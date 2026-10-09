import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Diff Dock chrome fidelity", () => {
  it("accepts a deterministic initial source for turn-scoped dock restoration", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain("readonly initialDiffSource?: DiffSource");
    expect(source).toContain('props.initialDiffSource ?? "workingTree"');
  });

  it("reuses the universal closable tab and keeps dock management separate", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const fileTabSource = readFileSync(
      new URL("./ExplorerFileTab.lynx.tsx", import.meta.url),
      "utf8",
    );
    const railTabsSource = readFileSync(
      new URL("./EditorRailTabs.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("<EditorSurfaceTab");
    expect(source).toContain('closeLabel="Close Diff"');
    expect(source).toContain('ariaLabel="Add panel"');
    expect(source).toContain('label="Collapse panel"');
    expect(source).toContain('<PanelRightCloseIcon color={semanticIconColor("secondary")}');
    expect(source).toContain('<PlusIcon color={semanticIconColor("secondary")}');
    expect(fileTabSource).toContain("<EditorSurfaceTab");
    expect(railTabsSource).toContain("<EditorSurfaceTab");
  });

  it("uses the shared chat-surface hairline under the hosted Diff toolbar", () => {
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    expect(styles).not.toMatch(/\.DiffDockHeader\s*\{[^}]*border-bottom/s);
    expect(source).toContain('className="DiffDockHeader chat-surface-divider"');
    // Electron DiffPanelToolbar separators: bg-border/60.
    expect(styles).toMatch(
      /\.DiffDockToolbarDivider\s*\{[^}]*background-color:\s*color-mix\(in oklab, var\(--color-border\) 60%, transparent\);/s,
    );
  });

  it("uses Web neutral hover material for close and retry controls", () => {
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    for (const className of ["DiffDockClose", "DiffDockRetry"]) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          "s",
        ),
      );
    }
    expect(styles).not.toContain("background-color: var(--accent)");
  });

  it("fits standalone state feedback inside a short thread dock", () => {
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ThreadPage[\s\S]*?> \.DiffDock[\s\S]*?\.DiffDockState\s*\{[^}]*height:\s*100%;[^}]*min-height:\s*100%;/s,
    );
  });

  it("provides a stable searchable file jump overlay for multi-file diffs", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    expect(source).toContain('props.presentation === "dock"');
    expect(source).toContain("view.files.length > 1");
    expect(source).toContain('aria-label="Jump to file"');
    expect(source).toContain('className="DiffDockFileJumpViewport"');
    expect(source).toContain('accessibility-label="Search changed files"');
    expect(source).toContain("file.path.toLowerCase().includes(");
    expect(source).toContain("const closeFileJump = () => {");
    expect(source).toContain('setFileJumpQuery("")');
    expect(source).toContain("bindtap={closeFileJump}");
    expect(source).toContain("onClick={closeFileJump}");
    expect(source).toContain("setExpandedFileKeys([file.key])");
    expect(source).toContain("scrollLynxElementIntoViewById(fileElementId(file.key))");
    expect(source).toContain("const jumpToFile = (file: PullRequestDiffFileView) => {");
    expect(source).toContain("onClick={() => jumpToFile(file)}");
    expect(source).toContain("onConfirm={() => {");
    expect(source).toContain("if (fileJumpFiles.length === 1)");
    expect(source).toContain("jumpToFile(fileJumpFiles[0]!)");
    // File actions legitimately use the shared Menu primitive. The jump picker
    // itself is intentionally a fixed native overlay, so scope this check to
    // the picker section rather than forbidding menus in the whole dock.
    const fileJumpOverlaySource = source.slice(
      source.indexOf("{fileJumpOpen ? ("),
      source.indexOf("function EditorDiffOptionsMenu"),
    );
    expect(fileJumpOverlaySource).toContain(
      '<XIcon color={semanticIconColor("secondary")} size={14} />',
    );
    expect(fileJumpOverlaySource).not.toContain(">\n              ×\n            </Button>");
    expect(fileJumpOverlaySource).not.toContain("<Menu");
    expect(styles).toMatch(
      /\.DiffDockFileJumpViewport\s*\{[^}]*position:\s*fixed;[^}]*z-index:\s*120;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.DiffDockFileJumpDialog\s*\{[^}]*width:\s*calc\(100vw - 16px\);[^}]*height:\s*calc\(100vh - 16px\);/s,
    );
  });

  it("ports the source-backed searchable review file tree as a real dock panel", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    expect(source).toContain('from "@synara/shared/pathTree"');
    expect(source).toContain('label={fileTreeOpen ? "Hide file tree" : "Show file tree"}');
    expect(source).toContain("<FoldersIcon");
    expect(source).toContain("<ReviewFileTree");
    expect(source).toContain('placeholder="Filter files..."');
    expect(source).toContain("buildPathTree(");
    expect(source).toContain("filterPathsForSearch(fileTreePaths, fileTreeQuery)");
    expect(source).toContain("setSelectedFilePath(file.path)");
    expect(source).toContain("scrollLynxElementIntoViewById(fileElementId(file.key))");
    expect(source).toContain("disclosureChevronClassName(open");
    expect(source).toContain("useLynxDisclosurePresence(fileTreeOpen)");
    expect(source).toContain("disclosureContentClassName(");
    expect(source).toContain("? disclosureContentClassName(");
    expect(source).toContain("props.initialFileTreeOpen === true");
    expect(source).toContain("const fileTreeVisible =");
    expect(source).toContain("!fileTreeInteracted && props.initialFileTreeOpen === true");
    expect(source).toContain("props.onFileTreeOpenChange?.(open)");
    expect(styles).toContain(".DiffDockReviewTree {");
    expect(styles).toContain("  width: 176px;");
    expect(styles).toContain("  max-width: 176px;");
    expect(styles).toContain("  height: calc(100vh - 124px);");
    expect(styles).toContain("  border-left: 1px solid var(--border);");
    expect(styles).toContain(".DiffDockReviewTreeRow {");
    expect(styles).toContain("  height: 28px;");
    expect(source).toContain("DiffDockPatchViewportFrame--with-review-tree");
    expect(source).toContain('className="DiffDockScroller DiffDockPatchViewport"');
    expect(styles).toContain(".DiffDockPatchViewportFrame {");
    expect(styles).toContain("  width: 0;");
    expect(styles).toContain("  flex: 1;");
    expect(styles).toContain(".DiffDockPatchViewportFrame--with-review-tree {");
    expect(styles).toContain("  width: calc(100% - 176px);");
    expect(styles).toMatch(
      /\.DiffDockReviewTree\s*\{[^}]*position:\s*relative;[^}]*z-index:\s*3;[^}]*width:\s*176px;[^}]*flex:\s*none;/s,
    );
    expect(styles).toMatch(/\.DiffDockBody\s*\{[^}]*flex-direction:\s*row;/s);
    expect(styles).not.toContain(".SliceRoot--viewport-medium .DiffDockReviewTree");
  });

  it("reuses the Native Git action lifecycle as the Web-style toolbar split control", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const environmentSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    expect(source).toContain("import { EnvironmentGitAction }");
    expect(source).toContain("useQuery(gitStatusQueryOptions(props.workspaceRoot, diffsEnabled))");
    expect(source).toContain('presentation="toolbar"');
    expect(environmentSource).toContain("export function EnvironmentGitAction");
    expect(environmentSource).toContain("resolveQuickAction(");
    expect(environmentSource).toContain('className="DiffDockGitSplitControl"');
    expect(environmentSource).toContain('ariaLabel="Git action options"');
    expect(styles).toContain(".DiffDockGitSplitControl {");
    expect(styles).toContain("  border-radius: 8px;");
  });

  it("shares the complete source and view options menu across dock and Editor", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");

    expect(source).toContain("<DiffOptionsMenu");
    expect(source).toContain("<EditorDiffOptionsMenu");
    expect(source).toContain("<ExplorerFileActionsMenu");
    expect(source).toContain("defaultOpen={props.defaultOpen}");
    expect(source).toContain("filePath === selectedFile?.path");
    expect(source).toContain("includeCopyPath");
    expect(source).toContain("<MenuGroupLabel>Source</MenuGroupLabel>");
    for (const value of ["workingTree", "unstaged", "staged", "branch"]) {
      expect(source).toContain(`value="${value}"`);
    }
    expect(source).toContain("Ignore whitespace-only changes");
    expect(source).toContain('<MenuRadioItem value="allTurns">All turns</MenuRadioItem>');
    expect(source).toContain('<MenuRadioItem value="lastTurn">Last turn</MenuRadioItem>');
    expect(source).toContain("value={`turn:${checkpoint.turnId}`}");
    expect(source).toContain("checkpointDiffQueryOptions({");
    expect(source).toContain("`conversation:${props.threadId}`");
    expect(source).toContain("ignoreWhitespace: diffIgnoreWhitespace");
    expect(source).toContain('"Copied diff" : "Copy diff"');
    expect(source).toContain("...gitWorkingTreeDiffQueryOptions({");
    expect(source).toContain(
      'scope: diffRequest.kind === "repo" ? diffRequest.scope : "workingTree"',
    );
  });

  it("preserves hunk rows and Web-compatible plus/minus gutters in split mode", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const elements = readFileSync(
      new URL("../adapters/PullRequestCodeCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("visibleDiffFiles(");
    expect(source).toContain("? { ...view, files: visibleFiles }");
    expect(source).toContain("view.files.map((file) => (");
    expect(source).toMatch(/Show(?:\{" "\}| )\s*\{Math\.min\(/);
    expect(source).toContain('visibleFiles.map((file) => file.key).join("\\0")');
    expect(source).not.toContain("line.kind !== 'hunk'");
    expect(elements).toContain('className="SharedPrCodeLinePrefix"');
    expect(elements).not.toContain("SharedPrCodeLineMarker--${props.kind}");
  });

  it("shares one fill-width patch viewport across dock and Editor presentations", () => {
    const source = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./diff-dock.css", import.meta.url), "utf8");

    expect(source).toContain('className="DiffDockScroller DiffDockPatchViewport"');
    expect(source).toContain("className={`DiffDockPatchViewportFrame${");
    expect(styles).toMatch(
      /\.DiffDockPatchViewport \.SharedPrCodeRoot,[\s\S]*?\.DiffDockPatchViewport \.SharedPrCodeSplitRow\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*100%;/s,
    );
    expect(styles).not.toContain(".ThreadEditorChanges .SharedPrCodeLinesContent,");
  });
});
