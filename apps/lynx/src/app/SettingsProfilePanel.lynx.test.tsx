import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  heatmapColumns,
  heatmapMonthLabels,
} from './SettingsProfilePanel.lynx';

describe('Settings Profile fidelity', () => {
  it('aligns heatmap cells to weekday slots and month labels to week columns', () => {
    const cells = [
      { day: '2026-01-07', count: 0, weekday: 3, intensity: 0 },
      { day: '2026-01-08', count: 0, weekday: 4, intensity: 0 },
      { day: '2026-01-09', count: 0, weekday: 5, intensity: 0 },
      { day: '2026-01-10', count: 0, weekday: 6, intensity: 0 },
      { day: '2026-01-11', count: 0, weekday: 0, intensity: 0 },
    ] as const;

    const columns = heatmapColumns(cells);

    expect(columns).toHaveLength(2);
    expect(columns[0]?.slice(0, 3).map((slot) => slot.kind)).toEqual([
      'pad',
      'pad',
      'pad',
    ]);
    expect(
      columns[0]
        ?.filter(
          (
            slot
          ): slot is Extract<
            NonNullable<(typeof columns)[number]>[number],
            { readonly kind: 'cell' }
          > => slot.kind === 'cell'
        )
        .map((slot) => slot.cell.day)
    ).toEqual(['2026-01-07', '2026-01-08', '2026-01-09', '2026-01-10']);
    expect(heatmapMonthLabels(columns)).toEqual(['Jan', '']);
  });

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
    const source = readFileSync(
      new URL('./SettingsProfilePanel.lynx.tsx', import.meta.url),
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
    expect(source).toContain('className="SettingsProfileIdentityCopy"');
    expect(styles).toMatch(
      /\.SettingsProfileIdentityCopy\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*center;[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileAvatarText\s*\{[^}]*font-size:\s*20px;[^}]*line-height:\s*28px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileName\s*\{[^}]*font-size:\s*24px;[^}]*line-height:\s*32px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStats\s*\{[^}]*border-radius:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileStatValue,\s*\.SettingsProfileStatLabel\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmap\s*\{[^}]*height:\s*136\.5px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapGrid\s*\{[^}]*height:\s*123\.5px;[^}]*gap:\s*3px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapCell\s*\{[^}]*border-radius:\s*5px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapMonths\s*\{[^}]*height:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapMonth\s*\{[^}]*font-size:\s*10px;[^}]*line-height:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileHeatmapCell--pad\s*\{[^}]*background-color:\s*transparent;[^}]*opacity:\s*1;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileColumns\s*\{[^}]*gap:\s*48px;/s
    );
    expect(source).toContain('<ProfileProviderIcon provider={entry.provider} />');
    expect(source).toContain('hasLynxProviderIcon(props.provider)');
    expect(styles).toMatch(
      /\.SettingsProfileModelIdentity\s*\{[^}]*flex:\s*1;[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SettingsProfileModelIdentity \.OpenAIProviderIcon,\s*\.SettingsProfileProviderFallback\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
  });
});
