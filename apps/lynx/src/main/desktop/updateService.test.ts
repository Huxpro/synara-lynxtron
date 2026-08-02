import { describe, expect, it } from '@rstest/core';

import { compareVersions } from './update.logic';

describe('compareVersions', () => {
  it('compares numeric components instead of lexicographic text', () => {
    expect(compareVersions('0.10.0', '0.9.9')).toBeGreaterThan(0);
    expect(compareVersions('1.0.0', '1.0')).toBe(0);
  });

  it('treats a stable release as newer than its prerelease', () => {
    expect(compareVersions('1.0.0', '1.0.0-lynx.1')).toBeGreaterThan(0);
  });
});
