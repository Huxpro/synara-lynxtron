import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings load error semantics', () => {
  it('announces retained query failures without making loading states assertive', () => {
    for (const file of [
      './SettingsProfilePanel.lynx.tsx',
      './SettingsWorktreesPanel.lynx.tsx',
      './SettingsSkillsPanel.lynx.tsx',
      './SettingsArchivedPanel.lynx.tsx',
    ]) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).toContain('accessibility-role="alert"');
    }

    const combinedSource = [
      './SettingsProfilePanel.lynx.tsx',
      './SettingsWorktreesPanel.lynx.tsx',
      './SettingsSkillsPanel.lynx.tsx',
      './SettingsArchivedPanel.lynx.tsx',
    ]
      .map((file) => readFileSync(new URL(file, import.meta.url), 'utf8'))
      .join('\n');

    for (const loadingCopy of [
      'Loading local stats…',
      'Loading managed worktrees…',
      'Scanning skills…',
      'Loading archived threads…',
    ]) {
      const loadingIndex = combinedSource.indexOf(loadingCopy);
      expect(loadingIndex).toBeGreaterThan(-1);
      expect(
        combinedSource.slice(Math.max(0, loadingIndex - 180), loadingIndex)
      ).not.toContain('accessibility-role="alert"');
    }
  });
});
