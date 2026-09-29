import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { PullRequestDetailCloseComposition } from "./PullRequestDetailCloseComposition";

describe("PullRequestDetailCloseComposition", () => {
  it("owns the canonical close label when the panel is closable", () => {
    const markup = renderToStaticMarkup(<PullRequestDetailCloseComposition onClose={vi.fn()} />);

    expect(markup).toContain('aria-label="Close pull request panel"');
    expect(markup).toContain("Close");
  });

  it("does not draw a close affordance without a close action", () => {
    expect(renderToStaticMarkup(<PullRequestDetailCloseComposition />)).toBe("");
  });
});
