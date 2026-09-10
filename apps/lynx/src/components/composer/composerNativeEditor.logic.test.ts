import { describe, expect, it } from '@rstest/core';

import {
  cutComposerNativeEditorSelection,
  normalizeComposerNativeEditorSnapshot,
  selectAllComposerNativeEditor,
  selectedComposerNativeEditorText,
} from './composerNativeEditor.logic';

describe('native editor send snapshot', () => {
  it('keeps the complete native value when draft events are behind', () => {
    expect(
      normalizeComposerNativeEditorSnapshot(
        {
          value: 'stored prefix and the rest',
          selectionStart: 26,
          selectionEnd: 26,
          isComposing: false,
        }
      )
    ).toEqual({
      value: 'stored prefix and the rest',
      selectionStart: 26,
      selectionEnd: 26,
      isComposing: false,
    });
  });

  it('preserves composition state and clamps a malformed range', () => {
    expect(
      normalizeComposerNativeEditorSnapshot(
        {
          value: '中文',
          selectionStart: -4,
          selectionEnd: 99,
          isComposing: true,
        }
      )
    ).toEqual({
      value: '中文',
      selectionStart: 0,
      selectionEnd: 2,
      isComposing: true,
    });
  });

  it('accepts the selectionBegin field returned by native getValue', () => {
    expect(
      normalizeComposerNativeEditorSnapshot({
        value: 'native selection',
        selectionBegin: 3,
        selectionEnd: 9,
      })
    ).toEqual({
      value: 'native selection',
      selectionStart: 3,
      selectionEnd: 9,
      isComposing: false,
    });
  });

  it('fails closed when the host does not return a string value', () => {
    expect(
      normalizeComposerNativeEditorSnapshot({
        value: undefined,
        selectionStart: 1,
      })
    ).toBeNull();
  });

  it('selects, copies and cuts the same normalized range', () => {
    const selected = selectAllComposerNativeEditor({
      value: 'alpha beta',
      selectionStart: 10,
      selectionEnd: 10,
      isComposing: false,
    });
    expect(selectedComposerNativeEditorText(selected)).toBe('alpha beta');
    expect(cutComposerNativeEditorSelection(selected)).toEqual({
      value: '',
      selectionStart: 0,
      selectionEnd: 0,
      isComposing: false,
    });
  });
});
