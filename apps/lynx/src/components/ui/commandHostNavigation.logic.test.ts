import { describe, expect, it } from '@rstest/core';

import { parseHostCommandKeyboardEvent } from './commandHostNavigation.logic';

describe('parseHostCommandKeyboardEvent', () => {
  it('accepts only the bounded Search navigation payload', () => {
    expect(parseHostCommandKeyboardEvent({ key: 'ArrowDown' })).toEqual({
      key: 'ArrowDown',
    });
    expect(
      parseHostCommandKeyboardEvent({ key: 'Tab', shiftKey: true })
    ).toEqual({ key: 'Tab', shiftKey: true });
    expect(parseHostCommandKeyboardEvent({ key: 'Enter' })).toBeNull();
    expect(
      parseHostCommandKeyboardEvent({ key: 'Escape', shiftKey: 'yes' })
    ).toBeNull();
  });
});
