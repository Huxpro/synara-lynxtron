import {
  areThemePacksEqual,
  buildThemeCssVariables,
  DEFAULT_THEME_STATE,
  resolveThemePack,
  resolveThemeVariant,
  type ThemePack,
  type ThemeState,
  type ThemeVariant,
} from "@synara-web/theme/theme.logic";

import { evaluateColorMixRecipes } from "../../scripts/color-mix-eval.logic.mjs";
import colorMixManifest from "../generated/nativeColorMix.generated.json";
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

/**
 * Lynx does not resolve a custom property whose value is another `var()` (or a
 * `color-mix()` over one). Upstream leaves a few such values in the table; they are left
 * out here, and `resolveSliceColorMixVariables` supplies each one evaluated.
 */
function concreteThemeVariables(variables: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(variables).filter(([, value]) => !String(value).includes("var(")),
  );
}

const defaultThemePacks: Partial<Record<ThemeVariant, ThemePack>> = {};

function isDefaultThemePack(theme: ThemePack, variant: ThemeVariant): boolean {
  const defaultPack = (defaultThemePacks[variant] ??= resolveThemePack(
    DEFAULT_THEME_STATE,
    variant,
  ));
  return areThemePacksEqual(theme, defaultPack);
}

/**
 * Evaluates every colour-mix recipe of the Native stylesheets against `variables`, the
 * active pack's theme variables: the `--color-mix-*` tokens and the custom properties the
 * stylesheets define as one `color-mix()`. Same recipes and same arithmetic as the
 * build-time generator (scripts/color-mix-eval.logic.mjs); the manifest supplies the
 * properties upstream's table does not carry (base palette, status colours).
 */
export function evaluateSliceColorMixVariables(
  variant: ThemeVariant,
  variables: Readonly<Record<string, string>>,
): Record<string, string> {
  return evaluateColorMixRecipes(
    [
      ...Object.entries(colorMixManifest.named[variant]),
      ...Object.entries(colorMixManifest.tokens),
    ],
    {
      ...colorMixManifest.properties.base,
      ...colorMixManifest.properties[variant],
      ...variables,
    },
  );
}

/**
 * The derived colours for the root inline map. Lynx has no `color-mix()`, so the generated
 * stylesheet holds each recipe evaluated against the default pack; for any other pack the
 * recipes are evaluated here so dividers, focus rings, status tints and accent mixes
 * follow a theme-pack edit. The default pack takes the generator's own values without
 * evaluating anything: that is the only pack the first paint (main thread) can see, since
 * a stored theme arrives from storage on the background thread.
 */
export function resolveSliceColorMixVariables(
  theme: ThemePack,
  variant: ThemeVariant,
  variables: Readonly<Record<string, string>>,
): Record<string, string> {
  return isDefaultThemePack(theme, variant)
    ? colorMixManifest.defaults[variant]
    : evaluateSliceColorMixVariables(variant, variables);
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
  const uiFontFamily = resolveSliceUiFontFamily(themeState, systemDark);
  return {
    ...concreteThemeVariables(variables),
    // After the theme table: a property upstream leaves as a `color-mix()` (dropped just
    // above) gets its evaluated value here.
    ...resolveSliceColorMixVariables(theme, variant, variables),
    "--font-ui-family": uiFontFamily,
    // Web tokens.css: `"Cal Sans", var(--font-ui-family)`, projected concretely for the
    // same nested-fallback reason as the mono stack below.
    "--font-display-family": `"Cal Sans", ${uiFontFamily}`,
    // Lynx Desktop currently leaves nested var() fallbacks unresolved in
    // font-family. Project the concrete stack at the root so every code surface
    // uses the same theme-selected monospace family as Web.
    "--font-mono-family": codeFontFamily,
    "--font-chat-code-family": codeFontFamily,
  };
}
