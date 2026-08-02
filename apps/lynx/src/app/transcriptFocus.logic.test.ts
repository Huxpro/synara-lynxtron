import { describe, expect, it } from '@rstest/core';

import { TRANSCRIPT_KEYBOARD_LANDMARK_PROPS } from './transcriptFocus.logic';

describe('Transcript keyboard landmark', () => {
  it('publishes a named focusable scroll region contract', () => {
    expect(TRANSCRIPT_KEYBOARD_LANDMARK_PROPS).toEqual({
      'aria-label': 'Conversation transcript',
      'accessibility-element': true,
      'accessibility-label': 'Conversation transcript',
      focusable: true,
    });
  });
});
