import type { ClientOrchestrationCommand, ThreadId } from "@synara/contracts";
import { deleteProjectThreadsSequentially } from "@synara/shared/projectThreadArchive";

interface NativeProjectThread {
  readonly id: string;
  readonly sessionStatus?: string | null;
}

function commandId(prefix: string): string {
  return `${prefix}-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

export async function deleteNativeProjectThreads(input: {
  readonly threads: readonly NativeProjectThread[];
  readonly dispatch: (command: ClientOrchestrationCommand) => Promise<unknown>;
  readonly closeTerminalHistory: (threadId: ThreadId) => Promise<void>;
  readonly cleanupThreadState: (threadId: ThreadId) => void | Promise<void>;
  readonly onFailure?: (threadId: ThreadId, cause: unknown) => void;
}) {
  const result = await deleteProjectThreadsSequentially({
    threads: input.threads,
    deleteThread: async (thread) => {
      const threadId = thread.id as ThreadId;
      if (thread.sessionStatus && thread.sessionStatus !== "closed") {
        await input
          .dispatch({
            type: "thread.session.stop",
            commandId: commandId("lynx-project-thread-stop") as never,
            threadId,
            createdAt: new Date().toISOString(),
          })
          .catch(() => undefined);
      }
      await input.closeTerminalHistory(threadId).catch(() => undefined);
      await input.dispatch({
        type: "thread.delete",
        commandId: commandId("lynx-project-thread-delete") as never,
        threadId,
      });
      await input.cleanupThreadState(threadId);
    },
    onFailure: (thread, cause) => input.onFailure?.(thread.id as ThreadId, cause),
  });
  return {
    ...result,
    deletedThreadIds: result.deletedThreadIds as readonly ThreadId[],
  };
}

export async function removeNativeProject(input: {
  readonly projectId: import("@synara/contracts").ProjectId;
  readonly threads: readonly NativeProjectThread[];
  readonly dispatch: (command: ClientOrchestrationCommand) => Promise<unknown>;
  readonly closeTerminalHistory: (threadId: ThreadId) => Promise<void>;
  readonly cleanupThreadState: (threadId: ThreadId) => void | Promise<void>;
  readonly onFailure?: (threadId: ThreadId, cause: unknown) => void;
}) {
  const deletion = await deleteNativeProjectThreads(input);
  if (deletion.failureCount > 0) {
    return {
      ...deletion,
      projectDeleted: false as const,
      projectDeleteError: null,
    };
  }
  try {
    await input.dispatch(buildNativeProjectDeleteCommand(input.projectId));
    return {
      ...deletion,
      projectDeleted: true as const,
      projectDeleteError: null,
    };
  } catch (projectDeleteError) {
    return {
      ...deletion,
      projectDeleted: false as const,
      projectDeleteError,
    };
  }
}

export function buildNativeProjectDeleteCommand(
  projectId: import("@synara/contracts").ProjectId,
): ClientOrchestrationCommand {
  return {
    type: "project.delete",
    commandId: commandId("lynx-project-delete") as never,
    projectId,
  };
}
