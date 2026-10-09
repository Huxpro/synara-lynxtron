import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { KanbanCardComposition } from "./KanbanCardComposition";
import type { KanbanCard } from "./kanban.logic";

function makeDraftCard(): KanbanCard {
  return {
    cardId: "thread:thread-1",
    threadId: "thread-1" as KanbanCard["threadId"],
    projectId: "project-1" as KanbanCard["projectId"],
    column: "draft",
    title: "Document the release",
    provider: "codex",
    providerInstanceId: null,
    isTerminal: false,
    branch: "feature/release",
    envMode: null,
    worktreePath: null,
    thread: null,
    draftPrompt: "Capture the final verification notes.",
    draftHasAttachments: true,
    sortTimestamp: 0,
    timestamp: null,
    activeWorkStartedAt: null,
    isOptimisticDispatch: false,
  };
}

describe("KanbanCardComposition", () => {
  it("owns title, draft preview, metadata, and column-status order", () => {
    const markup = renderToStaticMarkup(<KanbanCardComposition card={makeDraftCard()} />);

    const titleIndex = markup.indexOf("Document the release");
    const previewIndex = markup.indexOf("Capture the final verification notes.");
    const branchIndex = markup.indexOf("feature/release");
    const columnIndex = markup.lastIndexOf("Draft");

    expect(markup).toContain('aria-label="Document the release, Draft"');
    expect(titleIndex).toBeGreaterThan(-1);
    expect(previewIndex).toBeGreaterThan(titleIndex);
    expect(branchIndex).toBeGreaterThan(previewIndex);
    expect(columnIndex).toBeGreaterThan(branchIndex);
  });
});
