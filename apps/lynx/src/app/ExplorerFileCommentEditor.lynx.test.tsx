import { beforeEach, describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';

import { ExplorerFileCommentEditor } from './ExplorerFileCommentEditor.lynx';

beforeEach(() => {
  Object.assign(lynx, {
    createSelectorQuery() {
      return { select() { return this; }, invoke() { return this; }, exec() {} };
    },
  });
});

describe('Explorer file comment editor', () => {
  it('matches Web copy and submits only normalized non-empty comments', async () => {
    const onCancel = rs.fn();
    const onSubmit = rs.fn();
    render(
      <ExplorerFileCommentEditor
        lineNumber={5}
        onCancel={onCancel}
        onSubmit={onSubmit}
      />
    );

    expect(
      elementTree.root?.querySelector('.ExplorerDockCommentTitle')?.textContent
    ).toBe('Local comment');
    expect(
      elementTree.root?.querySelector('.ExplorerDockCommentTarget')?.textContent
    ).toBe('Comment on line 5');
    expect(
      elementTree.root?.querySelector('.ExplorerDockCommentBadgeMark')
        ?.getAttribute('accessibility-label')
    ).toBe('Lynx logo');
    const textarea = elementTree.root?.querySelector(
      '.ExplorerDockCommentInput textarea'
    );
    expect(textarea?.getAttribute('placeholder')).toBe('Request change');

    const buttons = elementTree.root?.querySelectorAll('.LxButton') ?? [];
    fireEvent.tap(buttons[1]!);
    expect(onSubmit).not.toHaveBeenCalled();

    const inputEvent = new Event('bindEvent:input', { bubbles: true });
    Object.assign(inputEvent, {
      detail: {
        value: '\n  Rename this value.  \n',
        selectionStart: 24,
        selectionEnd: 24,
        isComposing: false,
      },
    });
    textarea?.dispatchEvent(inputEvent);
    await waitFor(() => {
      const currentButtons =
        elementTree.root?.querySelectorAll('.LxButton') ?? [];
      expect(currentButtons[1]?.getAttribute('disabled')).not.toBe(true);
    });
    fireEvent.tap(
      (elementTree.root?.querySelectorAll('.LxButton') ?? [])[1]!
    );
    expect(onSubmit).toHaveBeenCalledWith('Rename this value.');

    fireEvent.tap(
      (elementTree.root?.querySelectorAll('.LxButton') ?? [])[0]!
    );
    expect(onCancel).toHaveBeenCalledTimes(1);
  });
});
