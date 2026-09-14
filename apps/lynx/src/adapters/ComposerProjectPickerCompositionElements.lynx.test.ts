import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import {
  ComposerProjectPickerActionElement,
  ComposerProjectPickerGroupLabelElement,
  ComposerProjectPickerOptionElement,
} from './ComposerProjectPickerCompositionElements.lynx';

describe('composer project picker trigger icon', () => {
  it('embeds muted paint in group, option, and footer action glyphs', () => {
    render(
      <>
        <ComposerProjectPickerGroupLabelElement icon="home">
          Personal
        </ComposerProjectPickerGroupLabelElement>
        <ComposerProjectPickerOptionElement
          primaryLabel="Synara"
          secondaryLabel="~/github/synara"
          selected
          onSelect={() => {}}
        />
        <ComposerProjectPickerActionElement kind="add" onActivate={() => {}}>
          New project
        </ComposerProjectPickerActionElement>
      </>
    );

    for (const className of [
      'ComposerProjectPickerSpaceIconLynx',
      'ComposerProjectPickerOptionIconLynx',
      'ComposerProjectPickerActionIconLynx',
    ]) {
      expect(
        elementTree.root?.querySelector(`.${className}`)?.getAttribute('content')
      ).toContain('stroke="rgba(13, 13, 13, 0.6)"');
    }
    expect(
      elementTree.root
        ?.querySelector('.ComposerProjectPickerCheckLynx svg')
        ?.getAttribute('content')
    ).toContain('stroke="#0d0d0d"');
  });

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
      "content={colorizeLynxSvg(folderSvg, semanticIconColor('secondary'))}"
    );
    expect(source).not.toContain(
      '<FolderIcon className="ComposerProjectPickerTriggerIconLynx"'
    );
    expect(source).toMatch(
      /import\s*\{[^}]*FolderIcon,[^}]*\}\s*from '\.\.\/lib\/icons\.lynx';/s
    );
    expect(source).toContain('const Icon = icons[props.icon] ?? FolderIcon;');
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
