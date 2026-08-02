import { describe, expect, it } from "vitest";

import {
  normalizeFavoriteModelSlugs,
  parseFavoriteModelSlugs,
  toggleFavoriteModelSlug,
} from "./modelFavorites.logic";

describe("modelFavorites.logic", () => {
  it("normalizes persisted values without changing first-seen order", () => {
    expect(normalizeFavoriteModelSlugs([" b ", "", "a", "b", 42])).toEqual(["b", "a"]);
    expect(parseFavoriteModelSlugs("not json")).toEqual([]);
  });

  it("toggles one normalized slug while preserving the other favorites", () => {
    expect(toggleFavoriteModelSlug(["b", "a"], "c")).toEqual(["b", "a", "c"]);
    expect(toggleFavoriteModelSlug([" b ", "a", "b"], "b")).toEqual(["a"]);
  });
});
