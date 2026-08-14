import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings sidebar layout', () => {
  it('defines the shared large card radius used by native Settings owners', () => {
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
    const consumers = [
      './settings-advanced-panel.css',
      './settings-appsnap-panel.css',
      './settings-integrations-panel.css',
      './settings-skills-panel.css',
      './settings-worktrees-panel.css',
    ].map((path) => readFileSync(new URL(path, import.meta.url), 'utf8'));

    expect(styles).toMatch(
      /\.SliceRoot\s*\{[^}]*--radius-lg:\s*10px;/s
    );
    for (const consumer of consumers) {
      expect(consumer).toContain('var(--radius-lg)');
    }
  });

  it('keeps the titlebar separate from the Web-owned navigation gutter', () => {
    const styles = readFileSync(new URL('./App.css', import.meta.url), 'utf8');
    const webSidebar = readFileSync(
      new URL(
        '../../../web/src/components/SettingsSidebarNav.tsx',
        import.meta.url
      ),
      'utf8'
    );

    expect(webSidebar).toContain('className="px-1.5 py-1.5"');
    expect(styles).toMatch(
      /\.SettingsSidebarTitlebar\s*\{[^}]*height:\s*46px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSidebarBody\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*width:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.SettingsSidebarBodyInner\s*\{[^}]*min-height:\s*100%;[^}]*padding:\s*8px 6px 6px;/s
    );
  });

  it('gives the complete Settings navigation one vertical scroll owner', () => {
    const source = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('className="SettingsSidebarBody"');
    expect(source).toContain('scroll-orientation="vertical"');
    expect(source).toContain('className="SettingsSidebarBodyInner"');
  });

  it('overlays the Settings sidebar instead of squeezing compact content', () => {
    const shellStyles = readFileSync(
      new URL('../adapters/app-shell-frame-elements.css', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(shellStyles).toMatch(
      /\.SharedAppShellFrame\s*\{[^}]*position:\s*relative;/s
    );
    expect(shellStyles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedAppShellFrame > \.SidebarDisclosure\s*\{[^}]*position:\s*absolute;[^}]*left:\s*0;[^}]*top:\s*0;[^}]*z-index:\s*50;/s
    );
    expect(routerSource).toContain('resolveResponsiveSidebarOpen({');
    expect(routerSource).toContain(
      'desktopMinimumWidth: VIEWPORT_BREAKPOINTS.md'
    );
  });
});
