// Runs the generated upstream `EventRouter` the way App.tsx mounts it: over the
// Lynx router-hook adapter, toast sink and draft-store facade, against a
// NativeApi double. Proves the shared store is fed by upstream's sync code and
// that the legacy polling read path can run next to it.

import { readFileSync } from "node:fs";

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import {
  ThreadId,
  type OrchestrationShellStreamItem,
  type OrchestrationThreadStreamItem,
} from "@synara/contracts";
import { useStore } from "@synara-web/store";
import { initialState } from "@synara-web/storeState";
import {
  makeDomainEvent,
  makeReadModelThread,
  makeShellSnapshot,
} from "@synara-web/storeTestFixtures";
import { getThreadFromState, getThreadsFromState } from "@synara-web/threadDerivation";

import { installFakeNativeHost } from "../adapters/fakeNativeHost.testUtils";
import { setNativeApiForTest } from "../adapters/nativeApi.lynx";
import { bindLynxRouterHistory } from "../adapters/reactRouter.lynx";
import { projectShellSnapshot } from "../app/sessionShell.lynx";
import { projectThreadDetailSnapshot } from "../app/threadDetailProjection.logic";
import { EventRouter } from "./eventRouter.generated";
import {
  assistantDelta,
  createFakeNativeApi,
  MESSAGE_1,
  settle,
  shellThread,
  THREAD_1,
  THREAD_2,
} from "./eventRouterHarness.testUtils";

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

