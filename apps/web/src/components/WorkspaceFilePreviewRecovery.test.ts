import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("workspace file preview recovery ownership", () => {
  it("keeps retry in the query owner and close in each surface owner", () => {
    const preview = readFileSync(new URL("./WorkspaceFilePreview.tsx", import.meta.url), "utf8");
    const explorer = readFileSync(new URL("./chat/DockExplorerPane.tsx", import.meta.url), "utf8");
    const filePane = readFileSync(new URL("./chat/DockFilePane.tsx", import.meta.url), "utf8");
    const surface = readFileSync(new URL("./chat/SingleChatSurface.tsx", import.meta.url), "utf8");

    expect(preview).toContain("onRetry={() => void fileQuery.refetch()}");
    expect(preview).toContain("onClose={props.onClosePreview}");
    expect(explorer).toContain("onClosePreview={() => setSelectedFilePath(null)}");
    expect(filePane).toContain("onClosePreview={props.onClosePreview}");
    expect(surface).toContain("onClosePreview={() => closePane(props.threadId, pane.id)}");
    expect(surface).toContain("editorFilePath: undefined");
    expect(surface).toContain("onCloseFilePreview={handleCloseEditorFilePreview}");
  });
});
