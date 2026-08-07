import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, it } from '@rstest/core';

const source = fs.readFileSync(
  path.resolve(__dirname, 'DesktopTitlebarControls.lynx.tsx'),
  'utf8'
);
const styles = fs.readFileSync(
  path.resolve(__dirname, 'desktop-titlebar-controls.css'),
  'utf8'
);
const routerSource = fs.readFileSync(
  path.resolve(__dirname, '../app/router.tsx'),
  'utf8'
);
const settingsSource = fs.readFileSync(
  path.resolve(__dirname, '../app/SettingsPage.tsx'),
  'utf8'
);
const desktopMainSource = fs.readFileSync(
  path.resolve(__dirname, '../main/desktop/main.ts'),
  'utf8'
);
const appStyles = fs.readFileSync(
  path.resolve(__dirname, '../app/App.css'),
  'utf8'
);

describe('desktop titlebar controls', () => {
  it('publishes real toggle, back, and forward actions', () => {
    expect(source).toContain('accessibleLabel="Toggle thread sidebar"');
    expect(source).toContain('accessibleLabel="Back"');
    expect(source).toContain('accessibleLabel="Forward"');
    expect(source).toContain('disabled={!props.canGoBack}');
    expect(source).toContain('disabled={!props.canGoForward}');
    expect(routerSource).toContain('onGoBack={() => history.back()}');
    expect(routerSource).toContain('onGoForward={() => history.forward()}');
    expect(routerSource).toContain(
      'onToggleSidebar={() => setSidebarOpen((open) => !open)}'
    );
    expect(source).toContain('M295.6 163.7');
    expect(source).toContain('M216.4 163.7');
    expect(source).not.toContain('arrow-rounded.svg');
    expect(desktopMainSource).toContain("accelerator: 'CmdOrCtrl+B'");
    expect(desktopMainSource).toContain("accelerator: 'CmdOrCtrl+['");
    expect(desktopMainSource).toContain("accelerator: 'CmdOrCtrl+]'");
    expect(routerSource).toContain("'shell:navigate-history'");
    expect(routerSource).toContain("command === 'sidebar.toggle'");
    expect(styles).not.toContain(
      '.DesktopTitlebarControl--back .DesktopTitlebarControlIcon'
    );
  });

  it('matches the Electron control geometry and closed traffic-light inset', () => {
    expect(styles).toMatch(
      /\.DesktopTitlebarControls--closed\s*\{[^}]*left:\s*90px;[^}]*height:\s*46px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle \.DesktopTitlebarControlIcon\s*\{[^}]*left:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*16px;[^}]*height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--navigation\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControls\s*\{[^}]*gap:\s*2px;[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle\s+\.DesktopTitlebarControlIcon--secondary\s*\{[^}]*opacity:\s*0\.75;/s
    );
  });

  it('keeps one action owner across distinct open and closed placements', () => {
    expect(routerSource).toContain(
      "const renderTitlebarControls = ("
    );
    expect(routerSource).toContain(
      "const openTitlebarControls = renderTitlebarControls('open')"
    );
    expect(routerSource).toContain(
      "const closedTitlebarControls = renderTitlebarControls('closed')"
    );
    expect(routerSource).toContain(
      "const sidebar =\n    sidebarOpen && route.pathname !== '/settings' ? ("
    );
    expect(routerSource).toContain(
      '{sidebarOpen ? null : closedTitlebarControls}'
    );
    expect(routerSource).toContain("AppMain--sidebar-closed");
  });

  it('keeps Settings inside the same global shell and titlebar ownership', () => {
    expect(routerSource).toContain("if (route.pathname === '/settings')");
    expect(routerSource).not.toContain(
      "if (route.pathname === '/settings') {\n    return ("
    );
    expect(routerSource).toContain('sidebarOpen={sidebarOpen}');
    expect(routerSource).toContain(
      'openTitlebarControls={openTitlebarControls}'
    );
    expect(routerSource).toContain(
      'closedTitlebarControls={closedTitlebarControls}'
    );
    expect(settingsSource).toContain('<AppShellFrame sidebar={settingsSidebar}>');
    expect(settingsSource).toContain(
      '{sidebarOpen ? null : closedTitlebarControls}'
    );
    expect(settingsSource).toContain(
      '<SidebarDisclosure open={sidebarOpen}>'
    );
    expect(settingsSource).toContain(
      '<SettingsSidebarChromeComposition'
    );
    expect(settingsSource).toContain('onBack={onBack}');
    expect(settingsSource).not.toContain('showBack={false}');
    expect(appStyles).toMatch(
      /\.SettingsSidebar\s*\{[^}]*width:\s*256px;[^}]*height:\s*100%;/s
    );
    expect(appStyles).not.toMatch(
      /\.SettingsSidebar\s*\{[^}]*border-right:/s
    );
    expect(appStyles).toMatch(
      /\.SettingsSidebarTitlebar\s*\{[^}]*height:\s*46px;[^}]*padding-left:\s*14px;[^}]*padding-right:\s*14px;/s
    );
    expect(appStyles).toMatch(
      /\.SettingsSidebarBody\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*width:\s*100%;/s
    );
    expect(appStyles).toMatch(
      /\.SettingsSidebarBodyInner\s*\{[^}]*min-height:\s*100%;[^}]*padding:\s*6px;/s
    );
  });
});
