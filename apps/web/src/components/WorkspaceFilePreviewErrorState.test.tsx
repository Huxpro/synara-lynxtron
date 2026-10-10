import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";
import { WorkspaceFilePreviewErrorState } from "./WorkspaceFilePreviewErrorState";

describe("WorkspaceFilePreviewErrorState", () => {
  it("renders shared recovery copy and both owning actions", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceFilePreviewErrorState
        detail="ENOENT: missing.ts"
        onRetry={vi.fn()}
        onClose={vi.fn()}
      />,
    );
    expect(markup).toContain("Could not read this file.");
    expect(markup).toContain("The file may have moved, changed, or become unavailable.");
    expect(markup).toContain(">Retry<");
    expect(markup).toContain(">Close preview<");
    expect(markup).toContain("ENOENT: missing.ts");
  });

  it("exposes a disabled retrying state without inventing a close owner", () => {
    const markup = renderToStaticMarkup(
      <WorkspaceFilePreviewErrorState retrying onRetry={vi.fn()} />,
    );
    expect(markup).toContain("Retrying…");
    expect(markup).toContain("disabled");
    expect(markup).not.toContain("Close preview");
  });
});
