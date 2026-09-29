import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Environment panel", () => {
  it("reuses the shared disclosure motion for every expandable section", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(panelSource).toContain("function EnvironmentDisclosureHeader(");
    expect(panelSource).toContain("function EnvironmentDisclosureContent(");
    expect(panelSource).toContain("useLynxDisclosurePresence(props.open)");
    expect(panelSource).toContain("disclosureContentClassName(");
    expect(panelSource).toContain("disclosureChevronClassName(");
    expect(panelSource).toContain("<ChevronRightIcon");
    expect(panelSource).not.toContain("EnvironmentDisclosureChevron--open");
    expect(panelSource).not.toMatch(/<ChevronDownIcon[\s\S]{0,120}EnvironmentDisclosureChevron/);
    expect(panelSource.match(/<EnvironmentDisclosureHeader/g)).toHaveLength(4);
    expect(panelSource.match(/<EnvironmentDisclosureContent/g)).toHaveLength(4);
  });

  it("routes actionable rows through the shared keyboard and focus interaction state", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(panelSource).toContain("function EnvironmentInteractiveRow(");
    expect(panelSource).toContain("baseClassName: props.baseClassName");
    expect(panelSource).toContain("disabled: props.disabled");
    expect(panelSource).toContain("aria-checked={props.ariaChecked}");
    expect(panelSource).toContain('baseClassName="EnvironmentGitActionSelectAll"');
    expect(panelSource).toContain('baseClassName="EnvironmentEditorTrigger"');
    expect(panelSource).toContain('baseClassName="EnvironmentRepositoryRow"');
    expect(panelSource).not.toContain("bindtap=");
  });

  it("connects the real thread header toggle and mounted panel", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");
    expect(routerSource).toContain("<EnvironmentToggle");
    expect(routerSource).toContain("<EnvironmentPanel");
    expect(routerSource).toContain("accessibleLabel: 'Toggle diff panel'");
    expect(routerSource).toContain("panelRightCloseSvg");
    expect(routerSource).not.toContain("accessibleLabel: 'Toggle files panel'");
    expect(routerSource).toContain(
      "const [environmentUserOverride, setEnvironmentUserOverride] = useState<",
    );
    expect(routerSource).toContain("const resolvedEnvironmentOpen =");
    expect(routerSource).toContain("environmentData={null}");
    expect(routerSource).toContain("open={environmentPanelLayout.visible}");
    expect(panelSource).toContain("label={props.envMode === 'worktree' ? 'Worktree' : 'Local'}");
    expect(panelSource).not.toContain("EnvironmentWorkspace");
    expect(panelSource).toContain("initialData: EnvironmentBootstrapData | null");
    expect(panelSource).toContain("initialStatus={props.initialData?.gitStatus ?? null}");
    expect(panelSource).toContain("props.initialData?.gitStatusLoaded === true");
    expect(panelSource).toContain(
      "error: props.initialLoadCompleted && props.initialStatus === null",
    );
    expect(panelSource).toContain("initialBranches={props.initialData?.branches ?? null}");
    expect(panelSource).toContain("initialData={props.initialData?.localServers ?? null}");
    expect(panelSource).toContain("initialRepository={props.initialData?.repository ?? null}");
    expect(panelSource).toContain("initialConfig={props.initialData?.config ?? null}");
    expect(panelSource).toContain("const liveQueriesEnabled = props.open && !props.bootstrapOnly");
    expect(panelSource.match(/open=\{liveQueriesEnabled\}/g)).toHaveLength(6);
    expect(panelSource).toContain("open={props.open}");
    expect(panelSource).toContain("initializeGit(props.workspaceRoot)");
    expect(panelSource).toContain("\'Retry Initialize Git\' : \'Initialize Git\'");
    expect(panelSource).toContain("const isGitRepo = repositoryQuery.data?.isRepo === true");
    expect(panelSource).toContain("props.onNotesChange(next)");
    expect(panelSource).toContain("props.onBranchChange(branch)");
    expect(panelSource).toContain("props.onBranchChange(result.branch.name)");
    expect(panelSource).not.toContain("if (!props.open || props.bootstrapOnly) return;");
    expect(routerSource).toContain("initialEnvironmentOpen && environmentData !== null");
    expect(panelSource).toContain("? 'Usage is currently unavailable.'");
    expect(panelSource).toContain("!props.bootstrapOnly && visibility.showEnvironmentUsage ? (");
    expect(routerSource).toContain('className="ThreadHeaderControls"');
    expect(routerSource).toContain("resolveEnvironmentPanelLayout({");
    expect(routerSource).toContain(
      "viewportWidth < VIEWPORT_BREAKPOINTS.lg || diffOpen || explorerOpen",
    );
    expect(routerSource).toContain("ThreadPage--environment-open");
    expect(routerSource).toContain("ThreadPage--provider-health-visible");
    expect(routerSource).toContain(
      "resolveProviderHealthBannerPresentation(providerHealth.status)",
    );
    expect(panelSource).toContain("useLynxInteractiveState({");
    expect(panelSource).toContain("Toggle environment panel");
    expect(panelSource).toContain("import windowSvg from '@synara-central-icons/window.svg?raw'");
    expect(panelSource).toContain("from '@synara/shared/pinnedMessages'");
    expect(panelSource).toContain("from '@synara/shared/threadMarkers'");
    expect(panelSource).not.toContain("from '@synara-web/pinnedMessages'");
    expect(panelSource).not.toContain("from '@synara-web/threadMarkers'");
    expect(appStyles).toMatch(
      /\.TransportStatusNotice\s*\{[^}]*top:\s*8px;[^}]*right:\s*76px;[^}]*z-index:\s*1000;/s,
    );
  });

  it("uses only sections backed by real current capabilities", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const queriesSource = readFileSync(new URL("./queries.ts", import.meta.url), "utf8");
    const transcriptSource = readFileSync(new URL("./Transcript.tsx", import.meta.url), "utf8");
    const diffDockSource = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const appStyles = readFileSync(new URL("./App.css", import.meta.url), "utf8");

    expect(panelSource).toContain("fetchAllProviderUsage({})");
    expect(panelSource).toContain("fetchLocalServers()");
    expect(panelSource).toContain("fetchGitStatus(props.workspaceRoot)");
    expect(panelSource).toContain("async function pollGitStatus()");
    expect(panelSource).toContain("await sleepOnHost(15_000)");
    expect(panelSource).toContain("onOpenViewer={props.onOpenChanges}");
    expect(panelSource).toContain("fetchGitBranches(props.workspaceRoot)");
    expect(panelSource).toContain("await checkoutGitBranch({ cwd: props.workspaceRoot, branch })");
    expect(panelSource).toContain("type: 'thread.meta.update'");
    expect(panelSource).toContain("Switch branches from the worktree environment controls.");
    expect(panelSource).toContain("buildMenuItems(");
    expect(panelSource).toContain("resolvePullActionAvailability({");
    expect(panelSource).toContain("requiresDefaultBranchConfirmation(");
    expect(panelSource).toContain("resolveDefaultBranchActionDialogCopy({");
    expect(panelSource).toContain("await runGitStackedAction({");
    expect(panelSource).toContain("await pullGitBranch(props.workspaceRoot)");
    expect(panelSource).toContain("Git pull failed.");
    expect(panelSource).toContain("await dialogs.confirm(");
    expect(panelSource).toContain("<Dialog");
    expect(panelSource).toContain("open={dialogOpen}");
    expect(panelSource).toContain("Commit message (optional)");
    expect(panelSource).toContain('aria-label="Commit message"');
    expect(panelSource).toContain("aria-invalid={Boolean(error)}");
    expect(panelSource).toContain('accessibility-label="Commit message"');
    expect(panelSource).toContain('accessibility-role="alert"');
    expect(panelSource).toContain("default-value={commitMessage}");
    expect(panelSource).toContain("readonly={running}");
    expect(panelSource).not.toContain("readOnly={running}");
    expect(panelSource).toContain('ariaLabel="Commit and Push"');
    expect(panelSource).toContain(
      "label={running ? progressLabel ?? 'Working…' : 'Commit and Push'}",
    );
    expect(panelSource).toContain("event.kind === 'phase_started'");
    expect(panelSource).toContain("event.kind === 'hook_started'");
    expect(panelSource).toContain("event.kind === 'hook_output'");
    expect(panelSource).toContain("Git actions");
    expect(panelSource).toContain("Pull");
    expect(panelSource).toContain("Unavailable");
    expect(panelSource).toContain("const [excludedFiles, setExcludedFiles]");
    expect(panelSource).toContain("const selectedFiles = files.filter(");
    expect(panelSource).toContain("{ filePaths: selectedFiles.map((file) => file.path) }");
    expect(panelSource).toContain("editingFiles ? 'Done' : 'Edit'");
    expect(panelSource).toContain("allSelected ? 'Exclude all' : 'Include all'");
    expect(panelSource).toContain("EnvironmentGitActionFile--excluded");
    expect(panelSource).toContain("disabled={running || noneSelected || !dialogAction}");
    expect(panelSource).toContain("void runAction('commit', { featureBranch: true })");
    expect(panelSource).toContain("result.branch.status === 'created'");
    expect(panelSource).toContain("createBranchFlowCompleted: true");
    expect(panelSource).toContain("threadId={props.threadId}");
    expect(panelSource).not.toContain("EnvironmentChangesPopup");
    expect(panelSource).not.toContain("EnvironmentChangesFilePath");
    expect(panelSource).toContain("stopLocalServer({");
    expect(panelSource).toContain("const [stopFeedback, setStopFeedback]");
    expect(panelSource).toContain("message: result.message ?? 'Couldn’t stop local server.'");
    expect(panelSource).toContain("message: 'Couldn’t stop local server.'");
    expect(panelSource).toContain("retainLocalServerStopFeedback(");
    expect(panelSource).toContain("{stopFeedback.message}");
    expect(panelSource).toContain('className="EnvironmentLocalServersFeedback"');
    expect(panelSource).toContain('accessibility-role="alert"');
    expect(panelSource).toContain("localServerPrimaryLabel(server)");
    expect(panelSource).toContain("localServerAddressLabel(server)");
    expect(panelSource).toContain("fetchServerConfig()");
    expect(panelSource).toContain("environmentEditorOptions(");
    expect(panelSource).toContain("webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor)");
    expect(panelSource).toContain("await openPathInEditor({");
    expect(panelSource.indexOf("await openPathInEditor({")).toBeLessThan(
      panelSource.indexOf("webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor)"),
    );
    expect(panelSource).toContain("Open in ${activeOption.label}");
    expect(panelSource).toContain('accessibleLabel="Editor view"');
    expect(panelSource).toContain('label="Editor view"');
    expect(routerSource).toContain("onOpenEditorView={enterEditorMode}");
    expect(routerSource).toContain('className="ThreadEditorView"');
    expect(routerSource).toContain(
      "presentationMode={editorSearchActive ? 'editor-search' : 'editor'}",
    );
    expect(panelSource).toContain("fetchGitHubRepository(props.workspaceRoot)");
    expect(panelSource).toContain("platformWindow.openExternal(repository.url)");
    expect(panelSource).toContain("repository.nameWithOwner");
    expect(panelSource).toContain("import githubSvg from '@synara-central-icons/github.svg?raw'");
    expect(panelSource).toContain(
      "import arrowUpRightSvg from '@synara-central-icons/arrow-up-right.svg?raw'",
    );
    expect(panelSource).toContain("Could not open repository");
    expect(panelSource).toContain("fetchGitPullRequestSnapshot({");
    expect(panelSource).toContain("async function pollPullRequest()");
    expect(panelSource).toContain("await sleepOnHost(60_000)");
    expect(panelSource).toContain("setRefreshGeneration((current) => current + 1)");
    expect(panelSource).toContain("summarizePullRequestChecks(checks)");
    expect(panelSource).toContain("summarizePullRequestComments(");
    expect(panelSource).toContain("Conflicts with ${livePullRequest.baseBranch}");
    expect(panelSource).toContain("No unresolved review comments.");
    expect(queriesSource).toContain("lastKnownPr: thread.lastKnownPr ?? null");
    expect(panelSource).toContain("useProjectInstructionsStore.persist.rehydrate()");
    expect(panelSource).toContain("() => applyHydratedInstructions(storedInstructions)");
    expect(panelSource).toContain(
      "The next edit or explicit blur/close flush remains authoritative.",
    );
    expect(panelSource).toContain("state.instructionsByProjectId[props.projectId]");
    expect(panelSource).toContain("setInstructions(props.projectId as never, next)");
    expect(panelSource).toContain("mergeProjectInstructionsIntoThreadNotes({");
    expect(panelSource).toContain("copiedNotesRef.current ?? props.notes");
    expect(panelSource).toContain("Architecture notes, conventions, repo links");
    expect(panelSource).toContain("Append to notepad");
    expect(panelSource).toContain("function EnvironmentPinnedRow(");
    expect(panelSource).toContain("type: 'thread.pinned-message.done.set'");
    expect(panelSource).toContain("type: 'thread.pinned-message.label.set'");
    expect(panelSource).toContain("type: 'thread.pinned-message.remove'");
    expect(panelSource).toContain("displayLabelFor(props.pin, props.messageText)");
    expect(queriesSource).toContain("pinnedMessages: thread.pinnedMessages ?? []");
    expect(queriesSource).toContain("pinnedMessageTextById: Object.fromEntries(");
    expect(transcriptSource).toContain("function scrollToMessage(messageId: string)");
    expect(transcriptSource).toContain("row.kind === 'message' && row.message.id === messageId");
    expect(panelSource).toContain("function EnvironmentMarkerRow(");
    expect(panelSource).toContain("isThreadMarkerAvailable(props.marker, props.messageText)");
    expect(panelSource).toContain("type: 'thread.marker.done.set'");
    expect(panelSource).toContain("type: 'thread.marker.label.set'");
    expect(panelSource).toContain("type: 'thread.marker.remove'");
    expect(queriesSource).toContain("threadMarkers: thread.threadMarkers ?? []");
    expect(panelSource).toContain("onOpenViewer={props.onOpenChanges}");
    expect(diffDockSource).toContain(
      "return fetchWorkingTreeDiff(props.workspaceRoot, diffRequest.scope);",
    );
    expect(diffDockSource).toContain("'working-tree-diff',");
    expect(diffDockSource).toContain("diffSource,");
    expect(diffDockSource).toContain("diffIgnoreWhitespace,");
    expect(diffDockSource).toContain("refreshGeneration === 0 && diffSource === 'workingTree'");
    expect(diffDockSource).toContain("function OpenDiffDock(");
    expect(diffDockSource).not.toContain("enabled: props.open && Boolean(props.workspaceRoot)");
    expect(diffDockSource).toContain("buildPullRequestCodeView(");
    expect(diffDockSource).toContain("<PullRequestCodeComposition");
    expect(diffDockSource).toContain("<ResizableRightPanel");
    expect(diffDockSource).toContain("maxWidth={720}");
    expect(diffDockSource).toContain("resizable={props.presentation === 'dock'}");
    expect(routerSource).toContain("effectiveRightDockWidth !== null");
    expect(routerSource).toContain("open={diffOpen}");
    expect(routerSource).not.toContain('open={diffOpen}\n        presentation="editor"');
    expect(routerSource).toContain("(threadPageWidth || viewportWidth) - effectiveRightDockWidth");
    expect(appStyles).toMatch(
      /\.ThreadPageMain\s*\{[^}]*display:\s*flex;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*height:\s*100%;/s,
    );
    expect(appStyles).toMatch(
      /\.ThreadPage\s*\{[^}]*position:\s*relative;[^}]*overflow:\s*hidden;[^}]*padding:\s*0;/s,
    );
    expect(panelSource).toContain("resolveThreadRecapIdleMs({");
    expect(panelSource).toContain("fetchThreadRecapSummary(props.threadId)");
    expect(panelSource).toContain("prepareThreadRecap(props.threadId)");
    expect(panelSource).toContain(
      ".catch(() => {\n        if (generationRef.current === generation)",
    );
    expect(panelSource).toContain("await generatePreparedThreadRecap({");
    expect(panelSource).toContain("<ChatMarkdown");
    expect(queriesSource).toContain("deriveThreadRecapSource({");
    expect(queriesSource).toContain("thread.latestTurn?.state === 'running'");
    expect(queriesSource).toContain("export async function prepareThreadRecap(");
    expect(queriesSource).toContain("export async function generatePreparedThreadRecap(");
    expect(queriesSource).toContain("generateThreadRecap({");
    expect(queriesSource).toContain("readPersistedThreadRecapCache(webStorage)");
    expect(queriesSource).toContain("persistThreadRecapCache(");
    expect(queriesSource).toContain("webStorage\n  );");
    expect(queriesSource).toContain("upsertPersistedThreadRecap(");
    expect(panelSource).toContain("type: 'thread.meta.update'");
    expect(panelSource).toContain("THREAD_NOTES_MAX_CHARS");
    expect(panelSource).toContain("EnvironmentNotepadInput");
    expect(panelSource).toContain("scheduleSave(0)");
    expect(panelSource).toContain(
      ".catch(() => {\n        if (saveGenerationRef.current !== generation) return;\n        return flushNotes();",
    );
  });

  it("matches the Web overlay footprint and row rhythm", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./environment-panel.css", import.meta.url), "utf8");
    const primitiveStyles = readFileSync(
      new URL("../components/ui/primitives.css", import.meta.url),
      "utf8",
    );
    const source = readFileSync(new URL("./EnvironmentPanel.lynx.tsx", import.meta.url), "utf8");

    expect(styles).toMatch(/\.ThreadHeaderControls\s*\{[^}]*-x-app-region:\s*no-drag;/s);
    expect(styles).toMatch(
      /\.EnvironmentToggle\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*box-sizing:\s*border-box;[^}]*padding:\s*0;[^}]*-x-app-region:\s*no-drag;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentOverlay\s*\{[^}]*right:\s*0;[^}]*flex-direction:\s*column;[^}]*padding:\s*12px;[^}]*transition:[^}]*300ms cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\)/s,
    );
    expect(panelSource).not.toContain("rightInsetPx");
    expect(routerSource).toContain("const effectiveRightDockWidth =");
    expect(routerSource).toContain("rightDockWidth !== null && rightDockWidth > 0");
    expect(routerSource).not.toContain("rightInsetPx={");
    expect(routerSource).toContain("(threadPageWidth || viewportWidth) - effectiveRightDockWidth");
    expect(routerSource).toContain("resolveEnvironmentPanelLayout({");
    expect(routerSource).toContain("bodyState.kind === 'empty'");
    expect(routerSource).toContain(
      "viewportWidth < VIEWPORT_BREAKPOINTS.lg || diffOpen || explorerOpen",
    );
    expect(routerSource).toContain("ThreadPage--environment-docked");
    expect(routerSource).toContain("ThreadPage--environment-floating");
    expect(styles).toContain(".ThreadPage--environment-docked");
    expect(styles).toContain(".ThreadComposerDock");
    expect(styles).toMatch(
      /\.ThreadTranscriptViewport,[^{]*\.ThreadComposerDock\s*\{[^}]*transition:\s*padding-right 300ms cubic-bezier\(0\.32,\s*0\.72,\s*0,\s*1\);/s,
    );
    expect(styles).toMatch(
      /\.ThreadPage--provider-health-visible \.EnvironmentOverlay\s*\{[^}]*top:\s*126px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.ThreadPage--provider-health-visible\s+\.EnvironmentOverlay\s*\{[^}]*top:\s*90px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentSurface\s*\{[^}]*width:\s*288px;[^}]*border-radius:\s*18px;[^}]*box-shadow:\s*0 4px 18px -6px rgba\(13,\s*13,\s*13,\s*0\.07\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.EnvironmentSurface\s*\{[^}]*box-shadow:\s*0 6px 24px -10px rgba\(0,\s*0,\s*0,\s*0\.3\);/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentScroller\s*\{[^}]*width:\s*100%;[^}]*max-height:\s*100%;/s,
    );
    expect(styles).toMatch(/\.EnvironmentContent\s*\{[^}]*gap:\s*2px;[^}]*padding:\s*6px;/s);
    expect(styles).toMatch(
      /\.EnvironmentRow\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*8px;/s,
    );
    for (const className of [
      "EnvironmentToggle",
      "EnvironmentSettings",
      "EnvironmentChangesTrigger",
      "EnvironmentBranchTrigger",
      "EnvironmentGitActionTrigger",
      "EnvironmentGitActionSelectAll",
      "EnvironmentGitActionFile",
      "EnvironmentLocalServersTrigger",
      "EnvironmentEditorTrigger",
      "EnvironmentRepositoryRow",
      "EnvironmentPullRequestMenuTrigger",
      "EnvironmentInstructionsCopy",
      "EnvironmentPinnedAction",
      "EnvironmentDisclosure",
    ]) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-hover,[^}]*\\{[^}]*background-color:\\s*var\\(--color-background-elevated-secondary\\);`,
          "s",
        ),
      );
    }
    expect(styles).toMatch(
      /\.EnvironmentPinnedRow\.ui-hover\s*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentRecapSkeletonLine\s*\{[^}]*background-color:\s*var\(--accent\);/s,
    );
    expect(styles).toMatch(
      /\.ThreadPage--environment-docked \.ThreadTranscriptViewport,[\s\S]*?\.ThreadPage--environment-docked \.ThreadComposerDock\s*\{[^}]*padding-right:\s*312px;/s,
    );
    expect(routerSource).toContain('className="ThreadTranscriptViewport"');
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentLocalServersPopup\s*\{[^}]*width:\s*288px;[^}]*padding:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.LxMenuPopup\.EnvironmentLocalServersPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.EnvironmentLocalServersList\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*overflow-y:\s*scroll;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentChangesAddition\s*\{[^}]*color:\s*var\(--settings-usage-meter-healthy\);/s,
    );
    expect(styles).toMatch(/\.EnvironmentChangesDeletion\s*\{[^}]*color:\s*var\(--destructive\);/s);
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentBranchPopup\s*\{[^}]*width:\s*224px;[^}]*max-height:\s*320px;[^}]*padding:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.LxMenuPopup\.EnvironmentBranchPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.EnvironmentBranchList\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*overflow-y:\s*scroll;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentBranchGroup\s*\{[^}]*flex-direction:\s*column;[^}]*gap:\s*2px;/s,
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.EnvironmentGitActionDialog\s*\{[^}]*width:\s*min\(520px,\s*calc\(100vw - 32px\)\);[^}]*border-radius:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentGitActionPopup\s*\{[^}]*width:\s*240px;[^}]*max-height:\s*320px;[^}]*padding:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentGitActionMenuItem\s*\{[^}]*min-height:\s*28px;[^}]*padding:\s*4px 8px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentGitActionMessage\s*\{[^}]*min-height:\s*72px;[^}]*border-radius:\s*10px;[^}]*background-color:\s*transparent;[^}]*color:\s*var\(--foreground\);/s,
    );
    expect(source).toContain("<CheckboxIndicator checked={allSelected}");
    expect(source).toContain("mixed={!allSelected && !noneSelected}");
    expect(primitiveStyles).toMatch(
      /\.LxCheckboxIndicator--sm\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
    );
    expect(styles).toMatch(/\.EnvironmentGitActionFile--excluded\s*\{[^}]*opacity:\s*0\.55;/s);
    expect(styles).toMatch(
      /\.EnvironmentGitActionFooter\s*\{[^}]*height:\s*auto;[^}]*flex-wrap:\s*wrap;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentLocalServerStop\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*padding:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentEditorPopup\s*\{[^}]*width:\s*176px;[^}]*min-height:\s*0;[^}]*padding:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentEditorOption\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*1px 8px;[^}]*border-radius:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentRecapMarkdown\s*\{[^}]*font-size:\s*var\(--type-composer-editor-size\);[^}]*line-height:\s*var\(--type-composer-editor-line-height\);[^}]*opacity:\s*0\.4;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentRecapSkeletonLine\s*\{[^}]*height:\s*10px;[^}]*border-radius:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentRepositoryRow\s*\{[^}]*width:\s*100%;[^}]*border-radius:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentInstructionsInput\s*\{[^}]*min-height:\s*68px;[^}]*padding:\s*8px 12px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentNotepad\s*\{[^}]*min-height:\s*78px;[^}]*padding:\s*2px 8px 4px;/s,
    );
    expect(styles).toMatch(/\.EnvironmentNotepadInput\s*\{[^}]*min-height:\s*72px;/s);
    expect(styles).toMatch(
      /\.EnvironmentInstructionsCopy\s*\{[^}]*min-height:\s*24px;[^}]*gap:\s*4px;[^}]*padding:\s*0 7px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentPinnedRow\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*6px;/s,
    );
    expect(source).toContain('<CheckboxIndicator checked={done} size="sm" />');
    expect(primitiveStyles).toMatch(
      /\.LxCheckboxIndicator--sm\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s,
    );
    expect(styles).toMatch(
      /\.EnvironmentMarkerSwatch\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*border-radius:\s*999px;/s,
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentPullRequestPopup\s*\{[^}]*width:\s*288px;[^}]*max-height:\s*320px;[^}]*padding:\s*6px;/s,
    );
  });

  it("keeps sections in the Web authority order", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    const renderSource = panelSource.slice(
      panelSource.indexOf('<view className="EnvironmentContent">'),
    );
    const orderedSections = [
      "<EnvironmentChanges",
      "<EnvironmentBranch",
      "<EnvironmentGitAction",
      "<EnvironmentLocalServers",
      "<EnvironmentSectionLabel>Usage",
      "<EnvironmentRepository",
      "<EnvironmentPullRequest",
      "<EnvironmentEditor",
      "<EnvironmentRecap",
      "<EnvironmentPinned",
      "<EnvironmentMarkers",
      "<EnvironmentProjectInstructions",
      "<EnvironmentNotepad",
    ];
    let previousIndex = -1;
    for (const section of orderedSections) {
      const index = renderSource.indexOf(section);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  });

  it("consumes every canonical Environment visibility setting", () => {
    const panelSource = readFileSync(
      new URL("./EnvironmentPanel.lynx.tsx", import.meta.url),
      "utf8",
    );
    expect(panelSource).toContain("readSettingsGeneralProjection(");
    for (const key of [
      "showEnvironmentUsage",
      "showEnvironmentRepository",
      "showEnvironmentPullRequest",
      "showEnvironmentEditor",
      "showEnvironmentRecap",
      "showEnvironmentPinned",
      "showEnvironmentMarkers",
      "showEnvironmentInstructions",
      "showEnvironmentNotepad",
    ]) {
      expect(panelSource).toContain(`visibility.${key}`);
    }
  });

  it("honors and persists the canonical default-open preference", () => {
    const routerSource = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(routerSource).toContain("resolveDefaultEnvironmentPanelOpen({");
    expect(routerSource).toContain("isCenteredEmptyLanding: bodyState.kind === 'empty'");
    expect(routerSource).toContain(
      "settingsDefaultOpen: environmentSettings.environmentPanelDefaultOpen",
    );
    expect(routerSource).toContain("environmentPanelDefaultOpen: open");
    expect(routerSource).toContain("writeSettingsGeneralProjection(");
    expect(routerSource).toContain("Keep the explicit session override.");
    expect(routerSource).toContain("open={environmentPanelLayout.visible}");
    expect(routerSource).toContain("onChange={setEnvironmentVisibility}");
  });
});
