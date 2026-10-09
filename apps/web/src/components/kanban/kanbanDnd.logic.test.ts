import { describe, expect, it } from "vitest";

import type { KanbanCard } from "./kanban.logic";
import { resolveKanbanCrossColumnDropPolicy, resolveKanbanDragColumn } from "./kanbanDnd.logic";

function card(overrides: Partial<KanbanCard> = {}): KanbanCard {
  return {
    cardId: "thread:thread-a",
    threadId: "thread-a" as KanbanCard["threadId"],
    projectId: "project-a" as KanbanCard["projectId"],
    column: "draft",
    title: "Task A",
    provider: "codex",
    providerInstanceId: null,
    isTerminal: false,
    branch: null,
    envMode: null,
    worktreePath: null,
    thread: { id: "thread-a" } as KanbanCard["thread"],
    draftPrompt: "Run the task",
    draftHasAttachments: false,
    sortTimestamp: 0,
    timestamp: null,
    activeWorkStartedAt: null,
    isOptimisticDispatch: false,
    ...overrides,
  };
}

describe("Kanban cross-column DnD policy", () => {
  it("uses measured column rectangles rather than screen-size thirds", () => {
    const rects = [
      { column: "draft" as const, left: 16, right: 316, top: 100, bottom: 700 },
      {
        column: "inProgress" as const,
        left: 332,
        right: 632,
        top: 100,
        bottom: 700,
      },
      { column: "done" as const, left: 648, right: 948, top: 100, bottom: 700 },
    ];

    expect(resolveKanbanDragColumn({ x: 500, y: 400 }, rects)).toBe("inProgress");
    expect(resolveKanbanDragColumn({ x: 324, y: 400 }, rects)).toBeNull();
    expect(resolveKanbanDragColumn({ x: 500, y: 90 }, rects)).toBeNull();
  });

  it("allows only the canonical Draft to In Progress transition", () => {
    expect(
      resolveKanbanCrossColumnDropPolicy(card(), "inProgress", {
        canSupplyStartPrompt: true,
      }),
    ).toEqual({ kind: "dispatch", label: "Release to start task" });
    expect(
      resolveKanbanCrossColumnDropPolicy(card(), "done", {
        canSupplyStartPrompt: true,
      }),
    ).toMatchObject({ kind: "invalid", reason: "done-derived" });
    expect(
      resolveKanbanCrossColumnDropPolicy(card({ column: "done" }), "draft", {
        canSupplyStartPrompt: true,
      }),
    ).toMatchObject({ kind: "invalid", reason: "derived-source" });
  });

  it("routes an empty real Draft through the existing Start prompt fallback", () => {
    expect(
      resolveKanbanCrossColumnDropPolicy(card({ draftPrompt: "" }), "inProgress", {
        canSupplyStartPrompt: true,
      }),
    ).toEqual({ kind: "prompt-required", label: "Release to add a prompt" });
    expect(
      resolveKanbanCrossColumnDropPolicy(card({ draftPrompt: "", thread: null }), "inProgress", {
        canSupplyStartPrompt: true,
      }),
    ).toMatchObject({ kind: "invalid", reason: "prompt-unavailable" });
  });

  it("treats same-column and outside-board drops as non-mutations", () => {
    expect(
      resolveKanbanCrossColumnDropPolicy(card(), "draft", {
        canSupplyStartPrompt: true,
      }).kind,
    ).toBe("noop");
    expect(
      resolveKanbanCrossColumnDropPolicy(card(), null, {
        canSupplyStartPrompt: true,
      }),
    ).toMatchObject({ kind: "invalid", reason: "outside-board" });
  });
});
