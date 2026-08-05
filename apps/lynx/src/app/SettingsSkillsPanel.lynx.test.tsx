import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Skills fidelity', () => {
  it('routes the real Skills section and canonical RPCs', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsSkillsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'skills',");
    expect(settingsSource).toContain("section === 'skills'");
    expect(settingsSource).toContain('<SettingsSkillsPanel />');
    expect(clientSource).toContain("'provider.listSkillsCatalog'");
    expect(panelSource).toContain("queryKey: ['skills-catalog']");
    expect(panelSource).toContain("queryKey: ['server-settings']");
    expect(panelSource).toContain('Synara skills folder');
    expect(panelSource).toContain('No skills found');
  });

  it('optimistically toggles the canonical disabled-skill setting', () => {
    const panelSource = readFileSync(
      new URL('./SettingsSkillsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('disabledNamesRef.current');
    expect(panelSource).toContain('saveQueueRef.current');
    expect(panelSource).toContain('saveOperationRef.current');
    expect(panelSource).toContain('nextDisabledSkillNames({');
    expect(panelSource).toContain('await updateServerSettings({');
    expect(panelSource).toContain('skills: { disabled: [...next] }');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['provider-skills'] })"
    );
    expect(panelSource).toContain('setDisabledNames(previous)');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['server-settings'] })"
    );
  });

  it('matches the Web portable summary and grouped-row anatomy', () => {
    const source = readFileSync(
      new URL('./SettingsSkillsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./settings-skills-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsSkillsPanel\s*\{[^}]*gap:\s*32px;/s
    );
    expect(styles).not.toMatch(
      /\.SettingsSkills(?:PortableRow|Row|EmptyRow)\s*\{[^}]*min-height:/s
    );
    expect(styles).toMatch(
      /\.SettingsSkillsRow\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*gap:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSkillsControl\s*\{[^}]*flex-shrink:\s*0;[^}]*align-items:\s*flex-end;/s
    );
    expect(source).toContain('<SkillProviderStack providers={group.providers} />');
    expect(styles).toMatch(
      /\.SettingsSkillsProviderBadge\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*border-radius:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSkillsProviderBadge \.OpenAIProviderIcon\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SettingsSkillsSource\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
    expect(styles).toMatch(
      /\.SettingsSkillsPath\s*\{[^}]*overflow:\s*hidden;[^}]*text-overflow:\s*ellipsis;[^}]*white-space:\s*nowrap;/s
    );
  });
});
