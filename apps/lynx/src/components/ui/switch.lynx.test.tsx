import { describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";
import { fireEvent, render } from "@lynx-js/react/testing-library";

import { Switch } from "./switch.lynx";

describe("Switch", () => {
  it("publishes checked and disabled accessibility state", () => {
    render(<Switch checked disabled ariaLabel="Notifications" onCheckedChange={() => {}} />);
    const control = elementTree.root?.querySelector(".LxSwitch");
    expect(control?.getAttribute("accessibility-role")).toBe("switch");
    expect(control?.getAttribute("accessibility-state")).toBe('{"checked":true,"disabled":true}');
  });

  it("toggles through the shared activation path", () => {
    const onCheckedChange = rs.fn();
    render(<Switch checked={false} ariaLabel="Notifications" onCheckedChange={onCheckedChange} />);
    const control = elementTree.root?.querySelector(".LxSwitch");
    if (!control) throw new Error("expected switch");
    fireEvent.tap(control);
    expect(onCheckedChange).toHaveBeenCalledWith(true);
  });

  it("matches the Electron 200ms state transition", () => {
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.LxSwitch\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--settings-switch-border\);[^}]*border-right-color:\s*var\(--settings-switch-border\);[^}]*border-bottom-color:\s*var\(--settings-switch-border\);[^}]*border-left-color:\s*var\(--settings-switch-border\);/s,
    );
    expect(styles).toMatch(
      /\.LxSwitch--checked\s*\{[^}]*border-top-color:\s*var\(--color-text-accent\);[^}]*border-right-color:\s*var\(--color-text-accent\);[^}]*border-bottom-color:\s*var\(--color-text-accent\);[^}]*border-left-color:\s*var\(--color-text-accent\);/s,
    );
    expect(styles).toMatch(
      /\.LxSwitch\s*\{[^}]*transition-property:\s*background-color, border-color, box-shadow;[^}]*transition-duration:\s*200ms;[^}]*transition-timing-function:\s*ease-out;/s,
    );
    expect(styles).toMatch(
      /\.LxSwitchThumb\s*\{[^}]*transition-property:\s*transform;[^}]*transition-duration:\s*200ms;[^}]*transition-timing-function:\s*ease-out;/s,
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion:\s*reduce\)\s*\{[\s\S]*\.LxSwitch,[\s\S]*transition-duration:\s*0\.01ms;/,
    );
  });
});
