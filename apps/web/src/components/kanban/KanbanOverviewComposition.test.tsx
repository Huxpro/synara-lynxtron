import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { KanbanOverviewComposition } from "./KanbanOverviewComposition";
import type { KanbanBoard, KanbanCard } from "./kanban.logic";

function card(
  cardId: string,
  column: KanbanCard["column"],
  title: string,
): KanbanCard {
  return {
    cardId,
    threadId: cardId as KanbanCard["threadId"],
    projectId: "project-ready" as KanbanCard["projectId"],
    column,
    title,
    provider: null,
    isTerminal: false,
    branch: null,
    envMode: null,
    worktreePath: null,
    thread: null,
    draftPrompt: "",
    draftHasAttachments: false,
    sortTimestamp: 0,
    timestamp: null,
    activeWorkStartedAt: null,
    isOptimisticDispatch: false,
  };
}

describe("KanbanOverviewComposition", () => {
  it("filters empty projects and owns in-progress, draft, done card order", () => {
    const running = card("running", "inProgress", "Running card");
    const draft = card("draft", "draft", "Draft card");
    const done = card("done", "done", "Done card");
    const board: KanbanBoard = {
      totalCount: 3,
      projects: [
        {
          projectId: "project-empty" as KanbanCard["projectId"],
          projectName: "Empty project",
          projectKind: "project",
          draft: [],
          inProgress: [],
          done: [],
          totalCount: 0,
        },
        {
          projectId: "project-ready" as KanbanCard["projectId"],
          projectName: "Ready project",
          projectKind: "project",
          draft: [draft],
          inProgress: [running],
          done: [done],
          totalCount: 3,
        },
      ],
    };

    const markup = renderToStaticMarkup(
      <KanbanOverviewComposition
        board={board}
        onOpenProject={vi.fn()}
        onOpenCard={vi.fn()}
      />,
    );

    expect(markup).not.toContain("Empty project");
    expect(markup).toContain("Ready project");
    expect(markup.indexOf("Running card")).toBeLessThan(
      markup.indexOf("Draft card"),
    );
    expect(markup.indexOf("Draft card")).toBeLessThan(
      markup.indexOf("Done card"),
    );
  });

  it("uses the canonical empty-state copy", () => {
    const markup = renderToStaticMarkup(
      <KanbanOverviewComposition
        board={{ projects: [], totalCount: 0 }}
        onOpenProject={vi.fn()}
        onOpenCard={vi.fn()}
      />,
    );
    expect(markup).toContain("Nothing on the board yet");
    expect(markup).toContain("completed chats will show up here automatically");
  });
});
