import { describe, expect, it } from '@rstest/core';
import { DEFAULT_THEME_STATE } from '@synara-web/theme/theme.logic';

import {
  resolveSliceUiFontFamily,
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

  it('uses the system stack when requested and the active theme font otherwise', () => {
    expect(resolveSliceUiFontFamily(DEFAULT_THEME_STATE)).toBe('system-ui');

    const customState = {
      ...DEFAULT_THEME_STATE,
      systemUiFont: false,
      chromeThemes: {
        ...DEFAULT_THEME_STATE.chromeThemes,
        light: {
          ...DEFAULT_THEME_STATE.chromeThemes.light,
          fonts: {
            ...DEFAULT_THEME_STATE.chromeThemes.light.fonts,
            ui: 'IBM Plex Sans',
          },
        },
        dark: {
          ...DEFAULT_THEME_STATE.chromeThemes.dark,
          fonts: {
            ...DEFAULT_THEME_STATE.chromeThemes.dark.fonts,
            ui: 'Inter',
          },
        },
      },
    };

    expect(resolveSliceUiFontFamily(customState, false)).toBe(
      '"IBM Plex Sans"'
    );
    expect(resolveSliceUiFontFamily(customState, true)).toBe('Inter');
    expect(
      resolveSliceUiFontFamily({
        ...customState,
        chromeThemes: {
          ...customState.chromeThemes,
          light: {
            ...customState.chromeThemes.light,
            fonts: { ...customState.chromeThemes.light.fonts, ui: null },
          },
        },
      })
    ).toBe('system-ui');
  });
});
