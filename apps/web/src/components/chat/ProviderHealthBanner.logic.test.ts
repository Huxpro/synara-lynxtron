import type { ServerProviderStatus } from "@synara/contracts";
import { describe, expect, it } from "vitest";

import { resolveProviderHealthBannerPresentation } from "./ProviderHealthBanner.logic";

const BASE_STATUS: ServerProviderStatus = {
  provider: "codex",
  driver: "codex",
  instanceId: "codex" as ServerProviderStatus["instanceId"],
  status: "ready",
  available: true,
  authStatus: "authenticated",
  checkedAt: "2026-08-05T00:00:00.000Z",
};

describe("resolveProviderHealthBannerPresentation", () => {
  it("hides ready and missing provider states", () => {
    expect(resolveProviderHealthBannerPresentation(null)).toBeNull();
    expect(resolveProviderHealthBannerPresentation(BASE_STATUS)).toBeNull();
  });

  it("shares error copy, tone, and dismissal identity across clients", () => {
    expect(
      resolveProviderHealthBannerPresentation({
        ...BASE_STATUS,
        status: "error",
        available: false,
        authStatus: "unknown",
        message: "Codex CLI failed to start.",
      }),
    ).toEqual({
      key: "codex\u001ferror\u001funavailable\u001funknown\u001fCodex CLI failed to start.",
      message: "Codex CLI failed to start.",
      title: "Codex provider status",
      tone: "error",
    });
  });

  it("provides deterministic fallback copy for warnings", () => {
    expect(
      resolveProviderHealthBannerPresentation({
        ...BASE_STATUS,
        status: "warning",
      }),
    ).toMatchObject({
      message: "Codex provider has limited availability.",
      tone: "warning",
    });
  });
});
