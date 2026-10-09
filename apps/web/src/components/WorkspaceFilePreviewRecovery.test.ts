import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace file preview recovery ownership", () => {
  it("keeps retry in the query owner and close in the file pane owner", () => {
    const preview = readFileSync(new URL("./WorkspaceFilePreview.tsx", import.meta.url), "utf8");
    const filePane = readFileSync(new URL("./chat/DockFilePane.tsx", import.meta.url), "utf8");

    expect(preview).toContain("onRetry={() => void fileQuery.refetch()}");
    expect(preview).toContain("onClose={props.onClosePreview}");
    expect(filePane).toContain("onClosePreview={props.onClosePreview}");
    // Upstream owns the explorer pane and the chat surface; they do not pass a close
    // handler, so the preview's Close action shows only where a file pane provides one.
  });
});
