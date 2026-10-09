import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { KanbanColumnComposition, KANBAN_DONE_RENDER_CAP } from "./KanbanColumnComposition";
import type { KanbanCard } from "./kanban.logic";

function card(index: number, column: KanbanCard["column"]): KanbanCard {
  return {
    cardId: `thread:${index}`,
    threadId: `thread-${index}` as KanbanCard["threadId"],
    projectId: "project-1" as KanbanCard["projectId"],
    column,
    title: `Card ${index}`,
    provider: null,
    providerInstanceId: null,
    isTerminal: false,
    branch: null,
    envMode: null,
    worktreePath: null,
    thread: null,
    draftPrompt: "",
    draftHasAttachments: false,
    sortTimestamp: index,
    timestamp: null,
    activeWorkStartedAt: null,
    isOptimisticDispatch: false,
  };
}

describe("KanbanColumnComposition", () => {
  it("owns the header, count, dispatch affordance, and empty copy", () => {
    const markup = renderToStaticMarkup(
      <KanbanColumnComposition
        columnKey="inProgress"
        cards={[]}
        onOpenCard={vi.fn()}
        showDispatchTarget
      />,
    );

    expect(markup).toContain("In Progress");
    expect(markup).toContain("Drop to send");
    expect(markup).toContain("No cards");
  });

  it("publishes a policy-specific DnD target label", () => {
    const markup = renderToStaticMarkup(
      <KanbanColumnComposition
        columnKey="inProgress"
        cards={[]}
        onOpenCard={vi.fn()}
        showDispatchTarget
        dispatchTargetLabel="Release to add a prompt"
      />,
    );

    expect(markup).toContain("Release to add a prompt");
  });

  it("caps long Done columns and exposes the exact hidden count", () => {
    const cards = Array.from({ length: KANBAN_DONE_RENDER_CAP + 2 }, (_, index) =>
      card(index, "done"),
    );
    const markup = renderToStaticMarkup(
      <KanbanColumnComposition columnKey="done" cards={cards} onOpenCard={vi.fn()} />,
    );

    expect(markup).toContain(`Card ${KANBAN_DONE_RENDER_CAP - 1}`);
    expect(markup).not.toContain(`Card ${KANBAN_DONE_RENDER_CAP}`);
    expect(markup).toContain("Show 2 more");
  });
});
