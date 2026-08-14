import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

function source(relativePath: string): string {
  return readFileSync(new URL(relativePath, import.meta.url), 'utf8');
}

describe('Lynx workspace surface', () => {
  it('rehydrates the shared workspace identity after the Lynx storage mirror', () => {
    const appSource = source('./App.tsx');
    expect(appSource).toContain('useWorkspaceStore.persist.rehydrate()');
    expect(appSource.indexOf('await hydrateStorage()')).toBeLessThan(
      appSource.indexOf('useWorkspaceStore.persist.rehydrate()')
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
    expect(pageSource).toContain(
      "from '@synara-web/workspaceStore'"
    );
    expect(pageSource).toContain('workspaceThreadId(workspace.id)');
    expect(pageSource).toContain('presentationMode="workspace"');
    expect(pageSource).toContain('workspaceTerminalIdsForPreset');
    expect(pageSource).toContain('terminalId={terminalId}');
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
    expect(pageSource).toContain('deleteWorkspaceWithTerminalCleanup({');
    expect(pageSource).toContain('terminalIds,');
    expect(pageSource).toContain('closeTerminal: platformTerminal.close');
    expect(pageSource).toContain('writeTerminalExit: platformTerminal.write');
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
  });
});
