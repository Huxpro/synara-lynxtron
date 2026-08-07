import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('composer project picker trigger icon', () => {
  it('uses the exact shared folder-2 asset at the canonical size', () => {
    const source = readFileSync(
      new URL('./ComposerProjectPickerCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('../components/composer/landing-composer.css', import.meta.url),
      'utf8'
    );

    expect(source).toContain(
      "import folderSvg from '@synara-central-icons/folder-2.svg?raw';"
    );
    expect(source).toContain(
      'className="ComposerProjectPickerTriggerIconLynx"'
    );
    expect(source).toContain(
      'content={colorizeLynxSvg(folderSvg, svgColors.mutedForeground)}'
    );
    expect(source).not.toContain(
      '<FolderIcon className="ComposerProjectPickerTriggerIconLynx"'
    );
    expect(styles).toMatch(
      /\.ComposerProjectPickerTriggerIconLynx\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*flex-shrink:\s*0;/s
    );
  });
});
