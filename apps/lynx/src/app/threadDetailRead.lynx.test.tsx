// The two read paths this change moved onto the shared store, end to end over
// upstream's generated `EventRouter` and a NativeApi double:
//   - one-shot thread reads (`readThreadDetailOnce`): the store when session
//     sync holds the detail, otherwise a single facade read that is never
//     committed;
//   - the dock's Side pane: the Lynx dock mirrored into upstream's dock store
//     is what leases the Side thread, and the pane reads it like the thread page.

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import type { OrchestrationThreadStreamItem, ThreadId } from "@synara/contracts";
import {
  closePaneInState,
  createDefaultRightDockState,
  openPaneInState,
} from "@synara/shared/rightDock";
import { useStore } from "@synara-web/store";
import { initialState } from "@synara-web/storeState";
import { makeReadModelThread, makeShellSnapshot } from "@synara-web/storeTestFixtures";
import { emitWsTransportState } from "@synara-web/wsTransportEvents";

import { installFakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { bindLynxRouterHistory } from "../adapters/reactRouter.lynx";
import { EventRouter } from "../generated/eventRouter.generated";
import {
  createFakeNativeApi,
  MESSAGE_1,
  settle,
  shellThread,
  THREAD_1,
  THREAD_2,
} from "../generated/eventRouterHarness.testUtils";
import { storeRightDockThreadState } from "./rightDockState.lynx";
import { readThreadDetailOnce, readThreadHeaderSummaryOnce } from "./threadDetailRead.lynx";
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

const readModelThread = (id: ThreadId, text: string) =>
  makeReadModelThread({
    id,
    messages: [
      {
        id: MESSAGE_1,
        role: "assistant",
        text,
        turnId: null,
        streaming: false,
        createdAt: "2026-02-27T00:02:00.000Z",
        updatedAt: "2026-02-27T00:02:00.000Z",
      },
    ] as never,
  });

const threadSnapshot = (id: ThreadId, text: string) =>
  ({
    kind: "snapshot",
    snapshot: { snapshotSequence: 5, thread: readModelThread(id, text) },
  }) as OrchestrationThreadStreamItem;

describe("thread detail reads outside the thread page", () => {
  let fake: ReturnType<typeof createFakeNativeApi>;
  let unbind: () => void;
  let unmount: (() => void) | null = null;
  let detailSnapshot: (threadId: string) => Promise<unknown>;
  let sideRead: ThreadPageRead;

  function SideProbe(props: { readonly threadId: string }) {
    sideRead = useThreadPageData(props.threadId, { retain: false });
    return null;
  }

  async function mount(sideThreadId?: string): Promise<void> {
    unbind = bindLynxRouterHistory(
      createMemoryHistory({ initialEntries: [`/thread/${THREAD_1}`] }),
    );
    const view = render(
      <QueryClientContext.Provider value={new QueryClient()}>
        <EventRouter />
        {sideThreadId ? <SideProbe threadId={sideThreadId} /> : null}
      </QueryClientContext.Provider>,
    );
    unmount = view.unmount;
    await settle();
  }

  const pushShell = () =>
    fake.pushShell({
      kind: "snapshot",
      snapshot: {
        ...makeShellSnapshot(shellThread(THREAD_1, "One")),
        threads: [shellThread(THREAD_1, "One"), shellThread(THREAD_2, "Two")],
      },
    } as never);
  const calls = (prefix: string) => fake.calls.filter((call) => call.startsWith(prefix)).length;

  beforeEach(async () => {
    rs.useFakeTimers();
    installFakeNativeHost();
    useStore.setState({ ...initialState });
    const { useRightDockStore } = await import("@synara-web/rightDockStore");
    useRightDockStore.setState({ dockStateByThreadId: {} });
    emitWsTransportState("open");
    fake = createFakeNativeApi();
    detailSnapshot = async (threadId) => ({
      snapshotSequence: 9,
      thread: readModelThread(threadId as ThreadId, "From the server"),
    });
    (
      fake.api.orchestration as unknown as {
        getThreadDetailSnapshot: (input: { threadId: string }) => Promise<unknown>;
      }
    ).getThreadDetailSnapshot = (input) => {
      fake.calls.push(`getThreadDetailSnapshot:${input.threadId}`);
      return detailSnapshot(input.threadId);
    };
    setNativeApiForTest(fake.api);
  });

  afterEach(() => {
    unmount?.();
    unmount = null;
    unbind();
    setNativeApiForTest(undefined);
    rs.useRealTimers();
  });

  it("reads a leased, synced thread from the store without a request", async () => {
    await mount();
    act(() => {
      pushShell();
      fake.pushThread(threadSnapshot(THREAD_1, "From the stream"));
    });
    const read = await readThreadDetailOnce(THREAD_1);
    expect(read?.source).toBe("store");
    expect(read?.thread.messages[0]?.text).toBe("From the stream");
    expect(read?.project?.name).toBe("Project");
    expect(calls("getThreadDetailSnapshot")).toBe(0);
    const summary = await readThreadHeaderSummaryOnce(THREAD_1);
    expect(summary).toMatchObject({
      id: THREAD_1,
      project: "Project",
      workspaceRoot: "/tmp/project",
    });
    expect(calls("getThreadDetailSnapshot")).toBe(0);
  });

  it("asks the facade once for a thread the store has no detail of, and commits nothing", async () => {
    await mount();
    act(() => pushShell());
    const before = useStore.getState();
    const read = await readThreadDetailOnce(THREAD_2);
    expect(read?.source).toBe("facade");
    expect(read?.thread.messages[0]?.text).toBe("From the server");
    expect(read?.project?.name).toBe("Project");
    expect(calls(`getThreadDetailSnapshot:${THREAD_2}`)).toBe(1);
    // EventRouter stays the only writer: the snapshot was projected, not stored.
    expect(useStore.getState()).toBe(before);
    expect(useStore.getState().threadDetailSyncById?.[THREAD_2]).toBeUndefined();
  });

  it("reports a missing thread as undefined and lets a failed request reject", async () => {
    await mount();
    act(() => pushShell());
    detailSnapshot = async () => null;
    expect(await readThreadDetailOnce(THREAD_2)).toBeUndefined();
    expect(await readThreadHeaderSummaryOnce(THREAD_2)).toBeUndefined();
    detailSnapshot = async () => {
      throw new Error("Synara is offline.");
    };
    await expect(readThreadDetailOnce(THREAD_2)).rejects.toThrow("Synara is offline.");
  });

  it("leases the dock's active Side thread and shows it from the store", async () => {
    await mount(THREAD_2);
    act(() => pushShell());
    await settle();
    // Not leased yet: the shell row alone is "loading", and nothing asks for it.
    expect(calls(`subscribeThread:${THREAD_2}`)).toBe(0);
    expect(sideRead).toEqual({ data: undefined, error: null, isPending: true });

    const withSide = openPaneInState(createDefaultRightDockState(), {
      paneId: `sidechat:${THREAD_2}`,
      kind: "sidechat",
      threadId: THREAD_2,
    });
    storeRightDockThreadState(THREAD_1, withSide);
    await settle();
    // The mirror into upstream's dock store, then the lease reconcile.
    await settle();
    expect(calls(`subscribeThread:${THREAD_2}`)).toBe(1);

    act(() => fake.pushThread(threadSnapshot(THREAD_2, "Side answer")));
    expect(sideRead.isPending).toBe(false);
    expect(sideRead.error).toBeNull();
    expect(sideRead.data?.summary?.id).toBe(THREAD_2);
    expect(
      sideRead.data?.data.flatMap((row) => (row.kind === "message" ? [row.message.text] : [])),
    ).toEqual(["Side answer"]);
    expect(calls("getThreadDetailSnapshot")).toBe(0);

    // A dropped connection keeps what is on screen.
    act(() => emitWsTransportState("closed"));
    expect(sideRead.data?.summary?.id).toBe(THREAD_2);
    act(() => emitWsTransportState("open"));

    // Closing the pane gives the lease back.
    storeRightDockThreadState(THREAD_1, closePaneInState(withSide, `sidechat:${THREAD_2}`));
    await settle();
    await settle();
    expect(calls(`unsubscribeThread:${THREAD_2}`)).toBe(1);
  });

  it("reports the Side thread as failed to load when offline with nothing to show", async () => {
    emitWsTransportState("closed");
    await mount(THREAD_2);
    expect(sideRead.isPending).toBe(false);
    expect(sideRead.error?.message).toBe("Synara is offline.");
  });
});
