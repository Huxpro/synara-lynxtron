import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

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
});