describe("generated EventRouter on the Lynx shims", () => {
  let fake: ReturnType<typeof createFakeNativeApi>;
  let history: ReturnType<typeof createMemoryHistory>;
  let unbind: () => void;
  let unmount: (() => void) | null = null;

  async function mount(initialPath: string): Promise<void> {
    history = createMemoryHistory({ initialEntries: [initialPath] });
    unbind = bindLynxRouterHistory(history);
    const queryClient = new QueryClient();
    const view = render(
      // The context directly: `QueryClientProvider` is compiled against
      // `react/jsx-runtime`, which only the Lynx bundler maps to ReactLynx.
      <QueryClientContext.Provider value={queryClient}>
        <EventRouter />
      </QueryClientContext.Provider>,
    );
    unmount = view.unmount;
    await settle();
  }

  beforeEach(() => {
    rs.useFakeTimers();
    installFakeNativeHost(); // storage persistence of the stores under test
    useStore.setState({ ...initialState });
    fake = createFakeNativeApi();
    setNativeApiForTest(fake.api);
  });

  afterEach(() => {
    unmount?.();
    unmount = null;
    unbind();
    setNativeApiForTest(undefined);
    rs.useRealTimers();
  });

  it("feeds projects and threads into the shared store from the shell stream", async () => {
    await mount("/");
    expect(fake.calls).toContain("subscribeShell");
    expect(useStore.getState().threadsHydrated).toBe(false);

    act(() => {
      fake.pushShell({
        kind: "snapshot",
        snapshot: makeShellSnapshot(shellThread(THREAD_1, "Pushed by the server")),
      });
    });

    const state = useStore.getState();
    expect(state.threadsHydrated).toBe(true);
    expect(state.projects.map((project) => project.id)).toEqual(["project-1"]);
    expect(getThreadsFromState(state).map((thread) => thread.title)).toEqual([
      "Pushed by the server",
    ]);

    // A later pushed change lands without any poll.
    act(() => {
      fake.pushShell({
        kind: "thread-upserted",
        sequence: 3,
        thread: shellThread(THREAD_2, "Created on another client"),
      } as OrchestrationShellStreamItem);
    });
    expect(
      getThreadsFromState(useStore.getState())
        .map((thread) => thread.id)
        .toSorted(),
    ).toEqual([THREAD_1, THREAD_2]);
  });

  it("falls back to the shell query when the stream stays silent", async () => {
    await mount("/");
    expect(fake.calls).not.toContain("getShellSnapshot");

    await act(async () => {
      rs.advanceTimersByTime(1_500);
      await Promise.resolve();
      await Promise.resolve();
    });

    expect(fake.calls).toContain("getShellSnapshot");
    expect(getThreadsFromState(useStore.getState()).map((thread) => thread.title)).toEqual([
      "From the fallback query",
    ]);
  });

  it("leases thread detail for the Lynx route thread and follows navigation", async () => {
    await mount(`/thread/${THREAD_1}`);
    expect(fake.calls).toContain(`subscribeThread:${THREAD_1}`);

    act(() => {
      fake.pushShell({
        kind: "snapshot",
        snapshot: {
          ...makeShellSnapshot(shellThread(THREAD_1, "One")),
          threads: [shellThread(THREAD_1, "One"), shellThread(THREAD_2, "Two")],
        },
      });
      fake.pushThread({
        kind: "snapshot",
        snapshot: {
          snapshotSequence: 5,
          thread: makeReadModelThread({
            id: THREAD_1,
            messages: [
              {
                id: MESSAGE_1,
                role: "assistant",
                text: "Hello",
                turnId: null,
                streaming: true,
                createdAt: "2026-02-27T00:02:00.000Z",
                updatedAt: "2026-02-27T00:02:00.000Z",
              },
            ] as never,
          }),
        },
      } as OrchestrationThreadStreamItem);
    });
    expect(getThreadFromState(useStore.getState(), THREAD_1)?.messages[0]?.text).toBe("Hello");

    await act(async () => {
      history.push(`/thread/${THREAD_2}`);
      await Promise.resolve();
    });
    await settle();
    expect(fake.calls).toContain(`subscribeThread:${THREAD_2}`);

    // A route without a thread opens no further lease. (Counted from here: the
    // engine may itself renew a lease it already holds, e.g. once the shell
    // snapshot makes the thread known.)
    const subscribeCalls = () =>
      fake.calls.filter((call) => call.startsWith("subscribeThread:")).length;
    const leasesBeforeSettings = subscribeCalls();
    await act(async () => {
      history.push("/settings/general");
      await Promise.resolve();
    });
    await settle();
    expect(subscribeCalls()).toBe(leasesBeforeSettings);
  });

  it("stays the only writer of thread detail while the polling path projects its own snapshot", async () => {
    await mount(`/thread/${THREAD_1}`);
    const streamingMessage = (text: string) =>
      [
        {
          id: MESSAGE_1,
          role: "assistant",
          text,
          turnId: null,
          streaming: true,
          createdAt: "2026-02-27T00:02:00.000Z",
          updatedAt: "2026-02-27T00:02:00.000Z",
        },
      ] as never;
    act(() => {
      fake.pushShell({
        kind: "snapshot",
        snapshot: makeShellSnapshot(shellThread(THREAD_1, "One")),
      });
      fake.pushThread({
        kind: "snapshot",
        snapshot: {
          snapshotSequence: 5,
          thread: makeReadModelThread({ id: THREAD_1, messages: streamingMessage("Hello") }),
        },
      } as OrchestrationThreadStreamItem);
    });

    // Deltas 6 and 7 arrive; the first flushes at once, the second waits in the
    // 100 ms flush window.
    act(() => {
      fake.pushThread({ kind: "event", event: assistantDelta(6, " wor") });
      fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") });
    });
    expect(getThreadFromState(useStore.getState(), THREAD_1)?.messages[0]?.text).toBe("Hello wor");

    // Inside that window the polling path receives a snapshot that already
    // contains both deltas. It reads its own projection and leaves the store alone.
    const before = useStore.getState();
    const polled = projectThreadDetailSnapshot(
      before,
      makeReadModelThread({ id: THREAD_1, messages: streamingMessage("Hello world") }),
    );
    expect(polled?.messages[0]?.text).toBe("Hello world");
    expect(useStore.getState()).toBe(before);

    act(() => {
      rs.advanceTimersByTime(100);
    });
    // Committing the polled snapshot instead would have produced "Hello worldld".
    expect(getThreadFromState(useStore.getState(), THREAD_1)?.messages[0]?.text).toBe(
      "Hello world",
    );
  });

  it("keeps an old thread's detail and newer streamed shell state when a bounded sidebar poll resolves late", async () => {
    const OLD_THREAD = ThreadId.makeUnsafe("thread-old");
    const RECENT = Array.from({ length: 80 }, (_unused, index) =>
      ThreadId.makeUnsafe(`thread-recent-${String(index).padStart(2, "0")}`),
    );
    const recentShell = (id: ThreadId, title: string) => ({
      ...shellThread(id, title),
      updatedAt: "2026-03-01T00:00:00.000Z",
    });
    const oldShell = {
      ...shellThread(OLD_THREAD, "Old thread"),
      updatedAt: "2026-01-01T00:00:00.000Z",
    };
    const fullShell = {
      ...makeShellSnapshot(oldShell),
      snapshotSequence: 5,
      threads: [oldShell, ...RECENT.map((id) => recentShell(id, `Recent ${id}`))],
    };
    const streamingMessage = (text: string) =>
      [
        {
          id: MESSAGE_1,
          role: "assistant",
          text,
          turnId: null,
          streaming: true,
          createdAt: "2026-02-27T00:02:00.000Z",
          updatedAt: "2026-02-27T00:02:00.000Z",
        },
      ] as never;

    // The visible thread is older than the sidebar's 80 most recent ones.
    await mount(`/thread/${OLD_THREAD}`);
    act(() => {
      fake.pushShell({ kind: "snapshot", snapshot: fullShell });
      fake.pushThread({
        kind: "snapshot",
        snapshot: {
          snapshotSequence: 5,
          thread: makeReadModelThread({ id: OLD_THREAD, messages: streamingMessage("Hello") }),
        },
      } as OrchestrationThreadStreamItem);
    });
    expect(getThreadsFromState(useStore.getState())).toHaveLength(81);

    // The sidebar poll is captured now (sequence 5, 80 newest threads) …
    const boundedPoll = { ...fullShell, threads: fullShell.threads.slice(1) };
    // … then a newer streamed shell change lands …
    act(() => {
      fake.pushShell({
        kind: "thread-upserted",
        sequence: 6,
        thread: recentShell(RECENT[0]!, "Renamed on another client"),
      } as OrchestrationShellStreamItem);
    });
    const beforePoll = useStore.getState();

    // … and only then does the poll resolve. The sidebar no longer polls (it
    // reads this store); the landing bootstrap is the remaining reader of the
    // bounded snapshot. Its module graph breaks rstest's chunk loading, so its
    // one store interaction is pinned to the source right below.
    const queriesSource = readFileSync(new URL("../app/queries.ts", import.meta.url), "utf8");
    const landingSource = readFileSync(
      new URL("../components/composer/LandingComposer.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(landingSource).toContain("projectShellSnapshot(useStore.getState(), shell)");
    expect(queriesSource).not.toMatch(/\.(syncServer\w+|applyShellEvent|setState)\(/);
    expect(landingSource).not.toMatch(/\.(syncServer\w+|applyShellEvent|setState)\(/);
    const polled = projectShellSnapshot(useStore.getState(), boundedPoll);
    expect(getThreadsFromState(polled)).toHaveLength(80);
    expect(getThreadFromState(polled, OLD_THREAD)).toBeUndefined();

    // The store is exactly what session sync made it.
    const afterPoll = useStore.getState();
    expect(afterPoll).toBe(beforePoll);
    expect(getThreadFromState(afterPoll, OLD_THREAD)?.messages[0]?.text).toBe("Hello");
    expect(getThreadFromState(afterPoll, RECENT[0]!)?.title).toBe("Renamed on another client");
    expect(getThreadsFromState(afterPoll)).toHaveLength(81);

    // The next delta for the old thread applies, once.
    const delta = makeDomainEvent(
      "thread.message-sent",
      {
        threadId: OLD_THREAD,
        messageId: MESSAGE_1,
        role: "assistant",
        text: " world",
        turnId: null,
        streaming: true,
        createdAt: "2026-02-27T00:02:00.000Z",
        updatedAt: "2026-02-27T00:02:00.000Z",
      } as never,
      { sequence: 7 },
    );
    act(() => {
      fake.pushThread({ kind: "event", event: delta });
      fake.pushThread({ kind: "event", event: delta }); // redelivery is dropped by sequence
      rs.advanceTimersByTime(100);
    });
    expect(getThreadFromState(useStore.getState(), OLD_THREAD)?.messages[0]?.text).toBe(
      "Hello world",
    );
  });

  // Upstream defect (not fixed on upstream/main 6f54f53c6), corrected by the
  // generator's guarded patch `drop-queued-thread-events-covered-by-snapshot`
  // (scripts/event-router-patches.mjs). A snapshot replaces the thread while
  // deltas it already contains are still queued in the 100 ms flush window;
  // unpatched, `EventRouter` drops only `pendingThreadEventsById`, not
  // `pendingDomainEvents`, and the flush appends the delta again
  // ("Hello worldld"). The thread page renders these messages from the store.
  describe("queued deltas a thread snapshot already contains", () => {
    const streamingMessage = (text: string) =>
      [
        {
          id: MESSAGE_1,
          role: "assistant",
          text,
          turnId: null,
          streaming: true,
          createdAt: "2026-02-27T00:02:00.000Z",
          updatedAt: "2026-02-27T00:02:00.000Z",
        },
      ] as never;
    const detail = (snapshotSequence: number, text: string) => ({
      snapshotSequence,
      thread: makeReadModelThread({ id: THREAD_1, messages: streamingMessage(text) }),
    });
    const threadSnapshot = (snapshotSequence: number, text: string) =>
      ({
        kind: "snapshot",
        snapshot: detail(snapshotSequence, text),
      }) as OrchestrationThreadStreamItem;
    const text = () => getThreadFromState(useStore.getState(), THREAD_1)?.messages[0]?.text;

    async function openStreamingThread(): Promise<void> {
      await mount(`/thread/${THREAD_1}`);
      act(() => {
        fake.pushShell({
          kind: "snapshot",
          snapshot: makeShellSnapshot(shellThread(THREAD_1, "One")),
        });
        fake.pushThread(threadSnapshot(5, "Hello"));
        fake.pushThread({ kind: "event", event: assistantDelta(6, " wor") }); // flushes at once
        fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") }); // queued
      });
      expect(text()).toBe("Hello wor");
    }

    it("are not applied again after a stream snapshot (resubscribe inside the window)", async () => {
      await openStreamingThread();
      act(() => {
        fake.pushThread(threadSnapshot(7, "Hello world"));
      });
      expect(text()).toBe("Hello world");
      act(() => {
        rs.advanceTimersByTime(100);
      });
      expect(text()).toBe("Hello world");

      // The stream goes on from the snapshot's sequence.
      act(() => {
        fake.pushThread({ kind: "event", event: assistantDelta(7, "ld") }); // redelivery
        fake.pushThread({ kind: "event", event: assistantDelta(8, "!") });
        rs.advanceTimersByTime(100);
      });
      expect(text()).toBe("Hello world!");
    });

    it("keeps queued deltas that are newer than the stream snapshot", async () => {
      await openStreamingThread();
      act(() => {
        fake.pushThread({ kind: "event", event: assistantDelta(8, "!") }); // queued behind 7
        // A snapshot taken at 7: it contains " wor" and "ld", not "!".
        fake.pushThread(threadSnapshot(7, "Hello world"));
        rs.advanceTimersByTime(100);
      });
      expect(text()).toBe("Hello world!");
    });

    it("are not applied again after the catch-up projection read", async () => {
      await openStreamingThread();
      // The thread counts as live (a streaming assistant message), so the
      // catch-up interval reads the projection; it resolves inside the window.
      let resolveDetail: (value: ReturnType<typeof detail>) => void = () => undefined;
      const requested: string[] = [];
      (
        fake.api.orchestration as unknown as {
          getThreadDetailSnapshot: (input: { threadId: string }) => Promise<unknown>;
        }
      ).getThreadDetailSnapshot = (input) => {
        requested.push(input.threadId);
        return new Promise((resolve) => {
          resolveDetail = resolve;
        });
      };
      // An event that arrives for a subscribed thread with no fence asks for the
      // projection; so does the periodic catch-up. Drive the latter.
      await act(async () => {
        for (let elapsed = 0; elapsed < 30_000 && requested.length === 0; elapsed += 50) {
          rs.advanceTimersByTime(50);
          await Promise.resolve();
        }
      });
      expect(requested).toEqual([THREAD_1]);
      expect(text()).toBe("Hello world"); // the window elapsed while waiting

      act(() => {
        fake.pushThread({ kind: "event", event: assistantDelta(8, " again") }); // queued
      });
      const beforeProjection = text();
      await act(async () => {
        resolveDetail(detail(8, "Hello world again"));
        for (let turn = 0; turn < 10; turn += 1) await Promise.resolve();
      });
      act(() => {
        rs.advanceTimersByTime(100);
      });
      expect(beforeProjection).toBe("Hello world");
      expect(text()).toBe("Hello world again");
    });
  });

  it("releases every listener and lease on unmount", async () => {
    await mount(`/thread/${THREAD_1}`);
    expect(fake.listenerCounts()).toEqual({ shell: 1, thread: 1, device: 1, computer: 1 });

    unmount?.();
    unmount = null;
    await settle();

    expect(fake.listenerCounts()).toEqual({ shell: 0, thread: 0, device: 0, computer: 0 });
    expect(fake.calls).toContain("unsubscribeShell");
    expect(fake.calls).toContain(`unsubscribeThread:${THREAD_1}`);
  });
});
