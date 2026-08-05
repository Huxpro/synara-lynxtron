import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings sidebar layout', () => {
  it('uses the Web-owned six pixel horizontal gutter', () => {
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
      /\.SettingsSidebar\s*\{[^}]*padding:\s*18px 6px;/s
    );
  });
});
