import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native route-independent sidebar search palette host", () => {
  it("owns the shared snapshot and existing palette implementation", () => {
    const source = readFileSync(
      new URL("./SidebarSearchPaletteHost.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("queryKey: ['sidebar-snapshot']");
    expect(source).toContain("<SidebarSearchPaletteLynx");
    expect(source).toContain("onCreateSpace={() => {");
  });

  it("is mounted by SliceRouter for both settings and shell routes", () => {
    const routerSource = readFileSync(new URL("../../app/router.tsx", import.meta.url), "utf8");
    const sidebarSource = readFileSync(new URL("./Sidebar.lynx.tsx", import.meta.url), "utf8");

    expect(routerSource).toContain("if (command === 'sidebar.search') openSearchPalette()");
    expect(routerSource.match(/<SidebarSearchPaletteHost/g)).toHaveLength(2);
    expect(routerSource).toContain("route.pathname !== '/settings'");
    expect(sidebarSource).not.toContain("<SidebarSearchPaletteLynx");
    expect(sidebarSource).toContain("onOpenSearch={onOpenSearch}");
    const hostSource = readFileSync(
      new URL("./SidebarSearchPaletteHost.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(hostSource).toContain("const { data, error, isPending, refetch } = useQuery({");
    expect(sidebarSource).toContain("onOpenSearch('~/', ADD_PROJECT_TRIGGER_ELEMENT_ID)");
  });

  it("does not restore focus to an unmounted sidebar trigger on settings", () => {
    const routerSource = readFileSync(new URL("../../app/router.tsx", import.meta.url), "utf8");

    expect(routerSource).toContain("if (!open && route.pathname !== '/settings')");
    expect(routerSource).toContain("focusLynxElementById(searchReturnFocusElementId)");
    const interactionSource = readFileSync(
      new URL("../../components/ui/interactive-state.lynx.ts", import.meta.url),
      "utf8",
    );
    expect(interactionSource).toContain("consumeProgrammaticLynxFocus");
    expect(interactionSource).toContain("programmaticFocusId");
  });
});
