import { describe, expect, it } from '@rstest/core';

import {
  readSystemDarkEvent,
  SYSTEM_APPEARANCE_EVENT,
} from './systemAppearanceEvent.logic';

describe('system appearance event contract', () => {
  it('uses one stable host-to-renderer event name', () => {
    expect(SYSTEM_APPEARANCE_EVENT).toBe('synara:system-appearance');
  });

  it('accepts only boolean host appearance payloads', () => {
    expect(readSystemDarkEvent(true)).toBe(true);
    expect(readSystemDarkEvent(false)).toBe(false);
    expect(readSystemDarkEvent('dark')).toBeNull();
    expect(readSystemDarkEvent(null)).toBeNull();
  });
});
