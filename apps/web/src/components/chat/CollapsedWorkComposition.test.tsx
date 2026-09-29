import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { collapsedWorkLabel, CollapsedWorkComposition } from "./CollapsedWorkComposition";

describe("CollapsedWorkComposition", () => {
  it("owns the canonical elapsed label and collapsed anatomy", () => {
    const markup = renderToStaticMarkup(
      <CollapsedWorkComposition elapsed="6.0s" open={false} onOpenChange={vi.fn()}>
        <span>tool detail</span>
      </CollapsedWorkComposition>,
    );

    expect(collapsedWorkLabel("6.0s")).toBe("Worked for 6.0s");
    expect(markup).toContain("Worked for 6.0s");
    expect(markup).toContain('aria-label="Expand Worked for 6.0s"');
    expect(markup).not.toContain("tool detail");
  });

  it("uses Details and exposes the expanded state through its trigger", () => {
    const markup = renderToStaticMarkup(
      <CollapsedWorkComposition open onOpenChange={vi.fn()}>
        tool detail
      </CollapsedWorkComposition>,
    );

    expect(collapsedWorkLabel(null)).toBe("Details");
    expect(markup).toContain('aria-label="Collapse Details"');
    expect(markup).toContain("tool detail");
  });
});
