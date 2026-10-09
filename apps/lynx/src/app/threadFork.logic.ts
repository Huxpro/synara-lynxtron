import type { ClientOrchestrationCommand } from "@synara/contracts";
import { resolveForkThreadEnvironment } from "@synara-web/lib/threadEnvironment";
import { buildThreadHandoffImportedMessages } from "@synara-web/lib/threadHandoff";
import { newCommandId } from "@synara-web/lib/utils";

import type { ThreadHeaderSummary } from "./queries";

/**
 * Electron's message-footer fork: a new thread in the current checkout (a worktree-backed
 * thread keeps its worktree) carrying the transcript through the clicked message.
 */
export function buildNativeThreadForkCreateCommand(input: {
  readonly createdAt: string;
  readonly nextThreadId: string;
  readonly thread: ThreadHeaderSummary;
  readonly throughMessageId: string;
}): Extract<ClientOrchestrationCommand, { type: "thread.fork.create" }> {
  const environment = resolveForkThreadEnvironment({
    target: "local",
    activeRootBranch: null,
    sourceThread: input.thread,
  });
  return {
    type: "thread.fork.create",
    commandId: newCommandId(),
    threadId: input.nextThreadId as never,
    sourceThreadId: input.thread.id as never,
    projectId: input.thread.projectId as never,
    title: input.thread.title,
    modelSelection: input.thread.modelSelection,
    runtimeMode: input.thread.runtimeMode,
    interactionMode: input.thread.interactionMode,
    envMode: environment.envMode,
    branch: environment.branch,
    worktreePath: environment.worktreePath,
    workingDirectory: input.thread.workingDirectory,
    associatedWorktreePath: environment.associatedWorktreePath,
    associatedWorktreeBranch: environment.associatedWorktreeBranch,
    associatedWorktreeRef: environment.associatedWorktreeRef,
    importedMessages: [
      ...buildThreadHandoffImportedMessages(input.thread as never, {
        throughMessageId: input.throughMessageId as never,
      }),
    ],
    createdAt: input.createdAt as never,
  };
}
