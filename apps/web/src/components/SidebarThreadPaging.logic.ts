export const SIDEBAR_THREAD_PREVIEW_LIMIT = 5;
export const SIDEBAR_THREAD_PREVIEW_PAGE_SIZE = 5;

export type SidebarThreadListPaging = {
  /** Requested pages clamped to what `totalCount` can actually consume. */
  readonly effectiveExtraPages: number;
  /** Row cap to render: `baseLimit + effectiveExtraPages * pageSize`. */
  readonly previewLimit: number;
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
};

// One "Show more" click reveals one extra page of rows; "Show less" hides one
// page again. Stale persisted values are clamped to the real row count.
export function resolveSidebarThreadListPaging(input: {
  readonly totalCount: number;
  readonly baseLimit: number;
  readonly pageSize: number;
  readonly requestedExtraPages: number;
}): SidebarThreadListPaging {
  const { baseLimit, pageSize, totalCount } = input;
  const hiddenBeyondBase = Math.max(0, totalCount - baseLimit);
  const maxExtraPages = pageSize > 0 ? Math.ceil(hiddenBeyondBase / pageSize) : 0;
  const requestedExtraPages = Number.isFinite(input.requestedExtraPages)
    ? Math.floor(input.requestedExtraPages)
    : 0;
  const effectiveExtraPages = Math.min(Math.max(0, requestedExtraPages), maxExtraPages);
  const previewLimit = baseLimit + effectiveExtraPages * pageSize;

  return {
    effectiveExtraPages,
    previewLimit,
    canShowMore: totalCount > previewLimit,
    canShowLess: effectiveExtraPages > 0,
  };
}

export function getVisibleThreadsForProject<T extends { readonly id: string }>(input: {
  readonly threads: readonly T[];
  readonly activeThreadId: string | undefined;
  readonly previewLimit: number;
}): {
  readonly hasHiddenThreads: boolean;
  readonly visibleThreads: T[];
} {
  const { activeThreadId, previewLimit, threads } = input;
  const hasHiddenThreads = threads.length > previewLimit;

  if (!hasHiddenThreads) {
    return { hasHiddenThreads, visibleThreads: [...threads] };
  }

  const previewThreads = threads.slice(0, previewLimit);
  if (!activeThreadId || previewThreads.some((thread) => thread.id === activeThreadId)) {
    return { hasHiddenThreads: true, visibleThreads: previewThreads };
  }

  const activeThread = threads.find((thread) => thread.id === activeThreadId);
  if (!activeThread) {
    return { hasHiddenThreads: true, visibleThreads: previewThreads };
  }

  const visibleThreadIds = new Set([...previewThreads, activeThread].map((thread) => thread.id));
  return {
    hasHiddenThreads: true,
    visibleThreads: threads.filter((thread) => visibleThreadIds.has(thread.id)),
  };
}

export interface SidebarThreadTreeRow<
  T extends { readonly id: string; readonly parentThreadId?: string | null | undefined },
> {
  readonly thread: T;
  readonly depth: number;
  readonly rootThreadId: T["id"];
}

function collectActiveThreadAncestorIds<
  T extends { readonly id: string; readonly parentThreadId?: string | null | undefined },
>(threadById: Map<T["id"], T>, forceVisibleThreadId: T["id"] | undefined): Set<T["id"]> {
  const ancestorIds = new Set<T["id"]>();
  let currentThreadId = forceVisibleThreadId;

  while (currentThreadId) {
    const parentThreadId = threadById.get(currentThreadId)?.parentThreadId ?? undefined;
    if (!parentThreadId) break;
    ancestorIds.add(parentThreadId);
    currentThreadId = parentThreadId;
  }

  return ancestorIds;
}

// Build the project-local parent/child tree while preserving input sort order.
export function buildProjectThreadTree<
  T extends { readonly id: string; readonly parentThreadId?: string | null | undefined },
>(input: {
  readonly threads: readonly T[];
  readonly forceVisibleThreadId?: T["id"] | undefined;
}): SidebarThreadTreeRow<T>[] {
  const { forceVisibleThreadId, threads } = input;
  const threadById = new Map(threads.map((thread) => [thread.id, thread] as const));
  const childrenByParentId = new Map<T["id"], T[]>();
  const roots: T[] = [];

  for (const thread of threads) {
    const parentThreadId = thread.parentThreadId ?? null;
    if (!parentThreadId) {
      roots.push(thread);
      continue;
    }
    // Subagent threads are only reachable through their parent. When the parent
    // is not in the list (archived or deleted), its subtree stays hidden instead
    // of being promoted to top-level rows.
    if (!threadById.has(parentThreadId)) {
      continue;
    }
    const siblings = childrenByParentId.get(parentThreadId) ?? [];
    siblings.push(thread);
    childrenByParentId.set(parentThreadId, siblings);
  }

  const activeThreadAncestorIds = collectActiveThreadAncestorIds(threadById, forceVisibleThreadId);
  const orderedRows: SidebarThreadTreeRow<T>[] = [];

  const visit = (thread: T, depth: number, rootThreadId: T["id"]) => {
    const childThreads = childrenByParentId.get(thread.id) ?? [];
    const revealsActiveDescendant =
      childThreads.length > 0 && activeThreadAncestorIds.has(thread.id);

    orderedRows.push({ thread, depth, rootThreadId });
    if (!revealsActiveDescendant) return;
    for (const child of childThreads) visit(child, depth + 1, rootThreadId);
  };

  for (const root of roots) visit(root, 0, root.id);
  return orderedRows;
}

export function getVisibleSidebarEntriesForPreview<
  T extends { readonly rowId: string; readonly rootRowId: string },
>(input: {
  readonly entries: readonly T[];
  readonly activeEntryId: string | undefined;
  readonly previewLimit: number;
}): {
  readonly hasHiddenEntries: boolean;
  readonly visibleEntries: T[];
} {
  const { activeEntryId, entries, previewLimit } = input;
  const hasHiddenEntries = entries.length > previewLimit;

  if (!hasHiddenEntries) {
    return { hasHiddenEntries, visibleEntries: [...entries] };
  }

  const previewEntries = entries.slice(0, previewLimit);
  const visibleEntryIds = new Set(previewEntries.map((entry) => entry.rowId));
  if (!activeEntryId || visibleEntryIds.has(activeEntryId)) {
    return { hasHiddenEntries: true, visibleEntries: previewEntries };
  }

  const activeEntryIndex = entries.findIndex((entry) => entry.rowId === activeEntryId);
  if (activeEntryIndex === -1) {
    return { hasHiddenEntries: true, visibleEntries: previewEntries };
  }

  const activeEntry = entries[activeEntryIndex];
  if (!activeEntry) {
    return { hasHiddenEntries: true, visibleEntries: previewEntries };
  }

  const rootEntryIndex = entries.findIndex((entry) => entry.rowId === activeEntry.rootRowId);
  const forcedVisibleEntries =
    rootEntryIndex === -1 ? [activeEntry] : entries.slice(rootEntryIndex, activeEntryIndex + 1);
  for (const entry of forcedVisibleEntries) visibleEntryIds.add(entry.rowId);

  return {
    hasHiddenEntries: true,
    visibleEntries: entries.filter((entry) => visibleEntryIds.has(entry.rowId)),
  };
}
