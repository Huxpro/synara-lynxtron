import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render } from '@lynx-js/react/testing-library';

import { ComposerExtrasImageItemElement } from './ComposerExtrasMenuCompositionElements.lynx';

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
});
