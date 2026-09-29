import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { SettingsPanelHeaderRestoreElement } from "./SettingsPanelHeaderCompositionElements.lynx";

describe("native settings panel header restore control", () => {
  it("matches the Web xs button and Rotate2 icon anatomy", () => {
    const styles = readFileSync(
      new URL("./settings-panel-header-composition-elements.css", import.meta.url),
      "utf8",
    );

    render(<SettingsPanelHeaderRestoreElement disabled={false} onRestore={() => undefined} />);

    const button = elementTree.root?.querySelector(".SharedSettingsPanelHeaderRestoreButton");
    const icon = elementTree.root?.querySelector(".SharedSettingsPanelHeaderRestoreIcon");
    if (!button || !icon) throw new Error("expected restore control anatomy");

    expect(button.getAttribute("class")).toContain("LxButton--outline");
    expect(button.getAttribute("class")).toContain("LxButton--xs");
    expect(button.textContent).toBe("Restore defaults");
    expect(icon.getAttribute("content")).toContain("M15 4.55a8 8 0 0 0 -6 14.9m0 -4.45v5h-5");
    expect(styles).toMatch(
      /\.SharedSettingsPanelHeaderRestoreIcon\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*opacity:\s*0\.8;/s,
    );
    expect(styles).toMatch(
      /\.SharedSettingsPanelHeaderRestoreButton\s*\{[^}]*border-radius:\s*6px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsPanelHeader\s*\{[^}]*gap:\s*16px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.SharedSettingsPanelHeaderRestoreButton\s*\{[^}]*width:\s*121\.8125px;[^}]*min-width:\s*121\.8125px;[^}]*height:\s*28px;[^}]*min-height:\s*28px;/s,
    );
  });

  it("preserves restore activation and disabled behavior", () => {
    const onRestore = rs.fn();
    const { unmount } = render(
      <SettingsPanelHeaderRestoreElement disabled={false} onRestore={onRestore} />,
    );

    const enabledButton = elementTree.root?.querySelector(".LxButton");
    if (!enabledButton) throw new Error("expected enabled restore control");
    fireEvent.tap(enabledButton);
    expect(onRestore).toHaveBeenCalledTimes(1);

    unmount();
    render(<SettingsPanelHeaderRestoreElement disabled onRestore={onRestore} />);
    const disabledButton = elementTree.root?.querySelector(".LxButton");
    if (!disabledButton) throw new Error("expected disabled restore control");
    fireEvent.tap(disabledButton);
    expect(onRestore).toHaveBeenCalledTimes(1);
  });
});
