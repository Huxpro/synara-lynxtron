import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), "utf8");
}

describe("Lynx Editor view", () => {
  it("routes the Environment Editor view row into a real editor composition", () => {
    const routerSource = source("./router.tsx");
    expect(routerSource).toContain("onOpenEditorView={enterEditorMode}");
    expect(routerSource).toContain('className="ThreadEditorView"');
    expect(routerSource).toContain('className="ThreadEditorActivityRail"');
    expect(routerSource).toContain(
      'presentationMode={editorSearchActive ? "editor-search" : "editor"}',
    );
    expect(routerSource).toContain("onClick={exitEditorMode}");
  });

  it("matches the Web header action order and handoff behavior", () => {
    const routerSource = source("./router.tsx");
    const actionsSource = source("./ThreadHeaderActions.lynx.tsx");
    expect(actionsSource).toContain("readonly compact: boolean;");
    expect(actionsSource.match(/!props.compact ?/g)).toHaveLength(3);
    expect(routerSource).toContain("const compactThreadHeader = threadHeaderAvailableWidth < 700");
    expect(routerSource).not.toContain("threadHeaderAvailableWidth < 240");
    expect(routerSource).not.toContain("displayTitle={compactThreadTitle}");
    const environmentSource = source("./EnvironmentPanel.lynx.tsx");

    const handoffIndex = routerSource.indexOf("<ThreadHeaderActions");
    // The landing header renders the same toggles earlier in the file; order is checked
    // within the thread header, which starts at its actions.
    const environmentIndex = routerSource.indexOf("<EnvironmentToggle", handoffIndex);
    const diffIndex = routerSource.indexOf("<ThreadRightSidebarToggle", environmentIndex);
    expect(handoffIndex).toBeGreaterThan(-1);
    expect(environmentIndex).toBeGreaterThan(handoffIndex);
    expect(diffIndex).toBeGreaterThan(environmentIndex);
    expect(actionsSource).toContain("Hand off");
    expect(actionsSource).toContain("Add action");
    expect(actionsSource).toContain("export function ProjectActionAddButton");
    expect(actionsSource).toContain(
      '<text className="ThreadHeaderTextActionLabel">Hand off</text>',
    );
    expect(actionsSource).toContain(
      '<text className="ThreadHeaderTextActionLabel">Add action</text>',
    );
    expect(actionsSource).toContain("queryFn: () => fetchNativeThreadHandoffProviderContext()");
    expect(actionsSource).toContain("resolveNativeThreadHandoffTargets(");
    expect(actionsSource).toContain("await createNativeThreadHandoff({");
    expect(routerSource).toContain("subscribeOpenThreadPathInTerminal(");
    expect(routerSource).toContain("consumeOpenThreadPathInTerminal(threadId)");
    expect(routerSource).toContain('data: "cd " + quotePosixShellArgument(intent.cwd) + "\\r"');
    expect(actionsSource).toContain('type: "project.meta.update"');
    expect(actionsSource).toContain("<ProjectActionEditor");
    expect(actionsSource).toContain("addProjectAction(project.scripts");
    expect(actionsSource).toContain("updateProjectAction(project.scripts");
    expect(actionsSource).toContain("deleteProjectAction(project.scripts");
    expect(actionsSource).toContain("await upsertKeybinding(");
    expect(actionsSource).toContain("await removeKeybinding(");
    expect(actionsSource).toContain("aria-label={`Edit ${script.name}`}");
    expect(actionsSource).toContain(
      "props.actionState.showProjectActions && (project?.scripts.length ?? 0) > 0",
    );
    expect(actionsSource).toContain(") : props.actionState.showProjectActions ? (");
    expect(actionsSource).toContain("onClick={openActionEditor}");
    expect(environmentSource).toContain("Toggle environment panel");
  });

  it("reuses the real explorer preview beside the live chat rail", () => {
    const routerSource = source("./router.tsx");
    const editorStateSource = source("./editorViewState.lynx.ts");
    expect(routerSource).toContain('editorChatOpen ? "" : " ThreadEditorCenter--chat-hidden"');
    expect(routerSource).toContain('editorChatOpen ? "" : " ThreadEditorChat--hidden"');
    expect(routerSource).toContain("explorerFileSyntaxHighlight");
    expect(routerSource).toContain("onSelectPath={onExplorerSelectPath}");
    expect(routerSource).toContain("{chatBody}");
    expect(editorStateSource).toContain("export function readEditorChatPaneVisible()");
    expect(editorStateSource).toContain(
      "export function storeEditorChatPaneVisible(visible: boolean)",
    );
    expect(editorStateSource).toContain(
      'export const EDITOR_CHAT_PANE_STORAGE_KEY = "synara.editor.chatPaneWidth"',
    );
    expect(editorStateSource).toContain("export const EDITOR_CHAT_PANE_MIN_WIDTH = 320");
    expect(editorStateSource).toContain("export const EDITOR_CHAT_PANE_MAX_WIDTH = 600");
    expect(routerSource).toContain("initialEditorChatOpen ?? readEditorChatPaneVisible()");
    expect(routerSource).toContain(
      'aria-label={editorChatOpen ? "Hide chat panel" : "Show chat panel"}',
    );
    expect(routerSource).toContain('className="ThreadEditorChatToggle"');
    expect(routerSource).toContain("content={colorizeLynxSvg(");
    expect(routerSource).toContain("panelRightCloseSvg");
    expect(routerSource).toContain('className="ThreadEditorExitButton"');
    expect(routerSource).toContain("bubbleTextSvg");
    expect(routerSource).toContain("storeEditorChatPaneVisible(next)");
    expect(routerSource).toContain("ThreadEditorChat--hidden");
    expect(routerSource).toContain("<ResizableRightPanel");
    expect(routerSource).toContain("storageKey={EDITOR_CHAT_PANE_STORAGE_KEY}");
    expect(routerSource).toContain("minWidth={EDITOR_CHAT_PANE_MIN_WIDTH}");
    expect(routerSource).toContain("maxWidth={EDITOR_CHAT_PANE_MAX_WIDTH}");
    expect(routerSource).toContain("editorChatOpen && viewportWidth >= VIEWPORT_BREAKPOINTS.lg");
    expect(routerSource).toContain("<ChatSurfaceHeaderFrame editorRail>");
    expect(routerSource).toContain(
      "storeEditorViewState(threadId, {\n      centerMode: editorCenterMode",
    );
  });

  it("provides project-scoped chat history navigation through a stable overlay", () => {
    const routerSource = source("./router.tsx");
    const railTabsSource = source("./EditorRailTabs.lynx.tsx");
    const historySource = source("./editorChatHistory.logic.ts");
    expect(routerSource).toContain("onHistory={() => setEditorChatHistoryOpen(true)}");
    expect(routerSource).toContain('className="ThreadEditorHistoryDialog"');
    expect(routerSource).toContain('className="ThreadEditorHistoryViewport"');
    expect(routerSource).toContain('className="ThreadEditorHistoryBackdrop"');
    expect(routerSource).toContain('if (event.key === "Escape") setEditorChatHistoryOpen(false)');
    expect(routerSource).toContain("resolveEditorChatHistoryThreads({");
    expect(routerSource).toContain("onNavigateToThread={(threadId) => {");
    // Only navigation from inside the Editor carries the Editor into the next thread.
    expect(routerSource).toContain("if (editorModeOpen) setEditorEntryThreadId(threadId);");
    expect(routerSource).toContain("navigate(`/thread/${threadId}`);");
    const historyOverlaySource = routerSource.slice(
      routerSource.indexOf("{editorChatHistoryOpen ? ("),
      routerSource.indexOf("{editorRailNewOpen ? ("),
    );
    expect(historyOverlaySource).not.toContain("<Menu");
    expect(historyOverlaySource).toContain(
      '<XIcon color={semanticIconColor("secondary")} size={14} />',
    );
    expect(historyOverlaySource).not.toContain(">\n                ×\n              </Button>");
    expect(railTabsSource).toContain('label="Chat history"');
    expect(historySource).toContain("thread.projectId === input.projectId");
    expect(historySource).toContain("sortThreadsForSidebar(");
    expect(historySource).toContain("export const EDITOR_CHAT_HISTORY_LIMIT = 30");
  });

  it("switches Editor projects through the shared anchored picker", () => {
    const routerSource = source("./router.tsx");
    const projectSwitchSource = source("./editorProjectSwitch.logic.ts");
    const projectSwitchMenuSource = source("./EditorProjectSwitchMenu.lynx.tsx");
    const appStyles = source("./App.css");

    expect(routerSource).toContain("<EditorProjectSwitchMenu");
    expect(projectSwitchMenuSource).toContain('ariaLabel="Switch project"');
    expect(projectSwitchMenuSource).toContain('className="ThreadEditorProjectSwitchPopup"');
    expect(projectSwitchMenuSource).toContain('placeholder="Search projects"');
    expect(projectSwitchMenuSource).toContain("<MenuRadioGroup");
    expect(projectSwitchMenuSource).toContain("<MenuRadioItem");
    expect(routerSource).toContain("resolveEditorProjectSwitchOptions({");
    expect(routerSource).toContain("groupEditorProjectSwitchOptions({");
    expect(routerSource).toMatch(/useSpacesUiStore\(\s*\(state\) => state\.activeSpaceId\s*\)/s);
    // Spaces come from the shared store that upstream session sync feeds.
    expect(routerSource).toContain("const editorProjectSpaces = useSessionShellSpaces();");
    expect(routerSource).toContain("spaceId: project.spaceId ?? null");
    expect(projectSwitchMenuSource).toContain("<ComposerProjectPickerGroupElement");
    expect(projectSwitchMenuSource).toContain("<ComposerProjectPickerGroupLabelElement");
    expect(routerSource).toContain("resolveEditorProjectSwitchTarget(option);");
    expect(routerSource).toContain("setEditorRailDraftProjectId(target.projectId);");
    expect(routerSource).toContain('setEditorRailSurface("chat")');
    expect(routerSource).not.toContain("disabled={option.threadId === null}");
    expect(routerSource).not.toContain("ThreadEditorProjectSwitchBackdrop");
    expect(projectSwitchSource).toContain("sortThreadsForSidebar(");
    expect(projectSwitchSource).toContain('return { kind: "draft", projectId: option.id };');
    expect(projectSwitchSource).toContain('project.kind !== "project"');
    expect(projectSwitchSource).toContain("thread.archivedAt == null");
    expect(appStyles).toMatch(
      /\.ThreadEditorProjectSwitchPopup\s*\{[^}]*width:\s*240px;[^}]*max-height:\s*320px;/s,
    );
    expect(appStyles).toMatch(
      /\.LxMenuTrigger\.ThreadEditorProjectSwitchTrigger\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s,
    );
  });

  it("lets an explicit startup file or diff mode override persisted Editor state", () => {
    const routerSource = source("./router.tsx");
    expect(routerSource).toMatch(
      /initialEditorCenterMode === ["']file["'][\s\S]*?\? ["']file["'][\s\S]*?initialEditorCenterMode === ["']diff["'][\s\S]*?\? ["']diff["'][\s\S]*?readEditorViewState\(threadId\)\?\.centerMode/s,
    );
    expect(routerSource).toContain("if (initialEditorCenterMode !== null)");
    expect(routerSource).toContain("setEditorCenterMode(initialEditorCenterMode);");
  });

  it("opens real chat and terminal surfaces from the Editor rail", () => {
    const routerSource = source("./router.tsx");
    const railTabsSource = source("./EditorRailTabs.lynx.tsx");
    const railTabsStyles = source("./editor-rail-tabs.css");
    const appStyles = source("./App.css");
    expect(routerSource).toContain("onNewChat={openEditorNewChat}");
    expect(routerSource).not.toContain("onClick={openEditorTerminal}");
    expect(routerSource).toContain('setEditorRailSurface("terminal")');
    expect(routerSource).toContain("onNewTerminal={openEditorTerminal}");
    expect(routerSource).not.toContain("ThreadEditorNewDialog");
    expect(railTabsSource).toContain("<EditorRailAddMenu");
    expect(routerSource).toContain('setEditorRailSurface("chat")');
    expect(routerSource).toContain('presentationMode="workspace"');
    expect(routerSource).toContain('terminalId="lynx-editor-rail"');
    expect(routerSource).toContain("<EditorRailTabs");
    expect(railTabsSource).toContain('label="New editor rail item"');
    expect(railTabsSource).toContain('className="ThreadEditorRailTabsRoot"');
    expect(railTabsSource).toContain("<EditorSurfaceTab");
    expect(railTabsSource).toContain("readEditorRailChatTabs(");
    expect(railTabsSource).toContain("storeEditorRailChatTabs(");
    expect(routerSource).toContain("className={`ThreadEditorChatSurface${");
    expect(routerSource).toContain("className={`ThreadEditorTerminalSurface${");
    expect(routerSource).toContain("{editorTerminalOpen && currentThread?.workspaceRoot ? (");
    expect(routerSource).not.toContain(
      "{editorRailSurface === 'terminal' &&\n              currentThread?.workspaceRoot ? (",
    );
    const addMenuSource = source("./EditorRailAddMenu.lynx.tsx");
    expect(addMenuSource).toContain("EditorRailAddMenuComposition");
    expect(addMenuSource).toContain("onNewTerminal");
    expect(routerSource).toContain("onNewTerminal={openEditorTerminal}");
    expect(routerSource).toContain('terminalPrimaryState.entryPoint === "terminal"');
    expect(routerSource).toContain('terminalPrimaryState.workspaceLayout === "terminal-only"');
    expect(routerSource).toContain('primary: terminalPrimary ? "terminal" : "chat"');
    expect(routerSource).toContain('scope="thread"');
    expect(routerSource).toContain("resolveThreadHeaderIconKind(");
    expect(routerSource).toContain('className="ThreadHeaderTerminalIcon"');
    expect(routerSource).not.toContain("onClick={openEditorNewChat}");
    expect(routerSource).toContain("onNewChat={openEditorNewChat}");
    expect(routerSource).toContain("<LandingComposer");
    expect(routerSource).toContain("initialProjectId={editorRailDraftProject?.id ?? null}");
    expect(routerSource).toContain("onProjectSelectionChange={setEditorRailDraftProjectId");
    expect(routerSource).toContain("projectName={editorRailDraftProject?.name ?? null}");
    expect(routerSource).toContain("setEditorEntryThreadId(threadId)");
    expect(routerSource).toContain("editorEntryThreadId === route.params.threadId");
    expect(railTabsStyles).toMatch(/\.ThreadEditorRailTabChip\s*\{[^}]*max-width:\s*132px;/s);
    expect(source("./editor-surface-tab.css")).toMatch(
      /\.EditorSurfaceTab\s*\{[^}]*height:\s*28px;/s,
    );
    expect(source("./editor-surface-tab.css")).toMatch(
      /\.EditorSurfaceTab\.ui-hover \.EditorSurfaceTabRestingIcon,[^}]*opacity:\s*0;/s,
    );
    expect(source("./editor-surface-tab.css")).toMatch(
      /\.EditorSurfaceTab\.ui-hover \.EditorSurfaceTabCloseGlyph,[^}]*opacity:\s*1;/s,
    );
    expect(appStyles).toMatch(/\.ThreadEditorNewDialog\s*\{[^}]*width:\s*240px;/s);
    expect(appStyles).toMatch(
      /\.ThreadEditorChatSurface--hidden,[\s\S]*?\.ThreadEditorTerminalSurface--hidden\s*\{[^}]*display:\s*none;/s,
    );
  });

  it("keeps Editor entry intent out of ordinary sidebar thread navigation", () => {
    const routerSource = source("./router.tsx");

    expect(routerSource).toMatch(/\(\) =>\s*\(?initialEditorOpen \? activeThreadId : null\)?/);
    expect(routerSource).toContain(
      "initialEditorOpen={editorEntryThreadId === route.params.threadId",
    );
    expect(routerSource).not.toContain(
      "initialEditorOpen ||\n          editorEntryThreadId === route.params.threadId",
    );
    expect(routerSource).toContain("const navigateToChat = useCallback(");
    expect(routerSource).toContain("setEditorEntryThreadId(null);");
    expect(routerSource).toContain("setEditorModeOpen(false);");
    expect(routerSource).toContain("navigate={navigateToChat}");
  });

  it("keeps thread data and the Editor shell stable while local resources refresh", () => {
    const routerSource = source("./router.tsx");

    expect(routerSource).toContain('queryKey: ["thread-detail", activeThreadId]');
    expect(routerSource).toContain(
      'queryKey: ["explorer-entries", activeThreadId, workspaceRoot, explorerTrimmedQuery]',
    );
    expect(routerSource).toContain(
      'queryKey: ["explorer-file", activeThreadId, workspaceRoot, explorerSelectedPath]',
    );
    expect(routerSource).not.toContain(
      "'thread-detail',\n      activeThreadId,\n      explorerTrimmedQuery",
    );
    expect(routerSource).not.toContain("if (editorMode && !currentThread)");
    expect(routerSource).not.toContain("ThreadEditorCenterLoading");
    expect(routerSource).not.toContain("Loading editor content…");
  });

  it("reuses the real Changes renderer as an Editor activity mode", () => {
    const routerSource = source("./router.tsx");
    const appStyles = source("./App.css");
    expect(routerSource).toContain('readEditorViewState(threadId)?.centerMode ?? "file"');
    expect(routerSource).toContain("<EditorActivityItem");
    expect(routerSource).toContain("changesSvg");
    expect(routerSource).toContain("foldersSvg");
    expect(routerSource).toContain('className="ThreadEditorActivityIcon"');
    expect(routerSource).toContain('? "Hide search sidebar"');
    expect(routerSource).toContain(': "Search files"');
    expect(routerSource).toContain("onActivate={showEditorSearch}");
    expect(routerSource).toContain("readEditorSidebarVisible");
    expect(routerSource).toContain("storeEditorSidebarVisible(false)");
    expect(routerSource).toContain("sidebarVisible={editorSidebarVisible}");
    expect(routerSource).toContain(
      'presentationMode={editorSearchActive ? "editor-search" : "editor"}',
    );
    expect(routerSource).toContain('setEditorCenterMode("diff")');
    expect(routerSource).toContain("<DiffDock");
    expect(routerSource).toContain("initialDiff={initialWorkingTreeDiff ?? undefined}");
    expect(routerSource).toContain("initialSelectedFilePath={explorerSelectedPath}");
    expect(routerSource).toContain('presentation="editor"');
    expect(routerSource).toContain("workspaceRoot={currentThread?.workspaceRoot ?? null}");
    expect(routerSource).toContain("<DiffDock");
    const diffDockSource = source("./DiffDock.lynx.tsx");
    expect(diffDockSource).toContain(
      "const [expandedFileKeys, setExpandedFileKeys] = useState<string[] | null>(null",
    );
    expect(diffDockSource).toContain('resizable={props.presentation === "dock"}');
    expect(diffDockSource).toContain('{props.presentation === "dock" ?');
    expect(diffDockSource).toContain("? view.files.map((file) => file.key)");
    expect(diffDockSource).toContain('className="DiffDockFileSidebar"');
    expect(diffDockSource).toContain('className="DiffDockFileSidebarStats"');
    expect(diffDockSource).toContain('className="DiffDockFileSidebarIcon"');
    expect(diffDockSource).toContain("<EditorDiffOptionsMenu");
    expect(diffDockSource).toContain("<MenuGroupLabel>Source</MenuGroupLabel>");
    expect(diffDockSource).toContain(
      '<MenuRadioItem value="workingTree">Working tree</MenuRadioItem>',
    );
    expect(diffDockSource).toContain(
      '<MenuRadioItem value="unstaged">Unstaged changes</MenuRadioItem>',
    );
    expect(diffDockSource).toContain(
      '<MenuRadioItem value="staged">Staged changes</MenuRadioItem>',
    );
    expect(diffDockSource).toContain(
      '<MenuRadioItem value="branch">Branch changes</MenuRadioItem>',
    );
    expect(diffDockSource).toContain("Ignore whitespace-only changes");
    expect(diffDockSource).toContain(
      "fetchWorkingTreeDiff(props.workspaceRoot, diffRequest.scope)",
    );
    expect(diffDockSource).toContain('props.diffCopied ? "Copied diff" : "Copy diff"');
    expect(diffDockSource).toContain("+{view.additions}");
    expect(diffDockSource).toContain("-{view.deletions}");
    expect(diffDockSource).toContain("showSummary={false}");
    expect(diffDockSource).toContain('className="DiffDockTabHeader chat-surface-divider"');
    expect(diffDockSource).toContain("<EditorSurfaceTab");
    expect(diffDockSource).toContain('label="Diff"');
    expect(diffDockSource).toContain("<DiffSourcePicker");
    expect(diffDockSource).toContain('return "Working tree"');
    expect(diffDockSource).toContain('emptyLabel="No working tree changes."');
    expect(diffDockSource).toContain("<EditorDiffFileRow");
    expect(diffDockSource).toContain('className="DiffDockFileIcon"');
    expect(diffDockSource).toContain('className="DiffDockFileStats"');
    expect(diffDockSource).toContain("syntaxTokensByLineId={syntaxTokensByLineId}");
    expect(diffDockSource).not.toContain("files: [selectedFile],");
    expect(diffDockSource).toContain(
      "visibleDiffFiles(view.files, visibleFileCount, selectedFile?.path ?? null)",
    );
    expect(diffDockSource).toContain("{ ...view, files: visibleFiles }");
    expect(diffDockSource).toContain('visibleFiles.map((file) => file.key).join("\\0")');
    expect(diffDockSource).not.toContain("line.kind !== 'hunk'");
    expect(diffDockSource).toContain('props.presentation !== "editor" ? diffRenderMode : "split"');
    expect(diffDockSource).toContain('filePathPresentation="basename-first"');
    expect(diffDockSource).toContain("renderFileActions={");
    expect(diffDockSource).toContain("<DiffFileActionsMenu");
    expect(diffDockSource).toContain("setSelectedFilePath(file.path)");
    expect(appStyles).toMatch(
      /\.ThreadEditorChanges\s+\.DiffDock\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*height:\s*100%;/s,
    );
    const diffDockStyles = source("./diff-dock.css");
    expect(diffDockStyles).toContain(`.ThreadEditorChanges .DiffDockScroller {
  padding: 0;
}`);
    expect(diffDockStyles).toMatch(/\.DiffDockScroller\s*\{[^}]*width:\s*100%;[^}]*flex:\s*1;/s);
    expect(diffDockStyles).toContain(`.ThreadEditorChanges .SharedPrCodeRoot {
  gap: 8px;
  padding: 8px;
}`);
    expect(diffDockStyles).toContain(`.ThreadEditorChanges .SharedPrCodeFileHeader {
  min-height: 36px;
  padding: 6px 12px;
}`);
    expect(diffDockStyles).toContain(`.ThreadEditorChanges .SharedPrCodeDisclosure {
  padding-bottom: 9px;
}`);
    expect(diffDockStyles).toMatch(
      /\.DiffDockPatchViewport \.SharedPrCodeRoot,[\s\S]*?\.DiffDockPatchViewport \.SharedPrCodeSplitRow\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*100%;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.DiffDockPatchViewport \.SharedPrCodeSplitRow\s*\{[^}]*flex:\s*1;/s,
    );
    expect(diffDockStyles).toMatch(/\.DiffDock\s*\{[^}]*top:\s*0;[^}]*width:\s*50%;/s);
    expect(diffDockStyles).toMatch(
      /\.DiffDockTabHeader\s*\{[^}]*height:\s*46px;[^}]*min-height:\s*46px;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.DiffDockFileSidebar\s*\{[^}]*width:\s*224px;[^}]*min-width:\s*224px;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorChanges\s+\.DiffDockFileSidebar,[\s\S]*?width:\s*100%;[\s\S]*?height:\s*176px;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadEditorChanges\s+\.DiffDockBody\s*\{[^}]*flex-direction:\s*row;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.SliceRoot--viewport-short-height[\s\S]*?\.ThreadEditorChanges[\s\S]*?\.DiffDockFileSidebar\s*\{[^}]*width:\s*104px;[^}]*min-width:\s*104px;[^}]*height:\s*100%;[^}]*min-height:\s*0;/s,
    );
    expect(diffDockStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadEditorChanges\s+\.DiffDockScroller\s*\{[^}]*padding:\s*4px;/s,
    );
  });

  it("uses the shared Web right-dock state policy for Native pane tabs", () => {
    const routerSource = source("./router.tsx");
    const tabsSource = source("./ThreadRightDockTabs.lynx.tsx");
    const sharedSource = source("../../../../packages/shared/src/rightDock.ts");
    const webPolicySource = source("../../../web/src/rightDockStore.logic.ts");

    for (const transition of [
      "openPaneInState",
      "closePaneInState",
      "setActivePaneInState",
      "setDockOpenInState",
    ]) {
      expect(routerSource).toContain(transition);
      // Upstream keeps this policy in `rightDockStore.logic.ts`; the shared
      // module mirrors its transitions for Lynx, so both must define each one.
      expect(sharedSource).toContain(`function ${transition}`);
      expect(webPolicySource).toContain(`function ${transition}`);
    }
    expect(routerSource).toContain('from "@synara/shared/rightDock"');
    expect(routerSource).toContain("<ThreadRightDockTabs");
    expect(routerSource).toContain('kind: "file"');
    expect(tabsSource).toContain("<EditorSurfaceTab");
    expect(tabsSource).toContain('ariaLabel="Add panel"');
    expect(tabsSource).toContain('accessibleLabel: "Collapse panel"');
  });

  it("matches the Web authority rail boundaries", () => {
    const routerSource = source("./router.tsx");
    const appStyles = source("./App.css");
    const explorerStyles = source("./explorer-dock.css");
    const explorerSource = source("./ExplorerDock.lynx.tsx");
    expect(appStyles).toMatch(
      /\.ThreadEditorActivityRail\s*\{[^}]*width:\s*48px;[^}]*min-width:\s*48px;/s,
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorActivityIndicator\s*\{[^}]*top:\s*12px;[^}]*width:\s*2px;[^}]*height:\s*24px;/s,
    );
    expect(appStyles).toMatch(/\.ThreadEditorProject\s*\{[^}]*white-space:\s*nowrap;/s);
    expect(routerSource).toContain("MAC_DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CSS_PX");
    expect(routerSource).not.toContain('className="ThreadEditorModeLabel"');
    expect(appStyles).toMatch(
      /\.LxButton\.ThreadEditorChatToggle\s*\{[^}]*width:\s*34px;[^}]*height:\s*28px;/s,
    );
    expect(appStyles).toMatch(
      /\.LxButton\.ThreadEditorExitButton\s*\{[^}]*width:\s*88px;[^}]*height:\s*28px;/s,
    );
    expect(routerSource).toContain('className="ThreadEditorView"');
    expect(routerSource).not.toContain("ThreadEditorView--stacked");
    expect(routerSource).toContain("<SidebarDisclosure open={sidebarOpen && !editorModeOpen}>");
    expect(routerSource).toContain("onEditorModeChange={setEditorModeOpen}");
    expect(appStyles).toContain(".ThreadEditorChat > .AppWindowDragRegion {");
    expect(appStyles).toContain("min-height: 40px;");
    expect(appStyles).toContain(".ThreadEditorChat .SharedChatHeaderIdentityTitle {");
    expect(appStyles).toMatch(
      /\.ThreadEditorChat\s*\{[^}]*width:\s*384px;[^}]*min-width:\s*320px;/s,
    );
    expect(explorerStyles).toMatch(
      /\.ExplorerDock--editor\s+\.ExplorerDockSidebar\s*\{[^}]*width:\s*224px;[^}]*min-width:\s*224px;/s,
    );
    expect(explorerStyles).toMatch(
      /\.ExplorerDock--editor\s+\.ExplorerDockHeader\s*\{[^}]*display:\s*none;/s,
    );
    expect(explorerStyles).toMatch(
      /\.ExplorerDock--editor:not\(\.ExplorerDock--editor-search\)\s+\.ExplorerDockSearch\s*\{[^}]*display:\s*none;/s,
    );
    expect(explorerSource).toContain('props.presentationMode === "editor-search"');
    expect(explorerStyles).toMatch(
      /\.SliceRoot--viewport-compact[\s\S]*?\.ExplorerDock--editor[\s\S]*?\.ExplorerDockBody,[\s\S]*?flex-direction:\s*column;/s,
    );
    expect(explorerStyles).toMatch(
      /\.SliceRoot--viewport-compact[\s\S]*?\.ExplorerDock--editor[\s\S]*?\.ExplorerDockSidebar,[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?height:\s*176px;/s,
    );
    expect(appStyles).not.toContain(".ThreadEditorView--stacked");
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadEditorChat\s+>\s+\.AppWindowDragRegion,[\s\S]*?\.SliceRoot--viewport-short-height\s+\.ThreadEditorChat\s+\.ProviderHealthBannerFrame\s*\{[^}]*display:\s*none;/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.ThreadEditorChat\s*\{[^}]*--app-density-composer-editor-min-height:\s*20px;/s,
    );
    expect(appStyles).toMatch(/\.ThreadEditorChat--hidden\s*\{[^}]*display:\s*none;/s);
  });

  it("supports deterministic Web and Native startup verification", () => {
    const appSource = source("./App.tsx");
    const diffDockSource = source("./DiffDock.lynx.tsx");
    const routerSource = source("./router.tsx");
    const webHostSource = source("../main/web/web-host.ts");
    const desktopSource = source("../main/desktop/shellRuntime.ts");
    expect(appSource).toContain("const initialEditorOpen = initData.initialEditorOpen === true");
    expect(appSource).toContain("await hydrateStorage()");
    expect(appSource).toContain("rehydratePersistedStores()");
    expect(source("./persistedStoreHydration.lynx.ts")).toContain("useTerminalStateStore,");
    expect(appSource).not.toContain("Promise.all([fetchSidebarSnapshot(), fetchThreads()])");
    expect(webHostSource).toContain('get("editor") === "open"');
    expect(webHostSource).toContain('get("editorMode") === "diff"');
    expect(webHostSource).toContain('get("editorChat") === "hidden"');
    expect(webHostSource).toContain('get("editorHistory") ===');
    expect(webHostSource).toContain('get("editorNew") === "open"');
    expect(webHostSource).toContain('get("editorNewChat") ===');
    expect(webHostSource).toContain('get("editorSearch") === "open"');
    expect(routerSource).toContain("initData.initialEditorHistoryOpen === true");
    expect(appSource).not.toContain("await fetchWorkingTreeDiff(");
    expect(appSource).not.toContain("await fetchGitBranches(summary.workspaceRoot)");
    expect(diffDockSource).toContain("enabled: !props.unavailableLabel");
    expect(diffDockSource).toContain(
      '<text className="DiffDockStateText">{props.unavailableLabel}</text>',
    );
    expect(desktopSource).toContain('initialEditorOpen: url.searchParams.get("editor") === "open"');
    expect(desktopSource).toContain('url.searchParams.get("editorMode") === "diff"');
    expect(desktopSource).toContain('url.searchParams.get("editorHistory") === "open"');
    expect(desktopSource).toContain('url.searchParams.get("editorNew") === "open"');
    expect(desktopSource).toContain('url.searchParams.get("editorNewChat") === "open"');
    expect(desktopSource).toContain('url.searchParams.get("editorSearch") === "open"');
  });
});
