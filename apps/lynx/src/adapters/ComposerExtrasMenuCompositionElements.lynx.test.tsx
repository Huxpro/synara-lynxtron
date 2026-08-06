import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import {
  ComposerExtrasFastLabelElement,
  ComposerExtrasImageItemElement,
  ComposerExtrasMenuTriggerElement,
  ComposerExtrasPlanLabelElement,
} from './ComposerExtrasMenuCompositionElements.lynx';

describe('native composer attachment menu item', () => {
  it('opens the host picker only when the capability is available', () => {
    const onPickAttachments = rs.fn();
    render(
      <ComposerExtrasImageItemElement
        available
        onAddPhotos={() => undefined}
        onPickAttachments={onPickAttachments}
      />
    );
    const item = elementTree.root?.querySelector('[role="menuitem"]');
    if (!item) throw new Error('expected attachment menu item');
    expect(item.textContent).toContain('Add files');
    fireEvent.tap(item);
    expect(onPickAttachments).toHaveBeenCalledTimes(1);
  });

  it('uses native SVG icons for trigger, attachment, Plan, and Fast anatomy', () => {
    render(
      <>
        <ComposerExtrasMenuTriggerElement />
        <ComposerExtrasImageItemElement
          available
          onAddPhotos={() => undefined}
          onPickAttachments={() => undefined}
        />
        <ComposerExtrasPlanLabelElement />
        <ComposerExtrasFastLabelElement />
      </>
    );

    expect(
      elementTree.root?.querySelector('.ComposerExtrasTriggerIconLynx')
    ).not.toBeNull();
    expect(
      elementTree.root?.querySelectorAll('.ComposerExtrasItemIconLynx')
    ).toHaveLength(3);
    expect(elementTree.root?.textContent).not.toContain('+');
  });

  it('matches the canonical trigger and menu row radii', () => {
    const composerStyles = readFileSync(
      new URL('../components/composer/composer.css', import.meta.url),
      'utf8'
    );
    const primitiveStyles = readFileSync(
      new URL('../components/ui/primitives.css', import.meta.url),
      'utf8'
    );

    expect(composerStyles).toMatch(
      /\.ComposerExtrasTriggerHostLynx,\s*\.ComposerExtrasTriggerLynx\s*\{[^}]*width:\s*28px;[^}]*min-width:\s*28px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerExtrasTriggerLynx\s*\{[^}]*padding:\s*5px;[^}]*border-radius:\s*8px;/s
    );
    expect(primitiveStyles).toMatch(
      /\.LxMenuItem\s*\{[^}]*border-radius:\s*8px;/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerExtrasPopupLynx\.LxMenuPopup\s*\{[^}]*border-radius:\s*10\.4px;[^}]*box-shadow:\s*0 4px 18px -6px rgba\(13,\s*13,\s*13,\s*0\.07\);/s
    );
    expect(composerStyles).toMatch(
      /\.ComposerExtrasPopupLynx \.LxMenuSubPopup\s*\{[^}]*border-radius:\s*10\.4px;[^}]*box-shadow:\s*0 4px 18px -6px rgba\(13,\s*13,\s*13,\s*0\.07\);/s
    );
    expect(composerStyles).toMatch(
      /\.SliceRoot--theme-dark \.ComposerExtrasPopupLynx\.LxMenuPopup,\s*\.SliceRoot--theme-dark \.ComposerExtrasPopupLynx \.LxMenuSubPopup\s*\{[^}]*box-shadow:\s*0 6px 24px -10px rgba\(0,\s*0,\s*0,\s*0\.3\);/s
    );
  });
});
