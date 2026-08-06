import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';
import { render } from '@lynx-js/react/testing-library';

import { ComposerTraitFastModeToggleElement } from './ComposerTraitRadioSectionCompositionElements.lynx';

describe('native composer Fast mode toggle', () => {
  it('matches the shared Web geometry and accessibility identity', () => {
    const composerStyles = readFileSync(
      new URL('../components/composer/composer.css', import.meta.url),
      'utf8'
    );

    render(
      <ComposerTraitFastModeToggleElement enabled={false} onToggle={() => {}} />
    );

    const toggle = elementTree.root?.querySelector(
      '.ComposerTraitFastModeToggleLynx'
    );
    if (!toggle) throw new Error('expected Fast mode toggle');

    expect(toggle.getAttribute('aria-label')).toBe('Fast mode');
    expect(toggle.getAttribute('aria-pressed')).toBe('false');
    expect(composerStyles).toMatch(
      /\.ComposerTraitFastModeToggleLynx\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*8px;/s
    );
  });
});
