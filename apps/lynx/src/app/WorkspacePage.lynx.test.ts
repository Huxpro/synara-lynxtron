import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('Lynx workspace surface', () => {
  it('rehydrates the shared workspace identity after the Lynx storage mirror', () => {
    const appSource = source('./App.tsx');
    expect(appSource).toContain('useWorkspaceStore.persist.rehydrate()');
    expect(appSource).toContain('useTerminalStateStore.persist.rehydrate()');
    expect(appSource.indexOf('await hydrateStorage()')).toBeLessThan(
      appSource.indexOf('useWorkspaceStore.persist.rehydrate()')
    );
    expect(appSource.indexOf('await hydrateStorage()')).toBeLessThan(
      appSource.indexOf('useTerminalStateStore.persist.rehydrate()')
    );
  });

  it('parses and renders workspace routes without falling through to chat', () => {
    const routerSource = source('./router.tsx');
    expect(routerSource).toContain(
      "pathname: '/workspace/$workspaceId'"
    );
    expect(routerSource).toContain("pathname: '/workspace'");
    expect(routerSource).toContain(
      "route.pathname === '/workspace/$workspaceId'"
    );
    expect(routerSource).toContain('<WorkspacePage');
    expect(routerSource).toContain('studioSettings.showWorkspaceSection');
  });

  it('uses the shared workspace store and a host-backed terminal', () => {
    const pageSource = source('./WorkspacePage.lynx.tsx');
    const pageStyles = source('./workspace-page.css');
    expect(pageSource).toContain(
      "from '@synara-web/workspaceStore'"
    );
    expect(pageSource).toContain('workspaceThreadId(workspace.id)');
    expect(pageSource).toContain('presentationMode="workspace"');
    expect(pageSource).toContain('workspaceTerminalIdsForPreset');
    expect(pageSource).toContain('terminalId={terminalId}');
    expect(pageSource).toContain('active={terminalIndex === 0}');
    expect(pageSource).toContain('aria-label="Workspace settings"');
    expect(pageSource).toContain('<Dialog open={settingsOpen}');
    expect(pageSource).toContain('<DialogTitle>Workspace settings</DialogTitle>');
    expect(pageSource).toContain('initialWorkspaceSettingsOpen === true');
    expect(pageSource).toContain('setWorkspaceLayoutPreset(');
    expect(pageSource).toContain('autoOpen');
    expect(pageSource).toContain('WORKSPACE_LAYOUT_PRESETS.map');
    expect(pageSource).toContain('setWorkspaceLayoutPreset(');
    expect(pageSource).toContain(
      'WorkspaceTerminalGrid--${workspace.layoutPresetId}'
    );
    expect(pageSource).toContain(
      "terminalIndex === 0 ? ' WorkspaceTerminalPane--primary' : ''"
    );
    expect(pageStyles).toContain(
      '.WorkspaceTerminalGrid--top-main .WorkspaceTerminalPane--primary'
    );
    expect(pageStyles).toContain(
      '.WorkspaceTerminalGrid--left-main .WorkspaceTerminalPane--primary'
    );
    expect(pageStyles).not.toContain('.WorkspaceTerminalPane:first-child');
    expect(pageSource).toContain('deleteWorkspaceWithTerminalCleanup({');
    expect(pageSource).toContain('terminalIds,');
    expect(pageSource).toContain('closeTerminal: platformTerminal.close');
    expect(pageSource).toContain('writeTerminalExit: platformTerminal.write');
  });

  it('preserves compact title space with accessible icon actions', () => {
    const pageSource = source('./WorkspacePage.lynx.tsx');
    const pageStyles = source('./workspace-page.css');

    expect(pageSource).toContain('aria-label="New terminal"');
    expect(pageSource).toContain('aria-label="Workspace settings"');
    expect(pageSource).toContain('aria-label="Delete workspace"');
    expect(pageSource).toContain('className="WorkspacePageTitleRow"');
    expect(pageSource).toContain('className="WorkspacePageActions"');
    expect(pageStyles).not.toContain('display: contents');
    expect(pageStyles).toMatch(
      /\.WorkspacePageActions\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*row;/s
    );
    expect(pageSource.match(/className="WorkspacePageHeaderAction"/g)).toHaveLength(
      3
    );
    expect(pageSource.match(/WorkspacePageHeaderActionText/g)).toHaveLength(3);
    expect(
      pageSource.match(/color={svgColors.foreground80}/g)
    ).toHaveLength(3);
    expect(pageStyles).toMatch(
      /\.WorkspacePageTitleButton\s*\{[^}]*min-width:\s*0;[^}]*flex-shrink:\s*1;/s
    );
    expect(pageStyles).toMatch(
      /\.WorkspacePageTitleButton \.LxButton__text\s*\{[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-compact \.WorkspacePageHeaderAction\s*\{[^}]*width:\s*28px;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-compact \.WorkspacePageHeaderActionText\s*\{[^}]*display:\s*none;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-compact \.WorkspacePageHeader,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.WorkspacePageHeader\s*\{[^}]*height:\s*92px;[^}]*flex-direction:\s*column;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-compact \.WorkspacePageTitleRow,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.WorkspacePageTitleRow\s*\{[^}]*height:\s*46px;[^}]*padding-left:\s*180px;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-compact \.WorkspacePageActions,[\s\S]*?\.SliceRoot--viewport-medium\s+\.AppMain--sidebar-closed\s+\.WorkspacePageActions\s*\{[^}]*height:\s*46px;[^}]*justify-content:\s*flex-end;/s
    );
    expect(pageStyles).not.toMatch(
      /\.SliceRoot--viewport-medium[\s\S]*?\.WorkspacePageHeaderActionText\s*\{[^}]*display:\s*none;/s
    );
  });

  it('preserves the workspace settings title and scroll owner at short heights', () => {
    const pageStyles = source('./workspace-page.css');

    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.WorkspaceSettingsDialog\s+>\s+\.LxDialogTitle\s*\{[^}]*flex-shrink:\s*0;[^}]*min-height:\s*21px;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.WorkspaceSettingsDialog\s+>\s+\.LxDialogDescription\s*\{[^}]*display:\s*none;/s
    );
    expect(pageStyles).toMatch(
      /\.SliceRoot--viewport-short-height \.WorkspaceSettingsPanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*margin-top:\s*8px;/s
    );
  });

  it('wires the optional workspace sidebar surface and create action', () => {
    const sidebarSource = source(
      '../components/sidebar/Sidebar.lynx.tsx'
    );
    expect(sidebarSource).toContain(
      "isOnWorkspace: activePath === '/workspace'"
    );
    expect(sidebarSource).toContain('initialSortSettings.showWorkspaceSection');
    expect(sidebarSource).toContain('onCreateWorkspace={() => {');
    expect(sidebarSource).toContain('activeWorkspaceId === workspace.id');
    expect(sidebarSource).toContain(
      '(state) => state.reorderWorkspace'
    );
    expect(sidebarSource).toContain(
      'reorderWorkspace(workspace.id, workspaceIndex - 1)'
    );
    expect(sidebarSource).toContain(
      'reorderWorkspace(workspace.id, workspaceIndex + 1)'
    );
    expect(sidebarSource).toContain(
      'className="AppSidebarWorkspaceOrderIcon AppSidebarWorkspaceOrderIcon--up"'
    );
    expect(sidebarSource).toContain(
      'className="AppSidebarWorkspaceOrderIcon"'
    );
    expect(sidebarSource).not.toContain('>\n                      ↑\n');
    expect(sidebarSource).not.toContain('>\n                      ↓\n');
  });
});
