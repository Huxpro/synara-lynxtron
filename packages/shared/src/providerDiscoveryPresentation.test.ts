import { describe, expect, it } from "vitest";

import {
  describeProviderDiscoveryError,
  normalizeProviderDiscoveryText,
  resolveProviderDiscoveryStatus,
} from "./providerDiscoveryPresentation";

describe("provider discovery presentation", () => {
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
});
