import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Advanced fidelity', () => {
  it('routes the real Advanced section and canonical capabilities', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsAdvancedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const configSource = readFileSync(
      new URL('../../lynx.config.ts', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'advanced',");
    expect(settingsSource).toContain("section === 'advanced'");
    expect(settingsSource).toContain('<SettingsAdvancedPanel />');
    expect(clientSource).toContain("'shell.openInEditor'");
    expect(clientSource).toContain("'orchestration.repairState'");
    expect(configSource).toContain("'process.env.SYNARA_APP_VERSION'");
    expect(panelSource).toContain('Keybindings');
    expect(panelSource).toContain('Recovery tools');
    expect(panelSource).toContain('Version');
    expect(panelSource).not.toContain('View release history');
  });

  it('uses host confirmation and refreshes state after repair', () => {
    const panelSource = readFileSync(
      new URL('./SettingsAdvancedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('await dialogs.confirm(');
    expect(panelSource).toContain('await repairSynaraState()');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] })"
    );
    expect(panelSource).toContain('await openPathInEditor({ cwd: path, editor })');
    expect(panelSource).toContain('No available editors found.');
    expect(panelSource).toContain('useLynxDisclosurePresence(');
    expect(panelSource).toContain('disclosureContentClassName(');
    expect(panelSource).toContain('disclosureChevronClassName(');
    expect(panelSource).toContain('aria-expanded={showRecoveryTools}');
    expect(panelSource).toContain("'SettingsAdvancedRecoveryChevron'");
  });

  it('matches the Web developer-tools and About row anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-advanced-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsAdvancedPanel\s*\{[^}]*gap:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRow\s*\{[^}]*min-height:\s*84px;[^}]*justify-content:\s*space-between;[^}]*gap:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRow--keybindings\s*\{[^}]*min-height:\s*104px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDetails\s*\{[^}]*margin-top:\s*12px;[^}]*padding:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDisclosure\s*\{[^}]*margin-top:\s*12px;[^}]*padding-top:\s*12px;[^}]*border-top:\s*1px solid var\(--settings-project-border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryTrigger\s*\{[^}]*min-height:\s*20px;[^}]*justify-content:\s*space-between;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDetails\s*\{[^}]*border-radius:\s*10px;/s
    );
  });
});
