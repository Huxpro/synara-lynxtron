import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  serializeThemeState,
  setWindowTranslucency,
  updateChromeTheme,
} from "@synara-web/theme/theme.logic";
import { resolveSliceThemeVariables } from "./appTheme.logic";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");

describe("Appearance panel (upstream order)", () => {
  const panel = read("./SettingsAppearancePanel.lynx.tsx");
  const editor = read("./ThemePackEditor.lynx.tsx");

  it("opens on the Theme section: reset action, mode picker, then the pack editors", () => {
    const reset = panel.indexOf("<ThemeSectionResetButton");
    const picker = panel.indexOf('accessibility-label="Theme preference"');
    const packs = panel.indexOf("<SettingsAppearanceThemePacksElement>");
    const typography = panel.indexOf('title="Typography and spacing"');
    const systemFont = panel.indexOf('"Use system UI font"');

    expect(reset).toBeGreaterThan(0);
    expect(reset).toBeLessThan(picker);
    expect(picker).toBeLessThan(packs);
    expect(packs).toBeLessThan(typography);
    // Upstream moved the font switch under Typography and spacing.
    expect(typography).toBeLessThan(systemFont);
    expect(panel).toContain('values.themeMode !== "system"');
    expect(panel).toContain('accessibleLabel: "Reset theme to default"');
    // The radios keep the "<group>: <option>" names the settings workflow taps.
    expect(panel).toContain("const label = `Theme preference: ${props.choice.label}`;");
    expect(panel).toContain('ariaLabel="UI density"');
  });

  it("edits theme state only through upstream's reducers", () => {
    for (const reducer of [
      "updateThemePackFromShareString(themeState, value, variant)",
      "resetThemeVariant(themeState, variant)",
      "updateChromeTheme(themeState, variant, patch)",
      "setThemeFonts(themeState, variant, patch)",
      "setWindowTranslucency(themeState, variant, patch)",
    ]) {
      expect(panel).toContain(reducer);
    }
  });

  it("renders the editor in upstream's row order with upstream's labels", () => {
    const order = [
      "<ThemePackHeaderElement>",
      'className="SharedThemePackContextRow"',
      "accessibility-label={`${title} preview: ${model.codeThemeLabel}`}",
      '<ThemePackRowElement label="Accent">',
      '<ThemePackRowElement label="Background">',
      '<ThemePackRowElement label="Foreground">',
      '<ThemePackRowElement label="UI font">',
      "Use system UI font is on; theme fonts are not applied.",
      '<ThemePackRowElement label="Code font">',
      '<ThemePackRowElement label="Window">',
      '<ThemePackRowElement label="Sidebar only">',
      '<ThemePackRowElement label="Opacity">',
      '<ThemePackRowElement label="Blur">',
      '<ThemePackRowElement label="Contrast">',
    ].map((marker) => editor.indexOf(marker));

    expect(order.every((index) => index > 0)).toBe(true);
    expect(order).toEqual([...order].sort((left, right) => left - right));
    for (const label of [
      "`${title} window material`",
      "`${title} translucent sidebar only`",
      "`${title} translucency opacity`",
      "`${title} background blur`",
      "`${title} contrast`",
    ]) {
      expect(editor).toContain(label);
    }
  });

  it("says window translucency is not rendered by the Native app", () => {
    expect(editor).toContain(
      "Window translucency is not available in the Native app yet. These settings are saved and apply in the Electron app.",
    );
    expect(editor).toContain("{WINDOW_TRANSLUCENCY_UNAVAILABLE_COPY}");
  });

  it("paints the preview from resolved tokens, not scoped custom properties", () => {
    expect(editor).toContain("buildResolvedThemeTokens(props.pack, props.variant).codexVariables");
    expect(editor).toContain('backgroundColor: preview["--color-background-surface"]');
    expect(editor).toContain('backgroundColor: preview["--color-background-accent"]');
    expect(editor).not.toContain("previewVariables");
  });

  it("matches upstream's measured editor geometry", () => {
    const styles = read("../adapters/theme-pack-editor-composition-elements.css");
    const panelStyles = read("./settings-appearance-panel.css");

    expect(styles).toMatch(/\.SharedThemePackContextRow\s*\{[^}]*min-height:\s*30px;/s);
    expect(styles).toMatch(/\.SharedThemePackPreviewRow\s*\{[^}]*padding:\s*0 16px 12px;/s);
    expect(styles).toMatch(/\.SharedThemePackPreview\s*\{[^}]*padding:\s*12px;/s);
    expect(styles).toMatch(
      /\.LxButton\.SharedThemePackColorReset\s*\{[^}]*width:\s*22px;[^}]*height:\s*22px;/s,
    );
    expect(styles).toMatch(/\.SharedThemePackContrastValue\s*\{[^}]*width:\s*40px;/s);
    expect(panelStyles).toMatch(/\.SettingsThemeSectionHeader\s*\{[^}]*height:\s*27\.5px;/s);
    expect(panelStyles).toMatch(/\.SettingsThemeModePicker\s*\{[^}]*gap:\s*12px;/s);
    expect(panelStyles).toMatch(/\.SettingsThemeModeMockup\s*\{[^}]*aspect-ratio:\s*10 \/ 7;/s);
  });
});

describe("Theme pack edits reach the app", () => {
  it("projects an edited pack into the root theme variables", () => {
    const edited = updateChromeTheme({ ...DEFAULT_THEME_STATE, mode: "dark" }, "dark", {
      accent: "#ff5500",
      surface: "#101820",
    });
    const before = resolveSliceThemeVariables({ ...DEFAULT_THEME_STATE, mode: "dark" });
    const after = resolveSliceThemeVariables(edited);

    expect(after["--background"]).not.toBe(before["--background"]);
    expect(after["--color-text-accent"]).not.toBe(before["--color-text-accent"]);
    expect(after["--ring"]).not.toBe(before["--ring"]);
    // The ink did not change, so neither does what derives from it.
    expect(after["--foreground"]).toBe(before["--foreground"]);
    // Concrete values only: Lynx does not resolve a custom property that is another var(),
    // so those few upstream entries are left to the generated stylesheet.
    expect(Object.values(after).some((value) => String(value).includes("var("))).toBe(false);
    expect(after["--app-overlay-surface"]).toBeUndefined();
  });

  it("turns inline custom properties on, which the root theme variables need", () => {
    expect(read("../../lynx.config.ts")).toContain("enableCSSInlineVariables: true,");
    expect(read("./App.tsx")).toContain("style={themeVariables}");
  });

  it("round-trips translucency through the stored theme state", () => {
    const edited = setWindowTranslucency(DEFAULT_THEME_STATE, "dark", {
      opacity: 40,
      sidebarOnly: true,
    });
    const restored = parseStoredThemeState(serializeThemeState(edited));

    expect(restored.translucency.dark).toMatchObject({ opacity: 40, sidebarOnly: true });
    expect(restored.translucency.light).toEqual(DEFAULT_THEME_STATE.translucency.light);
  });
});
