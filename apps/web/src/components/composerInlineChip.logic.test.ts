import { describe, expect, it } from "vitest";

import {
  DEFAULT_AGENT_CHIP_COLOR,
  resolveAgentChipColor,
} from "./composerInlineChip.logic";

describe("composer inline chip presentation", () => {
  it("resolves the canonical per-agent colors", () => {
    expect(resolveAgentChipColor("violet")).toEqual({
      bg: "rgb(139 92 246 / 0.15)",
      text: "rgb(139 92 246)",
    });
    expect(resolveAgentChipColor("teal")).toEqual({
      bg: "rgb(20 184 166 / 0.15)",
      text: "rgb(20 184 166)",
    });
  });

  it("uses amber for missing and unknown agent colors", () => {
    expect(resolveAgentChipColor(undefined)).toEqual(DEFAULT_AGENT_CHIP_COLOR);
    expect(resolveAgentChipColor("unknown")).toEqual(DEFAULT_AGENT_CHIP_COLOR);
  });
});
