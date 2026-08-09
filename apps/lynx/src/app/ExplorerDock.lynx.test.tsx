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
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const appSource = readFileSync(
      new URL('./App.tsx', import.meta.url),
      'utf8'
    );

    expect(clientSource).toContain("'projects.listDirectories'");
    expect(clientSource).toContain("'projects.searchEntries'");
    expect(clientSource).toContain("'projects.readFile'");
    expect(source).not.toContain('useQuery');
    expect(source).toContain('entriesPending: boolean');
    expect(source).toContain('onQueryChange: (query: string) => void');
    expect(routerSource).toContain('fetchExplorerEntries({');
    expect(routerSource).toContain('fetchExplorerFile({');
    expect(routerSource).toContain("'background only'");
    expect(routerSource).toContain(
      'enabled: activeThreadId !== null'
    );
    expect(routerSource).toContain(
      'const [data, summary] = await Promise.all(['
    );
    expect(source).toContain('<ResizableRightPanel');
    expect(source).toContain('placeholder="Search files..."');
    expect(source).toContain("entry.kind === 'directory'");
    expect(source).toContain('<ChatMarkdown');
    expect(source).toContain('Preview truncated at 1 MB.');
    expect(source).toContain('<ExplorerDirectory');
    expect(source).toContain('expandedDirectories.has(entry.path)');
    expect(source).toContain('disclosureChevronClassName(');
    expect(source).toContain('Loading directory…');
    expect(source).toContain('Could not load directory.');
    expect(source).toContain('showPaths={Boolean(props.query.trim())}');
    expect(queriesSource).toContain('export async function fetchExplorerDirectory');
    expect(queriesSource).toContain('relativePath: input.relativePath');
    expect(routerSource).toContain('fetchExplorerDirectory({');
    expect(routerSource).toContain(
      'Array.from(explorerExpandedDirectories).toSorted()'
    );
    expect(routerSource).toContain('explorerDirectories,');
    expect(appSource).toContain(
      'initialExplorerExpandedDirectories.map(async (path)'
    );
    expect(appSource).toContain('fetchExplorerDirectory({');
    expect(routerSource).toContain(
      'toggleExpandedDirectory(current, path)'
    );
    expect(routerSource).toContain("accessibleLabel: 'Toggle files panel'");
    expect(routerSource).toContain(
      'onActivate: () => setExplorerVisibility(!explorerOpen)'
    );
    expect(routerSource).toContain(
      'useState(initialExplorerOpen)'
    );
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
      /\.ExplorerDockEntry\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*4px 8px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreview\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;[^}]*padding:\s*12px;/s
    );
  });
});
