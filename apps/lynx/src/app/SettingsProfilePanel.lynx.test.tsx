import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Profile fidelity', () => {
  it('routes the real Profile section and fetches canonical local stats', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const profileSource = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'profile',");
    expect(settingsSource).toContain("section === 'profile'");
    expect(settingsSource).toContain('<SettingsProfilePanel />');
    expect(settingsSource).toContain("section !== 'profile'");
    expect(settingsSource).toContain('SettingsContentInner--profile');
    expect(clientSource).toContain("'stats.getProfileStats'");
    expect(clientSource).toContain("'stats.getProfileTokenStats'");
    expect(profileSource).toContain('selectProfileHeatmap');
    expect(profileSource).toContain('selectProfileModelUsage');
    expect(profileSource).toContain('selectProfileTopProvider');
    expect(profileSource).toContain('function formatCompact');
    expect(profileSource).not.toContain('Intl.');
    expect(profileSource).toContain('SettingsProfileStats');
    expect(profileSource).toContain('Copy summary');
    expect(profileSource).toContain("clipboard.writeText(summary)");
    expect(profileSource).toContain('SettingsProfileHeatmap');
    expect(profileSource).toContain('Activity insights');
    expect(profileSource).toContain('Most used plugins');
    expect(profileSource).toContain('Model usage');
  });

  it('matches the Web first-screen profile anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-profile-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsProfile\s*\{[^}]*width:\s*100%;[^}]*gap:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileActions\s*\{[^}]*height:\s*28px;[^}]*justify-content:\s*flex-end;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileAvatar\s*\{[^}]*width:\s*64px;[^}]*height:\s*64px;[^}]*border-radius:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStats\s*\{[^}]*border-radius:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmap\s*\{[^}]*height:\s*136\.5px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapGrid\s*\{[^}]*height:\s*112px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapMonths\s*\{[^}]*height:\s*21\.5px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileColumns\s*\{[^}]*gap:\s*48px;/s
    );
  });
});
