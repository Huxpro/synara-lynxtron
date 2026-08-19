// FILE: providerUpdates.test.ts
// Purpose: Covers provider-update filtering shared by notifications and settings.
// Layer: Web utility tests
// Exports: Vitest suites for providerUpdates.ts

import type { ProviderKind, ServerProviderStatus, ServerSettings } from "@synara/contracts";
import { afterEach, describe, expect, it, vi } from "vitest";

import {
  formatProviderVersion,
  getVisibleProviderUpdateStatuses,
  isProviderUpdateActive,
  providerUpdateFailureMessage,
  providerUpdateStatusLabel,
  providerUpdateOutcomeCopy,
  providerUpdateNotificationKey,
  runProviderUpdateBatch,
  shouldOfferProviderUpdateAction,
  shouldShowProviderUpdateStatus,
  withProviderUpdateTimeout,
} from "./providerUpdates";

afterEach(() => {
  vi.useRealTimers();
});

function providerStatus(
  provider: ProviderKind,
  overrides: Partial<ServerProviderStatus> = {},
): ServerProviderStatus {
  return {
    provider,
    status: "ready",
    available: true,
    authStatus: "authenticated",
    version: "1.0.0",
    checkedAt: "2026-06-10T10:00:00.000Z",
    versionAdvisory: {
      status: "behind_latest",
      currentVersion: "1.0.0",
      latestVersion: "1.1.0",
      updateCommand: "npm install -g provider@latest",
      canUpdate: true,
      checkedAt: "2026-06-10T10:00:00.000Z",
      message: "Update available.",
    },
    ...overrides,
  };
}

function serverSettings(overrides: Partial<ServerSettings["providers"]> = {}): ServerSettings {
  const provider = {
    enabled: true,
    binaryPath: "",
    customModels: [],
  };

  return {
    enableAssistantStreaming: false,
    enableProviderUpdateChecks: true,
    defaultThreadEnvMode: "local",
    addProjectBaseDirectory: "",
    textGenerationModelSelection: { provider: "codex", model: "gpt-5.4-mini" },
    providers: {
      codex: { ...provider, binaryPath: "codex", homePath: "" },
      claudeAgent: { ...provider, binaryPath: "claude", launchArgs: "" },
      cursor: { ...provider, binaryPath: "cursor-agent", apiEndpoint: "" },
      antigravity: { ...provider, binaryPath: "agy" },
      grok: { ...provider, binaryPath: "grok" },
      droid: { ...provider, binaryPath: "droid" },
      kilo: { ...provider, binaryPath: "kilo", serverUrl: "", serverPasswordConfigured: false },
      opencode: {
        ...provider,
        binaryPath: "opencode",
        serverUrl: "",
        serverPasswordConfigured: false,
        experimentalWebSockets: false,
      },
      pi: { ...provider, binaryPath: "pi", agentDir: "" },
      ...overrides,
    },
    skills: { disabled: [] },
  };
}

describe("getVisibleProviderUpdateStatuses", () => {
  it("excludes providers hidden from Synara so unchecked providers do not nag", () => {
    const result = getVisibleProviderUpdateStatuses({
      providers: [providerStatus("codex"), providerStatus("pi")],
      hiddenProviders: ["pi"],
      serverSettings: serverSettings(),
    });

    expect(result.map((provider) => provider.provider)).toEqual(["codex"]);
  });

  it("excludes server-disabled providers", () => {
    const result = getVisibleProviderUpdateStatuses({
      providers: [providerStatus("codex"), providerStatus("pi")],
      serverSettings: serverSettings({
        pi: { enabled: false, binaryPath: "pi", agentDir: "", customModels: [] },
      }),
    });

    expect(result.map((provider) => provider.provider)).toEqual(["codex"]);
  });

  it("waits for server settings before showing provider updates", () => {
    const result = getVisibleProviderUpdateStatuses({
      providers: [providerStatus("codex")],
      serverSettings: null,
    });

    expect(result).toEqual([]);
  });

  it("excludes provider updates when automatic update checks are disabled", () => {
    const result = getVisibleProviderUpdateStatuses({
      providers: [providerStatus("codex")],
      serverSettings: { ...serverSettings(), enableProviderUpdateChecks: false },
    });

    expect(result).toEqual([]);
  });

  it("can narrow notifications to one-click updates while settings keep manual updates visible", () => {
    const manualOnly = providerStatus("pi", {
      versionAdvisory: {
        status: "behind_latest",
        currentVersion: "1.0.0",
        latestVersion: "1.1.0",
        updateCommand: null,
        canUpdate: false,
        checkedAt: "2026-06-10T10:00:00.000Z",
        message: "Update available.",
      },
    });

    expect(
      getVisibleProviderUpdateStatuses({
        providers: [providerStatus("codex"), manualOnly],
        serverSettings: serverSettings(),
      }).map((provider) => provider.provider),
    ).toEqual(["codex", "pi"]);
    expect(
      getVisibleProviderUpdateStatuses({
        providers: [providerStatus("codex"), manualOnly],
        serverSettings: serverSettings(),
        oneClickOnly: true,
      }).map((provider) => provider.provider),
    ).toEqual(["codex"]);
  });
});

