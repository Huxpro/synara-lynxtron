import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import {
  KanbanStateComposition,
  resolveKanbanStatePresentation,
} from "./KanbanStateComposition";

describe("KanbanStateComposition", () => {
  it("separates loading, offline and missing-project semantics", () => {
    expect(resolveKanbanStatePresentation("loading-project")).toMatchObject({
      intent: "status",
      title: "Building board…",
    });
    expect(resolveKanbanStatePresentation("offline")).toMatchObject({
      intent: "alert",
      title: "Synara is offline",
    });
    expect(resolveKanbanStatePresentation("not-found")).toMatchObject({
      intent: "empty",
      title: "Project not found",
    });
  });

  it("renders an actionable alert without hiding stale-board copy", () => {
    const markup = renderToStaticMarkup(
      <KanbanStateComposition kind="stale-offline" onRetry={vi.fn()} />,
    );

    expect(markup).toContain('role="alert"');
    expect(markup).toContain("showing the last loaded board");
    expect(markup).toContain(">Retry<");
  });

  it("disables a retry already in progress", () => {
    const markup = renderToStaticMarkup(
      <KanbanStateComposition kind="error" retrying onRetry={vi.fn()} />,
    );

    expect(markup).toContain("Retrying…");
    expect(markup).toContain("disabled");
  });
});
