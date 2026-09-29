import type {
  ModelSelection,
  OrchestrationSession,
  OrchestrationShellSnapshot,
  ProviderKind,
} from "@synara/contracts";
import { isProviderKind } from "@synara-web/providerOrdering";

import type { ThreadSummary } from "./queries";

// Orchestration snapshots carry the running provider as `session.providerName`
// (the web store's normalized `session.provider` does not exist on them).
export function resolveSnapshotThreadProvider(thread: {
  readonly session: Pick<OrchestrationSession, "providerName"> | null;
  readonly modelSelection: Pick<ModelSelection, "provider">;
}): ProviderKind {
  const providerName = thread.session?.providerName;
  return providerName && isProviderKind(providerName)
    ? providerName
    : thread.modelSelection.provider;
}

export function projectActiveThreadSummaries(
  snapshot: OrchestrationShellSnapshot,
): ThreadSummary[] {
  const projectNames = new Map(snapshot.projects.map((project) => [project.id, project.title]));
  return snapshot.threads
    .filter((thread) => thread.archivedAt == null)
    .map((thread) => ({
      id: thread.id,
      title: thread.title,
      projectId: thread.projectId,
      project: projectNames.get(thread.projectId) ?? "Unknown project",
      messageCount: 0,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      archivedAt: thread.archivedAt,
      latestUserMessageAt: thread.latestUserMessageAt ?? null,
      live: thread.session?.status === "running" || thread.session?.status === "starting",
      provider: resolveSnapshotThreadProvider(thread),
      isPinned: thread.isPinned,
      sessionStatus: thread.session?.status ?? null,
      hasPendingApprovals: thread.hasPendingApprovals,
      hasPendingUserInput: thread.hasPendingUserInput,
      latestTurnCompletedAt: thread.latestTurn?.completedAt ?? null,
      latestTurnState: thread.latestTurn?.state ?? null,
      parentThreadId: thread.parentThreadId,
      subagentAgentId: thread.subagentAgentId,
      subagentNickname: thread.subagentNickname,
      subagentRole: thread.subagentRole,
      forkSourceThreadId: thread.forkSourceThreadId,
      sidechatSourceThreadId: thread.sidechatSourceThreadId,
      handoffSourceProvider: thread.handoff?.sourceProvider ?? null,
    }));
}
