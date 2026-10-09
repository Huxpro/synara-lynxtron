// The thread page's read path end to end: upstream's generated `EventRouter`
// feeds the shared store from a NativeApi double, and `useThreadPageData`
// (what `router.tsx` hands to `ThreadPage`) projects the routed thread from it.

import { useState } from "@lynx-js/react";
import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import type { OrchestrationThreadStreamItem } from "@synara/contracts";
import { useStore } from "@synara-web/store";
import { initialState } from "@synara-web/storeState";
import { makeReadModelThread, makeShellSnapshot } from "@synara-web/storeTestFixtures";
import { emitWsTransportState } from "@synara-web/wsTransportEvents";

import { installFakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { bindLynxRouterHistory } from "../adapters/reactRouter.lynx";
import { isRpcTransportError } from "../data/rpcTransport.logic";
import { EventRouter } from "../generated/eventRouter.generated";
import {
  assistantDelta,
  createFakeNativeApi,
  MESSAGE_1,
  settle,
  shellThread,
  THREAD_1,
  THREAD_2,
} from "../generated/eventRouterHarness.testUtils";
import type { ThreadPageRead } from "./threadPageProjection.logic";
import { useThreadPageData } from "./threadPageStore.lynx";

// Persisted stores in the EventRouter graph write to host storage as soon as
// their module loads, before any `beforeEach` can install the host double.
rs.hoisted(() => {
  (globalThis as { NativeModules?: unknown }).NativeModules = {
    bridge: {
      call: (_name: string, _params: unknown, callback: (reply: string) => void) =>
        queueMicrotask(() => callback("{}")),
    },
  };
});

const message = (text: string, streaming: boolean) =>
  [
    {
      id: MESSAGE_1,
      role: "assistant",
      text,
      turnId: null,
      streaming,
      createdAt: "2026-02-27T00:02:00.000Z",
      updatedAt: "2026-02-27T00:02:00.000Z",
    },
  ] as never;

const threadSnapshot = (
  snapshotSequence: number,
  text: string,
  options: { readonly streaming?: boolean; readonly threadId?: typeof THREAD_1 } = {},
) =>
  ({
    kind: "snapshot",
    snapshot: {
      snapshotSequence,
      thread: makeReadModelThread({
        id: options.threadId ?? THREAD_1,
        messages: message(text, options.streaming ?? true),
      }),
    },
  }) as OrchestrationThreadStreamItem;

describe("thread page read path over the shared store", () => {
  let fake: ReturnType<typeof createFakeNativeApi>;
  let history: ReturnType<typeof createMemoryHistory>;
  let unbind: () => void;
  let unmount: (() => void) | null = null;
  let read: ThreadPageRead;
  let renders = 0;

  function Probe(props: { readonly threadId: string | null }) {
    read = useThreadPageData(props.threadId);
    renders += 1;
    return null;
  }

  // The app derives the routed thread from its own route state; the probe
  // follows the same history the engine reads.
  let routeThreadSetter: (threadId: string | null) => void = () => undefined;
  let initialThreadId: string | null = null;
  function RoutedProbe() {
    const [threadId, setThreadId] = useState<string | null>(initialThreadId);
    routeThreadSetter = setThreadId;
    return <Probe threadId={threadId} />;
  }

  async function mount(threadId: string | null): Promise<void> {
    initialThreadId = threadId;
    history = createMemoryHistory({ initialEntries: [threadId ? `/thread/${threadId}` : "/"] });
    unbind = bindLynxRouterHistory(history);
    const view = render(
      <QueryClientContext.Provider value={new QueryClient()}>
        <EventRouter />
        <RoutedProbe />
      </QueryClientContext.Provider>,
    );
    unmount = view.unmount;
    await settle();
  }

  async function navigate(threadId: string): Promise<void> {
    await act(async () => {
      history.push(`/thread/${threadId}`);
      routeThreadSetter(threadId);
      await Promise.resolve();
    });
    await settle();
  }

  const pushShell = (...threads: ReturnType<typeof shellThread>[]) =>
    fake.pushShell({
      kind: "snapshot",
      snapshot: { ...makeShellSnapshot(threads[0]!), threads },
    });
  const rowTexts = () =>
    (read.data?.data ?? []).flatMap((row) => (row.kind === "message" ? [row.message.text] : []));
  const calls = (prefix: string) => fake.calls.filter((call) => call.startsWith(prefix)).length;

  beforeEach(() => {
    rs.useFakeTimers();
    installFakeNativeHost();
    useStore.setState({ ...initialState });
    emitWsTransportState("open");
    fake = createFakeNativeApi();
    (
      fake.api.orchestration as unknown as { getThreadDetailSnapshot: () => Promise<null> }
    ).getThreadDetailSnapshot = async () => {
      fake.calls.push("getThreadDetailSnapshot");
      return null;
    };
    setNativeApiForTest(fake.api);
    renders = 0;
  });

  afterEach(() => {
    unmount?.();
    unmount = null;
    unbind();
    setNativeApiForTest(undefined);
    rs.useRealTimers();
  });

  it("is loading until the detail snapshot of the leased thread arrives, then shows it", async () => {
    await mount(THREAD_1);
    expect(read).toEqual({ data: undefined, error: null, isPending: true });
    // Opening the page leases the thread's stream; the page itself requests
    // nothing. (Upstream's startup leases the route thread, then re-leases it
    // once the shell subscription is up: two opens on a cold start.)
    expect(calls(`subscribeThread:${THREAD_1}`)).toBe(2);
    expect(calls("getThreadDetailSnapshot")).toBe(0);

    // The shell alone names the thread but cannot tell "empty" from "not loaded".
    act(() => pushShell(shellThread(THREAD_1, "One")));
    expect(read).toEqual({ data: undefined, error: null, isPending: true });

    act(() => fake.pushThread(threadSnapshot(5, "Hello", { streaming: false })));
    expect(read.isPending).toBe(false);
    expect(read.error).toBeNull();
    expect(rowTexts()).toEqual(["Hello"]);
    expect(read.data?.summary).toMatchObject({
      id: THREAD_1,
      title: "Thread",
      project: "Project",
      workspaceRoot: "/tmp/project",
      sessionStatus: null,
      pendingApprovals: [],
      checkpoints: [],
    });
    const messageRow = read.data?.data.find((row) => row.kind === "message");
    expect(messageRow?.markdownTree).toBeTruthy();
  });

  it("appends streamed deltas once, and keeps unchanged rows reference-equal", async () => {
    const USER = {
      id: "message-user",
      role: "user",
      text: "Question",
      turnId: null,
      streaming: false,
      createdAt: "2026-02-27T00:01:00.000Z",
      updatedAt: "2026-02-27T00:01:00.000Z",
    };
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread({
        kind: "snapshot",
        snapshot: {
          snapshotSequence: 5,
          thread: makeReadModelThread({
            id: THREAD_1,
            messages: [USER, ...message("Hello", true)] as never,
          }),
        },
      } as OrchestrationThreadStreamItem);
    });
    expect(rowTexts()).toEqual(["Question", "Hello"]);
    const userRow = read.data!.data[0];

    act(() => {
      fake.pushThread({ kind: "event", event: assistantDelta(6, " wor") }); // flushes at once
    });
    expect(rowTexts()).toEqual(["Question", "Hello wor"]);
    act(() => {
      fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") }); // 100 ms window
    });
    expect(rowTexts()).toEqual(["Question", "Hello wor"]);
    act(() => {
      rs.advanceTimersByTime(100);
    });
    expect(rowTexts()).toEqual(["Question", "Hello world"]);
    // The untouched row is the same object, tree included. (Row identity only:
    // whether the list skips rendering that row is the Transcript's concern.)
    expect(read.data!.data[0]).toBe(userRow);

    // A redelivered delta is dropped by sequence.
    act(() => {
      fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") });
      rs.advanceTimersByTime(100);
    });
    expect(rowTexts()).toEqual(["Question", "Hello world"]);
    // Streaming never leased the thread again or asked for its projection.
    expect(calls(`subscribeThread:${THREAD_1}`)).toBe(2);
  });

  it("does not render a delta twice when a snapshot replaces the thread inside the flush window", async () => {
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread(threadSnapshot(5, "Hello"));
      fake.pushThread({ kind: "event", event: assistantDelta(6, " wor") });
      fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") }); // queued
      fake.pushThread(threadSnapshot(7, "Hello world")); // resubscribe after a reconnect
    });
    expect(rowTexts()).toEqual(["Hello world"]);
    act(() => {
      rs.advanceTimersByTime(100);
    });
    expect(rowTexts()).toEqual(["Hello world"]); // not "Hello worldld"
  });

  it("keeps content through a dropped connection and catches up from the resumed stream", async () => {
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread(threadSnapshot(5, "Hello"));
    });
    expect(rowTexts()).toEqual(["Hello"]);

    // The socket drops: what was loaded stays, without an error state.
    act(() => emitWsTransportState("closed"));
    expect(read.error).toBeNull();
    expect(read.isPending).toBe(false);
    expect(rowTexts()).toEqual(["Hello"]);

    // It reopens; the transport resumes the thread stream from its cursor and
    // the server answers with the gap as one batch.
    act(() => {
      emitWsTransportState("connecting");
      emitWsTransportState("open");
      fake.pushThread({
        kind: "replay",
        events: [assistantDelta(6, " wor"), assistantDelta(7, "ld")],
      } as OrchestrationThreadStreamItem);
    });
    expect(rowTexts()).toEqual(["Hello world"]);

    // Or the server demands a fresh snapshot instead (cursor too old).
    act(() => {
      fake.pushThread(threadSnapshot(9, "Hello world, again"));
      rs.advanceTimersByTime(100);
    });
    expect(rowTexts()).toEqual(["Hello world, again"]);
    act(() => {
      fake.pushThread({ kind: "event", event: assistantDelta(10, ".") });
      rs.advanceTimersByTime(100);
    });
    expect(rowTexts()).toEqual(["Hello world, again."]);
  });

  it("recovers after a renderer reload: empty store, loading, then the fresh snapshot", async () => {
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread(threadSnapshot(5, "Hello"));
    });
    expect(rowTexts()).toEqual(["Hello"]);

    // Reload: the renderer's modules and store start over; the host relay drops
    // the previous generation's streams (wsTransport.lynx.test.ts).
    unmount?.();
    unbind();
    await settle();
    useStore.setState({ ...initialState });
    fake = createFakeNativeApi();
    setNativeApiForTest(fake.api);

    await mount(THREAD_1);
    expect(read).toEqual({ data: undefined, error: null, isPending: true });
    expect(calls(`subscribeThread:${THREAD_1}`)).toBe(2);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread(threadSnapshot(8, "Hello world"));
    });
    expect(rowTexts()).toEqual(["Hello world"]);
  });

  it("reports offline instead of loading while the server cannot be reached", async () => {
    emitWsTransportState("closed");
    await mount(THREAD_1);
    expect(read.isPending).toBe(false);
    expect(read.data).toBeUndefined();
    expect(isRpcTransportError(read.error)).toBe(true);

    act(() => {
      emitWsTransportState("open");
      pushShell(shellThread(THREAD_1, "One"));
      fake.pushThread(threadSnapshot(5, "Hello"));
    });
    expect(read.error).toBeNull();
    expect(rowTexts()).toEqual(["Hello"]);
  });

  it("shows the empty page for a thread the hydrated shell does not know", async () => {
    await mount(THREAD_2);
    act(() => pushShell(shellThread(THREAD_1, "One")));
    expect(read).toEqual({
      data: { data: [], summary: undefined },
      error: null,
      isPending: false,
    });
  });

  it("follows navigation: a new thread loads, a thread seen before shows at once", async () => {
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"), shellThread(THREAD_2, "Two"));
      fake.pushThread(threadSnapshot(5, "First thread", { streaming: false }));
    });
    expect(rowTexts()).toEqual(["First thread"]);

    await navigate(THREAD_2);
    expect(calls(`subscribeThread:${THREAD_2}`)).toBe(1);
    expect(read).toEqual({ data: undefined, error: null, isPending: true });
    act(() =>
      fake.pushThread(threadSnapshot(6, "Second thread", { streaming: false, threadId: THREAD_2 })),
    );
    expect(rowTexts()).toEqual(["Second thread"]);
    expect(read.data?.summary?.id).toBe(THREAD_2);

    // Back: the store still holds the first thread's detail, so there is no
    // loading state while its stream is leased again.
    await navigate(THREAD_1);
    expect(read.isPending).toBe(false);
    expect(rowTexts()).toEqual(["First thread"]);
  });

  it("does not re-render the page for store changes of other threads", async () => {
    await mount(THREAD_1);
    act(() => {
      pushShell(shellThread(THREAD_1, "One"), shellThread(THREAD_2, "Two"));
      fake.pushThread(threadSnapshot(5, "Hello", { streaming: false }));
    });
    const before = read;
    const rendersBefore = renders;
    act(() => {
      fake.pushShell({
        kind: "thread-upserted",
        sequence: 6,
        thread: shellThread(THREAD_2, "Renamed elsewhere"),
      } as never);
    });
    expect(read).toBe(before);
    expect(renders).toBe(rendersBefore);
  });
});
