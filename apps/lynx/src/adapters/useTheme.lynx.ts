import { useEffect, useState } from '@lynx-js/react';
import {
  DEFAULT_THEME_STATE,
  buildResolvedThemeTokens,
  resolveThemePack,
  resolveTextForegroundSecondary,
  resolveThemeVariant,
  serializeThemeState,
  setThemeCodeThemeId,
  type ThemeMode,
  type ThemeState,
  type ThemeVariant,
} from '@synara-web/theme/theme.logic';
import { THEME_STORAGE_KEY } from '@synara-web/appSettingsStorageProjection.logic';
import {
  DEFAULT_MONOSPACE_FONT_FAMILY_STACK,
  normalizeMonospaceFontFamilyCssValue,
} from '@synara-web/lib/fontFamily';
import {
  resolveSemanticIconTone,
  type SemanticIconPalette,
  type SemanticIconTone,
} from '@synara/shared/semanticIconTone';

let currentThemeState = DEFAULT_THEME_STATE;
let currentSystemDark = false;
const listeners = new Set<(state: ThemeState) => void>();

function withOpacity(color: string, opacity: number): string {
  const hexMatch = /^#([0-9a-f]{2})([0-9a-f]{2})([0-9a-f]{2})$/i.exec(
    color
  );
  if (hexMatch) {
    return `rgba(${Number.parseInt(hexMatch[1], 16)}, ${Number.parseInt(
      hexMatch[2],
      16
    )}, ${Number.parseInt(hexMatch[3], 16)}, ${opacity})`;
  }
  const rgbMatch = /^rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i.exec(
    color
  );
  if (!rgbMatch) return color;
  return `rgba(${rgbMatch[1]}, ${rgbMatch[2]}, ${rgbMatch[3]}, ${opacity})`;
}

function scaleOpacity(color: string, multiplier: number): string {
  const rgbaMatch = /^rgba\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*,\s*([0-9.]+)\s*\)$/i.exec(
    color
  );
  if (!rgbaMatch) return withOpacity(color, multiplier);
  return `rgba(${rgbaMatch[1]}, ${rgbaMatch[2]}, ${rgbaMatch[3]}, ${
    Number(rgbaMatch[4]) * multiplier
  })`;
}

export function setLynxThemeState(
  state: ThemeState,
  systemDark = currentSystemDark
): void {
  currentThemeState = state;
  currentSystemDark = systemDark;
  for (const listener of listeners) listener(state);
}

