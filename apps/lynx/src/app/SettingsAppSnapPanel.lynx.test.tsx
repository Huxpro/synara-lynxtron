import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings AppSnap capability fidelity', () => {
  it('routes AppSnap and states the real unavailable host boundary', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsAppSnapPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'appsnap',");
    expect(settingsSource).toContain("section === 'appsnap'");
    expect(settingsSource).toContain('<SettingsAppSnapPanel />');
    expect(panelSource).toContain(
      'AppSnap requires the Synara desktop app on macOS.'
    );
    expect(panelSource).toContain(
      'runtime does not expose the screen-capture, permission, or global'
    );
    expect(panelSource).toContain('device until you send the message.');
    expect(panelSource).toContain('in the last minute, and');
    expect(panelSource).toContain('consecutive snaps stay together.');
    expect(panelSource).toContain('Unavailable in this runtime');
    expect(panelSource).toContain('accessibility-role="switch"');
    expect(panelSource).toContain(
      'accessibility-state={{ checked: false, disabled: true }}'
    );
    expect(panelSource).not.toContain('onChange=');
    expect(panelSource).not.toContain('onClick=');
  });

  it('matches the Web hero and Capture row anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-appsnap-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsAppSnapHero\s*\{[^}]*min-height:\s*130px;[^}]*padding:\s*14px 16px;[^}]*gap:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*10px\) 12px;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapMain\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*gap:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapTitleLine\s*\{[^}]*min-height:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapMetadata\s*\{[^}]*padding-top:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapStatus\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow--continued\s*\{[^}]*border-bottom:\s*1px solid var\(--border\);/s
    );
    expect(styles).not.toMatch(
      /\.SettingsAppSnapRow\s*\{[^}]*min-height:/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapDisabledSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*opacity:\s*0\.5;/s
    );
    expect(styles).not.toContain('SettingsAppSnapRow--divided');
  });
});
