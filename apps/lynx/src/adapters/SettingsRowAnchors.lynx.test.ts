import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Lynx Settings row anchors', () => {
  it('derives the same stable ids as Web rows', () => {
    for (const file of [
      './SettingsAppearanceCompositionElements.lynx.tsx',
      './SettingsGeneralCompositionElements.lynx.tsx',
    ]) {
      const source = readFileSync(new URL(file, import.meta.url), 'utf8');
      expect(source).toContain(
        "import { settingRowAnchorId } from '@synara-web/settingsNavigation'"
      );
      expect(source).toContain('id={settingRowAnchorId(props.title)}');
    }
  });
});
