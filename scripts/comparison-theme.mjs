// The theme the comparison launchers store for both renderers (`synara:theme`).
//
// By default that is the bare mode string ("dark"), as the harness always stored it.
// Upstream's `normalizeThemeState` reads a bare mode as an existing store from before
// theme packs and gives it the Codex pack (blue accent), so the default matrix measures
// the Codex pack. `--theme-pack default` stores a complete theme state instead: the
// Synara pack of upstream's `DEFAULT_THEME_STATE`, which is what a fresh install shows
// and what the Lynx generated stylesheets are built from.

export const COMPARISON_THEME_PACKS = Object.freeze(["codex", "default"]);
export const DEFAULT_COMPARISON_THEME_PACK = "codex";

// Upstream's DEFAULT_THEME_STATE (apps/web/src/theme/theme.logic.ts), restated because
// the launchers are plain Node modules. apps/lynx/src/app/comparisonTheme.lynx.test.ts
// fails when upstream's default moves away from this.
const DEFAULT_PACK_THEME_STATE = Object.freeze({
  chromeThemes: {
    dark: {
      accent: "#f2612d",
      contrast: 0,
      fonts: { code: null, ui: null },
      ink: "#fcfcfc",
      opaqueWindows: false,
      semanticColors: { diffAdded: "#00a240", diffRemoved: "#e02e2a", skill: "#b06dff" },
      surface: "#111111",
    },
    light: {
      accent: "#c74614",
      contrast: 0,
      fonts: { code: null, ui: null },
      ink: "#0d0d0d",
      opaqueWindows: false,
      semanticColors: { diffAdded: "#00a240", diffRemoved: "#e02e2a", skill: "#751ed9" },
      surface: "#ffffff",
    },
  },
  codeThemeIds: { dark: "synara", light: "synara" },
  systemUiFont: true,
  translucency: {
    dark: { opacity: 90, blur: 64, sidebarOnly: false },
    light: { opacity: 90, blur: 64, sidebarOnly: false },
  },
});

export function parseComparisonThemePack(value) {
  if (!COMPARISON_THEME_PACKS.includes(value)) {
    throw new Error(`--theme-pack requires ${COMPARISON_THEME_PACKS.join(" or ")}.`);
  }
  return value;
}

/** What both renderers get under `synara:theme` for one mode and pack. */
export function comparisonThemeStorageValue(mode, pack = DEFAULT_COMPARISON_THEME_PACK) {
  if (pack === "codex") return mode;
  parseComparisonThemePack(pack);
  return JSON.stringify({ ...DEFAULT_PACK_THEME_STATE, mode });
}

/** True when a renderer's stored `synara:theme` is still the mode and pack that were seeded. */
export function comparisonThemeIsApplied(stored, mode, pack = DEFAULT_COMPARISON_THEME_PACK) {
  if (pack === "codex") return stored === mode;
  try {
    const state = JSON.parse(stored);
    return (
      state?.mode === mode &&
      state?.chromeThemes?.[mode]?.accent === DEFAULT_PACK_THEME_STATE.chromeThemes[mode].accent &&
      state?.codeThemeIds?.[mode] === DEFAULT_PACK_THEME_STATE.codeThemeIds[mode]
    );
  } catch {
    return false;
  }
}
