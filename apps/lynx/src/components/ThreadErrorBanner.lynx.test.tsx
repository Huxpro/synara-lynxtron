import { fireEvent, render } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";

import { ThreadErrorBanner } from "./ThreadErrorBanner.lynx";

describe("Lynx ThreadErrorBanner", () => {
  it("uses explicit semantic physical borders and surface paint", () => {
    const styles = readFileSync(new URL("./thread-error-banner.css", import.meta.url), "utf8");

    expect(styles).toMatch(
      /\.ThreadErrorBanner\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--destructive-outline-state-border\);[^}]*border-right-color:\s*var\(--destructive-outline-state-border\);[^}]*border-top-color:\s*var\(--destructive-outline-state-border\);[^}]*border-bottom-color:\s*var\(--destructive-outline-state-border\);[^}]*background-color:\s*var\(--destructive-outline-state-surface\);/s,
    );
  });

  it("renders the complete runtime error and dismisses it", () => {
    const onDismiss = rs.fn();
    render(
      <ThreadErrorBanner
        error="You've hit your usage limit. Try again later."
        onDismiss={onDismiss}
      />,
    );

    expect(elementTree.root?.querySelector(".ThreadErrorBannerText")?.textContent).toBe(
      "You've hit your usage limit. Try again later.",
    );
    const dismiss = elementTree.root?.querySelector('[accessibility-label="Dismiss error"]');
    if (!dismiss) throw new Error("expected dismiss control");
    expect(
      dismiss.querySelector(".ThreadErrorBannerDismissIcon")?.getAttribute("content"),
    ).toContain("#e02e2a");
    fireEvent.tap(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("routes recovery controls and refuses activation while disabled", () => {
    const onContinue = rs.fn();
    const onChangeModel = rs.fn();
    const screen = render(
      <ThreadErrorBanner
        error="failed"
        inline
        onContinue={onContinue}
        onChangeModel={onChangeModel}
      />,
    );
    const control = (label: string) => {
      const node = elementTree.root?.querySelector(`[accessibility-label="${label}"]`);
      if (!node) throw new Error(`Missing ${label}`);
      return node;
    };
    fireEvent.tap(control("Continue task"));
    fireEvent.tap(control("Change model"));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onChangeModel).toHaveBeenCalledTimes(1);
    screen.rerender(
      <ThreadErrorBanner
        error="failed"
        inline
        recoveryDisabled
        onContinue={onContinue}
        onChangeModel={onChangeModel}
      />,
    );
    fireEvent.tap(control("Continue task"));
    fireEvent.tap(control("Change model"));
    expect(onContinue).toHaveBeenCalledTimes(1);
    expect(onChangeModel).toHaveBeenCalledTimes(1);
  });

  it("renders nothing without an error", () => {
    render(<ThreadErrorBanner error={null} />);
    expect(elementTree.root?.querySelector(".ThreadErrorBanner")).toBeNull();
  });
});
