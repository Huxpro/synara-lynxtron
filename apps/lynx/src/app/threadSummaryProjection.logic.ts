import type { OrchestrationShellSnapshot } from "@synara/contracts";

import type { ThreadSummary } from "./queries";

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
      live: thread.session?.status === "running" || thread.session?.status === "connecting",
      provider: thread.session?.provider ?? thread.modelSelection.provider,
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
