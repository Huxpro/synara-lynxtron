import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { SettingsSidebarSearchUnavailableElement } from "./SettingsSidebarChromeCompositionElements.lynx";

describe("Lynx Settings search input", () => {
  it("exposes the unavailable placeholder as a disabled Native search element", () => {
    render(
      <SettingsSidebarSearchUnavailableElement>
        Search settings
      </SettingsSidebarSearchUnavailableElement>,
    );

    const search = elementTree.root?.querySelector(".SharedSettingsSidebarSearchUnavailable");
    expect(search?.getAttribute("focusable")).toBe("false");
    expect(search?.getAttribute("accessibility-element")).toBe("true");
    expect(search?.getAttribute("accessibility-label")).toBe("Search settings unavailable");
    expect(search?.getAttribute("accessibility-trait")).toBe("search");
    expect(search?.getAttribute("accessibility-state")).toBe('{"disabled":true}');
  });

  it("uses an uncontrolled native input to avoid per-keystroke ACK loss", () => {
    const source = readFileSync(
      new URL("./SettingsSidebarChromeCompositionElements.lynx.tsx", import.meta.url),
      "utf8",
    );

    expect(source).toContain("const inputRef = useRef<InputRef>(null)");
    expect(source).toContain("defaultValue={props.value}");
    expect(source).not.toContain("value={props.value}");
    expect(source).toContain('size="sm"');
    expect(source).toContain('variant="soft"');
    expect(source).toContain("inputRef.current?.setValue('')");
    expect(source).toContain("onChange={(event) => props.onValueChange?.(event.target.value)}");
  });

  it("matches the Web back-row label weight", () => {
    const styles = readFileSync(
      new URL("./settings-sidebar-chrome-composition-elements.css", import.meta.url),
      "utf8",
    );
    const webStyles = readFileSync(
      new URL("../../../web/src/sidebarRowStyles.ts", import.meta.url),
      "utf8",
    );

    expect(webStyles).toContain("font-normal");
    expect(styles).toMatch(
      /\.SharedSettingsSidebarBackLabel\s*\{[^}]*font-size:\s*12px;[^}]*font-weight:\s*400;[^}]*line-height:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearch\s*>\s*\.SharedSettingsSidebarSearchIcon\s*\{[^}]*opacity:\s*0\.7;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearchInput\s*\{[^}]*padding-left:\s*32px;[^}]*padding-right:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearchInput > \.LxInput\s*\{[^}]*height:\s*26px;[^}]*padding-top:\s*5px;[^}]*padding-bottom:\s*5px;[^}]*line-height:\s*16px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarSearch\s*>\s*\.SharedSettingsSidebarSearchIcon\s*\{[^}]*left:\s*10px;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsSidebarBackButton\.ui-focus\s*\{[^}]*box-shadow:\s*inset 0 0 0 1px var\(--ring\);/s,
    );
    expect(styles).toMatch(/\.SharedSettingsSidebarBackButton\s*\{[^}]*opacity:\s*0\.95;/s);
    expect(styles).toMatch(
      /\.SharedSettingsSidebarBackButton\.ui-hover,\s*\.SharedSettingsSidebarBackButton\.ui-pressed\s*\{[^}]*opacity:\s*1;/s,
    );
    expect(styles).not.toMatch(
      /\.SharedSettingsSidebarBackButton\.ui-pressed[^{]*\{[^}]*opacity:\s*0\.8;/s,
    );
  });
});
