import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it } from "vitest";

import { PanelStateMessage } from "./PanelStateMessage";

describe("PanelStateMessage", () => {
  it("preserves the comfortable full-panel presentation by default", () => {
    const markup = renderToStaticMarkup(
      <PanelStateMessage>Loading conversation…</PanelStateMessage>,
    );

    expect(markup).toContain("h-full min-h-0");
    expect(markup).toContain("p-6 text-sm text-muted-foreground");
    expect(markup).toContain("Loading conversation…");
  });

  it("preserves compact flex presentation and caller classes", () => {
    const markup = renderToStaticMarkup(
      <PanelStateMessage density="compact" fill="flex" className="items-start">
        Unavailable
      </PanelStateMessage>,
    );

    expect(markup).toContain("flex-1");
    expect(markup).toContain("px-5 text-xs text-muted-foreground/70");
    expect(markup).toContain("items-start");
  });
});
