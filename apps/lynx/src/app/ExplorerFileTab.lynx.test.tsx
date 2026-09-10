import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';

import { ExplorerFileTab } from './ExplorerFileTab.lynx';

describe('Lynx Explorer file tab', () => {
  it('keeps the file icon and close glyph in one slot and reveals close on hover', async () => {
    const onClose = rs.fn();
    render(<ExplorerFileTab path="src/example.js" onClose={onClose} />);

    const tab = elementTree.root?.querySelector('.ExplorerDockFileTab');
    const icon = elementTree.root?.querySelector(
      '.EditorSurfaceTabRestingIcon'
    );
    const close = elementTree.root?.querySelector('.EditorSurfaceTabClose');
    expect(tab).not.toBeNull();
    expect(icon).not.toBeNull();
    expect(close).not.toBeNull();
    expect(close?.getAttribute('class')).toContain('EditorSurfaceTabIconSlot');
    expect(elementTree.root?.querySelector('.ExplorerDockTitle')?.textContent).toBe(
      'example.js'
    );

    fireEvent(tab!, new Event('bindEvent:mouseenter', { bubbles: true }));
    await waitFor(() => expect(tab?.getAttribute('class')).toContain('ui-hover'));
    const visibleClose = elementTree.root?.querySelector('.EditorSurfaceTabClose');
    expect(visibleClose?.getAttribute('accessibility-label')).toBe(
      'Close example.js'
    );
    visibleClose!.dispatchEvent(
      new CustomEvent('catchEvent:tap', { bubbles: true })
    );
    expect(onClose).toHaveBeenCalledTimes(1);
  });
});
