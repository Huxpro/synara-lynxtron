import { describe, expect, it, vi } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";

import { SettingsAppearanceComposition } from "./SettingsAppearanceComposition";
import type { SettingsAppearanceValues } from "./SettingsAppearanceComposition.logic";
import { DEFAULT_THEME_STATE } from "../../theme/theme.logic";

const defaults: SettingsAppearanceValues = {
  themeMode: "system",
  systemUiFont: true,
  uiDensity: "comfortable",
  chatFontSizePx: 14,
  terminalFontSizePx: 12,
  terminalFontFamily: "",
  enableNativeFontSmoothing: true,
  timestampFormat: "locale",
};

describe("SettingsAppearanceComposition", () => {
  it("owns the canonical Appearance rows and reset visibility", () => {
    const markup = renderToStaticMarkup(
      <SettingsAppearanceComposition
        values={{ ...defaults, uiDensity: "compact" }}
        defaults={defaults}
        resolvedTheme="light"
        showFontSmoothing
        showTimestampFormat
        themeState={DEFAULT_THEME_STATE}
        onThemeStateChange={vi.fn()}
        onChange={vi.fn()}
      />,
    );
    expect(markup).toContain("Theme and typography");
    expect(markup).toContain("Use system UI font");
    expect(markup).toContain("Terminal font");
    expect(markup).toContain("Time and reading");
    expect(markup).toContain("Reset ui density to default");
  });
});
