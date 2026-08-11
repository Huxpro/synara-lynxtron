import { describe, expect, it } from '@rstest/core';

import {
  resolveSliceThemeVariant,
  sliceThemeClassName,
} from './appTheme.logic';

describe('slice root theme projection', () => {
  it('preserves explicit canonical light and dark modes', () => {
    expect(resolveSliceThemeVariant({ mode: 'light' })).toBe('light');
    expect(resolveSliceThemeVariant({ mode: 'dark' })).toBe('dark');
    expect(sliceThemeClassName({ mode: 'dark' })).toBe(
      'SliceRoot--theme-dark'
    );
  });

  it('uses the host appearance signal for system mode', () => {
    expect(resolveSliceThemeVariant({ mode: 'system' })).toBe('light');
    expect(resolveSliceThemeVariant({ mode: 'system' }, true)).toBe('dark');
    expect(sliceThemeClassName({ mode: 'system' })).toBe(
      'SliceRoot--theme-light'
    );
    expect(sliceThemeClassName({ mode: 'system' }, true)).toBe(
      'SliceRoot--theme-dark'
    );
  });
});
