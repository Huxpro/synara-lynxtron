import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("SidebarPrimarySurfaceNavigation", () => {
  it("does not forward renderer activation events as search query arguments", () => {
    const source = readFileSync(
      new URL("./SidebarPrimarySurfaceNavigation.tsx", import.meta.url),
      "utf8",
    );

    expect(
      source.match(
        /onActivate: props\.onOpenSearch \? \(\) => props\.onOpenSearch\?\.\(\) : undefined/g,
      ),
    ).toHaveLength(2);
    expect(source).not.toContain("onActivate: props.onOpenSearch,");
  });
});
