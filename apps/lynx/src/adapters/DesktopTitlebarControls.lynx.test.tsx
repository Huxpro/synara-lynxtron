import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "@rstest/core";

const source = fs.readFileSync(path.resolve(__dirname, "DesktopTitlebarControls.lynx.tsx"), "utf8");
const styles = fs.readFileSync(path.resolve(__dirname, "desktop-titlebar-controls.css"), "utf8");
const routerSource = fs.readFileSync(path.resolve(__dirname, "../app/router.tsx"), "utf8");
const settingsSource = fs.readFileSync(path.resolve(__dirname, "../app/SettingsPage.tsx"), "utf8");
const desktopMainSource = fs.readFileSync(
  path.resolve(__dirname, "../main/desktop/main.ts"),
  "utf8",
);
const appStyles = fs.readFileSync(path.resolve(__dirname, "../app/App.css"), "utf8");
const railStyles = fs.readFileSync(
  path.resolve(__dirname, "../components/sidebar/app-rail.css"),
  "utf8",
);

describe("desktop titlebar controls", () => {
  it("publishes real toggle, back, and forward actions", () => {
    expect(source).toContain('accessibleLabel="Toggle thread sidebar"');
    expect(source).toContain('accessibleLabel="Back"');
    expect(source).toContain('accessibleLabel="Forward"');
    expect(source).toContain("disabled={!props.canGoBack}");
    expect(source).toContain("disabled={!props.canGoForward}");
    expect(routerSource).toContain("onGoBack={() => history.back()}");
    expect(routerSource).toContain("onGoForward={() => history.forward()}");
    expect(routerSource).toContain("onToggleSidebar={() => setSidebarOpen((open) => !open)}");
    expect(source).toContain("M295.6 163.7");
    expect(source).toContain("M216.4 163.7");
    expect(source).not.toContain("arrow-rounded.svg");
    expect(desktopMainSource).toContain('accelerator: "CmdOrCtrl+B"');
    expect(desktopMainSource).toContain('accelerator: "CmdOrCtrl+["');
    expect(desktopMainSource).toContain('accelerator: "CmdOrCtrl+]"');
    expect(routerSource).toContain('"shell:navigate-history"');
    expect(routerSource).toContain('command === "sidebar.toggle"');
    expect(styles).not.toContain(".DesktopTitlebarControl--back .DesktopTitlebarControlIcon");
  });

  it("matches the Electron control geometry and closed traffic-light inset", () => {
    expect(styles).toMatch(
      /\.DesktopTitlebarControls--closed\s*\{[^}]*left:\s*90px;[^}]*height:\s*46px;/s,
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*border-radius:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle \.DesktopTitlebarControlIcon\s*\{[^}]*left:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*16px;[^}]*height:\s*16px;/s,
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--navigation\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControls\s*\{[^}]*gap:\s*2px;[^}]*-x-app-region:\s*no-drag;/s,
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle\s+\.DesktopTitlebarControlIcon--secondary\s*\{[^}]*opacity:\s*0\.75;/s,
    );
  });

  it("keeps one action owner across distinct open and closed placements", () => {
    expect(routerSource).toContain("const renderTitlebarControls = (");
    expect(routerSource).toContain('const openTitlebarControls = renderTitlebarControls("open")');
    // Upstream's rail layout paints the controls once, in the top strip over the rail and
    // panel; they overflow the strip while the panel is collapsed, so no second placement.
    expect(routerSource).not.toContain("closedTitlebarControls");
    expect(routerSource).toContain(
      "<AppRailShell titlebarControls={openTitlebarControls} onHome={navigateBackFromSettings}>",
    );
    expect(routerSource).toContain(
      "const panelOpen = sidebarOpen && !editorModeOpen && railPanelShownForPathname(route.pathname);",
    );
    expect(routerSource).toContain("<SidebarDisclosure open={panelOpen}>");
    expect(routerSource).toContain(
      'className={`AppMain AppMain--sidebar-${panelOpen ? "open" : "closed"}`}',
    );
    expect(railStyles).toMatch(
      /\.AppRailShellTopStrip\s*\{[^}]*position:\s*absolute;[^}]*height:\s*44px;[^}]*overflow:\s*visible;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-md-up \.AppMain--sidebar-open\s*\{[^}]*border-top-left-radius:\s*14\.4px;[^}]*border-bottom-left-radius:\s*14\.4px;[^}]*box-shadow:\s*inset 1px 0 0 rgba\(0,\s*0,\s*0,\s*0\.08\),\s*-6\.5px 0 12px -10px rgba\(0,\s*0,\s*0,\s*0\.1\);[^}]*overflow:\s*hidden;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-dark\.SliceRoot--viewport-md-up \.AppMain--sidebar-open\s*\{[^}]*box-shadow:\s*inset 1px 0 0 rgba\(255,\s*255,\s*255,\s*0\.03\),\s*-6\.5px 0 12px -10px rgba\(0,\s*0,\s*0,\s*0\.36\);/s,
    );
    expect(appStyles).not.toMatch(
      /\.SettingsPage--sidebar-open\s*\{[^}]*(?:border-radius|box-shadow):/s,
    );
  });

  it("keeps Settings inside the same global shell and titlebar ownership", () => {
    // Settings brings its own shell frame (rail + settings panel); the router mounts the
    // page without the threads shell and shares the overlays with every other route.
    expect(routerSource).toContain(
      '{route.pathname === "/settings" ? (\n        page\n      ) : (',
    );
    expect(routerSource).toContain("sidebarOpen={sidebarOpen}");
    expect(routerSource).toContain("openTitlebarControls={openTitlebarControls}");
    expect(settingsSource).toContain("<AppShellFrame sidebar={settingsSidebar}>");
    expect(settingsSource).toContain(
      "<AppRailShell titlebarControls={openTitlebarControls} onHome={onBack}>",
    );
    expect(settingsSource).not.toContain("closedTitlebarControls");
    expect(settingsSource).toContain(
      `SettingsPage--sidebar-\${
          sidebarOpen ? "open" : "closed"`,
    );
    expect(settingsSource).toContain("<SidebarDisclosure open={sidebarOpen}>");
    expect(settingsSource).toContain("<SettingsSidebarChromeComposition");
    expect(settingsSource).toContain("onBack={onBack}");
    expect(settingsSource).not.toContain("showBack={false}");
    expect(appStyles).toMatch(/\.SettingsSidebar\s*\{[^}]*width:\s*100%;[^}]*height:\s*100%;/s);
    expect(appStyles).not.toMatch(/\.SettingsSidebar\s*\{[^}]*border-right:/s);
    expect(appStyles).toMatch(
      /\.SettingsSidebar\s*\{[^}]*box-shadow:\s*inset 0 1px 0 rgba\(0,\s*0,\s*0,\s*0\.03\);/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-dark \.SettingsSidebar\s*\{[^}]*box-shadow:\s*inset 0 1px 0 rgba\(255,\s*255,\s*255,\s*0\.025\);/s,
    );
    // The rail shell's top strip holds the controls; the panel opens on its title.
    expect(settingsSource).not.toContain("<SidebarDesktopHeader");
    expect(appStyles).toMatch(
      /\.SettingsSidebarBody\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*width:\s*100%;/s,
    );
    expect(appStyles).toMatch(
      /\.SettingsSidebarBodyInner\s*\{[^}]*min-height:\s*100%;[^}]*padding:\s*0 6px 6px;/s,
    );
  });
});
