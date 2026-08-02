import { describe, expect, it } from '@rstest/core';

import {
  resolveSliceUiDensity,
  sliceUiDensityClassName,
} from './appDensity.logic';

describe('slice UI density', () => {
  it('uses the canonical Web density taxonomy and comfortable fallback', () => {
    expect(resolveSliceUiDensity('compact')).toBe('compact');
    expect(resolveSliceUiDensity('comfortable')).toBe('comfortable');
    expect(resolveSliceUiDensity('spacious')).toBe('spacious');
    expect(resolveSliceUiDensity('dense')).toBe('comfortable');
  });

  it('produces the stable root class consumed by the Lynx CSS adapter', () => {
    expect(sliceUiDensityClassName('compact')).toBe(
      'SliceRoot--density-compact'
    );
    expect(sliceUiDensityClassName(undefined)).toBe(
      'SliceRoot--density-comfortable'
    );
  });
});
