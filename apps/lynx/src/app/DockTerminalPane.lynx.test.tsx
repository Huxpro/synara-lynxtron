import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Native dock terminal pane', () => {
  it('composes one real PTY surface per terminal tab and keeps inactive sessions mounted', () => {
    const source = readFileSync(
      new URL('./DockTerminalPane.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('selectThreadTerminalState(');
    expect(source).toContain('dockTerminalThreadId(props.threadId');
    expect(source).toContain('terminalState.terminalIds');
    expect(source).toContain('resolvedLayout.normalizedTerminalIds.map');
    expect(source).toContain('const tab = allTabs.find');
    expect(source).toContain('leafTabs.map((tab) => {');
    expect(source).toContain('<EditorSurfaceTab');
    expect(source).toContain('<ThreadTerminal');
    expect(source).toContain('onAddTerminalContext={addTerminalSelectionToChat}');
    expect(source).toContain('addTerminalContext(props.threadId');
    expect(source).toContain('threadId={scopeId}');
    expect(source).toContain('showHeader={false}');
    expect(source).toContain("' DockTerminalPaneSession--hidden'");
    expect(source).toContain('terminalId={tab.id}');
    expect(source).toContain('threadId={scopeId}');
    expect(source).not.toContain('threadId={props.threadId}');
    expect(source).toContain(
      'terminalGroupId === resolvedLayout.resolvedActiveGroupId'
    );
    expect(source).toContain(
      'tab.id === resolvedLayout.resolvedActiveTerminalId'
    );
  });

  it('matches the Electron pane-local and multi-group terminal chrome', () => {
    const source = readFileSync(
      new URL('./DockTerminalPane.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./dock-terminal-pane.css', import.meta.url),
      'utf8'
    );
    expect(styles).toMatch(
      /\.DockTerminalPaneToolbar\s*\{[^}]*height:\s*36px;[^}]*min-height:\s*36px;[^}]*padding:\s*0 6px;/s
    );
    expect(styles).toMatch(
      /\.DockTerminalPaneToolbarButton\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/s
    );
    expect(source).toContain('label="New terminal tab"');
    expect(source).toContain('label="Move to its own terminal tab"');
    expect(source).toContain('newTerminalGroup(scopeId, terminalId)');
    expect(source).toContain('const leafTabs = node.terminalIds');
    expect(source).toContain('addTerminalTab(leafActiveId');
    expect(source).toContain('label="Close active terminal tab"');
    expect(source).toContain('label="Split right"');
    expect(source).toContain('label="Split down"');
    expect(source).toContain('splitTerminalRight(scopeId, terminalId)');
    expect(source).toContain('splitTerminalDown(scopeId, terminalId)');
    expect(source).toContain(
      'renderLayout(terminalGroup.layout, terminalGroup.id)'
    );
    expect(source).toContain(' DockTerminalPaneGroupBody--hidden');
    expect(source).toContain('tabs.length >= MAX_TERMINALS_PER_GROUP');
    expect(source).toContain('resolveTerminalVisualIdentity({');
    expect(source).toContain('deriveTerminalOutputIdentity(event.data)');
    expect(source).toContain('defaultTerminalTitleForCliKind(event.cliKind)');
    expect(source).toContain('<ActivityIndicator state={identity.state} />');
    expect(styles).toContain('.DockTerminalPaneActivity--running');
    expect(styles).toContain('.DockTerminalPaneActivity--attention');
    expect(styles).toContain('.DockTerminalPaneSplit--horizontal');
    expect(styles).toContain('.DockTerminalPaneSplit--vertical');
    expect(source).toContain('session.groupId');
    expect(source).toContain('moveLynxTerminalSplitResize({ event, session })');
    expect(source).toContain('registerLynxTerminalSplitTap({');
    expect(source).toContain('equalizeSplitOnSecondPointerDown({');
    expect(source).toContain('bindmousedown={(event: LynxTerminalSplitPointerEvent');
    expect(source).toContain('bindtouchstart={(event: LynxTerminalSplitPointerEvent) => {');
    expect(source).not.toContain('bindtap={() => {\n                    const handleKey = node.id');
    expect(source).toContain('node.children.map(() => 1)');
    expect(source).toContain('bindlayoutchange=');
    expect(source).toContain('className="DockTerminalPaneSplitResizeOverlay"');
    expect(source).toContain('bindmouseenter={() => setHoveredSplitHandle');
    expect(source).toContain("' ui-hover' : ''");
    expect(styles).toContain('.DockTerminalPaneSplitHandle--horizontal');
    expect(styles).toContain('.DockTerminalPaneSplitHandle--vertical');
    expect(source).toContain('resolvedTerminalGroups.length > 1');
    expect(source).toContain('className="DockTerminalPaneGroupTab"');
    expect(source).toContain('label="New terminal"');
    expect(source).toContain('newTerminalGroup(scopeId');
    expect(source).toContain("setCloseQueuePurpose('group')");
    expect(styles).toContain('.DockTerminalPaneGroupScroller');
  });

  it('persists dock terminal ownership and metadata in the canonical store', () => {
    const source = readFileSync(
      new URL('./DockTerminalPane.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain("from '@synara-web/terminalStateStore'");
    expect(source).toContain("from '@synara-web/lib/dockTerminalScope'");
    expect(source).toContain('openTerminalThreadPage(scopeId');
    expect(source).toContain('newTerminalTab(scopeId, targetTerminalId');
    expect(source).toContain('setActiveTerminal(scopeId, id)');
    expect(source).toContain('closeTerminal(scopeId, id)');
    expect(source).toContain('setTerminalMetadata(scopeId, id');
    expect(source).toContain('setTerminalActivity(scopeId, id');
    expect(source).toContain('flushTerminalStatePersistence()');
    expect(source).not.toContain('shellSetTerminalSearchEnabled');
  });
});
