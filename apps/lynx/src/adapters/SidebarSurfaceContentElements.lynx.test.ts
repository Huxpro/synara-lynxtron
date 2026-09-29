import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("sidebar fixed and scroll ownership", () => {
  const composition = readFileSync(
    new URL("../../../web/src/components/SidebarSurfaceContent.tsx", import.meta.url),
    "utf8",
  );
  const elements = readFileSync(
    new URL("./SidebarSurfaceContentElements.lynx.tsx", import.meta.url),
    "utf8",
  );
  const styles = readFileSync(
    new URL("../components/sidebar/sidebar.css", import.meta.url),
    "utf8",
  );

  it("keeps the picker and primary navigation outside collection scrolling", () => {
    expect(composition).toContain("<SidebarFixedRegionElement>");
    expect(composition).toContain("{props.picker}");
    expect(composition).toContain("{props.navigation}");
    expect(composition).toContain("<SidebarScrollRegionElement>");
    expect(composition).toContain("{props.body}");
    expect(composition).toContain("{props.trailing}");
  });

  it("maps only the collection region to the Native scroll view", () => {
    expect(elements).toContain('className="AppSidebarFixedRegion"');
    expect(elements).toContain(
      '<scroll-view className="AppSidebarScroll" scroll-orientation="vertical">',
    );
    expect(elements.match(/className="AppSidebarScroll"/g) ?? []).toHaveLength(1);
    expect(styles).toMatch(
      /\.AppSidebarContentFrame\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*flex-direction:\s*column;/s,
    );
    expect(styles).toMatch(/\.AppSidebarFixedRegion\s*\{[^}]*flex-shrink:\s*0;/s);
  });
});
