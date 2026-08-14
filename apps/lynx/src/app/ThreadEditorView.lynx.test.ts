import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('Lynx Editor view', () => {
  it('routes the Environment Editor view row into a real editor composition', () => {
    const routerSource = source('./router.tsx');
    expect(routerSource).toContain('onOpenEditorView={enterEditorMode}');
    expect(routerSource).toContain('className="ThreadEditorView"');
    expect(routerSource).toContain('className="ThreadEditorActivityRail"');
    expect(routerSource).toContain('presentationMode="editor"');
    expect(routerSource).toContain('onClick={exitEditorMode}');
  });

  it('reuses the real explorer preview beside the live chat rail', () => {
    const routerSource = source('./router.tsx');
    expect(routerSource).toContain('className="ThreadEditorCenter"');
    expect(routerSource).toContain('className="ThreadEditorChat"');
    expect(routerSource).toContain('explorerFileSyntaxHighlight');
    expect(routerSource).toContain('onSelectPath={onExplorerSelectPath}');
    expect(routerSource).toContain('{chatBody}');
    expect(routerSource).toContain(
      'storeEditorViewState(threadId, {\n      centerMode: editorCenterMode'
    );
  });

  it('reuses the real Changes renderer as an Editor activity mode', () => {
    const routerSource = source('./router.tsx');
    const appStyles = source('./App.css');
    expect(routerSource).toContain(
      "readEditorViewState(threadId)?.centerMode ?? 'file'"
    );
    expect(routerSource).toContain('accessibility-label="Changes"');
    expect(routerSource).toContain("setEditorCenterMode('diff')");
    expect(routerSource).toContain('<DiffDock');
    expect(routerSource).toContain(
      'initialDiff={initialWorkingTreeDiff ?? undefined}'
    );
    expect(routerSource).toContain('presentation="editor"');
    expect(routerSource).toContain(
      'workspaceRoot={currentThread?.workspaceRoot ?? null}'
    );
    expect(routerSource).toContain('<DiffDock');
    const diffDockSource = source('./DiffDock.lynx.tsx');
    expect(diffDockSource).toContain(
      "props.presentation === 'editor' ? null : []"
    );
    expect(diffDockSource).toContain(
      "resizable={props.presentation === 'dock'}"
    );
    expect(diffDockSource).toContain(
      "view.kind === 'files' && view.files[0] ? [view.files[0].key] : []"
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorChanges\s+\.DiffDock\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%;/s
    );
  });

  it('matches the Web authority rail boundaries', () => {
    const appStyles = source('./App.css');
    const explorerStyles = source('./explorer-dock.css');
    expect(appStyles).toMatch(
      /\.ThreadEditorActivityRail\s*\{[^}]*width:\s*48px;[^}]*min-width:\s*48px;/s
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorChat\s*\{[^}]*width:\s*384px;[^}]*min-width:\s*320px;/s
    );
    expect(explorerStyles).toMatch(
      /\.ExplorerDock--editor\s+\.ExplorerDockSidebar\s*\{[^}]*width:\s*224px;[^}]*min-width:\s*224px;/s
    );
  });

  it('supports deterministic Web and Native startup verification', () => {
    const appSource = source('./App.tsx');
    const webHostSource = source('../main/web/web-host.ts');
    const desktopSource = source('../main/desktop/shellRuntime.ts');
    expect(appSource).toContain(
      'const initialEditorOpen = initData.initialEditorOpen === true'
    );
    expect(webHostSource).toContain("get('editor') === 'open'");
    expect(webHostSource).toContain("get('editorMode') === 'diff'");
    expect(appSource).toContain(
      "await fetchWorkingTreeDiff(summary.workspaceRoot).catch("
    );
    expect(desktopSource).toContain(
      "initialEditorOpen: url.searchParams.get('editor') === 'open'"
    );
    expect(desktopSource).toContain(
      "url.searchParams.get('editorMode') === 'diff'"
    );
  });
});
