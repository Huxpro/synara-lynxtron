import type { ServerProviderStatus } from "@synara/contracts";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";

import { ProviderHealthBanner } from "./ProviderHealthBanner.lynx";

const BASE_STATUS: ServerProviderStatus = {
  provider: "codex",
  status: "ready",
  available: true,
  authStatus: "authenticated",
  checkedAt: "2026-08-05T00:00:00.000Z",
};

describe("Native ProviderHealthBanner", () => {
  it("does not reserve space for a ready provider", () => {
    render(<ProviderHealthBanner status={BASE_STATUS} />);
    expect(elementTree.root?.querySelector(".ProviderHealthBanner")).toBeNull();
  });

  it("uses the shared error presentation and exact banner anatomy", () => {
    const onDismiss = rs.fn();
    render(
      <ProviderHealthBanner
        status={{
          ...BASE_STATUS,
          status: "error",
          available: false,
          authStatus: "unknown",
          message: "Codex CLI failed to start.",
        }}
        onDismiss={onDismiss}
      />,
    );

    const banner = elementTree.root?.querySelector(".ProviderHealthBanner");
    const dismiss = elementTree.root?.querySelector(".ProviderHealthBannerDismiss");
    if (!banner || !dismiss) throw new Error("expected provider health banner");
    expect(banner.getAttribute("class")).toContain("ProviderHealthBanner--error");
    expect(banner.getAttribute("accessibility-label")).toBe(
      "Codex provider status. Codex CLI failed to start.",
    );
    expect(elementTree.root?.querySelector(".ProviderHealthBannerTitle")?.textContent).toBe(
      "Codex provider status",
    );
    expect(elementTree.root?.querySelector(".ProviderHealthBannerDescription")?.textContent).toBe(
      "Codex CLI failed to start.",
    );
    expect(dismiss.getAttribute("accessibility-label")).toBe("Dismiss provider status");
    fireEvent.tap(dismiss);
    expect(onDismiss).toHaveBeenCalledTimes(1);
  });

  it("matches the Web transcript-width banner geometry", () => {
    const styles = readFileSync(new URL("./provider-health-banner.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.ProviderHealthBannerFrame\s*\{[^}]*height:\s*80px;[^}]*padding:\s*12px 20px 0;/s,
    );
    expect(styles).toMatch(
      /\.ProviderHealthBanner\s*\{[^}]*width:\s*736px;[^}]*height:\s*68px;[^}]*padding:\s*12px 40px 12px 14px;[^}]*border-radius:\s*18px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.ProviderHealthBannerFrame\s*\{[^}]*height:\s*44px;[^}]*padding-top:\s*4px;/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--viewport-short-height \.ProviderHealthBannerDescription\s*\{[^}]*display:\s*none;/s,
    );
    expect(styles).toMatch(
      /\.ProviderHealthBannerIcon\s*\{[^}]*opacity:\s*0\.92;/s,
    );
    expect(styles).toMatch(
      /\.ProviderHealthBanner--error \.ProviderHealthBannerIcon\s*\{[^}]*color:\s*var\(--destructive\);/s,
    );
    expect(styles).toMatch(
      /\.ProviderHealthBanner--warning \.ProviderHealthBannerIcon\s*\{[^}]*color:\s*var\(--warning\);/s,
    );
    expect(styles).toMatch(
      /\.ProviderHealthBannerDismiss\.ui-hover,[^{]*\{[^}]*background-color:\s*rgba\(13,\s*13,\s*13,\s*0\.1\);/s,
    );
    expect(styles).toMatch(
      /\.SliceRoot--theme-dark \.ProviderHealthBannerDismiss\.ui-hover,[^{]*\{[^}]*background-color:\s*rgba\(252,\s*252,\s*252,\s*0\.1\);/s,
    );
    expect(styles).not.toContain("background-color: var(--accent)");
  });
});
