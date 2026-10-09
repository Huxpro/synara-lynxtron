import { describe, expect, it } from "@rstest/core";
import {
  normalizeStarredModels,
  toggleStarredModel,
  type StoredStarredModel,
} from "@synara-web/lib/starredModels";

import { selectableStarredModels } from "./useStarredModels.lynx";

const preset = (
  provider: StoredStarredModel["provider"],
  model: string,
  instanceId?: string,
): StoredStarredModel => ({
  provider,
  model,
  effort: null,
  fastMode: null,
  thinking: null,
  ...(instanceId ? { instanceId } : {}),
});

describe("Lynx starred presets and provider accounts", () => {
  const stored = [
    preset("codex", "gpt-default"),
    preset("codex", "gpt-work", "codex-work"),
    preset("claudeAgent", "claude-default", "claudeAgent"),
    preset("claudeAgent", "claude-team", "claude-team"),
  ];

  it("offers only presets of each provider's default account", () => {
    const starred = normalizeStarredModels(stored);
    expect(selectableStarredModels(starred, null).map((entry) => entry.model)).toEqual([
      "gpt-default",
      "claude-default",
    ]);
    expect(selectableStarredModels(starred, "claudeAgent").map((entry) => entry.model)).toEqual([
      "claude-default",
    ]);
    expect(selectableStarredModels(starred, "cursor")).toEqual([]);
  });

  it("keeps another account's presets in storage when Lynx edits the list", () => {
    const next = toggleStarredModel(stored, {
      provider: "codex",
      model: "gpt-default",
      effort: null,
      fastMode: null,
      thinking: null,
    });
    expect(next.map((entry) => entry.model)).toEqual(["gpt-work", "claude-default", "claude-team"]);
    expect(next.find((entry) => entry.model === "gpt-work")?.instanceId).toBe("codex-work");
  });
});
