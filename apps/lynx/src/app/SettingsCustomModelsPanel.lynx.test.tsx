import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  customModelsForProvider,
  customModelsProviderPatch,
} from './SettingsCustomModelsPanel.lynx';
import { DEFAULT_SERVER_SETTINGS_VIEW } from '@synara/contracts';

describe('Settings Custom Models fidelity', () => {
  it('reads and patches canonical provider customModels fields', () => {
    const settings = {
      ...DEFAULT_SERVER_SETTINGS_VIEW,
      providers: {
        ...DEFAULT_SERVER_SETTINGS_VIEW.providers,
        codex: {
          ...DEFAULT_SERVER_SETTINGS_VIEW.providers.codex,
          customModels: ['custom/model'],
        },
      },
    };

    expect(customModelsForProvider(settings, 'codex')).toEqual([
      'custom/model',
    ]);
    expect(customModelsProviderPatch('codex', ['custom/model'])).toEqual({
      providers: { codex: { customModels: ['custom/model'] } },
    });
    expect(customModelsProviderPatch('opencode', ['openai/gpt-5'])).toEqual({
      providers: { opencode: { customModels: ['openai/gpt-5'] } },
    });
  });

  it('owns the complete add/remove/reset workflow and Web anatomy', () => {
    const source = readFileSync(
      new URL('./SettingsCustomModelsPanel.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('./settings-custom-models-panel.css', import.meta.url),
      'utf8'
    );
    const settingsSource = readFileSync(
      new URL('./SettingsPage.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain("validateCustomModelInput");
    expect(source).toContain("queryKey: ['server-settings']");
    expect(source).toContain('updateServerSettings(patch)');
    expect(source).toContain('confirmType="send"');
    expect(source).toContain('onConfirm={addModel}');
    expect(source).toContain('aria-invalid={Boolean(error)}');
    expect(source).toContain('accessibility-role="alert"');
    expect(source).toContain('Remove ${row.slug}');
    expect(source).toContain('Reset custom models to default');
    expect(source).toContain("provider: 'pi'");
    expect(source).not.toContain("provider: 'droid'");
    expect(settingsSource).toContain('<SettingsCustomModelsPanel');
    expect(settingsSource).toContain('onSettingsChange={applyModelSettings}');
    expect(styles).toMatch(
      /\.SettingsCustomModelsSection\s*\{[^}]*gap:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsCard\s*\{[^}]*border-radius:\s*10px;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsRow\s*\{[^}]*padding:\s*10px 12px;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsEditor\s*\{[^}]*margin-top:\s*16px;[^}]*padding-top:\s*16px;[^}]*border-top:\s*1px solid var\(--border\);/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsEditorRow\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsProviderTrigger\s*\{[^}]*width:\s*100%;[^}]*height:\s*28px;[^}]*border-radius:\s*8px;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsInput\s*\{[^}]*height:\s*28px;[^}]*flex:\s*1;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsAdd\s*\{[^}]*width:\s*100%;[^}]*height:\s*32px;[^}]*gap:\s*8px;[^}]*padding:\s*7px 12px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-md-up \.SettingsCustomModelsEditorRow\s*\{[^}]*flex-direction:\s*row;[^}]*align-items:\s*center;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-md-up \.SettingsCustomModelsProviderTrigger\s*\{[^}]*width:\s*144px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-md-up \.SettingsCustomModelsAdd\s*\{[^}]*width:\s*69px;/s
    );
    expect(styles).toMatch(
      /\.SettingsCustomModelsListRow\s*\{[^}]*min-height:\s*36px;[^}]*padding:\s*8px 12px;/s
    );
  });
});
