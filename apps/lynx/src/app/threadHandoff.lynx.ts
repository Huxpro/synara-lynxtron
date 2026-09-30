import type {
  ClientOrchestrationCommand,
  ModelSelection,
  ProviderKind,
  ServerProviderStatus,
  ServerSettingsView,
} from "@synara/contracts";
import {
  buildThreadHandoffImportedActivities,
  buildThreadHandoffImportedMessages,
  canCreateThreadHandoff,
  resolveAvailableHandoffTargetProviders,
  resolveThreadHandoffModelSelection,
  resolveThreadHandoffTitle,
} from "@synara-web/lib/threadHandoff";
import { resolveProviderSendAvailability } from "@synara-web/lib/providerAvailability";
import { newCommandId, newThreadId } from "@synara-web/lib/utils";

import {
  dispatchSynaraCommand,
  fetchFreshServerConfig,
  fetchServerConfig,
  fetchServerSettings,
} from "../data/synaraClient.lynx";
import { queryClient, type ThreadHeaderSummary } from "./queries";

export interface NativeThreadHandoffProject {
  readonly id: string;
  readonly defaultModelSelection: ModelSelection | null;
}

/** Which providers can receive a handoff: enabled in settings and currently usable. */
export interface NativeThreadHandoffProviderContext {
  readonly providerSettings: ServerSettingsView["providers"] | null | undefined;
  readonly providerStatuses: readonly ServerProviderStatus[];
}

export async function fetchNativeThreadHandoffProviderContext(options?: {
  readonly fresh?: boolean;
}): Promise<NativeThreadHandoffProviderContext> {
  "background only";
  const [config, settings] = await Promise.all([
    options?.fresh ? fetchFreshServerConfig() : fetchServerConfig(),
    fetchServerSettings(),
  ]);
  return { providerSettings: settings.providers, providerStatuses: config.providers };
}

export function resolveNativeThreadHandoffTargets(
  thread: ThreadHeaderSummary | undefined,
  providers: NativeThreadHandoffProviderContext,
): readonly ProviderKind[] {
  if (
    !thread ||
    !canCreateThreadHandoff({
      thread: thread as never,
      isBusy:
        thread.sessionStatus === "starting" ||
        thread.sessionStatus === "running" ||
        thread.latestTurnState === "running",
      hasPendingApprovals: thread.pendingApprovals.length > 0,
      hasPendingUserInput: thread.pendingUserInputs.length > 0,
    })
  )
    return [];
  return resolveAvailableHandoffTargetProviders({
    sourceProvider: thread.modelSelection.provider,
    providerSettings: providers.providerSettings,
    providerStatuses: providers.providerStatuses,
  });
}

export function buildNativeThreadHandoffCreateCommand(input: {
  readonly createdAt: string;
  readonly nextThreadId: string;
  readonly project: NativeThreadHandoffProject;
  readonly targetProvider: ProviderKind;
  readonly thread: ThreadHeaderSummary;
}): Extract<ClientOrchestrationCommand, { type: "thread.handoff.create" }> {
  return {
    type: "thread.handoff.create",
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
  "background only";
  const providers = await fetchNativeThreadHandoffProviderContext({ fresh: true });
  const targets = resolveNativeThreadHandoffTargets(input.thread, providers);
  if (!targets.includes(input.targetProvider)) {
    throw new Error("This handoff target is not available for the current thread.");
  }
  const availability = resolveProviderSendAvailability({
    provider: input.targetProvider,
    statuses: providers.providerStatuses,
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
    }),
  );
  for (const activity of buildThreadHandoffImportedActivities(input.thread as never)) {
    await dispatchSynaraCommand({
      type: "thread.activity.append",
      commandId: newCommandId(),
      threadId: nextThreadId,
      activity,
      createdAt,
    });
  }
  await queryClient.invalidateQueries({ queryKey: ["threads"] });
  return nextThreadId;
}
