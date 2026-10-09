import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx sidebar primary icons", () => {
  const adapterSource = readFileSync(
    new URL("./SidebarPrimaryIcons.lynx.tsx", import.meta.url),
    "utf8",
  );
  const sidebarSource = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");
  const sharedSource = readFileSync(
    new URL("../../../../web/src/components/SidebarPrimarySurfaceNavigation.tsx", import.meta.url),
    "utf8",
  );

  it("renders the three Central sidebar glyphs as Native SVG content", () => {
    expect(adapterSource).toContain(
      'import newThreadSvg from "@synara-central-icons/compose-pencil.svg?raw";',
    );
    expect(adapterSource).toContain(
      'import kanbanSvg from "@synara-central-icons/columns-3-wide.svg?raw";',
    );
    expect(adapterSource).toContain('import clockSvg from "@synara-central-icons/clock.svg?raw";');
    expect(adapterSource).toContain("content={colorizeLynxSvg(content, activeTheme.theme.ink)}");
  });

  it("injects renderer icons without forking shared navigation behavior", () => {
    // Upstream's rail owns the route destinations, so the panel lists "New thread" only,
    // through the shared primary navigation composition.
    expect(sidebarSource).toContain(
      '<SidebarGlyph icon={LYNX_SIDEBAR_PRIMARY_ICONS.newThread} variant="leading" />',
    );
    expect(sidebarSource).toContain("<SidebarPrimaryNavigation");
    // Upstream's navigation takes the renderer's icons as an optional override.
    expect(sharedSource).toContain("icons?: SidebarPrimarySurfaceIcons | undefined;");
    expect(sharedSource).toContain("const icons = props.icons ?? DEFAULT_ICONS;");
    expect(sharedSource).toContain("icon: icons.newThread");
    expect(sharedSource).not.toContain("icons.search");
    expect(sharedSource).toContain("icon: icons.kanban");
    expect(sharedSource).toContain("icon: icons.automations");
  });
});
