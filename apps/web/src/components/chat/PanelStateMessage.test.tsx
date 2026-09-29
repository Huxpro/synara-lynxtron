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

  it("keeps plain hints silent and exposes explicit status and alert semantics", () => {
    const plainMarkup = renderToStaticMarkup(<PanelStateMessage>Select a file</PanelStateMessage>);
    const statusMarkup = renderToStaticMarkup(
      <PanelStateMessage intent="status" announcement="Loading conversation">
        Loading conversation…
      </PanelStateMessage>,
    );
    const alertMarkup = renderToStaticMarkup(
      <PanelStateMessage intent="alert">Unable to load conversation.</PanelStateMessage>,
    );

    expect(plainMarkup).not.toContain("role=");
    expect(plainMarkup).not.toContain("aria-live=");
    expect(statusMarkup).toContain('role="status"');
    expect(statusMarkup).toContain('aria-live="polite"');
    expect(statusMarkup).toContain('aria-atomic="true"');
    expect(statusMarkup).toContain('aria-label="Loading conversation"');
    expect(alertMarkup).toContain('role="alert"');
    expect(alertMarkup).toContain('aria-live="assertive"');
  });
});
