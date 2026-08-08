import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Explorer dock', () => {
  it('uses real project RPCs and a resizable right-panel surface', () => {
    const source = readFileSync(
      new URL('./ExplorerDock.lynx.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );

    expect(clientSource).toContain("'projects.listDirectories'");
    expect(clientSource).toContain("'projects.searchEntries'");
    expect(clientSource).toContain("'projects.readFile'");
    expect(source).not.toContain(
      "from '../data/synaraClient.lynx'"
    );
    expect(source).toContain("'background only'");
    expect(source).toContain(
      "/* webpackMode: \"eager\" */ '../data/synaraClient.lynx'"
    );
    expect(source).toContain('<ResizableRightPanel');
    expect(source).toContain('placeholder="Search files..."');
    expect(source).toContain("kind: 'file'");
    expect(source).toContain('<ChatMarkdown');
    expect(source).toContain('Preview truncated at 1 MB.');
    expect(routerSource).toContain("accessibleLabel: 'Toggle files panel'");
    expect(routerSource).toContain('setDiffOpen(false)');
    expect(routerSource).toContain('setExplorerOpen(false)');
  });

  it('matches the Web dock explorer split anatomy', () => {
    const styles = readFileSync(
      new URL('./explorer-dock.css', import.meta.url),
      'utf8'
    );

    expect(styles).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|color-mix\(/i);
    for (const token of [
      '--accent',
      '--background',
      '--border',
      '--destructive',
      '--foreground',
      '--muted-foreground',
      '--secondary',
    ]) {
      expect(styles).toContain(`var(${token})`);
    }
    expect(styles).toMatch(
      /\.ExplorerDock\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*480px;[^}]*max-width:\s*960px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockSidebar\s*\{[^}]*width:\s*240px;[^}]*min-width:\s*240px;[^}]*border-right:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockSearchInput\s*\{[^}]*height:\s*28px;[^}]*padding-left:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreview\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;[^}]*padding:\s*12px;/s
    );
  });
});
