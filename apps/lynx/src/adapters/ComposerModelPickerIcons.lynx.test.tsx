import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

describe('Composer model picker icon fidelity', () => {
  it('uses canonical Settings, Back, disclosure, and selection icons', () => {
    const triggerSource = readFileSync(
      new URL('./ComposerModelTriggerCompositionElements.lynx.tsx', import.meta.url),
      'utf8'
    );
    const groupSource = readFileSync(
      new URL(
        './ProviderModelOptionGroupListCompositionElements.lynx.tsx',
        import.meta.url
      ),
      'utf8'
    );
    const controlSource = readFileSync(
      new URL('../components/composer/ComposerModelControl.lynx.tsx', import.meta.url),
      'utf8'
    );
    const styles = readFileSync(
      new URL('../components/composer/composer.css', import.meta.url),
      'utf8'
    );

    expect(triggerSource).toContain(
      '<SettingsIcon className="ComposerModelTriggerStatusIconLynx" size={14} />'
    );
    expect(controlSource).toContain('<ArrowLeftIcon');
    expect(controlSource).toContain(
      'className="ComposerProviderBackIconLynx"'
    );
    expect(groupSource).toContain('<ChevronRightIcon');
    expect(groupSource).toContain('disclosureChevronClassName(');
    expect(groupSource).toContain(
      'useLynxDisclosurePresence(props.open)'
    );
    expect(groupSource).toContain('disclosureContentClassName(');
    expect(groupSource).toContain(
      "props.open ? ' ComposerModelGroupHeaderLynx--open' : ''"
    );
    expect(groupSource).toContain(
      '<view className="ComposerModelGroupCountColumnLynx">'
    );
    expect(groupSource).not.toContain('<ChevronDownIcon');
    expect(groupSource).not.toContain(
      '{props.open ? props.children : null}'
    );
    expect(groupSource).toContain('<CheckIcon size={12} />');
    expect(triggerSource).toContain(
      "import fastModeSvg from '@synara-central-icons-fill/zap.svg?raw';"
    );
    expect(groupSource).toContain(
      "import starFilledSvg from '@synara-central-icons-fill/star.svg?raw';"
    );
    expect(groupSource).toContain(
      "import starSvg from '@synara-central-icons/star.svg?raw';"
    );
    expect(`${triggerSource}\n${groupSource}\n${controlSource}`).not.toMatch(
      /[⚙‹⌄›✓⚡★☆]/
    );
    expect(styles).toMatch(
      /\.ComposerModelTriggerStatusIconLynx\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupChevronLynx\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;[^}]*opacity:\s*0\.5;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupLynx\s*\{[^}]*gap:\s*1px;[^}]*padding-right:\s*2px;[^}]*padding-left:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupChevronLynx\s*\{[^}]*margin-right:\s*6px;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupHeaderLynx--open \.ComposerModelGroupLabelLynx\s*\{[^}]*color:\s*var\(--foreground\);[^}]*opacity:\s*0\.75;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupCountColumnLynx\s*\{[^}]*width:\s*40px;[^}]*justify-content:\s*flex-end;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupCountLynx\s*\{[^}]*padding:\s*1px 6px;[^}]*border-radius:\s*999px;[^}]*background-color:\s*rgba\(0,\s*0,\s*0,\s*0\.06\);[^}]*font-size:\s*9px;/s
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.ComposerModelGroupCountLynx\s*\{[^}]*background-color:\s*rgba\(255,\s*255,\s*255,\s*0\.06\);/s
    );
    expect(styles).toMatch(
      /\.ComposerModelGroupContentLynx\s*\{[^}]*width:\s*100%;[^}]*padding-bottom:\s*2px;/s
    );
    expect(styles).toMatch(
      /\.ComposerModelOptionFavoriteIconLynx\s*\{[^}]*width:\s*12px;[^}]*height:\s*12px;/s
    );
  });
});
