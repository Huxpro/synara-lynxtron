import type {
  ClientOrchestrationCommand,
  ModelSelection,
  ProviderKind,
} from '@synara/contracts';
import {
  buildThreadHandoffImportedActivities,
  buildThreadHandoffImportedMessages,
  canCreateThreadHandoff,
  resolveAvailableHandoffTargetProviders,
  resolveThreadHandoffModelSelection,
  resolveThreadHandoffTitle,
} from '@synara-web/lib/threadHandoff';
import { resolveProviderSendAvailability } from '@synara-web/lib/providerAvailability';
import { newCommandId, newThreadId } from '@synara-web/lib/utils';

import {
  fetchFreshServerConfig,
  dispatchSynaraCommand,
} from '../data/synaraClient.lynx';
import { queryClient, type ThreadHeaderSummary } from './queries';

export interface NativeThreadHandoffProject {
  readonly id: string;
  readonly defaultModelSelection: ModelSelection | null;
}

export function resolveNativeThreadHandoffTargets(
  thread: ThreadHeaderSummary | undefined
): readonly ProviderKind[] {
  if (!thread || !canCreateThreadHandoff({
    thread: thread as never,
    isBusy:
      thread.sessionStatus === 'starting' ||
      thread.sessionStatus === 'running' ||
      thread.latestTurnState === 'running',
    hasPendingApprovals: thread.pendingApprovals.length > 0,
    hasPendingUserInput: thread.pendingUserInputs.length > 0,
  })) return [];
  return resolveAvailableHandoffTargetProviders(thread.modelSelection.provider);
}

export function buildNativeThreadHandoffCreateCommand(input: {
  readonly createdAt: string;
  readonly nextThreadId: string;
  readonly project: NativeThreadHandoffProject;
  readonly targetProvider: ProviderKind;
  readonly thread: ThreadHeaderSummary;
}): Extract<ClientOrchestrationCommand, { type: 'thread.handoff.create' }> {
  return {
    type: 'thread.handoff.create',
    commandId: newCommandId(),
    threadId: input.nextThreadId as never,
    sourceThreadId: input.thread.id as never,
    projectId: input.thread.projectId as never,
    title: resolveThreadHandoffTitle(input.thread),
    modelSelection: resolveThreadHandoffModelSelection({
      sourceThread: input.thread,
      targetProvider: input.targetProvider,
      projectDefaultModelSelection: input.project.defaultModelSelection,
      stickyModelSelectionByProvider: {},
    }),
    runtimeMode: input.thread.runtimeMode,
    interactionMode: input.thread.interactionMode,
    envMode: input.thread.envMode,
    branch: input.thread.branch,
    worktreePath: input.thread.worktreePath,
    associatedWorktreePath: input.thread.associatedWorktreePath,
    associatedWorktreeBranch: input.thread.associatedWorktreeBranch,
    associatedWorktreeRef: input.thread.associatedWorktreeRef,
    createBranchFlowCompleted: input.thread.createBranchFlowCompleted,
    importedMessages: [...buildThreadHandoffImportedMessages(input.thread as never)],
    createdAt: input.createdAt as never,
  };
}

export async function createNativeThreadHandoff(input: {
  readonly project: NativeThreadHandoffProject;
  readonly targetProvider: ProviderKind;
  readonly thread: ThreadHeaderSummary;
}): Promise<string> {
  'background only';
  const targets = resolveNativeThreadHandoffTargets(input.thread);
  if (!targets.includes(input.targetProvider)) {
    throw new Error('This handoff target is not available for the current thread.');
  }
  const config = await fetchFreshServerConfig();
  const availability = resolveProviderSendAvailability({
    provider: input.targetProvider,
    statuses: config.providers,
  });
  if (!availability.usable) throw new Error(availability.unavailableReason);

  const nextThreadId = newThreadId();
  const createdAt = new Date().toISOString();
  await dispatchSynaraCommand(
    buildNativeThreadHandoffCreateCommand({
      createdAt,
      nextThreadId,
      project: input.project,
      targetProvider: input.targetProvider,
      thread: input.thread,
    })
  );
  for (const activity of buildThreadHandoffImportedActivities(input.thread as never)) {
    await dispatchSynaraCommand({
      type: 'thread.activity.append',
      commandId: newCommandId(),
      threadId: nextThreadId,
      activity,
      createdAt,
    });
  }
  await queryClient.invalidateQueries({ queryKey: ['threads'] });
  return nextThreadId;
}
