import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";
import { render } from "@lynx-js/react/testing-library";
import { DEFAULT_THEME_STATE } from "@synara-web/theme/theme.logic";

import { Alert, AlertDescription, AlertTitle } from "./alert.lynx";
import { setLynxThemeState } from "../../adapters/useTheme.lynx";

describe("Alert", () => {
  it("matches the Electron default and compact type tiers", () => {
    const styles = readFileSync(new URL("./primitives.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.LxAlert\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-top-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);[^}]*border-left-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(/\.LxAlertTitle\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s);
    expect(styles).toMatch(
      /\.LxAlertDescription\s*\{[^}]*font-size:\s*14px;[^}]*line-height:\s*20px;/s,
    );
    expect(styles).toMatch(
      /\.LxAlert--sm \.LxAlertTitle,\s*\.LxAlert--sm \.LxAlertDescription\s*\{[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;/s,
    );
    expect(styles).toMatch(/\.LxAlertTitle \+ \.LxAlertDescription\s*\{[^}]*margin-top:\s*2px;/s);
  });

  it("publishes alert semantics and shared anatomy", () => {
    render(
      <Alert accessibilityLabel="Provider status" variant="warning">
        <AlertTitle>Status</AlertTitle>
        <AlertDescription>
          <text>Reconnect.</text>
        </AlertDescription>
      </Alert>,
    );
    const alert = elementTree.root?.querySelector(".LxAlert");
    expect(alert?.getAttribute("accessibility-role")).toBe("alert");
    expect(alert?.getAttribute("accessibility-label")).toBe("Provider status");
    expect(elementTree.root?.querySelector(".LxAlertTitle")?.textContent).toBe("Status");
  });

  it("preserves Electron semantic surfaces and borders", () => {
    render(
      <>
        <Alert variant="error" />
        <Alert variant="info" />
        <Alert variant="success" />
        <Alert variant="warning" />
      </>,
    );
    const alerts = elementTree.root?.querySelectorAll(".LxAlert") ?? [];
    expect(alerts[0]?.getAttribute("style")).toContain("background-color: rgba(224, 46, 42, 0.04)");
    expect(alerts[0]?.getAttribute("style")).toContain("border-color: rgba(224, 46, 42, 0.32)");
    expect(alerts[1]?.getAttribute("style")).toContain("background-color: rgba(1, 105, 204, 0.04)");
    expect(alerts[1]?.getAttribute("style")).toContain("border-color: rgba(1, 105, 204, 0.32)");
    expect(alerts[2]?.getAttribute("style")).toContain("background-color: rgba(0, 162, 64, 0.04)");
    expect(alerts[2]?.getAttribute("style")).toContain("border-color: rgba(0, 162, 64, 0.32)");
    expect(alerts[3]?.getAttribute("style")).toContain("background-color: rgba(217, 119, 6, 0.04)");
    expect(alerts[3]?.getAttribute("style")).toContain("border-color: rgba(217, 119, 6, 0.32)");
  });

  it("uses Electron dark input tint for the default surface only", () => {
    setLynxThemeState({ ...DEFAULT_THEME_STATE, mode: "dark" });
    render(<Alert />);
    expect(elementTree.root?.querySelector(".LxAlert")?.getAttribute("style")).toContain(
      "background-color: rgba(23, 23, 23, 0.32)",
    );

    setLynxThemeState({ ...DEFAULT_THEME_STATE, mode: "light" });
    render(<Alert />);
    expect(elementTree.root?.querySelector(".LxAlert")?.getAttribute("style")).toContain(
      "background-color: transparent",
    );
    setLynxThemeState(DEFAULT_THEME_STATE);
  });
});
