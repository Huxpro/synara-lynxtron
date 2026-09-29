import {
  buildThemeCssVariables,
  resolveThemePack,
  resolveThemeVariant,
  type ThemeState,
  type ThemeVariant,
} from "@synara-web/theme/theme.logic";
import {
  DEFAULT_MONOSPACE_FONT_FAMILY_STACK,
  normalizeFontFamilyCssValue,
  normalizeMonospaceFontFamilyCssValue,
} from "@synara-web/lib/fontFamily";

/** Resolve the shared theme mode against the host-provided system appearance. */
export function resolveSliceThemeVariant(
  themeState: Pick<ThemeState, "mode">,
  systemDark = false,
): ThemeVariant {
  return resolveThemeVariant(themeState.mode, systemDark);
}

export function sliceThemeClassName(
  themeState: Pick<ThemeState, "mode">,
  systemDark = false,
): `SliceRoot--theme-${ThemeVariant}` {
  return `SliceRoot--theme-${resolveSliceThemeVariant(themeState, systemDark)}`;
}

export function resolveSliceUiFontFamily(themeState: ThemeState, systemDark = false): string {
  if (themeState.systemUiFont) return "system-ui";
  const variant = resolveSliceThemeVariant(themeState, systemDark);
  return (
    normalizeFontFamilyCssValue(resolveThemePack(themeState, variant).theme.fonts.ui) ?? "system-ui"
  );
}

export function resolveSliceCodeFontFamily(themeState: ThemeState, systemDark = false): string {
  const variant = resolveSliceThemeVariant(themeState, systemDark);
  return (
    normalizeMonospaceFontFamilyCssValue(resolveThemePack(themeState, variant).theme.fonts.code) ??
    DEFAULT_MONOSPACE_FONT_FAMILY_STACK
  );
}

export function resolveSliceThemeVariables(
  themeState: ThemeState,
  systemDark = false,
): Record<string, string> {
  const variant = resolveSliceThemeVariant(themeState, systemDark);
  const codeFontFamily = resolveSliceCodeFontFamily(themeState, systemDark);
  const theme = resolveThemePack(themeState, variant);
  const variables = buildThemeCssVariables(theme, variant, {
    electron: false,
    isMac: true,
    systemUiFont: themeState.systemUiFont,
  }).variables;
  return {
    ...variables,
    "--font-ui-family": resolveSliceUiFontFamily(themeState, systemDark),
    // Lynx Desktop currently leaves nested var() fallbacks unresolved in
    // font-family. Project the concrete stack at the root so every code surface
    // uses the same theme-selected monospace family as Web.
    "--font-mono-family": codeFontFamily,
    "--font-chat-code-family": codeFontFamily,
  };
}
