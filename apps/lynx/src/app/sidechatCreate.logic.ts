import type { ClientOrchestrationCommand } from '@synara/contracts';
import { buildThreadHandoffImportedMessages } from '@synara-web/lib/threadHandoff';

import type { ThreadHeaderSummary } from './queries';

export function buildLynxSidechatCreateCommand(input: {
  readonly commandId: string;
  readonly createdAt: string;
  readonly source: ThreadHeaderSummary;
  readonly threadId: string;
}): Extract<ClientOrchestrationCommand, { type: 'thread.fork.create' }> {
  return {
    type: 'thread.fork.create',
    commandId: input.commandId as never,
    threadId: input.threadId as never,
    sourceThreadId: input.source.id as never,
    sidechatSourceThreadId: input.source.id as never,
    projectId: input.source.projectId as never,
    title: 'Sidechat: ' + input.source.title,
    modelSelection: input.source.modelSelection,
    runtimeMode: 'approval-required',
    interactionMode: 'default',
    envMode: input.source.envMode,
    branch: input.source.branch,
    worktreePath: input.source.worktreePath,
    associatedWorktreePath: input.source.associatedWorktreePath,
    associatedWorktreeBranch: input.source.associatedWorktreeBranch,
    associatedWorktreeRef: input.source.associatedWorktreeRef,
    createBranchFlowCompleted: input.source.createBranchFlowCompleted,
    importedMessages: [
      ...buildThreadHandoffImportedMessages(input.source as never),
    ],
    createdAt: input.createdAt,
  };
}

export function canCreateLynxSidechat(
  source: ThreadHeaderSummary | undefined
): boolean {
  return Boolean(source && source.sidechatSourceThreadId === null);
}
