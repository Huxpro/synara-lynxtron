import { describe, expect, it, rs } from "@rstest/core";
import type { ServerProviderUsageSnapshot } from "@synara/contracts";

import {
  deriveProviderUsageLimitDisplay,
  deriveUsagePace,
  formatProviderUsageResetCountdown,
} from "./providerUsageDisplay";
import { mergeProviderUsageRefresh } from "@synara/shared/providerUsage";

describe("providerUsageDisplay", () => {
  it("uses the reported duration when an archived label is stale", () => {
    expect(
      deriveProviderUsageLimitDisplay({
        window: "5h",
        usedPercent: 96,
        windowDurationMins: 10_080,
      }).label,
    ).toBe("Weekly");
  });

  it("derives the remaining, reset, and pace metadata for a server limit", () => {
    const nowMs = Date.parse("2026-06-09T12:00:00.000Z");

    expect(
      deriveProviderUsageLimitDisplay(
        {
          window: "5h",
          usedPercent: 15,
          resetsAt: "2026-06-09T12:36:00.000Z",
          windowDurationMins: 300,
        },
        nowMs,
      ),
    ).toMatchObject({
      label: "5h",
      remainingPercent: 85,
      leftText: "85% left",
      resetText: "Resets in 36m",
      markerPercent: 12,
      remainingTone: "healthy",
      paceTone: "healthy",
      pace: {
        status: "ahead",
        amountText: "73% in reserve",
        etaText: "Lasts until reset",
      },
    });
  });

  it("infers standard window durations for pace metadata", () => {
    const nowMs = Date.parse("2026-06-09T12:00:00.000Z");
    const display = deriveProviderUsageLimitDisplay(
      {
        window: "Weekly",
        usedPercent: 84,
        resetsAt: "2026-06-10T16:48:00.000Z",
      },
      nowMs,
    );

    expect(display.remainingPercent).toBe(16);
    expect(display.remainingTone).toBe("warning");
    expect(display.pace).not.toBeNull();
  });

  it("keeps reset metadata without inventing a percentage or pace", () => {
    const nowMs = Date.parse("2026-06-09T12:00:00.000Z");

    expect(
      deriveProviderUsageLimitDisplay(
        {
          window: "Current",
          resetsAt: "2026-06-09T14:16:00.000Z",
        },
        nowMs,
      ),
    ).toEqual({
      label: "Current",
      remainingPercent: null,
      leftText: "Usage reported",
      resetText: "Resets in 2h 16m",
      pace: null,
      markerPercent: null,
      remainingTone: "healthy",
      paceTone: "healthy",
    });
  });

  it("preserves the established pace and countdown edge cases", () => {
    rs.useFakeTimers();
    rs.setSystemTime(new Date("2026-06-09T12:00:00.000Z"));

    expect(
      deriveUsagePace({
        remainingPercent: 85,
      }),
    ).toBeNull();
    expect(formatProviderUsageResetCountdown("invalid")).toBe("");
    expect(formatProviderUsageResetCountdown("2026-06-09T11:00:00.000Z")).toBe("Resets soon");

    rs.useRealTimers();
  });

  it("keeps prior provider cards when a forced refresh omits a transient result", () => {
    const previous: ServerProviderUsageSnapshot[] = [
      {
        provider: "codex" as const,
        updatedAt: "2026-06-09T12:00:00.000Z",
        limits: [],
        usageLines: [],
        source: "codex",
        status: "ok" as const,
      },
      {
        provider: "claudeAgent" as const,
        updatedAt: "2026-06-09T12:00:00.000Z",
        limits: [],
        usageLines: [],
        source: "claude",
        status: "ok" as const,
      },
    ];
    const next: ServerProviderUsageSnapshot[] = [
      {
        provider: "codex",
        updatedAt: "2026-06-09T12:01:00.000Z",
        limits: [],
        usageLines: [],
        source: "codex",
        status: "ok",
      },
    ];

    expect(mergeProviderUsageRefresh(previous, next)).toEqual([next[0], previous[1]]);
  });
});
