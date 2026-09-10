import { describe, expect, it, rs } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { ThreadRightDockHost } from './ThreadRightDockHost.lynx';

describe('Native stable right dock host', () => {
  it('owns one resize shell and renders pane content below one tab strip', () => {
    render(
      <ThreadRightDockHost
        availableWidth={1280}
        onWidthChange={rs.fn()}
        open
        tabs={<text>Diff Explorer</text>}
      >
        <view className="HostedPane" />
      </ThreadRightDockHost>
    );

    expect(elementTree.root?.querySelectorAll('.ThreadRightDockHost')).toHaveLength(1);
    expect(elementTree.root?.querySelectorAll('.RightPanelResizeSash')).toHaveLength(1);
    expect(elementTree.root?.querySelector('.ThreadRightDockHostBody')).not.toBeNull();
    expect(elementTree.root?.querySelector('.HostedPane')).not.toBeNull();
  });

  it('keeps Diff and Explorer in hosted content mode from one router owner', () => {
    const router = readFileSync(new URL('./router.tsx', import.meta.url), 'utf8');
    const styles = readFileSync(
      new URL('./thread-right-dock-host.css', import.meta.url),
      'utf8'
    );

    expect(router).toContain('<ThreadRightDockHost');
    expect(router).toContain('presentation="hosted"');
    expect(router).toContain('<ExplorerDock');
    expect(router).toContain('hosted');
    expect(router).toContain('ThreadRightDockTerminalPane');
    expect(router).toContain('terminalHydrated');
    expect(router).toContain('closeRequestVersion={terminalCloseRequestVersion}');
    expect(router).toContain('if (!terminalHydrated)');
    expect(router).toContain(
      "rightDockState.open && activeRightDockPane?.kind === 'diff'"
    );
    expect(router).toContain('props.initialDiffOpen && !initialEditorOpen');
    expect(router).toContain('diffTurnId: props.initialDiffTurnId');
    expect(router).toContain('diffFilePath: props.initialDiffFilePath');
    expect(router).toContain(
      'activePane?.diffTurnId ? `turn:${activePane.diffTurnId}` : undefined'
    );
    expect(router).toContain(
      'initialSelectedFilePath={activePane?.diffFilePath}'
    );
    expect(router).not.toContain('diffDockWidth');
    expect(router).not.toContain('explorerDockWidth');
    expect(styles).toMatch(
      /\.ThreadRightDockHostBody > \.DiffDock--hosted,[\s\S]*?\.ExplorerDock--hosted\s*\{[^}]*width:\s*100%;[^}]*transition:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.ThreadPage > \.ThreadRightDockHost\s*\{[^}]*left:\s*0;[^}]*top:\s*92px;[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*max-width:\s*none;/s
    );
    expect(router).toContain(
      'viewportWidth < VIEWPORT_BREAKPOINTS.md'
    );
    expect(router).not.toContain(
      'availableDockWidth < VIEWPORT_BREAKPOINTS.md'
    );
    expect(router).toContain('rightDockState.open &&');
    expect(router).toContain('Boolean(rightDockState.activePaneId) &&');
    expect(router).toContain('!rightDockOverlaysMainContent');
  });
});
