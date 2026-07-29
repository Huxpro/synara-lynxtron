import { describe, expect, it } from "vitest";

import {
  deriveSidebarChatRows,
  resolveSidebarChatListTransition,
} from "./SidebarChatRows.logic";

type TestThread = {
  readonly id: string;
  readonly parentThreadId?: string | null;
};

function makeThread(id: string, parentThreadId?: string): TestThread {
  return { id, parentThreadId };
}

describe("deriveSidebarChatRows", () => {
  it("builds a root-aware preview and keeps the active child with its parent", () => {
    const threads = [
      makeThread("root-1"),
      makeThread("root-2"),
      makeThread("root-3"),
      makeThread("root-4"),
      makeThread("root-5"),
      makeThread("root-6"),
      makeThread("child-6", "root-6"),
    ];

    const result = deriveSidebarChatRows({
      threads,
      expanded: true,
      activeThreadId: "child-6",
      requestedExtraPages: 0,
      previewLimit: 5,
      previewPageSize: 5,
    });

    expect(result.visibleEntries.map((entry) => entry.rowId)).toEqual([
      "root-1",
      "root-2",
      "root-3",
      "root-4",
      "root-5",
      "root-6",
      "child-6",
    ]);
    expect(result.canShowMoreThreads).toBe(false);
  });

  it("clamps stale paging and exposes one-page transitions", () => {
    const result = deriveSidebarChatRows({
      threads: Array.from({ length: 11 }, (_, index) => makeThread(`thread-${index}`)),
      expanded: true,
      activeThreadId: undefined,
      requestedExtraPages: 99,
      previewLimit: 5,
      previewPageSize: 5,
    });

    expect(result.effectiveExtraPages).toBe(2);
    expect(result.visibleEntries).toHaveLength(11);
    expect(result.canShowMoreThreads).toBe(false);
    expect(result.canShowLessThreads).toBe(true);
  });

  it("does no tree or paging work while collapsed", () => {
    const result = deriveSidebarChatRows({
      threads: [makeThread("thread-1")],
      expanded: false,
      activeThreadId: "thread-1",
      requestedExtraPages: 2,
      previewLimit: 5,
      previewPageSize: 5,
    });

    expect(result).toEqual({
      orderedEntries: [],
      orderedThreadIds: [],
      visibleEntries: [],
      effectiveExtraPages: 0,
      canShowMoreThreads: false,
      canShowLessThreads: false,
      activeEntryId: null,
    });
  });
});

describe("resolveSidebarChatListTransition", () => {
  it("preserves requested pages while toggling disclosure", () => {
    expect(
      resolveSidebarChatListTransition({
        expanded: true,
        requestedExtraPages: 3,
        effectiveExtraPages: 2,
        action: "toggle",
      }),
    ).toEqual({ expanded: false, requestedExtraPages: 3 });
  });

  it("moves from the clamped effective page in both directions", () => {
    expect(
      resolveSidebarChatListTransition({
        expanded: true,
        requestedExtraPages: 99,
        effectiveExtraPages: 2,
        action: "show_more",
      }).requestedExtraPages,
    ).toBe(3);
    expect(
      resolveSidebarChatListTransition({
        expanded: true,
        requestedExtraPages: 99,
        effectiveExtraPages: 2,
        action: "show_less",
      }).requestedExtraPages,
    ).toBe(1);
  });
});
