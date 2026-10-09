// Runs the generated upstream `EventRouter` the way App.tsx mounts it: over the
// Lynx router-hook adapter, toast sink and draft-store facade, against a
// NativeApi double. Proves the shared store is fed by upstream's sync code and
// that the legacy polling read path can run next to it.

import { afterEach, beforeEach, describe, expect, it, rs } from "@rstest/core";
import { act, render } from "@lynx-js/react/testing-library";
import { createMemoryHistory } from "@tanstack/history";
import { QueryClient, QueryClientContext } from "@tanstack/react-query";
import {
  MessageId,
  ThreadId,
  type NativeApi,
  type OrchestrationEvent,
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
import { projectThreadDetailSnapshot } from "../app/threadDetailProjection.logic";
import { EventRouter } from "./eventRouter.generated";

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

const THREAD_1 = ThreadId.makeUnsafe("thread-1");
const THREAD_2 = ThreadId.makeUnsafe("thread-2");
const MESSAGE_1 = MessageId.makeUnsafe("message-1");

function shellThread(id: ThreadId, title: string) {
  const {
    messages: _messages,
    activities: _activities,
    ...thread
  } = makeReadModelThread({
    id,
    title,
  });
  return thread as unknown as Parameters<typeof makeShellSnapshot>[0];
}

function createFakeNativeApi() {
  const shellListeners = new Set<(item: OrchestrationShellStreamItem) => void>();
  const threadListeners = new Set<(item: OrchestrationThreadStreamItem) => void>();
  const calls: string[] = [];
  const api = {
    orchestration: {
      onShellEvent: (listener: (item: OrchestrationShellStreamItem) => void) => {
        shellListeners.add(listener);
        return () => shellListeners.delete(listener);
      },
      onThreadEvent: (listener: (item: OrchestrationThreadStreamItem) => void) => {
        threadListeners.add(listener);
        return () => threadListeners.delete(listener);
      },
      subscribeShell: async () => void calls.push("subscribeShell"),
      unsubscribeShell: async () => void calls.push("unsubscribeShell"),
      subscribeThread: async (input: { threadId: string }) =>
        void calls.push(`subscribeThread:${input.threadId}`),
      unsubscribeThread: async (input: { threadId: string }) =>
        void calls.push(`unsubscribeThread:${input.threadId}`),
      getShellSnapshot: async () => {
        calls.push("getShellSnapshot");
        return makeShellSnapshot(shellThread(THREAD_1, "From the fallback query"));
      },
      replayEvents: async () => [] as OrchestrationEvent[],
    },
    terminal: { onEvent: () => () => undefined },
    projects: {
      onDevServerEvent: () => () => undefined,
      listDevServers: async () => ({ servers: [] }),
    },
    shell: { openInEditor: async () => undefined },
  } as unknown as NativeApi;
  return {
    api,
    calls,
    pushShell: (item: OrchestrationShellStreamItem) => {
      for (const listener of Array.from(shellListeners)) listener(item);
    },
    pushThread: (item: OrchestrationThreadStreamItem) => {
      for (const listener of Array.from(threadListeners)) listener(item);
    },
    listenerCounts: () => ({ shell: shellListeners.size, thread: threadListeners.size }),
  };
}

function assistantDelta(sequence: number, text: string): OrchestrationEvent {
  return makeDomainEvent(
    "thread.message-sent",
    {
      threadId: THREAD_1,
      messageId: MESSAGE_1,
      role: "assistant",
      text,
      turnId: null,
      streaming: true,
      createdAt: "2026-02-27T00:02:00.000Z",
      updatedAt: "2026-02-27T00:02:00.000Z",
    } as never,
    { sequence },
  );
}

async function settle(): Promise<void> {
  // The subscription reconcile is a promise chain several turns deep.
  await act(async () => {
    for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
  });
}

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

    await act(async () => {
      history.push("/settings/general");
      await Promise.resolve();
    });
    await settle();
    expect(fake.calls.filter((call) => call.startsWith("subscribeThread:")).length).toBe(2);
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

  it("re-applying a shell snapshot the polling path already applied changes nothing", async () => {
    await mount("/");
    const snapshot = makeShellSnapshot(shellThread(THREAD_1, "Same snapshot"));
    useStore.getState().syncServerShellSnapshot(snapshot);
    const polled = useStore.getState();

    act(() => {
      fake.pushShell({ kind: "snapshot", snapshot });
    });

    const synced = useStore.getState();
    expect(synced.projects).toEqual(polled.projects);
    expect(synced.threadIds).toEqual(polled.threadIds);
    expect(synced.threadShellById).toEqual(polled.threadShellById);
    expect(synced.sidebarThreadSummaryById).toBe(polled.sidebarThreadSummaryById);
    expect(synced.shellSnapshotSequence).toBe(polled.shellSnapshotSequence);
  });

  it("releases every listener and lease on unmount", async () => {
    await mount(`/thread/${THREAD_1}`);
    expect(fake.listenerCounts()).toEqual({ shell: 1, thread: 1 });

    unmount?.();
    unmount = null;
    await settle();

    expect(fake.listenerCounts()).toEqual({ shell: 0, thread: 0 });
    expect(fake.calls).toContain("unsubscribeShell");
    expect(fake.calls).toContain(`unsubscribeThread:${THREAD_1}`);
  });
});
