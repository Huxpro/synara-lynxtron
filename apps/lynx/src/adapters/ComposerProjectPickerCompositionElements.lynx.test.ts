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
    expect(source).toMatch(
      /import\s*\{[^}]*FolderIcon,[^}]*\}\s*from '\.\.\/lib\/icons\.lynx';/s
    );
    expect(source).toMatch(/\?\s*PaletteIcon\s*:\s*FolderIcon\s*;/s);
    expect(styles).toMatch(
      /\.ComposerProjectPickerTriggerIconLynx\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*flex-shrink:\s*0;/s
    );
    expect(styles).toMatch(
      /\.ComposerProjectPickerTriggerLynx\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(styles).not.toContain(
      '.ComposerProjectPickerOptionLynx--selected'
    );
    expect(styles).toMatch(
      /\.ComposerProjectPickerOptionLynx\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-button-secondary-hover\);/s
    );
    expect(styles).toMatch(
      /\.ComposerProjectPickerActionLynx\.ui-hover,[^{]*\{[^}]*background-color:\s*var\(--color-background-elevated-secondary\);/s
    );
    expect(source).toContain('<CheckIcon size={12} />');
    expect(source).not.toContain("{props.selected ? '✓' : ''}");
    expect(source).toContain('const inputRef = useRef<InputRef>(null);');
    expect(source).toContain('.focus()');
    expect(source).toContain(
      '.then(() => input.setSelectionRange(0, props.query.length))'
    );
    expect(source).toContain('aria-label={props.placeholder}');
    expect(source).not.toContain('onKeyDown={() => undefined}');
  });
});
