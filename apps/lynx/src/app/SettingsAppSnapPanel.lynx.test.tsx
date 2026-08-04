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
    expect(panelSource).toContain('Unavailable in this runtime');
    expect(panelSource).toContain('accessibility-state={{ disabled: true }}');
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
      /\.SettingsAppSnapRow\s*\{[^}]*min-height:\s*79px;[^}]*justify-content:\s*space-between;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapDisabledSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*18px;[^}]*opacity:\s*0\.5;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow--shortcut\s*\{[^}]*min-height:\s*97px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAppSnapRow--sound\s*\{[^}]*min-height:\s*60px;/s
    );
  });
});
