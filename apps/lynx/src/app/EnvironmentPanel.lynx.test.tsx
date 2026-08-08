import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Environment panel', () => {
  it('connects the real thread header toggle and mounted panel', () => {
    const routerSource = readFileSync(
      new URL('./router.tsx', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./EnvironmentPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(routerSource).toContain('<EnvironmentToggle');
    expect(routerSource).toContain('<EnvironmentPanel');
    expect(routerSource).toContain('className="ThreadHeaderControls"');
    expect(routerSource).toContain('ThreadPage--environment-open');
    expect(panelSource).toContain('useLynxInteractiveState({');
    expect(panelSource).toContain('Toggle environment panel');
    expect(panelSource).toContain("import windowSvg from '@synara-central-icons/window.svg?raw'");
  });

  it('uses only sections backed by real current capabilities', () => {
    const panelSource = readFileSync(
      new URL('./EnvironmentPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const transcriptSource = readFileSync(
      new URL('./Transcript.tsx', import.meta.url),
      'utf8'
    );
    const diffDockSource = readFileSync(
      new URL('./DiffDock.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('fetchAllProviderUsage({})');
    expect(panelSource).toContain('fetchLocalServers()');
    expect(panelSource).toContain('fetchGitStatus(props.workspaceRoot)');
    expect(panelSource).toContain('async function pollGitStatus()');
    expect(panelSource).toContain('await sleepOnHost(15_000)');
    expect(panelSource).toContain('file.insertions');
    expect(panelSource).toContain('file.deletions');
    expect(panelSource).toContain('stopLocalServer({');
    expect(panelSource).toContain('localServerPrimaryLabel(server)');
    expect(panelSource).toContain('localServerAddressLabel(server)');
    expect(panelSource).toContain('fetchServerConfig()');
    expect(panelSource).toContain('environmentEditorOptions(');
    expect(panelSource).toContain('webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor)');
    expect(panelSource).toContain('await openPathInEditor({');
    expect(panelSource.indexOf('await openPathInEditor({')).toBeLessThan(
      panelSource.indexOf('webStorage.setItem(LAST_EDITOR_STORAGE_KEY, editor)')
    );
    expect(panelSource).toContain('Open in ${activeOption.label}');
    expect(panelSource).toContain('fetchGitHubRepository(props.workspaceRoot)');
    expect(panelSource).toContain('platformWindow.openExternal(repository.url)');
    expect(panelSource).toContain('repository.nameWithOwner');
    expect(panelSource).toContain(
      "import githubSvg from '@synara-central-icons/github.svg?raw'"
    );
    expect(panelSource).toContain(
      "import arrowUpRightSvg from '@synara-central-icons/arrow-up-right.svg?raw'"
    );
    expect(panelSource).toContain('Could not open repository');
    expect(panelSource).toContain('fetchGitPullRequestSnapshot({');
    expect(panelSource).toContain('async function pollPullRequest()');
    expect(panelSource).toContain('await sleepOnHost(60_000)');
    expect(panelSource).toContain('setRefreshGeneration((current) => current + 1)');
    expect(panelSource).toContain('summarizePullRequestChecks(checks)');
    expect(panelSource).toContain('summarizePullRequestComments(');
    expect(panelSource).toContain('Conflicts with ${livePullRequest.baseBranch}');
    expect(panelSource).toContain('No unresolved review comments.');
    expect(queriesSource).toContain('lastKnownPr: thread.lastKnownPr ?? null');
    expect(panelSource).toContain('useProjectInstructionsStore.persist.rehydrate()');
    expect(panelSource).toContain('state.instructionsByProjectId[props.projectId]');
    expect(panelSource).toContain('setInstructions(props.projectId as never, next)');
    expect(panelSource).toContain('mergeProjectInstructionsIntoThreadNotes({');
    expect(panelSource).toContain('copiedNotesRef.current ?? props.notes');
    expect(panelSource).toContain('Architecture notes, conventions, repo links');
    expect(panelSource).toContain('Append to notepad');
    expect(panelSource).toContain('function EnvironmentPinnedRow(');
    expect(panelSource).toContain("type: 'thread.pinned-message.done.set'");
    expect(panelSource).toContain("type: 'thread.pinned-message.label.set'");
    expect(panelSource).toContain("type: 'thread.pinned-message.remove'");
    expect(panelSource).toContain('displayLabelFor(props.pin, props.messageText)');
    expect(queriesSource).toContain('pinnedMessages: thread.pinnedMessages ?? []');
    expect(queriesSource).toContain('pinnedMessageTextById: Object.fromEntries(');
    expect(transcriptSource).toContain('function scrollToMessage(messageId: string)');
    expect(transcriptSource).toContain("row.kind === 'message' && row.message.id === messageId");
    expect(panelSource).toContain('function EnvironmentMarkerRow(');
    expect(panelSource).toContain('isThreadMarkerAvailable(props.marker, props.messageText)');
    expect(panelSource).toContain("type: 'thread.marker.done.set'");
    expect(panelSource).toContain("type: 'thread.marker.label.set'");
    expect(panelSource).toContain("type: 'thread.marker.remove'");
    expect(queriesSource).toContain('threadMarkers: thread.threadMarkers ?? []');
    expect(panelSource).toContain('onOpenViewer={props.onOpenChanges}');
    expect(diffDockSource).toContain('fetchWorkingTreeDiff(props.workspaceRoot!)');
    expect(diffDockSource).toContain('buildPullRequestCodeView(');
    expect(diffDockSource).toContain('<PullRequestCodeComposition');
    expect(panelSource).toContain('resolveThreadRecapIdleMs({');
    expect(panelSource).toContain('fetchThreadRecapSummary(props.threadId)');
    expect(panelSource).toContain('prepareThreadRecap(props.threadId)');
    expect(panelSource).toContain('await generatePreparedThreadRecap({');
    expect(panelSource).toContain('<ChatMarkdown');
    expect(queriesSource).toContain('deriveThreadRecapSource({');
    expect(queriesSource).toContain("thread.latestTurn?.state === 'running'");
    expect(queriesSource).toContain('export async function prepareThreadRecap(');
    expect(queriesSource).toContain('export async function generatePreparedThreadRecap(');
    expect(queriesSource).toContain('generateThreadRecap({');
    expect(queriesSource).toContain('readPersistedThreadRecapCache(webStorage)');
    expect(queriesSource).toContain('persistThreadRecapCache(');
    expect(queriesSource).toContain('webStorage\n  );');
    expect(queriesSource).toContain('upsertPersistedThreadRecap(');
    expect(panelSource).toContain("type: 'thread.meta.update'");
    expect(panelSource).toContain('THREAD_NOTES_MAX_CHARS');
    expect(panelSource).toContain('EnvironmentNotepadInput');
  });

  it('matches the Web overlay footprint and row rhythm', () => {
    const styles = readFileSync(
      new URL('./environment-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.ThreadHeaderControls\s*\{[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentToggle\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*box-sizing:\s*border-box;[^}]*padding:\s*0;[^}]*-x-app-region:\s*no-drag;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentOverlay\s*\{[^}]*right:\s*0;[^}]*padding:\s*12px;[^}]*transition:[^}]*220ms ease-out/s
    );
    expect(styles).toMatch(
      /\.EnvironmentSurface\s*\{[^}]*width:\s*288px;[^}]*border-radius:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentContent\s*\{[^}]*gap:\s*2px;[^}]*padding:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentRow\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*8px;/s
    );
    expect(styles).toContain('padding-right: 312px;');
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentLocalServersPopup\s*\{[^}]*width:\s*288px;[^}]*padding:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentChangesPopup\s*\{[^}]*width:\s*288px;[^}]*max-height:\s*360px;[^}]*padding:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentLocalServerStop\s*\{[^}]*width:\s*24px;[^}]*height:\s*24px;[^}]*padding:\s*0;/s
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentEditorPopup\s*\{[^}]*width:\s*176px;[^}]*min-height:\s*0;[^}]*padding:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentEditorOption\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*1px 8px;[^}]*border-radius:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentRecapMarkdown\s*\{[^}]*font-size:\s*var\(--type-composer-editor-size\);[^}]*line-height:\s*var\(--type-composer-editor-line-height\);[^}]*opacity:\s*0\.4;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentRecapSkeletonLine\s*\{[^}]*height:\s*10px;[^}]*border-radius:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentRepositoryRow\s*\{[^}]*width:\s*100%;[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentInstructionsInput\s*\{[^}]*min-height:\s*68px;[^}]*padding:\s*8px 12px;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentInstructionsCopy\s*\{[^}]*min-height:\s*24px;[^}]*gap:\s*4px;[^}]*padding:\s*0 7px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentPinnedRow\s*\{[^}]*min-height:\s*26px;[^}]*padding:\s*4px 8px;[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentPinnedCheckbox\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*border-radius:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.EnvironmentMarkerSwatch\s*\{[^}]*width:\s*10px;[^}]*height:\s*10px;[^}]*border-radius:\s*999px;/s
    );
    expect(styles).toMatch(
      /\.LxMenuPopup\.EnvironmentPullRequestPopup\s*\{[^}]*width:\s*288px;[^}]*max-height:\s*320px;[^}]*padding:\s*6px;/s
    );
  });

  it('keeps sections in the Web authority order', () => {
    const panelSource = readFileSync(
      new URL('./EnvironmentPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const renderSource = panelSource.slice(
      panelSource.indexOf('<view className="EnvironmentContent">')
    );
    const orderedSections = [
      '<EnvironmentChanges',
      'label={props.branch',
      '<EnvironmentLocalServers',
      '<EnvironmentSectionLabel>Usage',
      '<EnvironmentRepository',
      '<EnvironmentPullRequest',
      '<EnvironmentEditor',
      '<EnvironmentRecap',
      '<EnvironmentPinned',
      '<EnvironmentMarkers',
      '<EnvironmentProjectInstructions',
      '<EnvironmentNotepad',
    ];
    let previousIndex = -1;
    for (const section of orderedSections) {
      const index = renderSource.indexOf(section);
      expect(index).toBeGreaterThan(previousIndex);
      previousIndex = index;
    }
  });
});
