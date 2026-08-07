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

  it('keeps the titlebar separate from the Web-owned six pixel navigation gutter', () => {
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
      /\.SettingsSidebarBody\s*\{[^}]*padding:\s*6px;/s
    );
  });
});
