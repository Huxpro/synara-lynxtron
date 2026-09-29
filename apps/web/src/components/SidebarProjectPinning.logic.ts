// FILE: SidebarProjectPinning.logic.ts
// Purpose: Portable pinned-project ordering and optimistic state merge.
// Exports: Shared project pinning controller used by Web and Lynx sidebars.

import { MAX_PINNED_PROJECTS } from "@synara/contracts";
import { derivePinnedIds, isLatestPinMutation, orderPinnedItemsFirst } from "../pinning.logic";

export function isLatestPinnedProjectMutation<TId>(input: {
  readonly projectId: TId;
  readonly requestVersion: number;
  readonly latestMutationVersionByProjectId: ReadonlyMap<TId, number>;
}): boolean {
  return isLatestPinMutation({
    id: input.projectId,
    requestVersion: input.requestVersion,
    latestMutationVersionById: input.latestMutationVersionByProjectId,
  });
}

export function derivePinnedProjectIdsForSidebar<
  TId extends string,
  TProject extends { readonly id: TId; readonly isPinned?: boolean | undefined },
>(input: {
  readonly projects: readonly TProject[];
  readonly persistedPinnedProjectIds: readonly TId[];
  readonly optimisticPinnedStateByProjectId: ReadonlyMap<TId, boolean>;
}): TId[] {
  return derivePinnedIds({
    items: input.projects,
    persistedPinnedIds: input.persistedPinnedProjectIds,
    optimisticPinnedStateById: input.optimisticPinnedStateByProjectId,
    maxCount: MAX_PINNED_PROJECTS,
  });
}

export function orderPinnedProjectsForSidebar<
  TId extends string,
  TProject extends { readonly id: TId },
>(projects: readonly TProject[], pinnedProjectIds: readonly TId[]): TProject[] {
  return orderPinnedItemsFirst(projects, pinnedProjectIds);
}
