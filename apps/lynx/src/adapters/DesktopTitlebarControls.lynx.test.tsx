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
    expect(source).not.toContain('arrow-rounded.svg');
  });

  it('matches the Electron control geometry and closed traffic-light inset', () => {
    expect(styles).toMatch(
      /\.DesktopTitlebarControls--closed\s*\{[^}]*left:\s*90px;[^}]*height:\s*46px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--toggle\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControl--navigation\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.DesktopTitlebarControls\s*\{[^}]*gap:\s*2px;[^}]*-x-app-region:\s*no-drag;/s
    );
  });

  it('moves the same control instance between open and closed shell ownership', () => {
    expect(routerSource).toContain(
      "placement={sidebarOpen ? 'open' : 'closed'}"
    );
    expect(routerSource).toContain('const sidebar = sidebarOpen ? (');
    expect(routerSource).toContain('{sidebarOpen ? null : titlebarControls}');
    expect(routerSource).toContain("AppMain--sidebar-closed");
  });

  it('keeps Settings on its established real Back surface', () => {
    expect(routerSource).toContain("if (route.pathname === '/settings')");
    expect(settingsSource).toContain(
      '<SettingsSidebarChromeComposition'
    );
    expect(settingsSource).toContain('onBack={onBack}');
  });
});
