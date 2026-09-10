import { describe, expect, it } from '@rstest/core';

import { resolveNativeComposerMaxLines } from './composerNativeLines.logic';

describe('Native composer line sizing', () => {
  it('grows from two to six lines with real content', () => {
    expect(resolveNativeComposerMaxLines({ availableWidthPx: 736, chatFontSizePx: 12, text: '' })).toBe(2);
    expect(
      resolveNativeComposerMaxLines({ availableWidthPx: 736, chatFontSizePx: 12, text: 'One line' })
    ).toBe(2);
    expect(
      resolveNativeComposerMaxLines({
        availableWidthPx: 736,
        chatFontSizePx: 12,
        text: 'One\nTwo\nThree',
      })
    ).toBe(3);
    expect(
      resolveNativeComposerMaxLines({
        availableWidthPx: 192,
        chatFontSizePx: 18,
        text: 'A long composer draft '.repeat(30),
      })
    ).toBe(6);
  });
});
