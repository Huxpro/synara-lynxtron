// FILE: SidebarProjectRows.logic.ts
// Purpose: Portable per-project tree, collapsed reveal, and paging derivation.
// Exports: Shared controller core with host/product status rules injected.

import {
  buildProjectThreadTree,
  getVisibleSidebarEntriesForPreview,
  resolveSidebarThreadListPaging,
} from "./SidebarThreadPaging.logic";

export interface SidebarProjectRowEntry<TThread> {
  readonly kind: "thread";
  readonly rowId: string;
  readonly rootRowId: string;
  readonly thread: TThread;
  readonly depth: number;
}

export interface SidebarProjectRowsData<TThread, TStatus> {
  readonly allProjectThreadCount: number;
  readonly projectThreads: readonly TThread[];
  readonly orderedProjectThreadIds: readonly string[];
  readonly visibleEntries: readonly SidebarProjectRowEntry<TThread>[];
  readonly threadListExtraPages: number;
  readonly canShowMoreThreads: boolean;
  readonly canShowLessThreads: boolean;
  readonly activeEntryId: string | null;
  readonly projectStatus: TStatus;
}

export function deriveSidebarProjectRows<
  TProject extends { readonly id: string; readonly cwd: string; readonly expanded: boolean },
  TThread extends {
    readonly id: string;
    readonly parentThreadId?: string | null | undefined;
  },
  TThreadStatus,
  TProjectStatus,
>(input: {
  readonly projects: readonly TProject[];
  readonly sortedThreadsByProjectId: ReadonlyMap<string, readonly TThread[]>;
  readonly pinnedThreadIds: readonly string[];
  readonly filterPinnedThreads: (
    threads: readonly TThread[],
    pinnedThreadIds: readonly string[],
  ) => readonly TThread[];
  readonly resolveThreadStatus: (thread: TThread) => TThreadStatus;
  readonly resolveProjectStatus: (statuses: readonly TThreadStatus[]) => TProjectStatus;
  readonly threadListExtraPagesByProjectCwd: ReadonlyMap<string, number>;
  readonly normalizeProjectCwd: (cwd: string) => string;
  readonly activeThreadId: string | undefined;
  readonly previewLimit: number;
  readonly previewPageSize: number;
}): ReadonlyMap<string, SidebarProjectRowsData<TThread, TProjectStatus>> {
  const byProjectId = new Map<string, SidebarProjectRowsData<TThread, TProjectStatus>>();

  for (const project of input.projects) {
    const allProjectThreads = input.sortedThreadsByProjectId.get(project.id) ?? [];
    const projectThreads = input.filterPinnedThreads(
      allProjectThreads,
      input.pinnedThreadIds,
    );
    const projectStatus = input.resolveProjectStatus(
      allProjectThreads.map(input.resolveThreadStatus),
    );
    const requestedExtraPages =
      input.threadListExtraPagesByProjectCwd.get(input.normalizeProjectCwd(project.cwd)) ?? 0;
    const orderedProjectThreadIds = projectThreads.map((thread) => thread.id);

    if (!project.expanded) {
      const activeThread =
        input.activeThreadId === undefined
          ? null
          : (projectThreads.find((thread) => thread.id === input.activeThreadId) ?? null);
      const visibleEntries =
        activeThread === null
          ? []
          : [{
              kind: "thread" as const,
              rowId: activeThread.id,
              rootRowId: activeThread.id,
              thread: activeThread,
              depth: 0,
            }];
      byProjectId.set(project.id, {
        allProjectThreadCount: allProjectThreads.length,
        projectThreads,
        orderedProjectThreadIds,
        visibleEntries,
        threadListExtraPages: 0,
        canShowMoreThreads: false,
        canShowLessThreads: false,
        activeEntryId: activeThread?.id ?? null,
        projectStatus,
      });
      continue;
    }

    const orderedEntries = buildProjectThreadTree({
      threads: projectThreads,
      forceVisibleThreadId: input.activeThreadId,
    }).map(({ thread, depth, rootThreadId }) => ({
      kind: "thread" as const,
      rowId: thread.id,
      rootRowId: rootThreadId,
      thread,
      depth,
    }));
    const activeEntry =
      input.activeThreadId === undefined
        ? null
        : (orderedEntries.find((entry) => entry.rowId === input.activeThreadId) ?? null);
    const paging = resolveSidebarThreadListPaging({
      totalCount: orderedEntries.length,
      baseLimit: input.previewLimit,
      pageSize: input.previewPageSize,
      requestedExtraPages,
    });
    const { visibleEntries } = getVisibleSidebarEntriesForPreview({
      entries: orderedEntries,
      activeEntryId: activeEntry?.rowId,
      previewLimit: paging.previewLimit,
    });

    byProjectId.set(project.id, {
      allProjectThreadCount: allProjectThreads.length,
      projectThreads,
      orderedProjectThreadIds,
      visibleEntries,
      threadListExtraPages: paging.effectiveExtraPages,
      canShowMoreThreads: paging.canShowMore && visibleEntries.length < orderedEntries.length,
      canShowLessThreads: paging.canShowLess,
      activeEntryId: activeEntry?.rowId ?? null,
      projectStatus,
    });
  }
  return byProjectId;
}
