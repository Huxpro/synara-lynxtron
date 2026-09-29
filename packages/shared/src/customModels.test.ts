import { getModelOptions } from "./model";
import { describe, expect, it } from "vitest";

import { MAX_CUSTOM_MODEL_LENGTH, validateCustomModelInput } from "./customModels";

describe("validateCustomModelInput", () => {
  it("rejects empty, built-in, oversized, and duplicate model slugs", () => {
    expect(
      validateCustomModelInput({
        provider: "codex",
        value: " ",
        savedModels: [],
      }),
    ).toEqual({ error: "Enter a model slug." });
    expect(
      validateCustomModelInput({
        provider: "codex",
        value: getModelOptions("codex")[0]!.slug,
        savedModels: [],
      }),
    ).toEqual({ error: "That model is already built in." });
    expect(
      validateCustomModelInput({
        provider: "codex",
        value: "x".repeat(MAX_CUSTOM_MODEL_LENGTH + 1),
        savedModels: [],
      }),
    ).toEqual({
      error: `Model slugs must be ${MAX_CUSTOM_MODEL_LENGTH} characters or less.`,
    });
    expect(
      validateCustomModelInput({
        provider: "codex",
        value: " custom/model ",
        savedModels: ["custom/model"],
      }),
    ).toEqual({ error: "That custom model is already saved." });
  });

  it("returns the provider-normalized slug", () => {
    expect(
      validateCustomModelInput({
        provider: "codex",
        value: " custom/model ",
        savedModels: [],
      }),
    ).toEqual({ model: "custom/model" });
  });
});
