import { describe, expect, it } from "@rstest/core";

import { isAutomationTimezone } from "./automationTimezone.logic";

describe("Automation timezone validation", () => {
  it("accepts non-empty timezone identifiers up to 128 characters", () => {
    expect(isAutomationTimezone("Asia/Seoul")).toBe(true);
    expect(isAutomationTimezone(`Etc/${"A".repeat(124)}`)).toBe(true);
  });

  it("rejects blank and oversized timezone values", () => {
    expect(isAutomationTimezone("   ")).toBe(false);
    expect(isAutomationTimezone("A".repeat(129))).toBe(false);
  });
});
