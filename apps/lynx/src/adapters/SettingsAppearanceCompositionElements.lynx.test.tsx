import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { filterTerminalFontSuggestions } from './SettingsAppearanceCompositionElements.lynx';

describe('Settings Appearance fidelity', () => {
  it('matches the shared Web section and row anatomy', () => {
    const source = readFileSync(
      new URL('./SettingsAppearanceCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./settings-appearance-composition-elements.css', import.meta.url),
      'utf8'
    );
    const composition = readFileSync(
      new URL(
        '../../../web/src/components/settings/SettingsAppearanceComposition.tsx',
        import.meta.url
      ),
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
    expect(source).toContain(
      "props.terminal ? ' SharedSettingsAppearanceRow--terminal' : ''"
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRow--terminal\s*\{[^}]*border-bottom-width:\s*0;/s
    );
    expect(composition).toContain('terminal={terminal}');
    expect(composition).toContain('!props.showFontSmoothing');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowTitle\s*\{[^}]*font-size:\s*var\(--type-settings-row-title-size\);[^}]*line-height:\s*var\(--type-settings-row-title-line-height\);/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowDescription,\s*\.SharedSettingsAppearanceSuffix\s*\{[^}]*font-size:\s*var\(--type-settings-row-description-size\);[^}]*line-height:\s*var\(--type-settings-row-description-line-height\);/s
    );
    expect(source).toContain('THEME_OPTION_ICONS');
    expect(source).toContain('SunIcon');
    expect(source).toContain('MoonIcon');
    expect(source).toContain('DeviceLaptopIcon');
    expect(source).toContain('<text className="LxButton__text">{option.label}</text>');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*border:\s*1px solid var\(--settings-switch-border\);/s
    );
    expect(source).toContain('size="sm"');
    expect(source).toContain('variant="soft"');
    expect(source).toContain('const value = event.target.value.trim();');
    expect(source).toContain('if (value) props.onChange(Number(value));');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceInputLine\s*\{[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceInputLine \.LxInputControl\s*\{[^}]*width:\s*80px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceInputLine \.LxInput\s*\{[^}]*text-align:\s*right;/s
    );
    expect(source).toContain('onFocus={() => setOpen(true)}');
    expect(source).toContain('onActivate={() => setOpen(true)}');
    expect(source).toContain("props.onChange('');");
    expect(source).toContain('No matching suggested fonts.');
    expect(source).toContain('<MenuItem');
    expect(source).toContain('onClick={() => props.onChange(suggestion)}');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceFontTrigger,\s*\.SharedSettingsAppearanceFontInput\s*\{[^}]*width:\s*224px;/s
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceFontPopup\s*\{[^}]*width:\s*224px;/s
    );
  });

  it('filters the shared terminal font suggestions without restricting free-form values', () => {
    expect(filterTerminalFontSuggestions(' fIrA ')).toEqual(['Fira Code']);
    expect(filterTerminalFontSuggestions('')).toContain('JetBrains Mono');
    expect(filterTerminalFontSuggestions('not-a-font')).toEqual([]);
  });
});
