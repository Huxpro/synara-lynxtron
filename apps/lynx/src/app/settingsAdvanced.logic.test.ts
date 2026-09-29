import { describe, expect, it } from "@rstest/core";

import {
  advancedAppVersion,
  firstAvailableEditor,
  shouldOfferRecoveryTools,
} from "./settingsAdvanced.logic";

describe("Settings Advanced projection", () => {
  it("shows the canonical product version without a target build suffix", () => {
    expect(advancedAppVersion("0.5.5-lynx.0")).toBe("0.5.5");
    expect(advancedAppVersion(undefined)).toBe("0.0.0");
  });

  it("chooses the first product-ordered available editor", () => {
    expect(firstAvailableEditor(["cursor", "vscode"])).toBe("cursor");
    expect(firstAvailableEditor(["cursor"])).toBe("cursor");
    expect(firstAvailableEditor([])).toBeNull();
  });

  it("offers recovery only for hydrated projects with missing history", () => {
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 0,
        threadsHydrated: true,
        allThreadsMessageless: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 2,
        threadsHydrated: true,
        allThreadsMessageless: true,
      }),
    ).toBe(true);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 2,
        threadsHydrated: true,
        allThreadsMessageless: false,
      }),
    ).toBe(false);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 0,
        threadCount: 0,
        threadsHydrated: true,
        allThreadsMessageless: true,
      }),
    ).toBe(false);
  });
});