export function subscribeLynxThemeState(
  listener: (state: ThemeState) => void
): () => void {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

function updateLynxThemeState(
  update: (state: ThemeState) => ThemeState
): void {
  const next = update(currentThemeState);
  setLynxThemeState(next);
  void import(/* webpackMode: "eager" */ '../platform/storage')
    .then(({ setPersistedStorageItem }) =>
      setPersistedStorageItem(THEME_STORAGE_KEY, serializeThemeState(next))
    )
    .catch(() => {
      // The live theme remains applied. Settings hydration exposes storage
      // failures through its own retry surface.
    });
}

export function useTheme() {
  const [themeState, setThemeState] = useState(currentThemeState);

  useEffect(() => {
    'background only';
    return subscribeLynxThemeState(setThemeState);
  }, []);

  const resolvedTheme = resolveThemeVariant(themeState.mode, currentSystemDark);
  const activeTheme = resolveThemePack(themeState, resolvedTheme);
  const codeFontFamily =
    normalizeMonospaceFontFamilyCssValue(activeTheme.theme.fonts.code) ??
    DEFAULT_MONOSPACE_FONT_FAMILY_STACK;
  const resolvedTokens = buildResolvedThemeTokens(activeTheme, resolvedTheme);
  const semanticIconPalette: SemanticIconPalette = {
    accent: resolvedTokens.derived.iconAccent,
    disabled: resolvedTokens.aliases['--color-token-disabled-foreground'],
    inverse: resolvedTokens.derived.textButtonPrimary,
    primary: resolvedTokens.derived.iconPrimary,
    secondary: resolvedTokens.derived.iconSecondary,
    tertiary: resolvedTokens.derived.iconTertiary,
  };
  const statusSurfaceOpacity = resolvedTheme === 'dark' ? 0.16 : 0.08;
  const alertSurfaceOpacity = 0.04;
  const alertBorderOpacity = 0.32;
  const warningColor = resolvedTheme === 'dark' ? '#f5b44a' : '#d97706';
  const errorColor = activeTheme.theme.semanticColors.diffRemoved;
  const infoColor = activeTheme.theme.accent;
  const successColor = activeTheme.theme.semanticColors.diffAdded;
  return {
    activeTheme,
    codeFontFamily,
    resolvedTheme,
    svgColors: {
      foreground: activeTheme.theme.ink,
      foreground65: withOpacity(activeTheme.theme.ink, 0.65),
      foreground80: withOpacity(activeTheme.theme.ink, 0.8),
      mutedForeground: withOpacity(activeTheme.theme.ink, 0.6),
      placeholderForeground: scaleOpacity(
        resolvedTokens.derived.textForegroundSecondary,
        0.72
      ),
      mutedForeground55: withOpacity(activeTheme.theme.ink, 0.33),
      mutedForeground70: withOpacity(activeTheme.theme.ink, 0.42),
      mutedForeground80: withOpacity(activeTheme.theme.ink, 0.48),
      iconAccent: semanticIconPalette.accent,
      iconPrimary: semanticIconPalette.primary,
      iconSecondary: semanticIconPalette.secondary,
      iconTertiary: semanticIconPalette.tertiary,
      inverse: semanticIconPalette.inverse,
      disabled: semanticIconPalette.disabled,
      statusError: resolvedTokens.status.error,
      statusErrorSurface: withOpacity(
        errorColor,
        statusSurfaceOpacity
      ),
      statusInfoSurface: withOpacity(
        infoColor,
        statusSurfaceOpacity
      ),
      statusNeutral: resolvedTokens.status.neutral,
      statusSuccessSurface: withOpacity(
        successColor,
        statusSurfaceOpacity
      ),
      statusWarningSurface: withOpacity(
        warningColor,
        statusSurfaceOpacity
      ),
      alertErrorBorder: withOpacity(errorColor, alertBorderOpacity),
      alertErrorSurface: withOpacity(errorColor, alertSurfaceOpacity),
      alertInfoBorder: withOpacity(infoColor, alertBorderOpacity),
      alertInfoSurface: withOpacity(infoColor, alertSurfaceOpacity),
      alertSuccessBorder: withOpacity(successColor, alertBorderOpacity),
      alertSuccessSurface: withOpacity(successColor, alertSurfaceOpacity),
      alertWarningBorder: withOpacity(warningColor, alertBorderOpacity),
      alertWarningSurface: withOpacity(warningColor, alertSurfaceOpacity),
      formControlSurface:
        resolvedTheme === 'dark'
          ? withOpacity(resolvedTokens.derived.controlBackgroundOpaque, 0.32)
          : resolvedTokens.computed.surfaceUnder,
      secondaryForeground: resolveTextForegroundSecondary(
        activeTheme.theme,
        resolvedTheme
      ),
      surface: activeTheme.theme.surface,
      warning: warningColor,
    },
    semanticIconColor: (tone: SemanticIconTone) =>
      resolveSemanticIconTone(tone, semanticIconPalette),
    theme: themeState.mode,
    setTheme: (mode: ThemeMode) =>
      updateLynxThemeState((state) => ({ ...state, mode })),
    setCodeThemeId: (variant: ThemeVariant, codeThemeId: string) =>
      updateLynxThemeState((state) =>
        setThemeCodeThemeId(state, variant, codeThemeId)
      ),
  } as const;
}
