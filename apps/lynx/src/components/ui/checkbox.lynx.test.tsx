import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { render } from "@lynx-js/react/testing-library";
import { DEFAULT_THEME_STATE } from "@synara-web/theme/theme.logic";

import { setLynxThemeState } from "../../adapters/useTheme.lynx";
import { CheckboxIndicator } from "./checkbox.lynx";

describe("CheckboxIndicator", () => {
  it("uses the Electron light-border token for its unselected outline", () => {
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.LxCheckboxIndicator\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--color-border-light\);[^}]*border-right-color:\s*var\(--color-border-light\);[^}]*border-bottom-color:\s*var\(--color-border-light\);[^}]*border-left-color:\s*var\(--color-border-light\);/s,
    );
    expect(styles).toMatch(
      /\.LxCheckboxIndicator--selected\s*\{[^}]*border-top-color:\s*var\(--primary\);[^}]*border-right-color:\s*var\(--primary\);[^}]*border-bottom-color:\s*var\(--primary\);[^}]*border-left-color:\s*var\(--primary\);/s,
    );
  });

  it("uses the Electron dark unchecked control surface", () => {
    setLynxThemeState({ ...DEFAULT_THEME_STATE, mode: "dark" });
    render(<CheckboxIndicator />);
    expect(
      elementTree.root?.querySelector(".LxCheckboxIndicator")?.getAttribute("style"),
    ).toContain("background-color: rgba(23, 23, 23, 0.32)");
    setLynxThemeState(DEFAULT_THEME_STATE);
  });

  it("renders the shared selected visual", () => {
    render(<CheckboxIndicator checked />);
    expect(elementTree.root?.querySelector(".LxCheckboxIndicator--selected")).not.toBeNull();
    expect(elementTree.root?.querySelector(".LxCheckboxIndicatorIcon")).not.toBeNull();
  });

  it("renders the compact mixed visual without pretending to own interaction", () => {
    render(<CheckboxIndicator mixed size="sm" />);
    expect(elementTree.root?.querySelector(".LxCheckboxIndicator--sm")).not.toBeNull();
    expect(elementTree.root?.querySelector(".LxCheckboxIndicator--mixed")).not.toBeNull();
    expect(elementTree.root?.querySelector(".LxCheckboxIndicatorMixedBar")).not.toBeNull();
    expect(
      elementTree.root?.querySelector(".LxCheckboxIndicator")?.getAttribute("accessibility-role"),
    ).toBeNull();
  });
});
