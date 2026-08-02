import type { ServerProviderStatus } from "@synara/contracts";
import { describe, expect, it } from "vitest";
import { buildComposerProviderPickerItems } from "./ComposerProviderPickerItems";

function status(
  provider: ServerProviderStatus["provider"],
  overrides: Partial<ServerProviderStatus> = {},
): ServerProviderStatus {
  return {
    provider,
    status: "ready",
    available: true,
    authStatus: "authenticated",
    checkedAt: "2026-07-30T00:00:00.000Z",
    ...overrides,
  };
}

describe("buildComposerProviderPickerItems", () => {
  it("projects live provider availability and authentication labels", () => {
    const items = buildComposerProviderPickerItems({
      providers: [
        status("codex"),
        status("claudeAgent", { available: false, authStatus: "unauthenticated" }),
      ],
    });

    expect(items.find((item) => item.provider === "codex")).toMatchObject({
      disabled: false,
      statusLabel: null,
    });
    expect(items.find((item) => item.provider === "claudeAgent")).toMatchObject({
      disabled: true,
      statusLabel: "Sign in",
    });
  });

  it("keeps protected providers visible while filtering user-hidden entries", () => {
    const items = buildComposerProviderPickerItems({
      providers: [status("codex"), status("claudeAgent")],
      hiddenProviders: ["codex", "claudeAgent"],
      protectedProviders: ["codex"],
    });

    expect(items.some((item) => item.provider === "codex")).toBe(true);
    expect(items.some((item) => item.provider === "claudeAgent")).toBe(false);
  });

  it("uses configured provider order", () => {
    const items = buildComposerProviderPickerItems({
      providers: [status("codex"), status("claudeAgent")],
      providerOrder: ["claudeAgent", "codex"],
    });
    const visible = items.filter(
      (item) => item.provider === "codex" || item.provider === "claudeAgent",
    );

    expect(visible.map((item) => item.provider)).toEqual(["claudeAgent", "codex"]);
  });
});
