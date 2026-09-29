import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("ExplorerSearchInputHeader", () => {
  it("is shared by the product and Lab with centered input geometry", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./explorer-dock.css", import.meta.url), "utf8");
    const lab = readFileSync(
      new URL("./ComponentsLabStoryRenderer.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(source).toContain("export function ExplorerSearchInputHeader");
    expect(source).toContain("<ExplorerSearchInputHeader");
    expect(source).toContain('placeholder="Search files..."');
    expect(styles).toMatch(/\.ExplorerDockSearchInput\s*\{[^}]*height:\s*28px;/s);
    expect(lab).toContain("<ExplorerSearchInputHeader");
  });
});
