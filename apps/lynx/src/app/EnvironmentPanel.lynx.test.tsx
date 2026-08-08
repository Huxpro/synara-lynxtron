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

    expect(panelSource).toContain('fetchAllProviderUsage({})');
    expect(panelSource).toContain('fetchLocalServers()');
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
    expect(panelSource).toContain('useProjectInstructionsStore.persist.rehydrate()');
    expect(panelSource).toContain('state.instructionsByProjectId[props.projectId]');
    expect(panelSource).toContain('setInstructions(props.projectId as never, next)');
    expect(panelSource).toContain('mergeProjectInstructionsIntoThreadNotes({');
    expect(panelSource).toContain('copiedNotesRef.current ?? props.notes');
    expect(panelSource).toContain('Architecture notes, conventions, repo links');
    expect(panelSource).toContain('Append to notepad');
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
    expect(panelSource).not.toContain('Changes');
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
  });
});
