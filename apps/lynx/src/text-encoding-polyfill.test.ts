import { describe, expect, it } from '@rstest/core';

import { decodeUtf8, encodeUtf8 } from './text-encoding-polyfill';

describe('UTF-8 text encoding polyfill', () => {
  it('round-trips ASCII, CJK, and astral symbols', () => {
    const value = 'Synara · 线程 · 🦊';
    expect(decodeUtf8(encodeUtf8(value))).toBe(value);
  });

  it('emits the standard UTF-8 byte sequence', () => {
    expect([...encodeUtf8('A€')]).toEqual([0x41, 0xe2, 0x82, 0xac]);
  });
});