describe("provider update presentation", () => {
  it("contains malformed external string fields without throwing", () => {
    expect(formatProviderVersion(42)).toBeNull();
    expect(
      providerUpdateStatusLabel(
        providerStatus("codex", {
          version: 42 as never,
          versionAdvisory: {
            ...providerStatus("codex").versionAdvisory!,
            currentVersion: { value: "1.0.0" } as never,
            latestVersion: 11 as never,
          },
        }),
      ),
    ).toBeNull();
    expect(
      providerUpdateFailureMessage(
        providerStatus("codex", {
          updateState: {
            status: "failed",
            message: { detail: "failed" } as never,
            output: 17 as never,
            startedAt: null,
            completedAt: null,
          },
        }),
      ),
    ).toBe("The provider update did not complete.");
  });

  it("preserves valid provider update copy", () => {
    expect(formatProviderVersion(" 1.2.3 ")).toBe("v1.2.3");
    expect(providerUpdateStatusLabel(providerStatus("codex"))).toBe("v1.0.0 -> v1.1.0");
    expect(
      providerUpdateFailureMessage(
        providerStatus("codex", {
          updateState: {
            status: "failed",
            message: "fallback",
            output: " detailed failure ",
            startedAt: null,
            completedAt: null,
          },
        }),
      ),
    ).toBe("detailed failure");
  });
});

describe("providerUpdateNotificationKey", () => {
  it("keys by provider/version and ignores ordering", () => {
    const left = providerUpdateNotificationKey([
      providerStatus("pi", {
        versionAdvisory: {
          ...providerStatus("pi").versionAdvisory!,
          latestVersion: "2.0.0",
        },
      }),
      providerStatus("codex"),
    ]);
    const right = providerUpdateNotificationKey([
      providerStatus("codex"),
      providerStatus("pi", {
        versionAdvisory: {
          ...providerStatus("pi").versionAdvisory!,
          latestVersion: "2.0.0",
        },
      }),
    ]);

    expect(left).toBe(right);
  });
});

describe("shouldShowProviderUpdateStatus", () => {
  it("matches the list filter for hidden and server-disabled providers", () => {
    const codex = providerStatus("codex");
    const hiddenPi = providerStatus("pi");
    const settings = serverSettings({
      codex: { enabled: false, binaryPath: "codex", homePath: "", customModels: [] },
    });

    expect(
      shouldShowProviderUpdateStatus({
        provider: codex,
        hiddenProviderSet: new Set(),
        serverSettings: settings,
      }),
    ).toBe(false);
    expect(
      shouldShowProviderUpdateStatus({
        provider: hiddenPi,
        hiddenProviders: ["pi"],
        serverSettings: serverSettings(),
      }),
    ).toBe(false);
  });
});

describe("isProviderUpdateActive", () => {
  it("only treats queued and running provider updates as active", () => {
    const queuedState = {
      status: "queued",
      startedAt: null,
      finishedAt: null,
      message: null,
      output: null,
    } satisfies NonNullable<ServerProviderStatus["updateState"]>;
    const succeededState = {
      ...queuedState,
      status: "succeeded",
    } satisfies NonNullable<ServerProviderStatus["updateState"]>;

    expect(isProviderUpdateActive(providerStatus("codex", { updateState: queuedState }))).toBe(
      true,
    );
    expect(isProviderUpdateActive(providerStatus("codex", { updateState: succeededState }))).toBe(
      false,
    );
  });
});

describe("withProviderUpdateTimeout", () => {
  it("rejects a provider request that never settles", async () => {
    vi.useFakeTimers();
    const pending = new Promise<never>(() => undefined);
    const assertion = expect(
      withProviderUpdateTimeout({
        provider: "kilo",
        request: pending,
        timeoutMs: 1_000,
      }),
    ).rejects.toThrow("Kilo update timed out after 1 second");

    await vi.advanceTimersByTimeAsync(1_000);
    await assertion;
  });

  it("clears its watchdog when the provider request finishes", async () => {
    vi.useFakeTimers();
    await expect(
      withProviderUpdateTimeout({
        provider: "antigravity",
        request: Promise.resolve("updated"),
        timeoutMs: 1_000,
      }),
    ).resolves.toBe("updated");

    expect(vi.getTimerCount()).toBe(0);
  });
});

