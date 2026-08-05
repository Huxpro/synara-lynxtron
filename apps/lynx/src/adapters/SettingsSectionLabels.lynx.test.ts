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
    const usageStyles = readFileSync(
      new URL('../app/settings-usage-panel.css', import.meta.url),
      'utf8'
    );

    for (const styles of [generalStyles, appearanceStyles, providerStyles]) {
      expect(styles).toMatch(/Card\s*\{[^}]*border-radius:\s*10px;/s);
    }
    expect(usageStyles).toMatch(
      /\.SettingsUsageCard,\s*\.SettingsUsageState\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageCard\s*\{[^}]*gap:\s*14px;[^}]*padding:\s*16px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageState\s*\{[^}]*padding:\s*14px 16px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageProviderIcon\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;[^}]*border-radius:\s*10px;[^}]*background-color:\s*var\(--settings-provider-icon-surface\);/s
    );
    const usageSource = readFileSync(
      new URL('../app/SettingsUsagePanel.tsx', import.meta.url),
      'utf8'
    );
    expect(usageSource).toContain(
      '<OpenAIProviderIcon provider={snapshot.provider} />'
    );
    expect(usageSource).toContain('<RefreshCwIcon');
    expect(usageSource).toContain('mutationFn: () => loadProviderUsage(true)');
    expect(usageSource).toContain(
      'return fetchAllProviderUsage(forceRefresh ? { forceRefresh: true } : {});'
    );
    expect(usageSource).toContain(
      '(previous) => mergeProviderUsageRefresh(previous, data)'
    );
    expect(usageSource).toContain(
      'const isRefreshing = usageQuery.isFetching || refreshMutation.isPending;'
    );
    expect(usageSource).toContain("isRefreshing ? 'animate-spin'");
    expect(usageSource).toContain('<TriangleAlertIcon');
    expect(usageSource).toContain('snapshot.detail?.trim()');
    expect(usageSource).toContain('className="SettingsUsageNotice"');
    expect(usageSource).toContain(
      "if ((snapshot.status ?? 'ok') === 'ok') return snapshot.planName ?? null;"
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageStatus\s*\{[^}]*font-size:\s*11px;[^}]*font-weight:\s*500;[^}]*line-height:\s*11px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageStatus--needs-auth\s*\{[^}]*background-color:\s*var\(--settings-usage-warning-surface\);[^}]*color:\s*var\(--settings-usage-warning-text\);/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageNotice\s*\{[^}]*align-items:\s*flex-start;[^}]*gap:\s*6px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageNoticeIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*margin-top:\s*2px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageNoticeText\s*\{[^}]*color:\s*var\(--settings-usage-warning-text\);[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s
    );
    expect(usageSource).toContain(
      "import { deriveProviderUsageLimitDisplay } from '@synara/shared/providerUsageDisplay';"
    );
    expect(usageSource).toContain(
      'const display = deriveProviderUsageLimitDisplay(props.limit);'
    );
    expect(usageSource).toContain('className="SettingsUsageLimitTitle"');
    expect(usageSource).toContain('className="SettingsUsageLimitMeta"');
    expect(usageSource).toContain('className="SettingsUsageLimitPace"');
    expect(usageSource).not.toContain('className="SettingsUsageLimitHeader"');
    expect(usageSource).toContain('className="SettingsUsageTrack"');
    expect(usageSource).toContain(
      "style={{ width: `${display.remainingPercent}%` }}"
    );
    expect(usageSource).toContain('className="SettingsUsageTrackMarkerGap"');
    expect(usageStyles).toMatch(
      /\.SettingsUsageTrack\s*\{[^}]*height:\s*8px;[^}]*border-radius:\s*999px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsagePaceDot\s*\{[^}]*width:\s*6px;[^}]*height:\s*6px;[^}]*border-radius:\s*999px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageMetaText\s*\{[^}]*font-size:\s*11px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageTrackMarkerGap\s*\{[^}]*width:\s*8px;[^}]*margin-left:\s*-4px;[^}]*padding:\s*0 3px;/s
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageSubtitle\s*\{[^}]*font-size:\s*11px;[^}]*opacity:\s*0\.8;/s
    );
    expect(usageSource).toContain(
      "Usage is read locally from each provider CLI's stored credentials"
    );
    expect(usageStyles).toMatch(
      /\.SettingsUsageFootnote\s*\{[^}]*padding:\s*0 8px;[^}]*font-size:\s*11px;[^}]*line-height:\s*18px;/s
    );
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
      /\.SharedSettingsProviderPickerHeader\s*\{[^}]*padding:\s*10px 12px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerList\s*\{[^}]*padding:\s*16px 12px 10px;[^}]*gap:\s*8px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerItem\s*\{[^}]*min-height:\s*42px;[^}]*padding:\s*10px 12px;[^}]*border-radius:\s*10px;/s
    );
    const providerSource = readFileSync(
      new URL('./SettingsProviderPickerCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(providerSource).toContain('<SettingsResetIcon />');
    expect(providerSource).not.toContain('↶');
    expect(providerSource).toContain('<ChevronDownIcon');
    expect(providerSource).not.toContain('↑');
    expect(providerSource).not.toContain('↓');
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*border-radius:\s*10px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerSwitchThumb\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*border-radius:\s*8px;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerSwitch\s*\{[^}]*padding:\s*1px;[^}]*border:\s*1px solid var\(--settings-switch-border\);[^}]*background-color:\s*var\(--settings-switch-off\);/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerSwitchThumb\s*\{[^}]*background-color:\s*#ffffff;/s
    );
    expect(providerStyles).toMatch(
      /\.SharedSettingsProviderPickerSwitch\.ui-focus\s*\{[^}]*box-shadow:\s*0 0 0 2px var\(--ring\);/s
    );
  });

  it('uses one generated reset icon across Settings owners', () => {
    const resetIcon = readFileSync(
      new URL('./SettingsResetIcon.lynx.tsx', import.meta.url),
      'utf8'
    );
    const owners = [
      './SettingsGeneralCompositionElements.lynx.tsx',
      './SettingsAppearanceCompositionElements.lynx.tsx',
      './SettingsGitWritingModelCompositionElements.lynx.tsx',
      './SettingsProviderPickerCompositionElements.lynx.tsx',
    ].map((relativePath) =>
      readFileSync(new URL(relativePath, import.meta.url), 'utf8')
    );

    expect(resetIcon).toContain('<Undo2Icon size={14}');
    for (const source of owners) {
      expect(source).toContain('<SettingsResetIcon />');
      expect(source).not.toContain('↶');
    }
  });

  it('matches the Web select chevron tone', () => {
    const generalStyles = readFileSync(
      new URL('./settings-general-composition-elements.css', import.meta.url),
      'utf8'
    );

    expect(generalStyles).toMatch(
      /\.SharedSettingsGeneralSelectChevron\s*\{[^}]*opacity:\s*0\.8;/s
    );
  });

  it('keeps the shared Input primitive on the Web control radius', () => {
    const primitiveStyles = readFileSync(
      new URL('../components/ui/primitives.css', import.meta.url),
      'utf8'
    );

    expect(primitiveStyles).toMatch(
      /\.LxInputControl\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxButton\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(primitiveStyles).toMatch(/\.LxButton\s*\{[^}]*gap:\s*8px;/s);
    expect(primitiveStyles).toMatch(/\.LxButton--sm\s*\{[^}]*gap:\s*6px;/s);
  });
});
