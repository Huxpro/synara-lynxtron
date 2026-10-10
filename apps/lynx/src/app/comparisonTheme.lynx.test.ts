import { describe, expect, it } from "@rstest/core";
import {
  DEFAULT_THEME_STATE,
  normalizeThemeState,
  parseStoredThemeState,
  resolveThemePack,
} from "@synara-web/theme/theme.logic";

// @ts-expect-error The comparison launcher's helper is a plain Node module without types.
import { comparisonThemeStorageValue } from "../../../../scripts/comparison-theme.mjs";

// The comparison launchers restate upstream's DEFAULT_THEME_STATE (they are plain Node
// modules and cannot import it). This fails when upstream's default moves.
describe("comparison harness theme packs", () => {
  it("stores upstream's default theme state for --theme-pack default", () => {
    for (const mode of ["dark", "light"] as const) {
      const stored: string = comparisonThemeStorageValue(mode, "default");
      expect(JSON.parse(stored)).toEqual({ ...DEFAULT_THEME_STATE, mode });
      expect(parseStoredThemeState(stored)).toEqual({ ...DEFAULT_THEME_STATE, mode });
    }
  });

  it("stores the bare mode by default, which upstream reads as the Codex pack", () => {
    const stored: string = comparisonThemeStorageValue("dark");
    expect(stored).toBe("dark");
    expect(parseStoredThemeState(stored)).toEqual(normalizeThemeState({ mode: "dark" }));
    expect(resolveThemePack(parseStoredThemeState(stored), "dark").theme.accent).toBe("#0169cc");
    expect(resolveThemePack(DEFAULT_THEME_STATE, "dark").theme.accent).toBe("#f2612d");
  });
});
