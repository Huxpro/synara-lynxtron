import { describe, expect, it } from "vitest";

import {
  describeProviderDiscoveryError,
  normalizeProviderDiscoveryText,
  providerPluginDiscoveryWarnings,
  providerDiscoveryItemHue,
  providerDiscoveryItemAccent,
  providerDiscoveryItemGradient,
  providerDiscoveryItemRing,
  resolveProviderDiscoveryStatus,
} from "./providerDiscoveryPresentation";

describe("provider discovery presentation", () => {
  it("derives stable per-item hues across renderers", () => {
    expect(providerDiscoveryItemHue("react-doctor")).toBe(149);
    expect(providerDiscoveryItemAccent("react-doctor")).toBe("#166534");
    expect(providerDiscoveryItemAccent("adapt")).toBe("#4c1d95");
    expect(providerDiscoveryItemAccent("agent-browser")).toBe("#713f12");
    expect(providerDiscoveryItemHue("react-doctor")).toBe(
      providerDiscoveryItemHue("react-doctor"),
    );
  });
  it("shares plugin and skill glyph paint across renderers", () => {
    expect(providerDiscoveryItemGradient("adapt")).toBe(
      "linear-gradient(145deg, hsl(282 55% 30%), hsl(282 45% 18%))",
    );
    expect(providerDiscoveryItemRing("adapt")).toBe(
      "0 0 0 0.5px hsl(282 40% 30% / 0.35)",
    );
    expect(providerDiscoveryItemGradient("Documents", "#6699ff")).toBe(
      "linear-gradient(145deg, #6699ffcc, #6699ff77)",
    );
    expect(providerDiscoveryItemRing("Documents", "#6699ff")).toBe(
      "0 0 0 0.5px #6699ff35",
    );
  });
  it("keeps a provider failure ahead of placeholder empty data", () => {
    expect(
      resolveProviderDiscoveryStatus({
        error: new Error("Codex is not installed or not executable"),
        itemCount: 0,
        pending: false,
        providerLabel: "Codex",
        resource: "plugins",
        supported: true,
      }),
    ).toEqual({
      kind: "error",
      message: "Codex CLI is unavailable, so plugins cannot be loaded.",
    });
  });

  it("distinguishes unsupported, empty, and populated discovery", () => {
    const common = {
      error: null,
      pending: false,
      providerLabel: "Codex",
      resource: "plugins" as const,
    };

    expect(
      resolveProviderDiscoveryStatus({
        ...common,
        itemCount: 0,
        supported: false,
      }),
    ).toEqual({ kind: "unsupported" });
    expect(
      resolveProviderDiscoveryStatus({
        ...common,
        itemCount: 0,
        supported: true,
      }),
    ).toEqual({ kind: "empty" });
    expect(
      resolveProviderDiscoveryStatus({
        ...common,
        itemCount: 1,
        supported: true,
      }),
    ).toEqual({ kind: "content" });
  });

  it("preserves actionable provider error detail", () => {
    expect(
      describeProviderDiscoveryError({
        error: new Error("marketplace request timed out"),
        providerLabel: "Codex",
        resource: "plugins",
      }),
    ).toBe("Could not load plugins. marketplace request timed out");
  });

  it("normalizes separators consistently for renderer search", () => {
    expect(normalizeProviderDiscoveryText(" React_Doctor:Review ")).toBe(
      "react doctor review",
    );
  });

  it("preserves partial plugin discovery warnings while content remains available", () => {
    expect(
      providerPluginDiscoveryWarnings({
        remoteSyncError: " Remote sync unavailable ",
        marketplaceLoadErrors: [
          {
            marketplacePath: " /broken/marketplace.json ",
            message: " Invalid marketplace manifest ",
          },
          {
            marketplacePath: "",
            message: " Missing marketplace path ",
          },
        ],
      }),
    ).toEqual([
      "Remote sync unavailable",
      "/broken/marketplace.json: Invalid marketplace manifest • Unknown: Missing marketplace path",
    ]);
  });

  it("omits empty partial plugin discovery warnings", () => {
    expect(
      providerPluginDiscoveryWarnings({
        remoteSyncError: " ",
        marketplaceLoadErrors: [
          {
            marketplacePath: "/ignored",
            message: " ",
          },
        ],
      }),
    ).toEqual([]);
  });
});
