import { describe, expect, it } from "vitest";

import {
  comparisonThemeIsApplied,
  comparisonThemeStorageValue,
  parseComparisonThemePack,
} from "./comparison-theme.mjs";
import {
  comparisonRendererResetExpression,
  DEFAULT_DESKTOP_COMPARISON_OPTIONS,
  parseDesktopComparisonArgs,
} from "./dev-electron-lynxtron.mjs";
import { DEFAULT_WEB_COMPARISON_OPTIONS, parseWebComparisonArgs } from "./comparison-web.mjs";

describe("comparison theme pack", () => {
  it("stores the bare mode by default, so the existing matrix measures what it always did", () => {
    expect(DEFAULT_DESKTOP_COMPARISON_OPTIONS.themePack).toBe("codex");
    expect(DEFAULT_WEB_COMPARISON_OPTIONS.themePack).toBe("codex");
    expect(parseDesktopComparisonArgs(["--theme", "light"]).themePack).toBe("codex");
    expect(comparisonThemeStorageValue("dark")).toBe("dark");
    expect(comparisonThemeStorageValue("light", "codex")).toBe("light");
    expect(comparisonRendererResetExpression(comparisonThemeStorageValue("dark"))).toBe(
      comparisonRendererResetExpression("dark"),
    );
  });

  it("stores a complete theme state for the default pack", () => {
    expect(parseDesktopComparisonArgs(["--theme-pack", "default"]).themePack).toBe("default");
    expect(parseWebComparisonArgs(["--theme-pack", "default"], {}).themePack).toBe("default");
    const stored = JSON.parse(comparisonThemeStorageValue("dark", "default"));
    expect(stored.mode).toBe("dark");
    expect(stored.chromeThemes.dark.accent).toBe("#f2612d");
    expect(stored.chromeThemes.light.accent).toBe("#c74614");
    expect(stored.codeThemeIds).toEqual({ dark: "synara", light: "synara" });
    expect(
      comparisonRendererResetExpression(comparisonThemeStorageValue("dark", "default")),
    ).toContain(`localStorage.setItem('synara:theme', ${JSON.stringify(JSON.stringify(stored))})`);
  });

  it("rejects an unknown pack", () => {
    expect(() => parseComparisonThemePack("solarized")).toThrow(
      "--theme-pack requires codex or default.",
    );
    expect(() => comparisonThemeStorageValue("dark", "solarized")).toThrow();
  });

  it("recognises the seeded theme after a renderer rewrote its store", () => {
    expect(comparisonThemeIsApplied("dark", "dark")).toBe(true);
    expect(comparisonThemeIsApplied("light", "dark")).toBe(false);
    const stored = JSON.parse(comparisonThemeStorageValue("light", "default"));
    // Key order and extra fields are the renderer's business.
    const rewritten = JSON.stringify({ translucency: stored.translucency, ...stored, extra: 1 });
    expect(comparisonThemeIsApplied(rewritten, "light", "default")).toBe(true);
    expect(comparisonThemeIsApplied("light", "light", "default")).toBe(false);
    expect(
      comparisonThemeIsApplied(
        JSON.stringify({
          ...stored,
          chromeThemes: { ...stored.chromeThemes, light: { accent: "#0169cc" } },
        }),
        "light",
        "default",
      ),
    ).toBe(false);
  });
});