describe("runProviderUpdateBatch", () => {
  const finishedAt = "2026-06-10T10:01:00.000Z";

  function updateResult(
    provider: ProviderKind,
    overrides: Partial<ServerProviderStatus> = {},
  ) {
    return {
      providers: [
        providerStatus(provider, {
          version: "1.1.0",
          versionAdvisory: {
            ...providerStatus(provider).versionAdvisory!,
            status: "current",
            currentVersion: "1.1.0",
          },
          updateState: {
            status: "succeeded",
            startedAt: "2026-06-10T10:00:30.000Z",
            finishedAt,
            message: "Updated.",
            output: null,
          },
          ...overrides,
        }),
      ],
    };
  }

  it("reports success only when every refreshed provider is no longer outdated", async () => {
    const providers = [providerStatus("codex"), providerStatus("claudeAgent")];
    const updateProvider = vi.fn((provider: ProviderKind) =>
      Promise.resolve(updateResult(provider)),
    );

    const outcome = await runProviderUpdateBatch({ providers, updateProvider });

    expect(updateProvider.mock.calls.map(([provider]) => provider)).toEqual([
      "codex",
      "claudeAgent",
    ]);
    expect(outcome).toMatchObject({
      status: "succeeded",
      failures: [],
      manualCommands: [],
    });
    expect(providerUpdateOutcomeCopy(outcome)).toEqual({
      title: "2 providers updated",
      description: "New sessions will use the refreshed provider tools.",
    });
  });

  it.each([
    {
      label: "failed update state",
      overrides: {
        updateState: {
          status: "failed",
          startedAt: "2026-06-10T10:00:30.000Z",
          finishedAt,
          message: "Permission denied.",
          output: null,
        },
      } satisfies Partial<ServerProviderStatus>,
      reason: "Permission denied.",
    },
    {
      label: "unchanged update state",
      overrides: {
        updateState: {
          status: "unchanged",
          startedAt: "2026-06-10T10:00:30.000Z",
          finishedAt,
          message: null,
          output: null,
        },
      } satisfies Partial<ServerProviderStatus>,
      reason: "The update command did not complete successfully.",
    },
    {
      label: "still-outdated advisory",
      overrides: {
        versionAdvisory: providerStatus("codex").versionAdvisory,
      } satisfies Partial<ServerProviderStatus>,
      reason: "The provider still appears outdated after updating.",
    },
  ])("treats a fulfilled $label result as failure", async ({ overrides, reason }) => {
    const provider = providerStatus("codex");
    const outcome = await runProviderUpdateBatch({
      providers: [provider],
      updateProvider: () => Promise.resolve(updateResult("codex", overrides)),
    });

    expect(outcome.status).toBe("failed");
    expect(outcome.failures).toEqual([{ provider, reason }]);
  });

  it("reports rejected and missing-provider results with actionable manual commands", async () => {
    const providers = [
      providerStatus("codex"),
      providerStatus("claudeAgent", {
        versionAdvisory: {
          ...providerStatus("claudeAgent").versionAdvisory!,
          updateCommand: "npm install -g @anthropic-ai/claude-code@latest",
        },
      }),
    ];
    const outcome = await runProviderUpdateBatch({
      providers,
      updateProvider: (provider) =>
        provider === "codex"
          ? Promise.reject(new Error("Network unavailable."))
          : Promise.resolve({ providers: [] }),
    });
    const copy = providerUpdateOutcomeCopy(outcome);

    expect(outcome.status).toBe("failed");
    expect(outcome.failures.map(({ reason }) => reason)).toEqual([
      "Network unavailable.",
      "The provider status was missing after updating.",
    ]);
    expect(copy.title).toBe("Provider updates failed");
    expect(copy.description).toContain("Codex: Network unavailable.");
    expect(copy.description).toContain(
      "Claude: The provider status was missing after updating.",
    );
    expect(copy.copyText).toBe(
      "npm install -g provider@latest\nnpm install -g @anthropic-ai/claude-code@latest",
    );
  });

  it("preserves successful providers while reporting a partial failure", async () => {
    const providers = [providerStatus("codex"), providerStatus("claudeAgent")];
    const outcome = await runProviderUpdateBatch({
      providers,
      updateProvider: (provider) =>
        provider === "codex"
          ? Promise.resolve(updateResult(provider))
          : Promise.reject(new Error("Update process exited with code 1.")),
    });

    expect(outcome.status).toBe("partially_failed");
    expect(providerUpdateOutcomeCopy(outcome).title).toBe(
      "Some provider updates failed",
    );
  });
});

describe("shouldOfferProviderUpdateAction", () => {
  it("offers native AGY updates even when upstream latest-version metadata is unavailable", () => {
    expect(
      shouldOfferProviderUpdateAction(
        providerStatus("antigravity", {
          versionAdvisory: {
            status: "unknown",
            currentVersion: "1.1.2",
            latestVersion: null,
            updateCommand: "agy update",
            canUpdate: true,
            checkedAt: "2026-07-15T14:00:00.000Z",
            message: null,
          },
        }),
      ),
    ).toBe(true);
  });
});
