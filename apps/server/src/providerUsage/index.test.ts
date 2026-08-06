import { describe, expect, it } from "vitest";
import type { ServerProviderUsageSnapshot } from "@synara/contracts";

import { mergeLiveWithLocalUsage } from "./index";

const localSnapshot: ServerProviderUsageSnapshot = {
  provider: "codex",
  updatedAt: "2026-08-05T21:14:09.238Z",
  limits: [{ window: "5h", usedPercent: 96 }],
  usageLines: [{ label: "24h", value: "427M tokens" }],
  source: "codex-session-archive",
};

describe("mergeLiveWithLocalUsage", () => {
  it("serves locally recorded usage with a stale warning when live usage fails", () => {
    expect(
      mergeLiveWithLocalUsage(
        {
          provider: "codex",
          updatedAt: "2026-08-06T00:26:08.126Z",
          limits: [],
          usageLines: [],
          source: "codex-wham-usage",
          status: "error",
          detail: "Could not reach the Codex usage endpoint.",
        },
        localSnapshot,
      ),
    ).toEqual({
      ...localSnapshot,
      status: "ok",
      detail:
        "Could not reach the Codex usage endpoint. Showing the latest usage recorded by the local CLI.",
    });
  });

  it("keeps a live snapshot authoritative while filling missing local fields", () => {
    expect(
      mergeLiveWithLocalUsage(
        {
          provider: "codex",
          updatedAt: "2026-08-06T00:26:08.126Z",
          limits: [],
          usageLines: [{ label: "Credits", value: "12" }],
          source: "codex-wham-usage",
          status: "ok",
        },
        localSnapshot,
      ),
    ).toMatchObject({
      limits: localSnapshot.limits,
      usageLines: [
        { label: "Credits", value: "12" },
        { label: "24h", value: "427M tokens" },
      ],
      source: "codex-wham-usage",
      status: "ok",
    });
  });

  it("preserves the live failure when no local usage exists", () => {
    const liveFailure: ServerProviderUsageSnapshot = {
      provider: "claudeAgent",
      updatedAt: "2026-08-06T00:26:08.126Z",
      limits: [],
      usageLines: [],
      source: "claude-oauth-usage",
      status: "error",
      detail: "Could not reach the Claude usage endpoint.",
    };
    expect(
      mergeLiveWithLocalUsage(liveFailure, {
        ...liveFailure,
        source: "claude-project-transcripts",
        status: "ok",
      }),
    ).toEqual(liveFailure);
  });
});
