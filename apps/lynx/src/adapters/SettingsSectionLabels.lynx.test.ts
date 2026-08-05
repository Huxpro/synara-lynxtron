import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings section labels', () => {
  it('uses the shared Web section-label identity across native owners', () => {
    const webStyles = readFileSync(
      new URL('../../../web/src/settingsPanelStyles.ts', import.meta.url),
      'utf8'
    );
    const sources = [
      readFileSync(
        new URL('./settings-appearance-composition-elements.css', import.meta.url),
        'utf8'
      ),
      readFileSync(
        new URL('./settings-provider-picker-composition-elements.css', import.meta.url),
        'utf8'
      ),
      readFileSync(
        new URL('../app/settings-usage-panel.css', import.meta.url),
        'utf8'
      ),
    ];

    expect(webStyles).toContain('SETTINGS_SECTION_LABEL_CLASS_NAME');
    for (const styles of sources) {
      expect(styles).toMatch(
        /SectionTitle\s*\{[^}]*padding:\s*4px 8px;[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;[^}]*opacity:\s*0\.58;/s
      );
    }
  });

  it('keeps standard Settings cards on the shared Web radius', () => {
    const generalStyles = readFileSync(
      new URL('./settings-general-composition-elements.css', import.meta.url),
      'utf8'
    );
    const appearanceStyles = readFileSync(
      new URL('./settings-appearance-composition-elements.css', import.meta.url),
      'utf8'
    );
    const providerStyles = readFileSync(
      new URL('./settings-provider-picker-composition-elements.css', import.meta.url),
      'utf8'
    );

    for (const styles of [generalStyles, appearanceStyles, providerStyles]) {
      expect(styles).toMatch(/Card\s*\{[^}]*border-radius:\s*10px;/s);
    }
  });

  it('uses the standard row token and Web provider item typography', () => {
    const providerStyles = readFileSync(
      new URL('./settings-provider-picker-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerTitle\s*\{[^}]*font-size:\s*var\(--type-settings-row-title-size\);[^}]*line-height:\s*var\(--type-settings-row-title-line-height\);/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerItemTitle\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerDescription\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerStatus\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*17px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerItem\s*\{[^}]*min-height:\s*42px;[^}]*padding:\s*10px 12px;[^}]*border-radius:\s*10px;/s
    );
    const providerSource = readFileSync(
      new URL('./SettingsProviderPickerCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(providerSource).toContain('<Undo2Icon size={14}');
    expect(providerSource).not.toContain('↶');
    expect(providerSource).toContain('<ChevronDownIcon');
    expect(providerSource).not.toContain('↑');
    expect(providerSource).not.toContain('↓');
  });
});
