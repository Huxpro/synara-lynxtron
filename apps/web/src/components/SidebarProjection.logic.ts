// FILE: SidebarProjection.logic.ts
// Purpose: Small platform-neutral collection helpers shared by Sidebar renderers.

export function groupSidebarThreadsByProjectId<
  ProjectKey extends string,
  T extends { readonly projectId: ProjectKey },
>(threads: readonly T[]): ReadonlyMap<ProjectKey, T[]> {
  const byProjectId = new Map<ProjectKey, T[]>();
  for (const thread of threads) {
    const existing = byProjectId.get(thread.projectId);
    if (existing) {
      existing.push(thread);
    } else {
      byProjectId.set(thread.projectId, [thread]);
    }
  }
  return byProjectId;
}

/**
 * Minimal recent-first ordering for platform projections that do not yet carry
 * the Web controller's live-turn/attention metadata. The id tie-break keeps
 * both renderers deterministic while richer Web rows continue to use
 * sortThreadsForSidebar.
 */
export function sortSidebarRowsByUpdatedAt<
  T extends { readonly id: string; readonly updatedAt: string },
>(rows: readonly T[]): T[] {
  return [...rows].sort(
    (left, right) =>
      right.updatedAt.localeCompare(left.updatedAt) ||
      right.id.localeCompare(left.id),
  );
}
