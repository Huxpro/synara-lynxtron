import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Settings pressed feedback", () => {
  it("keeps reset and disclosure rows stable", () => {
    const generalStyles = readFileSync(
      new URL("./settings-general-composition-elements.css", import.meta.url),
      "utf8",
    );
    const appearanceStyles = readFileSync(
      new URL("./settings-appearance-composition-elements.css", import.meta.url),
      "utf8",
    );
    const advancedStyles = readFileSync(
      new URL("../app/settings-advanced-panel.css", import.meta.url),
      "utf8",
    );

    for (const [styles, className] of [
      [generalStyles, "SharedSettingsGeneralReset"],
      [appearanceStyles, "SharedSettingsAppearanceReset"],
    ] as const) {
      expect(styles).toMatch(
        new RegExp(
          `\\.${className}\\.ui-pressed\\s*\\{[^}]*background-color:\\s*var\\(--color-background-button-secondary\\);`,
          "s",
        ),
      );
      expect(styles).not.toMatch(
        new RegExp(`\\.${className}\\.ui-pressed\\s*\\{[^}]*opacity:`, "s"),
      );
    }
    expect(advancedStyles).not.toMatch(
      /\.SettingsAdvanced(?:Recovery|Release)Trigger\.ui-pressed\s*\{[^}]*opacity:/s,
    );
  });
});
