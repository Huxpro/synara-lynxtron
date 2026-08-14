import {
  buildThemeCssVariables,
  resolveThemePack,
  resolveThemeVariant,
  type ThemeState,
  type ThemeVariant,
} from '@synara-web/theme/theme.logic';
import { normalizeFontFamilyCssValue } from '@synara-web/lib/fontFamily';

/**
 * Lynxtron does not currently expose a reliable native appearance event to the
 * product graph. Explicit light/dark modes remain canonical; system mode uses
 * the documented light fallback until that host signal exists.
 */
export function resolveSliceThemeVariant(
  themeState: Pick<ThemeState, 'mode'>,
  systemDark = false
): ThemeVariant {
  return resolveThemeVariant(themeState.mode, systemDark);
}

export function sliceThemeClassName(
  themeState: Pick<ThemeState, 'mode'>,
  systemDark = false
): `SliceRoot--theme-${ThemeVariant}` {
  return `SliceRoot--theme-${resolveSliceThemeVariant(themeState, systemDark)}`;
}

export function resolveSliceUiFontFamily(
  themeState: ThemeState,
  systemDark = false
): string {
  if (themeState.systemUiFont) return 'system-ui';
  const variant = resolveSliceThemeVariant(themeState, systemDark);
  return (
    normalizeFontFamilyCssValue(
      resolveThemePack(themeState, variant).theme.fonts.ui
    ) ?? 'system-ui'
  );
}

export function resolveSliceThemeVariables(
  themeState: ThemeState,
  systemDark = false
): Record<string, string> {
  const variant = resolveSliceThemeVariant(themeState, systemDark);
  return {
    ...buildThemeCssVariables(resolveThemePack(themeState, variant), variant, {
      electron: false,
      isMac: true,
      systemUiFont: themeState.systemUiFont,
    }).variables,
    '--font-ui-family': resolveSliceUiFontFamily(themeState, systemDark),
  };
}
