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
    const pdfSource = readFileSync(
      new URL('./ExplorerPdfFallback.lynx.tsx', import.meta.url),
      'utf8'
    );
    const webHostSource = readFileSync(
      new URL('../main/web/web-host.ts', import.meta.url),
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
    expect(source).toContain('onOpenFileReference={props.onSelectPath}');
    expect(source).toContain('<ExplorerPreviewHeader');
    expect(source).toContain('truncated={props.file?.truncated ?? false}');
    expect(source).toContain("' ExplorerDockPreview--truncated'");
    expect(source).toContain('className="ExplorerDockPreviewTruncated"');
    expect(source).toContain('accessibility-label="Preview truncated at 1 MB."');
    expect(source).toContain('ariaLabel="More actions"');
    expect(source).toContain('Reference in chat');
    expect(source).toContain('Ask why this changed');
    expect(source).toContain('applyExplorerChatAction({');
    expect(source).toContain('className="ExplorerDockImage"');
    expect(source).toContain('mode="aspectFit"');
    expect(source).toMatch(
      /className="ExplorerDockImage"[\s\S]{0,160}accessibility-element=\{false\}/
    );
    expect(source).toContain('Could not load this image.');
    expect(source).toContain('<ExplorerPdfFallback');
    expect(source).toContain('<ExplorerSyntaxPreview');
    expect(source).toContain('isSupportedLocalPdfPath(props.selectedPath)');
    expect(source).toContain('<ExplorerDirectory');
    expect(source).toContain('<FileEntryIcon');
    expect(source).not.toContain('ExplorerDockFileGlyph');
    expect(source).toContain(
      'props.expandedDirectories.has(props.entry.path)'
    );
    expect(source).toContain('disclosureChevronClassName(');
    expect(source).toContain(
      'useLynxDisclosurePresence(expanded)'
    );
    expect(source).toContain('disclosureContentClassName(');
    expect(source).toContain('<ExplorerDirectoryEntry');
    expect(source).not.toContain('{expanded ? (');
    expect(source).toContain(
      "style={{ paddingLeft: `${8 + props.depth * 12}px` }}"
    );
    expect(source).toContain(
      "directory ? ' ExplorerDockEntry--directory' : ''"
    );
    expect(source).toContain(
      "style={{ paddingLeft: `${8 + (props.depth + 1) * 12}px` }}"
    );
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
    expect(appSource).toContain('fetchExplorerLocalPreviewUrl({');
    expect(appSource).toContain(
      '!isSupportedLocalPreviewFilePath(initialExplorerPath)'
    );
    expect(routerSource).toContain(
      '!isSupportedLocalPreviewFilePath(explorerSelectedPath)'
    );
    expect(queriesSource).toContain(
      'export async function fetchExplorerLocalPreviewUrl'
    );
    expect(pdfSource).toContain("editor: 'system-default'");
    expect(pdfSource).toContain('resolveExplorerPdfOpenTarget({');
    expect(queriesSource).toContain(
      'export async function fetchExplorerPdfMetadata'
    );
    expect(routerSource).toContain('fetchExplorerPdfMetadata({');
    expect(routerSource).toContain('explorerPdfPageCount={explorerPdfPageCount}');
    expect(routerSource).toContain('pdfPageCount={explorerPdfPageCount}');
    expect(pdfSource).toContain('buildPdfPagePreviewUrl({');
    expect(pdfSource).toContain('className="ExplorerDockPdfPageImage"');
    expect(source).toContain("' ExplorerDockPreview--pdf'");
    expect(source).toContain("' ExplorerDockPreview--image'");
    expect(source).toContain("' ExplorerDockPreview--markdown'");
    expect(pdfSource).toContain('className="ExplorerDockPdfPrevious"');
    expect(pdfSource).toContain('className="ExplorerDockPdfNext"');
    expect(pdfSource).toContain("' ExplorerDockPdf--multi-page'");
    expect(pdfSource).toContain('className="ExplorerDockPdfCompactOpen"');
    expect(pdfSource).toContain('aria-label="Previous PDF page"');
    expect(pdfSource).toContain('aria-label="Next PDF page"');
    expect(pdfSource).toContain('mode="aspectFit"');
    expect(pdfSource).not.toContain('<webview');
    expect(webHostSource).toContain(
      'relaySocketBaseUrl ??\n          relayReadyBaseUrl ??\n          configuredRelayBaseUrl()'
    );
    expect(routerSource).toContain(
      'toggleExpandedDirectory(current, path)'
    );
    expect(routerSource).toContain("accessibleLabel: 'Toggle files panel'");
    expect(routerSource).toContain(
      'onActivate: () => setExplorerVisibility(!explorerOpen)'
    );
    expect(routerSource).toContain(
      'onOpenFileReference={openExplorerFileReference}'
    );
    expect(routerSource).toContain("onExplorerQueryChange('')");
    expect(routerSource).toContain('onExplorerSelectPath(relativePath)');
    expect(routerSource).toContain('setExplorerVisibility(true)');
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
      '--background',
      '--border',
      '--color-background-elevated-secondary',
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
      /\.SliceRoot--viewport-compact \.ThreadPage > \.ExplorerDock\s*\{[^}]*left:\s*0;[^}]*top:\s*92px;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*max-width:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockSidebar\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+>\s+\.ExplorerDockHeader\s*\{[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockSearch\s*\{[^}]*padding:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreviewContent\s*\{[^}]*padding:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockEntries\s*\{[^}]*padding:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockEntryPath\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreview--pdf\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*32px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdfIdentity,[\s\S]*?\.ExplorerDockPdfPrevious,[\s\S]*?\.ExplorerDockPdfNext\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPdfControls\s*\{[^}]*width:\s*100%;[^}]*padding-right:\s*32px;[^}]*justify-content:\s*space-between;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdf--multi-page[\s\S]*?\.ExplorerDockPdfPrevious,[\s\S]*?\.ExplorerDockPdfNext\s*\{[^}]*display:\s*flex;[^}]*width:\s*28px;[^}]*min-width:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdf--multi-page[\s\S]*?\.ExplorerDockPdfOpen\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*margin-left:\s*0;[^}]*padding:\s*0;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreview--image\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPreview--image[\s\S]*?\.ExplorerDockPreviewPath,[\s\S]*?\.ExplorerDockImageName\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\.ExplorerDockPreview--truncated\s+\.ExplorerDockPreviewHeader\s*\{[^}]*width:\s*84px;[^}]*padding:\s*0 4px;[^}]*gap:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\s+\.ExplorerDockPreviewContent\s*\{[^}]*height:\s*100%;[^}]*padding:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockSidebar\s*\{[^}]*width:\s*240px;[^}]*min-width:\s*240px;[^}]*border-right:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockSearchInput\s*\{[^}]*height:\s*28px;[^}]*padding-left:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*6px;[^}]*border-radius:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\.ui-focus,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary\);/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockFileIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.75;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntryName\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*opacity:\s*0\.78;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry--directory \.ExplorerDockEntryName\s*\{[^}]*font-weight:\s*500;[^}]*opacity:\s*0\.8;/s
    );
    for (const className of [
      'ExplorerDockClose',
      'ExplorerDockPreviewActions',
    ]) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          's'
        )
      );
    }
    expect(styles).toMatch(
      /\.ExplorerDockDirectoryChildren\s*\{[^}]*width:\s*100%;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockCommentEditor\s*\{[^}]*width:\s*440px;[^}]*min-width:\s*240px;[^}]*max-width:\s*calc\(100% - 44px\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ExplorerDockCommentEditor\s*\{[^}]*width:\s*calc\(100% - 12px\);[^}]*min-width:\s*0;[^}]*max-width:\s*none;[^}]*margin:\s*5px 6px 8px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreview\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewHeader\s*\{[^}]*height:\s*40px;[^}]*min-height:\s*40px;[^}]*padding:\s*0 12px;[^}]*border-bottom:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewPath\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewTruncated\s*\{[^}]*flex-shrink:\s*0;[^}]*font-size:\s*10px;[^}]*line-height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewContent\s*\{[^}]*flex:\s*1;[^}]*padding:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage\s+>\s+\.ExplorerDock\s+\.ExplorerDockSyntaxCode\s*\{[^}]*white-space:\s*pre-wrap;[^}]*word-break:\s*break-word;/s
    );
  });
});
