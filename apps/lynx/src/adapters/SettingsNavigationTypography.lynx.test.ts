import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Lynx Settings navigation typography", () => {
  it("matches the Web section-label typography and height", () => {
    const styles = readFileSync(
      new URL("./settings-navigation-composition-elements.css", import.meta.url),
      "utf8",
    );
    const webStyles = readFileSync(
      new URL("../../../web/src/settingsPanelStyles.ts", import.meta.url),
      "utf8",
    );

    expect(webStyles).toContain("SETTINGS_SECTION_LABEL_CLASS_NAME");
    expect(styles).toMatch(
      /\.SharedSettingsNavigationGroupLabel\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;[^}]*padding:\s*4px 8px;/s,
    );
    expect(styles).toMatch(/\.SharedSettingsNavigationGroupLabel\s*\{[^}]*opacity:\s*0\.58;/s);
    expect(styles).toMatch(/\.SharedSettingsNavigationButton\s*\{[^}]*opacity:\s*0\.95;/s);
    expect(styles).toMatch(/\.SharedSettingsNavigationButton--active\s*\{[^}]*opacity:\s*1;/s);
    expect(styles).toMatch(
      /\.SharedSettingsNavigationButton--active\s*\{[^}]*background-color:\s*var\(--sidebar-accent-active\);/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsNavigationButton\.ui-focus\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px var\(--ring\);/s,
    );
  });
});
