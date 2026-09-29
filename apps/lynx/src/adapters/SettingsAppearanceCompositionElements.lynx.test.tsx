import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { filterTerminalFontSuggestions } from "./SettingsAppearanceCompositionElements.lynx";

describe("Settings Appearance fidelity", () => {
  it("matches the shared Web section and row anatomy", () => {
    const source = readFileSync(
      new URL("./SettingsAppearanceCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./settings-appearance-composition-elements.css", import.meta.url),
      "utf8",
    );
    const composition = readFileSync(
      new URL(
        "../../../web/src/components/settings/SettingsAppearanceComposition.tsx",
        import.meta.url,
      ),
      "utf8",
    );
    const appStyles = readFileSync(new URL("../app/App.css", import.meta.url), "utf8");
    const primitiveStyles = readFileSync(
      new URL("../components/ui/primitives.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(/\.SharedSettingsAppearanceRoot\s*\{[^}]*gap:\s*24px;/s);
    expect(styles).toMatch(/\.SharedSettingsAppearanceSection\s*\{[^}]*gap:\s*6px;/s);
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSectionTitle\s*\{[^}]*padding:\s*4px 8px;[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRow\s*\{[^}]*padding:\s*var\(--app-density-settings-row-padding-y,\s*0\.625rem\) 12px;/s,
    );
    expect(styles).not.toMatch(/\.SharedSettingsAppearanceRow\s*\{[^}]*min-height:/s);
    expect(source).toContain('props.terminal ? " SharedSettingsAppearanceRow--terminal" : ""');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRow--terminal\s*\{[^}]*border-bottom-width:\s*0;/s,
    );
    expect(composition).toContain("terminal={terminal}");
    expect(composition).toContain("!props.showFontSmoothing");
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowTitle\s*\{[^}]*font-size:\s*var\(--type-settings-row-title-size\);[^}]*line-height:\s*var\(--type-settings-row-title-line-height\);/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceRowDescription,\s*\.SharedSettingsAppearanceSuffix\s*\{[^}]*font-size:\s*var\(--type-settings-row-description-size\);[^}]*line-height:\s*var\(--type-settings-row-description-line-height\);/s,
    );
    expect(source).toContain("THEME_OPTION_ICONS");
    expect(source).toContain("SunIcon");
    expect(source).toContain("MoonIcon");
    expect(source).toContain("DeviceLaptopIcon");
    expect(source).toContain('<text className="LxButton__text">{option.label}</text>');
    expect(primitiveStyles).toMatch(
      /\.LxSwitch\s*\{[^}]*width:\s*32px;[^}]*height:\s*20px;[^}]*border:\s*1px solid var\(--settings-switch-border\);/s,
    );
    expect(source).toContain('role="radiogroup"');
    expect(source).toContain('role="radio"');
    expect(source).toContain("aria-checked={active}");
    expect(source).toContain('import { Switch } from "../components/ui/switch.lynx";');
    expect(source).toContain(`<Switch
      checked={props.checked}`);
    expect(source).toContain('"accessibility-state": { selected: active }');
    expect(source).toContain('"accessibility-role": "radio"');
    expect(source).toContain("SharedSettingsAppearanceSegment--inactive");
    expect(source).toContain('Icon ? "" : " SharedSettingsAppearanceSegment--text-only"');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSegment--text-only\s*\{[^}]*padding-left:\s*9px;[^}]*padding-right:\s*9px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSegment--inactive \.LxButton__text\s*\{[^}]*color:\s*var\(--muted-foreground\);/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-light\s*\{[^}]*--settings-row-label-strong:\s*rgba\(13,\s*13,\s*13,\s*0\.9\);/s,
    );
    expect(appStyles).toMatch(
      /\.SliceRoot--theme-dark\s*\{[^}]*--settings-row-label-strong:\s*rgba\(252,\s*252,\s*252,\s*0\.9\);/s,
    );
    expect(source).toContain('size="sm"');
    expect(source).toContain('variant="soft"');
    expect(source.match(/<Input\s+nativeInput/g)).toHaveLength(2);
    expect(source).toContain("size={16}");
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSegmentIcon\s*\{[^}]*width:\s*16px;[^}]*height:\s*16px;[^}]*margin-left:\s*-1px;[^}]*margin-right:\s*-1px;[^}]*opacity:\s*0\.8;/s,
    );
    expect(source).toContain("const value = event.target.value.trim();");
    expect(source).toContain("if (value) props.onChange(Number(value));");
    expect(styles).toMatch(/\.SharedSettingsAppearanceInputLine\s*\{[^}]*gap:\s*8px;/s);
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceInputLine \.LxInputControl\s*\{[^}]*width:\s*80px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceInputLine \.LxInput\s*\{[^}]*text-align:\s*right;/s,
    );
    expect(source).toContain("onFocus={() => setOpen(true)}");
    expect(source).toContain('className="SharedSettingsAppearanceFontTrigger" passive');
    expect(source).toContain('props.onChange("");');
    expect(source).toContain("No matching suggested fonts.");
    expect(source).toContain("<MenuItem");
    expect(source).toContain("onClick={() => props.onChange(suggestion)}");
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceFontTrigger,\s*\.SharedSettingsAppearanceFontInput\s*\{[^}]*width:\s*224px;/s,
    );
    expect(styles).toMatch(/\.SharedSettingsAppearanceFontPopup\s*\{[^}]*width:\s*224px;/s);
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.SharedSettingsAppearanceFontPopup\s*\{[^}]*height:\s*calc\(100vh - 16px\);[^}]*max-height:\s*calc\(100vh - 16px\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.SharedSettingsAppearanceFontList\s*\{[^}]*max-height:\s*none;[^}]*flex:\s*1;[^}]*min-height:\s*0;[^}]*overflow-y:\s*scroll;/s,
    );
    expect(source).toContain('className="SharedSettingsAppearanceSelectLabel"');
    expect(source).toContain('className="SharedSettingsAppearanceSelectChevron"');
    expect(source).toContain("<MenuTrigger ariaLabel={props.ariaLabel}>");
    expect(source).toContain('buttonProps={{ "accessibility-element": false }}');
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSelect\s*\{[^}]*width:\s*160px;[^}]*justify-content:\s*flex-start;[^}]*gap:\s*8px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSelectLabel\s*\{[^}]*font-size:\s*12px;[^}]*text-align:\s*left;[^}]*text-overflow:\s*ellipsis;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceSelectChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.5;/s,
    );
    expect(source).toContain('color="var(--foreground)"');
    expect(styles).toMatch(/\.SharedSettingsAppearanceSelectPopup\s*\{[^}]*width:\s*160px;/s);
    expect(styles).toMatch(
      /\.SharedSettingsAppearanceFontAction\.ui-hover,[^{]*\{[^}]*opacity:\s*1;/s,
    );
    expect(styles).not.toMatch(
      /\.SharedSettingsAppearanceFontAction\.ui-(?:hover|focus|pressed)[^{]*\{[^}]*background-color:/s,
    );
  });

  it("filters the shared terminal font suggestions without restricting free-form values", () => {
    expect(filterTerminalFontSuggestions(" fIrA ")).toEqual(["Fira Code"]);
    expect(filterTerminalFontSuggestions("")).toContain("JetBrains Mono");
    expect(filterTerminalFontSuggestions("not-a-font")).toEqual([]);
  });

  it("stacks private Appearance rows and fluid controls at compact widths", () => {
    const styles = readFileSync(
      new URL("./settings-appearance-composition-elements.css", import.meta.url),
      "utf8",
    );

    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsAppearanceRow\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;[^}]*gap:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsAppearanceRowCopy\s*\{[^}]*padding-right:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsAppearanceControl\s*\{[^}]*width:\s*100%;[^}]*justify-content:\s*flex-start;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsAppearanceFontTrigger,\s*\.SliceRoot--viewport-compact \.SharedSettingsAppearanceFontInput,\s*\.SliceRoot--viewport-compact \.SharedSettingsAppearanceSelect\s*\{[^}]*width:\s*100%;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsAppearanceRow\s*\{[^}]*flex-direction:\s*row;[^}]*align-items:\s*center;[^}]*gap:\s*0;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsAppearanceControl\s*\{[^}]*width:\s*auto;[^}]*justify-content:\s*flex-end;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsAppearanceFontTrigger,\s*\.SliceRoot--viewport-sm-up \.SharedSettingsAppearanceFontInput\s*\{[^}]*width:\s*224px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-sm-up \.SharedSettingsAppearanceSelect\s*\{[^}]*width:\s*160px;/s,
    );
  });
});
