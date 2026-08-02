import {
  resolveThemeVariant,
  type ThemeState,
  type ThemeVariant,
} from '@synara-web/theme/theme.logic';

/**
 * Lynxtron does not currently expose a reliable native appearance event to the
 * product graph. Explicit light/dark modes remain canonical; system mode uses
 * the documented light fallback until that host signal exists.
 */
export function resolveSliceThemeVariant(
  themeState: Pick<ThemeState, 'mode'>
): ThemeVariant {
  return resolveThemeVariant(themeState.mode, false);
}

export function sliceThemeClassName(
  themeState: Pick<ThemeState, 'mode'>
): `SliceRoot--theme-${ThemeVariant}` {
  return `SliceRoot--theme-${resolveSliceThemeVariant(themeState)}`;
}
