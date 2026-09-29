import { describe, expect, it } from "@rstest/core";

import {
  resolveCatalogModelSelection,
  resolveLynxProviderModelOptions,
} from "./composerModelCatalog.logic";

describe("Lynx provider model catalog", () => {
  it("prefers provider memory and falls back to the matching base selection", () => {
    const basePi = { provider: "pi" as const, model: "openai/gpt-5.5" };
    const rememberedPi = {
      provider: "pi" as const,
      model: "openai/gpt-5.6",
    };

    expect(
      resolveCatalogModelSelection({
        provider: "pi",
        activeSelection: basePi,
        rememberedSelection: rememberedPi,
      }),
    ).toEqual(rememberedPi);
    expect(
      resolveCatalogModelSelection({
        provider: "pi",
        activeSelection: basePi,
        rememberedSelection: undefined,
      }),
    ).toEqual(basePi);
    expect(
      resolveCatalogModelSelection({
        provider: "opencode",
        activeSelection: basePi,
        rememberedSelection: undefined,
      }),
    ).toBeUndefined();
  });

  it("uses the Web dynamic merge policy for a runtime-owned provider catalog", () => {
    const options = resolveLynxProviderModelOptions({
      provider: "opencode",
      currentModel: "openai/gpt-5.6",
      dynamicModels: [
        {
          slug: "openai/gpt-5.6",
          name: "GPT-5.6",
          upstreamProviderId: "openai",
          upstreamProviderName: "OpenAI",
        },
        {
          slug: "anthropic/claude-opus-4-8",
          name: "Claude Opus 4.8",
          upstreamProviderId: "anthropic",
          upstreamProviderName: "Anthropic",
        },
      ],
    });

    expect(options.map((option) => option.slug)).toEqual([
      "openai/gpt-5.6",
      "anthropic/claude-opus-4-8",
    ]);
    expect(options[0]?.upstreamProviderName).toBe("OpenAI");
  });

  it("keeps an active server selection that discovery does not return", () => {
    const options = resolveLynxProviderModelOptions({
      provider: "cursor",
      currentModel: "composer-unknown",
      dynamicModels: [{ slug: "composer-2", name: "Composer 2" }],
    });

    expect(options[0]?.slug).toBe("composer-unknown");
    expect(options.some((option) => option.slug === "composer-2")).toBe(true);
  });

  it("falls back to the static catalog when runtime discovery is empty", () => {
    const options = resolveLynxProviderModelOptions({
      provider: "codex",
      currentModel: "gpt-5.6",
      dynamicModels: [],
    });

    expect(options.some((option) => option.slug === "gpt-5.6")).toBe(true);
  });

  it("does not invent an active model while browsing another provider", () => {
    const options = resolveLynxProviderModelOptions({
      provider: "claudeAgent",
      currentModel: null,
      dynamicModels: [{ slug: "claude-opus-4-8", name: "Claude Opus 4.8" }],
    });

    expect(options[0]?.slug).toBe("claude-opus-4-8");
  });
});
