import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Settings Advanced fidelity', () => {
  it('routes the real Advanced section and canonical capabilities', () => {
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );
    const clientSource = readFileSync(
      new URL('../data/synaraClient.lynx.ts', import.meta.url),
      'utf8'
    );
    const panelSource = readFileSync(
      new URL('./SettingsAdvancedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const configSource = readFileSync(
      new URL('../../lynx.config.ts', import.meta.url),
      'utf8'
    );

    expect(settingsSource).toContain("'advanced',");
    expect(settingsSource).toContain("section === 'advanced'");
    expect(settingsSource).toContain('<SettingsAdvancedPanel />');
    expect(clientSource).toContain("'shell.openInEditor'");
    expect(clientSource).toContain("'orchestration.repairState'");
    expect(configSource).toContain("'process.env.SYNARA_APP_VERSION'");
    expect(panelSource).toContain('Keybindings');
    expect(panelSource).toContain('Recovery tools');
    expect(panelSource).toContain('Version');
    expect(panelSource).toContain('View release history');
    expect(panelSource).toContain('WHATS_NEW_ENTRIES');
    expect(panelSource).toContain('sortEntriesByVersionDesc');
  });

  it('uses host confirmation and refreshes state after repair', () => {
    const panelSource = readFileSync(
      new URL('./SettingsAdvancedPanel.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(panelSource).toContain('await dialogs.confirm(');
    expect(panelSource).toContain('await repairSynaraState()');
    expect(panelSource).toContain(
      "queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] })"
    );
    expect(panelSource).toContain('await openPathInEditor({ cwd: path, editor })');
    expect(panelSource).toContain('No available editors found.');
    expect(panelSource).toContain('useLynxDisclosurePresence(');
    expect(panelSource).toContain('disclosureContentClassName(');
    expect(panelSource).toContain('disclosureChevronClassName(');
    expect(panelSource).toContain(
      'useLynxDisclosurePresence(props.open)'
    );
    expect(panelSource).toContain('<ReleaseHistoryEntry');
    expect(panelSource).toContain(
      "'SettingsAdvancedReleaseChevron'\n          )}\n          size={14}"
    );
    expect(panelSource).not.toContain('bindtap={() =>\n                        setExpandedRelease');
    expect(panelSource).not.toContain('{open ? (');
    expect(panelSource).toContain('aria-expanded={showRecoveryTools}');
    expect(panelSource).toContain("'SettingsAdvancedRecoveryChevron'");
  });

  it('matches the Web developer-tools and About row anatomy', () => {
    const styles = readFileSync(
      new URL('./settings-advanced-panel.css', import.meta.url),
      'utf8'
    );

    expect(styles).toMatch(
      /\.SettingsAdvancedPanel\s*\{[^}]*gap:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*10px\) 12px;[^}]*flex-direction:\s*column;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRow--keybindings\s*\{[^}]*border-bottom:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedMain\s*\{[^}]*align-items:\s*center;[^}]*justify-content:\s*space-between;[^}]*gap:\s*20px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedMetadata\s*\{[^}]*gap:\s*4px;[^}]*padding-top:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedMetadataText\s*\{[^}]*font-size:\s*11px;[^}]*line-height:\s*16\.5px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedAction\s*\{[^}]*min-height:\s*24px;[^}]*padding:\s*0 7px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDetails\s*\{[^}]*margin-top:\s*12px;[^}]*padding:\s*12px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDisclosure\s*\{[^}]*margin-top:\s*12px;[^}]*padding-top:\s*12px;[^}]*border-top:\s*1px solid var\(--settings-project-border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryTrigger\s*\{[^}]*height:\s*16px;[^}]*justify-content:\s*space-between;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryChevron\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDetails\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRecoveryDetailsText\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedRow--version\s*\{[^}]*border-bottom:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.LxDialogPopup\.SettingsAdvancedReleaseDialog\s*\{[^}]*width:\s*512px;[^}]*height:\s*626\.390625px;[^}]*border-radius:\s*22px;[^}]*box-shadow:\s*0 16px 50px -12px rgba\(0,\s*0,\s*0,\s*0\.7\);/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseTrigger\s*\{[^}]*height:\s*44px;[^}]*padding:\s*12px 0;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseTrigger\.ui-focus\s*\{[^}]*box-shadow:\s*0 0 0 1px var\(--ring\);/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseFeatures\s*\{[^}]*padding:\s*0 4px 16px 24px;[^}]*gap:\s*24px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseFeature\s*\{[^}]*gap:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseFeatureCopy\s*\{[^}]*gap:\s*4px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseFeatureDetails\s*\{[^}]*opacity:\s*0\.85;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseDialog \.LxDialogFooter\s*\{[^}]*height:\s*52px;[^}]*padding:\s*12px 16px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.LxDialogPopup\.SettingsAdvancedReleaseDialog\s*\{[^}]*height:\s*calc\(100vh - 32px\);[^}]*max-height:\s*calc\(100vh - 32px\);/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.SettingsAdvancedReleaseHeader\s*\{[^}]*flex-shrink:\s*0;[^}]*padding:\s*10px 48px 2px 16px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.SettingsAdvancedReleaseHeader\s+\.LxDialogDescription\s*\{[^}]*display:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.SettingsAdvancedReleasePanel\s*\{[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*height:\s*auto;[^}]*max-height:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height\s+\.SettingsAdvancedReleaseDialog\s+\.LxDialogFooter\s*\{[^}]*flex-shrink:\s*0;[^}]*height:\s*44px;[^}]*padding:\s*8px 16px;/s
    );
    expect(styles).toMatch(
      /\.SettingsAdvancedReleaseAction,\s*\.SettingsAdvancedReleaseClose\s*\{[^}]*padding-left:\s*9px;[^}]*padding-right:\s*9px;/s
    );
  });
});
