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
});
