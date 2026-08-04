import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Appearance fidelity', () => {
  it('matches the shared Web section and row anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-appearance-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRoot\s*\{[^}]*gap:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSection\s*\{[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSectionTitle\s*\{[^}]*padding:\s*4px 8px;[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*0\.625rem\) 12px;/s
    );
    expect(styles).not.toMatch(
      /\.SharedSettingsAppearanceRow\s*\{[^}]*min-height:/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowTitle\s*\{[^}]*font-size:\s*var\(--type-settings-row-title-size\);[^}]*line-height:\s*var\(--type-settings-row-title-line-height\);/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowDescription,\s*\.SharedSettingsAppearanceSuffix\s*\{[^}]*font-size:\s*var\(--type-settings-row-description-size\);[^}]*line-height:\s*var\(--type-settings-row-description-line-height\);/s
    );
  });
});
