import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Explorer dock", () => {
  it("offers bounded recovery when a selected file cannot be read", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");

    expect(source).toContain("<WorkspaceFilePreviewErrorState");
    expect(source).toContain("onRetry={props.onRetryFile}");
    expect(source).toContain("retrying={props.fileRetrying}");
    expect(source).toContain("onClose={props.onClose}");
    const composition = readFileSync(
      new URL("../../../web/src/components/WorkspaceFilePreviewErrorState.tsx", import.meta.url),
      "utf8",
    );
    expect(composition).toContain("The file may have moved, changed, or become unavailable.");
    expect(composition).toContain("onClose={props.onClose}");
    expect(source).not.toContain("ExplorerDockFileErrorState");
    expect(source.indexOf("<ExplorerPreviewHeader")).toBeLessThan(
      source.indexOf("<WorkspaceFilePreviewErrorState"),
    );
    const header = readFileSync(
      new URL("./ExplorerPreviewHeader.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(header).toContain("await openPathInEditor({ cwd: openTarget, editor })");
    expect(routerSource).toContain("onExplorerRetryFile={() => void explorerFileQuery.refetch()}");
    expect(routerSource).toContain("explorerFileQuery.isError && explorerFileQuery.isFetching");
    expect(queriesSource).toContain("if (explorerFileCache.get(cacheKey)?.result === result)");
    expect(queriesSource).toContain("explorerFileCache.delete(cacheKey)");
  });

  it("restores the exact file row after its native context menu closes", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("() => focusLynxNode(rowRef)");
    expect(source).toContain("{ restoreFocus }");
  });

  it("keeps single-file panes on the shared resizable dock width contract", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain('import { RIGHT_DOCK_MIN_WIDTH_PX } from "@synara/shared/rightDock";');
    expect(source).toContain("export const EXPLORER_DOCK_MIN_WIDTH = RIGHT_DOCK_MIN_WIDTH_PX");
    expect(source).toContain("props.initialWidth ??");
    expect(source).toContain("Math.round(props.availableWidth / 2)");
    expect(source).toContain("minWidth={EXPLORER_DOCK_MIN_WIDTH}");
    expect(source).not.toContain("EXPLORER_SINGLE_FILE_DOCK_MIN_WIDTH");
  });

  it("opens transcript file references as a single-file dock", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./explorer-dock.css", import.meta.url), "utf8");
    const fileTabSource = readFileSync(
      new URL("./ExplorerFileTab.lynx.tsx", import.meta.url),
      "utf8",
    );
    const surfaceTabSource = readFileSync(
      new URL("./EditorSurfaceTab.lynx.tsx", import.meta.url),
      "utf8",
    );
    const surfaceTabStyles = readFileSync(
      new URL("./editor-surface-tab.css", import.meta.url),
      "utf8",
    );

    expect(routerSource).toContain(
      "const [explorerPresentationMode, setExplorerPresentationMode] = useState<",
    );
    expect(routerSource).toContain('setExplorerPresentationMode("single-file");');
    expect(routerSource).toContain("presentationMode={explorerPresentationMode}");
    expect(routerSource).toContain("initialExplorerActionMenuOpen={initialExplorerActionMenuOpen}");
    expect(source).toContain("actionMenuDefaultOpen={props.initialActionMenuOpen}");
    expect(routerSource).not.toMatch(/openExplorerFileReference[\s\S]{0,300}setEditorMode\(true\)/);
    expect(source).toContain('| "single-file"');
    expect(source).toContain('const singleFile = props.presentationMode === "single-file";');
    expect(source).toContain("singleFile && props.selectedPath");
    expect(source).toContain("`Close ${fileName(props.selectedPath)}`");
    expect(source).toContain("<ExplorerFileTab");
    expect(fileTabSource).toContain("<EditorSurfaceTab");
    expect(fileTabSource).toContain("icon={<FileEntryIcon pathValue={props.path} />}");
    expect(surfaceTabSource).toContain("className={`${close.className} EditorSurfaceTabIconSlot`}");
    expect(surfaceTabSource).toContain("...lynxNestedInteractiveEventProps(close.eventProps)");
    expect(styles).toMatch(/\.ExplorerDock--single-file\s*\{[^}]*top:\s*0;/s);
    expect(styles).toMatch(
      /\.ExplorerDock--single-file \.ExplorerDockHeader\s*\{[^}]*height:\s*46px;[^}]*min-height:\s*46px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDock--single-file \.ExplorerDockSidebar\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDock--single-file \.ExplorerDockPreview\s*\{[^}]*width:\s*100%;/s,
    );
    expect(surfaceTabStyles).toMatch(
      /\.EditorSurfaceTabIconSlot,[^}]*\{[^}]*position:\s*relative;[^}]*width:\s*16px;[^}]*height:\s*16px;/s,
    );
    expect(surfaceTabStyles).toMatch(/\.EditorSurfaceTabCloseGlyph\s*\{[^}]*opacity:\s*0;/s);
    expect(surfaceTabStyles).toMatch(
      /\.EditorSurfaceTab\.ui-hover \.EditorSurfaceTabRestingIcon,[^}]*opacity:\s*0;/s,
    );
    expect(surfaceTabStyles).toMatch(
      /\.EditorSurfaceTab\.ui-hover \.EditorSurfaceTabCloseGlyph,[^}]*opacity:\s*1;/s,
    );
  });

  it("uses real project RPCs and a resizable right-panel surface", () => {
    const source = readFileSync(new URL("./ExplorerDock.lynx.tsx", import.meta.url), "utf8");
    const clientSource = readFileSync(
      new URL("../data/synaraClient.lynx.ts", import.meta.url),
      "utf8",
    );
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const appSource = readFileSync(new URL("./App.tsx", import.meta.url), "utf8");
    const pdfSource = readFileSync(
      new URL("./ExplorerPdfFallback.lynx.tsx", import.meta.url),
      "utf8",
    );
    const pdfPageSource = readFileSync(
      new URL("./ExplorerPdfPageImage.lynx.tsx", import.meta.url),
      "utf8",
    );
    const webHostSource = readFileSync(new URL("../main/web/web-host.ts", import.meta.url), "utf8");
    const imageSource = readFileSync(
      new URL("./ExplorerImagePreview.lynx.tsx", import.meta.url),
      "utf8",
    );
    const previewHeaderSource = readFileSync(
      new URL("./ExplorerPreviewHeader.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(clientSource).toContain('"projects.listDirectories"');
    expect(clientSource).toContain('"projects.searchEntries"');
    expect(clientSource).toContain('"projects.readFile"');
    expect(clientSource).toContain('"projects.createLocalFilePreviewGrant"');
    expect(queriesSource).toContain("createLocalFilePreviewGrant");
    expect(queriesSource).toContain("isLocalAbsolutePath(input.relativePath)");
    expect(source).not.toContain("useQuery");
    expect(source).toContain("entriesPending: boolean");
    expect(source).toContain("entriesTruncated: boolean");
    expect(source).toContain('className="ExplorerDockSearchTruncated"');
    expect(source).toContain('" ExplorerDockEntries--truncated"');
    expect(source).toContain("Showing top matches. Refine search.");
    expect(source).toContain("onQueryChange: (query: string) => void");
    expect(routerSource).toContain("fetchExplorerEntries({");
    expect(routerSource).toContain(
      "explorerEntriesTruncated={explorerEntriesQuery.data?.truncated ?? false}",
    );
    expect(routerSource).toContain(
      'queryKey: ["explorer-entries", activeThreadId, workspaceRoot, explorerTrimmedQuery]',
    );
    expect(routerSource).toContain(
      'queryKey: ["explorer-file", activeThreadId, workspaceRoot, explorerSelectedPath]',
    );
    expect(routerSource).toContain("entriesTruncated={explorerEntriesTruncated}");
    expect(routerSource).toContain('| "explorerEntriesTruncated"');
    expect(routerSource).toContain("explorerEntriesPending,\n    explorerEntriesTruncated,");
    expect(routerSource).toContain("fetchExplorerFile({");
    expect(routerSource).toContain('"background only"');
    expect(routerSource).toContain("enabled: activeThreadId !== null");
    expect(routerSource).toContain("const [data, summary] = await Promise.all([");
    expect(source).toContain("<ResizableRightPanel");
    expect(source).toContain('props.open ? " ExplorerDock--open" : " ExplorerDock--closed"');
    expect(source).toContain("minWidth={EXPLORER_DOCK_MIN_WIDTH}");
    expect(routerSource).toContain("minWidth: EXPLORER_DOCK_MIN_WIDTH");
    expect(source).toContain('placeholder="Search files..."');
    expect(source).toContain('entry.kind === "directory"');
    expect(source).toContain("<ChatMarkdown");
    expect(source).toContain("onOpenFileReference={props.onSelectPath}");
    expect(source).toContain("<ExplorerPreviewHeader");
    expect(source).toContain("isMarkdown={fileIsMarkdown}");
    expect(source).toContain('markdownPreviewEnabled={markdownMode === "preview"}');
    expect(source).toContain("setMarkdownModeOverride({");
    expect(source).toContain('fileIsMarkdown && markdownMode === "preview"');
    expect(source).toContain("<ExplorerSyntaxPreview");
    expect(source).toContain("truncated={props.file?.truncated ?? false}");
    expect(source).toContain('" ExplorerDockPreview--truncated"');
    expect(previewHeaderSource).toContain('className="ExplorerDockPreviewTruncated"');
    expect(previewHeaderSource).toContain('accessibility-label="Preview truncated at 1 MB."');
    expect(previewHeaderSource).toContain('ariaLabel={props.triggerLabel ?? "More actions"}');
    expect(previewHeaderSource).toContain("Reference in chat");
    expect(previewHeaderSource).toContain("Ask why this changed");
    expect(previewHeaderSource).toContain("applyExplorerChatAction({");
    expect(previewHeaderSource).toContain("export function ExplorerFileActionsMenu");
    expect(previewHeaderSource).toContain("deriveFilePreviewBreadcrumb({");
    expect(previewHeaderSource).toContain('accessibility-label="Markdown view"');
    expect(previewHeaderSource).toContain('aria-label="Source view"');
    expect(previewHeaderSource).toContain('aria-label="Preview markdown"');
    expect(previewHeaderSource).toContain("props.onMarkdownPreviewChange(false)");
    expect(previewHeaderSource).toContain("props.onMarkdownPreviewChange(true)");
    expect(previewHeaderSource).not.toContain("function pathSegments(");
    expect(previewHeaderSource).toContain("props.includeCopyPath");
    expect(source).toContain("<ExplorerImagePreview");
    expect(source).toContain("key={props.localPreviewUrl}");
    expect(imageSource).toContain('className="ExplorerDockImage"');
    expect(imageSource).toContain('mode="aspectFit"');
    expect(imageSource).toContain("binderror={() => {");
    expect(source).toMatch(
      /<ExplorerImagePreview[\s\S]{0,180}previewUrl=\{props\.localPreviewUrl\}/,
    );
    expect(source).toContain("Could not load this image.");
    expect(source).toContain("props.file?.contents.length === 0");
    expect(source).toContain('<text className="ExplorerDockState">Empty file.</text>');
    expect(source).toContain("<ExplorerPdfFallback");
    expect(source).toContain("<ExplorerSyntaxPreview");
    const styles = readFileSync(new URL("./explorer-dock.css", import.meta.url), "utf8");
    expect(styles).toContain(".ExplorerDock--editor .ExplorerDockHeader");
    expect(styles).toContain(
      ".ExplorerDock--editor:not(.ExplorerDock--editor-search) .ExplorerDockSearch",
    );
    expect(source).toContain("isSupportedLocalPdfPath(props.selectedPath)");
    expect(source).toContain("<ExplorerDirectory");
    expect(source).toContain("<FileEntryIcon");
    expect(source).not.toContain("ExplorerDockFileGlyph");
    expect(source).toContain("props.expandedDirectories.has(props.entry.path)");
    expect(source).toContain("disclosureChevronClassName(");
    expect(source).toContain("useLynxDisclosurePresence(expanded)");
    expect(source).toContain("disclosureContentClassName(");
    expect(source).toContain("<ExplorerDirectoryEntry");
    expect(source).not.toContain("{expanded ? (");
    expect(source).toContain("style={{ paddingLeft: `${8 + props.depth * 12}px` }}");
    expect(source).toContain('directory ? " ExplorerDockEntry--directory" : ""');
    expect(source).toContain("style={{ paddingLeft: `${8 + (props.depth + 1) * 12}px` }}");
    expect(source).toContain("Loading directory…");
    expect(source).toContain("Could not load directory.");
    expect(source).toContain("showPaths={Boolean(props.query.trim())}");
    expect(source).toContain("props.showPath && directoryPath(props.entry.path)");
    expect(source).toContain('return separator < 0 ? "" : normalized.slice(0, separator + 1);');
    expect(queriesSource).toContain("export async function fetchExplorerDirectory");
    expect(queriesSource).toContain("relativePath: input.relativePath");
    expect(routerSource).toContain("fetchExplorerDirectory({");
    expect(routerSource).toContain("Array.from(explorerExpandedDirectories).toSorted()");
    expect(routerSource).toContain("explorerDirectoriesQuery.data ?? []");
    expect(routerSource).toContain("explorerExpandedDirectoryPaths.map(async (path)");
    expect(routerSource).toContain("fetchExplorerDirectory({");
    expect(routerSource).toContain("fetchExplorerLocalPreviewUrl({");
    expect(routerSource).toContain("!isSupportedLocalPreviewFilePath(explorerSelectedPath)");
    expect(queriesSource).toContain("export async function fetchExplorerLocalPreviewUrl");
    expect(pdfSource).toContain('editor: "system-default"');
    expect(pdfSource).toContain("resolveExplorerPdfOpenTarget({");
    expect(queriesSource).toContain("export async function fetchExplorerPdfMetadata");
    expect(routerSource).toContain("fetchExplorerPdfMetadata({");
    expect(routerSource).toContain("explorerPdfPageCount={explorerPdfPageCount}");
    expect(routerSource).toContain("pdfPageCount={explorerPdfPageCount}");
    expect(pdfSource).toContain("buildPdfPagePreviewUrl({");
    expect(pdfSource).toContain("<ExplorerPdfPageImage");
    expect(pdfSource).toContain("key={pageUrl}");
    expect(pdfPageSource).toContain('className="ExplorerDockPdfPageImage"');
    expect(pdfPageSource).toContain("binderror={() => {");
    expect(source).toContain('" ExplorerDockPreview--pdf"');
    expect(source).toContain('" ExplorerDockPreview--image"');
    expect(source).toContain('" ExplorerDockPreview--markdown"');
    expect(pdfSource).toContain('className="ExplorerDockPdfPrevious"');
    expect(pdfSource).toContain('className="ExplorerDockPdfNext"');
    expect(pdfSource).toContain('" ExplorerDockPdf--multi-page"');
    expect(pdfSource).toContain('className="ExplorerDockPdfCompactOpen"');
    expect(pdfSource).toContain("<ChevronLeftIcon");
    expect(pdfSource).toContain("<ChevronRightIcon");
    expect(pdfSource).toContain("<MinusIcon");
    expect(pdfSource).toContain("<PlusIcon");
    expect(pdfSource).toContain("<ExternalLinkIcon");
    expect(pdfSource).toContain('color={semanticIconColor("secondary")}');
    expect(pdfSource).not.toContain(">‹</text>");
    expect(pdfSource).not.toContain(">›</text>");
    expect(pdfSource).not.toContain(">−</text>");
    expect(pdfSource).not.toContain(">+</text>");
    expect(pdfSource).not.toContain(">↗</text>");
    expect(pdfSource).toContain('aria-label="Previous PDF page"');
    expect(pdfSource).toContain('aria-label="Next PDF page"');
    expect(pdfPageSource).toContain('mode="scaleToFill"');
    expect(pdfSource).toContain('from "@synara/shared/pdfZoom"');
    expect(pdfSource).toContain('value="fit-width"');
    expect(pdfSource).toContain('value="fit-page"');
    expect(pdfSource).toContain("previousZoomScale(scale)");
    expect(pdfSource).toContain("nextZoomScale(scale)");
    expect(pdfSource).toContain("width: rasterWidth");
    expect(pdfSource).toContain("clampExplorerPdfPage({");
    expect(pdfSource).toContain('aria-label="Current PDF page"');
    expect(pdfSource).toContain('scroll-orientation="horizontal"');
    expect(pdfSource).toContain('scroll-orientation="vertical"');
    expect(pdfSource).not.toContain("<webview");
    expect(webHostSource).toContain(
      "relaySocketBaseUrl ?? relayReadyBaseUrl ?? configuredRelayBaseUrl()",
    );
    expect(routerSource).toContain("toggleExpandedDirectory(current, path)");
    expect(routerSource).toContain('accessibleLabel: "Toggle diff panel"');
    expect(routerSource).toContain("onOpenFileReference={openExplorerFileReference}");
    expect(routerSource).toContain("onOpenFileReference={openExplorerFileReference}");
    expect(routerSource).toContain('onExplorerQueryChange("")');
    expect(routerSource).toContain("onExplorerSelectPath(relativePath)");
    expect(routerSource).toContain(
      'openPaneInState(current, { paneId: "explorer", kind: "explorer" })',
    );
    expect(routerSource).toContain(
      "const [rightDockState, setRightDockState] = useState<RightDockThreadState>",
    );
    expect(routerSource).toMatch(
      /const withExplorer = initialExplorerOpen[\s\S]{0,320}openPaneInState/,
    );
    expect(routerSource).toContain("setDockOpenInState(current, false)");
  });

  it("matches the Web dock explorer split anatomy", () => {
    const styles = readFileSync(new URL("./explorer-dock.css", import.meta.url), "utf8");

    expect(styles).not.toMatch(/#[0-9a-f]{3,8}\b|rgba?\(|oklch\(|color-mix\(/i);
    for (const token of [
      "--background",
      "--border",
      "--color-background-elevated-secondary",
      "--destructive",
      "--foreground",
      "--muted-foreground",
      "--secondary",
    ]) {
      expect(styles).toContain(`var(${token})`);
    }
    expect(styles).toMatch(
      /\.ExplorerDock\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*416px;[^}]*max-width:\s*960px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDock--closed\s*\{[^}]*pointer-events:\s*none;[^}]*opacity:\s*0;[^}]*transform:\s*translateX\(100%\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDock\s*\{[^}]*transition:[^}]*300ms cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ThreadPage > \.ExplorerDock\s*\{[^}]*left:\s*0;[^}]*top:\s*92px;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*max-width:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ExplorerDock\s+\.ExplorerDockSidebar\s*\{[^}]*width:\s*50%;[^}]*min-width:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+>\s+\.ExplorerDockHeader\s*\{[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockSearch\s*\{[^}]*padding:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreviewContent\s*\{[^}]*padding:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockEntries\s*\{[^}]*padding:\s*3px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockSearchTruncated\s*\{[^}]*height:\s*22px;[^}]*padding:\s*4px 8px;[^}]*border-top:\s*1px solid var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockSearchTruncated\s*\{[^}]*height:\s*14px;[^}]*padding:\s*0 4px;[^}]*font-size:\s*9px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockEntries--truncated\s*\{[^}]*padding:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock--editor-search\s+\.ExplorerDockSidebar\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock--editor-search\s+\.ExplorerDockSearch\s*\{[^}]*padding:\s*2px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock--editor-search\s+\.ExplorerDockPreview\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockEntryPath\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockDirectoryState\s*\{[^}]*height:\s*12px;[^}]*min-height:\s*12px;[^}]*font-size:\s*9px;[^}]*line-height:\s*12px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreview--pdf\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*32px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdfIdentity,[\s\S]*?\.ExplorerDockPdfPrevious,[\s\S]*?\.ExplorerDockPdfNext\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPdfControls\s*\{[^}]*width:\s*100%;[^}]*padding-right:\s*32px;[^}]*justify-content:\s*space-between;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdf--multi-page[\s\S]*?\.ExplorerDockPdfPrevious,[\s\S]*?\.ExplorerDockPdfNext\s*\{[^}]*display:\s*flex;[^}]*width:\s*28px;[^}]*min-width:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPdf--multi-page[\s\S]*?\.ExplorerDockPdfOpen\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*margin-left:\s*0;[^}]*padding:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreview--image\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ExplorerDockPreview--image[\s\S]*?\.ExplorerDockBreadcrumb,[\s\S]*?\.ExplorerDockImageName\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\s+\.ExplorerDockPreviewHeader\s*\{[^}]*position:\s*absolute;[^}]*right:\s*4px;[^}]*top:\s*4px;[^}]*width:\s*28px;[^}]*height:\s*28px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\.ExplorerDockPreview--truncated\s+\.ExplorerDockPreviewHeader\s*\{[^}]*width:\s*84px;[^}]*padding:\s*0 4px;[^}]*gap:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockPreview--markdown\s+\.ExplorerDockPreviewContent\s*\{[^}]*height:\s*100%;[^}]*padding:\s*2px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockSidebar\s*\{[^}]*width:\s*240px;[^}]*min-width:\s*240px;[^}]*border-right-width:\s*1px;[^}]*border-right-style:\s*solid;[^}]*border-right-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockSearch\s*\{[^}]*padding:\s*8px;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockSearchInput\s*\{[^}]*height:\s*28px;[^}]*padding-left:\s*32px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*6px;[^}]*border-radius:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry\.ui-focus,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockFileIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.75;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntryName\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*opacity:\s*0\.78;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntryCopy\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*overflow:\s*hidden;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntryName\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntryPath\s*\{[^}]*min-width:\s*0;[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockEntry--directory \.ExplorerDockEntryName\s*\{[^}]*font-weight:\s*500;[^}]*opacity:\s*0\.8;/s,
    );
    for (const className of ["ExplorerDockClose", "ExplorerDockPreviewActions"]) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          "s",
        ),
      );
    }
    expect(styles).toMatch(/\.ExplorerDockDirectoryChildren\s*\{[^}]*width:\s*100%;/s);
    expect(styles).toMatch(
      /\.ExplorerDockCommentEditor\s*\{[^}]*width:\s*440px;[^}]*min-width:\s*240px;[^}]*max-width:\s*calc\(100% - 44px\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ExplorerDockCommentEditor\s*\{[^}]*width:\s*calc\(100% - 12px\);[^}]*min-width:\s*0;[^}]*max-width:\s*none;[^}]*margin:\s*5px 6px 8px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreview\s*\{[^}]*flex:\s*1;[^}]*min-width:\s*0;[^}]*flex-direction:\s*column;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewHeader\s*\{[^}]*height:\s*40px;[^}]*min-height:\s*40px;[^}]*padding:\s*0 12px;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockBreadcrumb\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;[^}]*overflow:\s*hidden;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockBreadcrumbPrefix\s*\{[^}]*flex-grow:\s*0;[^}]*flex-shrink:\s*9999;[^}]*flex-basis:\s*auto;[^}]*overflow:\s*hidden;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewTruncated\s*\{[^}]*flex-shrink:\s*0;[^}]*font-size:\s*10px;[^}]*line-height:\s*14px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockMarkdownModes\s*\{[^}]*height:\s*28px;[^}]*flex-shrink:\s*0;[^}]*border-radius:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPdfPageInputSlot\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPdfPageImage\s*\{[^}]*background-color:\s*white;[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.ExplorerDockPreviewContent\s*\{[^}]*flex:\s*1;[^}]*padding:\s*12px;/s,
    );
    expect(styles).not.toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ExplorerDock\s+\.ExplorerDockSyntaxCode\s*\{[^}]*white-space:\s*pre-wrap;/s,
    );
  });
});
