import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { KanbanRouteHeaderComposition } from "./KanbanRouteHeaderComposition";

describe("KanbanRouteHeaderComposition", () => {
  it("owns the canonical back, identity, count, and new-task order", () => {
    const markup = renderToStaticMarkup(
      <KanbanRouteHeaderComposition
        title="Project A"
        taskCount={3}
        navigationAvailable={false}
        backAvailable
        onBack={vi.fn()}
        newTaskDisabled={false}
        newTaskShortcutParts={["⌥", "⌘", "T"]}
        onNewTask={vi.fn()}
      />,
    );

    expect(markup).toContain('aria-label="Back to all projects"');
    expect(markup.indexOf("Project A")).toBeLessThan(markup.indexOf("3 tasks"));
    expect(markup.indexOf("3 tasks")).toBeLessThan(markup.indexOf("New task"));
  });
});
