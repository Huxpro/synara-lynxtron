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

  it("renders the four Central sidebar glyphs as Native SVG content", () => {
    expect(adapterSource).toContain(
      "import newThreadSvg from '@synara-central-icons/compose-pencil.svg?raw';",
    );
    expect(adapterSource).toContain(
      "import searchSvg from '@synara-central-icons/magnifying-glass.svg?raw';",
    );
    expect(adapterSource).toContain(
      "import kanbanSvg from '@synara-central-icons/columns-3-wide.svg?raw';",
    );
    expect(adapterSource).toContain("import clockSvg from '@synara-central-icons/clock.svg?raw';");
    expect(adapterSource).toContain("content={colorizeLynxSvg(content, activeTheme.theme.ink)}");
  });

  it("injects renderer icons without forking shared navigation behavior", () => {
    expect(sidebarSource).toContain("icons={LYNX_SIDEBAR_PRIMARY_ICONS}");
    expect(sharedSource).toContain("const icons = props.icons ?? DEFAULT_ICONS;");
    expect(sharedSource).toContain("icon: icons.newThread");
    expect(sharedSource).toContain("icon: icons.search");
    expect(sharedSource).toContain("icon: icons.kanban");
    expect(sharedSource).toContain("icon: icons.automations");
  });
});
