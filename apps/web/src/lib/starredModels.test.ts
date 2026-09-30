import { describe, expect, it } from "vitest";

import { parseStoredStarredModels, seedStarredModelsFromLegacyFavorites } from "./starredModels";

describe("starred model storage", () => {
  it("tells an empty slot apart from an unreadable one", () => {
    expect(parseStoredStarredModels(null)).toBeNull();
    expect(parseStoredStarredModels("")).toBeNull();
    expect(parseStoredStarredModels("{not json")).toEqual([]);
    expect(parseStoredStarredModels(JSON.stringify([{ provider: "codex" }]))).toEqual([]);
  });

  it("decodes stored presets", () => {
    const preset = {
      provider: "codex",
      model: "gpt-5.6-luna",
      effort: "low",
      fastMode: null,
      thinking: null,
    };
    expect(parseStoredStarredModels(JSON.stringify([preset]))).toEqual([preset]);
  });

  it("seeds trait-less presets from the favourites a host reader returns", () => {
    const seeded = seedStarredModelsFromLegacyFavorites((provider) =>
      provider === "cursor" ? ["composer-2"] : [],
    );
    expect(seeded).toEqual([
      { provider: "cursor", model: "composer-2", effort: null, fastMode: null, thinking: null },
    ]);
  });
});
