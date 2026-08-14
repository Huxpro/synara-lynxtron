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
    const editorStateSource = source('../../../web/src/editorViewState.ts');
    const webEditorSource = source(
      '../../../web/src/components/EditorWorkspaceView.tsx'
    );
    expect(routerSource).toContain(
      "editorChatOpen ? '' : ' ThreadEditorCenter--chat-hidden'"
    );
    expect(routerSource).toContain(
      "editorChatOpen ? '' : ' ThreadEditorChat--hidden'"
    );
    expect(routerSource).toContain('explorerFileSyntaxHighlight');
    expect(routerSource).toContain('onSelectPath={onExplorerSelectPath}');
    expect(routerSource).toContain('{chatBody}');
    expect(editorStateSource).toContain(
      'export function readEditorChatPaneVisible()'
    );
    expect(editorStateSource).toContain(
      'export function storeEditorChatPaneVisible(visible: boolean)'
    );
    expect(webEditorSource).toContain('readEditorChatPaneVisible()');
    expect(webEditorSource).toContain('storeEditorChatPaneVisible(next)');
    expect(routerSource).toContain(
      'initialEditorChatOpen ?? readEditorChatPaneVisible()'
    );
    expect(routerSource).toContain(
      "{editorChatOpen ? 'Hide chat' : 'Show chat'}"
    );
    expect(routerSource).toContain('storeEditorChatPaneVisible(next)');
    expect(routerSource).toContain('ThreadEditorChat--hidden');
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
    expect(routerSource).toContain(
      'initialSelectedFilePath={explorerSelectedPath}'
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
      "{props.presentation === 'dock' ? ("
    );
    expect(diffDockSource).toContain(
      '(selectedFile ? [selectedFile.key] : [])'
    );
    expect(diffDockSource).toContain('className="DiffDockFileSidebar"');
    expect(diffDockSource).toContain(
      'emptyLabel="No working tree changes."'
    );
    expect(diffDockSource).toContain('<EditorDiffFileRow');
    expect(diffDockSource).toContain('files: [selectedFile],');
    expect(diffDockSource).toContain('setSelectedFilePath(file.path)');
    expect(appStyles).toMatch(
      /\.ThreadEditorChanges\s+\.DiffDock\s*\{[^}]*position:\s*relative;[^}]*width:\s*100%;[^}]*height:\s*100%;/s
    );
    const diffDockStyles = source('./diff-dock.css');
    expect(diffDockStyles).toMatch(
      /\.DiffDockFileSidebar\s*\{[^}]*width:\s*224px;[^}]*min-width:\s*224px;/s
    );
    expect(diffDockStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorChanges\s+\.DiffDockFileSidebar,[\s\S]*?width:\s*100%;[\s\S]*?height:\s*176px;/s
    );
  });

  it('matches the Web authority rail boundaries', () => {
    const appStyles = source('./App.css');
    const explorerStyles = source('./explorer-dock.css');
    expect(appStyles).toMatch(
      /\.ThreadEditorActivityRail\s*\{[^}]*width:\s*48px;[^}]*min-width:\s*48px;/s
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorProject\s*\{[^}]*white-space:\s*nowrap;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorPath,[\s\S]*?\.SliceRoot--viewport-medium\s+\.ThreadEditorModeLabel\s*\{[^}]*display:\s*none;/s
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorChat\s*\{[^}]*width:\s*384px;[^}]*min-width:\s*320px;/s
    );
    expect(explorerStyles).toMatch(
      /\.ExplorerDock--editor\s+\.ExplorerDockSidebar\s*\{[^}]*width:\s*224px;[^}]*min-width:\s*224px;/s
    );
    expect(explorerStyles).toMatch(
      /\.SliceRoot--viewport-compact[\s\S]*?\.ExplorerDock--editor[\s\S]*?\.ExplorerDockBody,[\s\S]*?flex-direction:\s*column;/s
    );
    expect(explorerStyles).toMatch(
      /\.SliceRoot--viewport-compact[\s\S]*?\.ExplorerDock--editor[\s\S]*?\.ExplorerDockSidebar,[\s\S]*?width:\s*100%;[\s\S]*?min-width:\s*0;[\s\S]*?height:\s*176px;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorBody,[\s\S]*?grid-template-columns:\s*48px minmax\(0,\s*1fr\);[\s\S]*?grid-template-rows:\s*minmax\(0,\s*5fr\) minmax\(0,\s*3fr\);/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorActivityRail,[\s\S]*?grid-column:\s*1;[\s\S]*?grid-row:\s*1\s*\/\s*3;/s
    );
    expect(appStyles).not.toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorActivityRail,[^}]*display:\s*none;/s
    );
    expect(appStyles).toMatch(
      /\.ThreadEditorChat--hidden\s*\{[^}]*display:\s*none;/s
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--viewport-compact\s+\.ThreadEditorCenter--chat-hidden,[\s\S]*?grid-row:\s*1\s*\/\s*3;/s
    );
  });

  it('supports deterministic Web and Native startup verification', () => {
    const appSource = source('./App.tsx');
    const diffDockSource = source('./DiffDock.lynx.tsx');
    const webHostSource = source('../main/web/web-host.ts');
    const desktopSource = source('../main/desktop/shellRuntime.ts');
    expect(appSource).toContain(
      'const initialEditorOpen = initData.initialEditorOpen === true'
    );
    expect(webHostSource).toContain("get('editor') === 'open'");
    expect(webHostSource).toContain("get('editorMode') === 'diff'");
    expect(webHostSource).toContain("get('editorChat') === 'hidden'");
    expect(appSource).toContain('await fetchWorkingTreeDiff(');
    expect(appSource).toContain('await fetchGitBranches(summary.workspaceRoot)');
    expect(appSource).toContain(
      "'Changes are unavailable because this workspace is not a Git repository.'"
    );
    expect(diffDockSource).toContain('enabled: !props.unavailableLabel');
    expect(diffDockSource).toContain(
      '<text className="DiffDockStateText">{props.unavailableLabel}</text>'
    );
    expect(desktopSource).toContain(
      "initialEditorOpen: url.searchParams.get('editor') === 'open'"
    );
    expect(desktopSource).toContain(
      "url.searchParams.get('editorMode') === 'diff'"
    );
  });
});
