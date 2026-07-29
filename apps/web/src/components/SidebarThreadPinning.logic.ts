// FILE: SidebarThreadPinning.logic.ts
// Purpose: Portable pinned-thread ordering, optimistic state, and list de-duplication.
// Exports: Shared thread pinning controller used by Web and Lynx sidebars.

import {
  derivePinnedIds,
  getPinnedItems,
  isLatestPinMutation,
} from "../pinning.logic";

export function getPinnedThreadsForSidebar<
  TId extends string,
  TThread extends { readonly id: TId },
>(threads: readonly TThread[], pinnedThreadIds: readonly TId[]): TThread[] {
  return getPinnedItems(threads, pinnedThreadIds);
}

export function derivePinnedThreadIdsForSidebar<
  TId extends string,
  TThread extends { readonly id: TId; readonly isPinned?: boolean | undefined },
>(input: {
  readonly threads: readonly TThread[];
  readonly persistedPinnedThreadIds: readonly TId[];
  readonly optimisticPinnedStateByThreadId: ReadonlyMap<TId, boolean>;
}): TId[] {
  return derivePinnedIds({
    items: input.threads,
    persistedPinnedIds: input.persistedPinnedThreadIds,
    optimisticPinnedStateById: input.optimisticPinnedStateByThreadId,
  });
}

export function isLatestPinnedThreadMutation<TId>(input: {
  readonly threadId: TId;
  readonly requestVersion: number;
  readonly latestMutationVersionByThreadId: ReadonlyMap<TId, number>;
}): boolean {
  return isLatestPinMutation({
    id: input.threadId,
    requestVersion: input.requestVersion,
    latestMutationVersionById: input.latestMutationVersionByThreadId,
  });
}

// Hide globally pinned rows from project/chat lists so the sidebar does not duplicate chats.
// A pinned parent with visible children remains in the tree because removing it would orphan
// those children or make them unreachable from the ordinary project hierarchy.
export function getUnpinnedThreadsForSidebar<
  TId extends string,
  TThread extends {
    readonly id: TId;
    readonly parentThreadId?: TId | null | undefined;
  },
>(threads: readonly TThread[], pinnedThreadIds: readonly TId[]): TThread[] {
  if (pinnedThreadIds.length === 0) {
    return [...threads];
  }

  const parentThreadIds = new Set<TId>();
  for (const thread of threads) {
    if (thread.parentThreadId != null) {
      parentThreadIds.add(thread.parentThreadId);
    }
  }

  const hiddenThreadIds = new Set(
    pinnedThreadIds.filter((threadId) => !parentThreadIds.has(threadId)),
  );
  return threads.filter((thread) => !hiddenThreadIds.has(thread.id));
}

export function shouldPrunePinnedThreads(input: {
  readonly threadsHydrated: boolean;
}): boolean {
  return input.threadsHydrated;
}
