import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import {
  ProviderModelCollapsibleGroupElement,
  ProviderModelRadioItemElement,
} from './ProviderModelOptionGroupListCompositionElements.lynx';

function fireCatchTap(element: Element) {
  fireEvent(element, new Event('catchEvent:tap', { bubbles: true }));
}

describe('Native provider model group interactions', () => {
  it('exposes disclosure state and toggles through the real group header', () => {
    const onOpenChange = rs.fn();
    render(
      <ProviderModelCollapsibleGroupElement
        label="Google"
        count={1}
        open={false}
        onOpenChange={onOpenChange}
      >
        <text>Gemini Group Disclosure</text>
      </ProviderModelCollapsibleGroupElement>
    );

    const trigger = elementTree.root?.querySelector('.ComposerModelGroupHeaderLynx');
    if (!trigger) throw new Error('expected model group trigger');
    expect(trigger.getAttribute('aria-label')).toBe('Expand Google models');
    expect(trigger.getAttribute('aria-expanded')).toBe('false');
    fireEvent.tap(trigger);
    expect(onOpenChange).toHaveBeenCalledWith(true);
  });

  it('exposes favourite state and activates the real star control', () => {
    const onToggleFavorite = rs.fn();
    render(
      <ProviderModelRadioItemElement
        active={false}
        costMultiplierLabel={null}
        favoriteProvider="opencode"
        isFavorite
        modelName="Open Model 02"
        modelSlug="open-model-02"
        onSelect={() => {}}
        onToggleFavorite={onToggleFavorite}
      />
    );

    const toggle = elementTree.root?.querySelector('.ComposerModelOptionFavoriteLynx');
    if (!toggle) throw new Error('expected favourite toggle');
    expect(toggle.getAttribute('aria-label')).toBe(
      'Remove Open Model 02 from favourites'
    );
    expect(toggle.getAttribute('aria-checked')).toBe('true');
    fireCatchTap(toggle);
    expect(onToggleFavorite).toHaveBeenCalledTimes(1);
  });
});
