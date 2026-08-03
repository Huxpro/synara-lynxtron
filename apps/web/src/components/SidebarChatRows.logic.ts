// FILE: SidebarChatRows.logic.ts
// Purpose: Portable home-chat tree and preview paging derivation.
// Exports: Shared controller used by both the Web and Lynx sidebars.

import {
  buildProjectThreadTree,
  getVisibleSidebarEntriesForPreview,
  resolveSidebarThreadListPaging,
} from "./SidebarThreadPaging.logic";

export interface SidebarChatRowEntry<
  TThread extends { readonly id: string; readonly parentThreadId?: string | null | undefined },
> {
  readonly kind: "thread";
  readonly rowId: TThread["id"];
  readonly rootRowId: TThread["id"];
  readonly row: {
    readonly thread: TThread;
    readonly depth: number;
    readonly rootThreadId: TThread["id"];
  };
}

export interface SidebarChatRowsData<
  TThread extends { readonly id: string; readonly parentThreadId?: string | null | undefined },
> {
  readonly orderedEntries: readonly SidebarChatRowEntry<TThread>[];
  readonly orderedThreadIds: readonly TThread["id"][];
  readonly visibleEntries: readonly SidebarChatRowEntry<TThread>[];
  readonly effectiveExtraPages: number;
  readonly canShowMoreThreads: boolean;
  readonly canShowLessThreads: boolean;
  readonly activeEntryId: string | null;
}

export type SidebarChatListAction = "toggle" | "show_more" | "show_less";

export function resolveSidebarChatListTransition(input: {
  readonly expanded: boolean;
  readonly requestedExtraPages: number;
  readonly effectiveExtraPages: number;
  readonly action: SidebarChatListAction;
}): {
  readonly expanded: boolean;
  readonly requestedExtraPages: number;
} {
  switch (input.action) {
    case "toggle":
      return {
        expanded: !input.expanded,
        requestedExtraPages: input.requestedExtraPages,
      };
    case "show_more":
      return {
        expanded: input.expanded,
        requestedExtraPages: input.effectiveExtraPages + 1,
      };
    case "show_less":
      return {
        expanded: input.expanded,
        requestedExtraPages: Math.max(0, input.effectiveExtraPages - 1),
      };
  }
}

export function deriveSidebarChatRows<
  TThread extends {
    readonly id: string;
    readonly parentThreadId?: string | null | undefined;
  },
>(input: {
  readonly threads: readonly TThread[];
  readonly expanded: boolean;
  readonly activeThreadId: string | undefined;
  readonly requestedExtraPages: number;
  readonly previewLimit: number;
  readonly previewPageSize: number;
}): SidebarChatRowsData<TThread> {
  if (!input.expanded) {
    return {
      orderedEntries: [],
      orderedThreadIds: [],
      visibleEntries: [],
      effectiveExtraPages: 0,
      canShowMoreThreads: false,
      canShowLessThreads: false,
      activeEntryId: null,
    };
  }

  const orderedEntries = buildProjectThreadTree({
    threads: input.threads,
    forceVisibleThreadId: input.activeThreadId,
  }).map((row) => ({
    kind: "thread" as const,
    rowId: row.thread.id,
    rootRowId: row.rootThreadId,
    row,
  }));
  const activeEntry =
    input.activeThreadId === undefined
      ? null
      : (orderedEntries.find((entry) => entry.rowId === input.activeThreadId) ?? null);
  const paging = resolveSidebarThreadListPaging({
    totalCount: orderedEntries.length,
    baseLimit: input.previewLimit,
    pageSize: input.previewPageSize,
    requestedExtraPages: input.requestedExtraPages,
  });
  const { visibleEntries } = getVisibleSidebarEntriesForPreview({
    entries: orderedEntries,
    activeEntryId: activeEntry?.rowId,
    previewLimit: paging.previewLimit,
  });

  return {
    orderedEntries,
    orderedThreadIds: orderedEntries.map((entry) => entry.rowId),
    visibleEntries,
    effectiveExtraPages: paging.effectiveExtraPages,
    canShowMoreThreads: paging.canShowMore && visibleEntries.length < orderedEntries.length,
    canShowLessThreads: paging.canShowLess,
    activeEntryId: activeEntry?.rowId ?? null,
  };
}
