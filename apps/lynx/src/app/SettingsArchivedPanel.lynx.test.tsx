import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Archived fidelity', () => {
  it('routes a real archived panel backed by the shell snapshot', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const queriesSource = readFileSync(
      new URL('./queries.ts', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsArchivedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'archived',");
    expect(settingsSource).toContain("section === 'archived'");
    expect(settingsSource).toContain('<SettingsArchivedPanel />');
    expect(queriesSource).toContain('readonly archivedAt?: string | null;');
    expect(queriesSource).toContain('readonly archivedThreads:');
    expect(queriesSource).toContain('createThreadShellsSelector()(normalized)');
    expect(panelSource).toContain("queryKey: ['sidebar-snapshot']");
    expect(panelSource).toContain('snapshotQuery.data?.archivedThreads');
    expect(panelSource).toContain('No archived threads');
    expect(panelSource).toContain(
      'Archived threads will appear here and can be restored to the sidebar.'
    );
  });

  it('wires restore through the canonical command and invalidates the snapshot', () => {
    const panelSource = readFileSync(
      new URL('./SettingsArchivedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('dispatchSynaraCommand(');
    expect(panelSource).toContain('createUnarchiveCommand({');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] })"
    );
    expect(panelSource).toContain('Restore ${thread.title}');
    expect(panelSource).not.toContain('Delete');
  });

  it('matches the Web empty-state and list-row anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-archived-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsArchivedEmpty,[^}]*\.SettingsArchivedState\s*\{[^}]*padding:\s*40px 20px;[^}]*border:\s*1px dashed var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsArchivedEmptyIconShell\s*\{[^}]*width:\s*44px;[^}]*height:\s*44px;[^}]*border-radius:\s*22px;/s
    );
    expect(styles).toMatch(
      /\.SettingsArchivedRow\s*\{[^}]*justify-content:\s*space-between;[^}]*gap:\s*16px;/s
    );
  });
});
