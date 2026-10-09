// Shared doubles for tests that run the generated upstream `EventRouter`: a
// `NativeApi` whose shell and thread streams the test pushes into, and the
// fixtures those pushes are built from.

import { act } from "@lynx-js/react/testing-library";
import {
  MessageId,
  ThreadId,
  type NativeApi,
  type OrchestrationEvent,
  type OrchestrationShellStreamItem,
  type OrchestrationThreadStreamItem,
} from "@synara/contracts";
import {
  makeDomainEvent,
  makeReadModelThread,
  makeShellSnapshot,
} from "@synara-web/storeTestFixtures";

export const THREAD_1 = ThreadId.makeUnsafe("thread-1");
export const THREAD_2 = ThreadId.makeUnsafe("thread-2");
export const MESSAGE_1 = MessageId.makeUnsafe("message-1");

export function shellThread(id: ThreadId, title: string) {
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

export function createFakeNativeApi() {
  const shellListeners = new Set<(item: OrchestrationShellStreamItem) => void>();
  const threadListeners = new Set<(item: OrchestrationThreadStreamItem) => void>();
  const deviceListeners = new Set<(event: unknown) => void>();
  const computerListeners = new Set<(event: unknown) => void>();
  const calls: string[] = [];
  const api = {
    // Upstream's EventRouter mounts the device and computer event bridges.
    device: {
      onEvent: (listener: (event: unknown) => void) => {
        deviceListeners.add(listener);
        return () => deviceListeners.delete(listener);
      },
    },
    computer: {
      onEvent: (listener: (event: unknown) => void) => {
        computerListeners.add(listener);
        return () => computerListeners.delete(listener);
      },
    },
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
    listenerCounts: () => ({
      shell: shellListeners.size,
      thread: threadListeners.size,
      device: deviceListeners.size,
      computer: computerListeners.size,
    }),
  };
}

export function assistantDelta(sequence: number, text: string): OrchestrationEvent {
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

export async function settle(): Promise<void> {
  // The subscription reconcile is a promise chain several turns deep.
  await act(async () => {
    for (let turn = 0; turn < 20; turn += 1) await Promise.resolve();
  });
}
