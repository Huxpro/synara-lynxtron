// FILE: providerUpdates.ts
// Purpose: Shared provider-update filtering and refresh cadence for global toasts and settings.
// Layer: Web settings/notification utility
// Exports: update candidate helpers, notification keys, and auto-refresh timing.

import {
  PROVIDER_DISPLAY_NAMES,
  type ProviderKind,
  type ServerProviderStatus,
  type ServerProviderUpdateResult,
  type ServerSettings,
} from "@synara/contracts";

export const PROVIDER_UPDATE_INITIAL_REFRESH_DELAY_MS = 10_000;
export const PROVIDER_UPDATE_REFRESH_INTERVAL_MS = 60 * 60 * 1_000;
// The server stops provider commands after two minutes. This slightly longer
// client watchdog also covers a stalled transport so loading UI always settles.
export const PROVIDER_UPDATE_REQUEST_TIMEOUT_MS = 2 * 60_000 + 15_000;

function formatUpdateTimeout(timeoutMs: number): string {
  if (timeoutMs % 60_000 === 0) {
    const minutes = timeoutMs / 60_000;
    return `${minutes} ${minutes === 1 ? "minute" : "minutes"}`;
  }
  const seconds = timeoutMs / 1_000;
  return `${seconds} ${seconds === 1 ? "second" : "seconds"}`;
}

export async function withProviderUpdateTimeout<T>(input: {
  readonly provider: ProviderKind;
  readonly request: Promise<T>;
  readonly timeoutMs?: number;
}): Promise<T> {
  const timeoutMs = input.timeoutMs ?? PROVIDER_UPDATE_REQUEST_TIMEOUT_MS;
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_resolve, reject) => {
    timeoutId = setTimeout(() => {
      reject(
        new Error(
          `${PROVIDER_DISPLAY_NAMES[input.provider]} update timed out after ${formatUpdateTimeout(timeoutMs)}.`,
        ),
      );
    }, timeoutMs);
  });

  try {
    return await Promise.race([input.request, timeout]);
  } finally {
    if (timeoutId !== undefined) {
      clearTimeout(timeoutId);
    }
  }
}

export type ProviderUpdateFailure = {
  readonly provider: ServerProviderStatus;
  readonly reason: string;
};

export type ProviderUpdateBatchOutcome = {
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  readonly failures: ReadonlyArray<ProviderUpdateFailure>;
  readonly manualCommands: ReadonlyArray<string>;
  readonly status: "succeeded" | "partially_failed" | "failed";
};

function providerUpdateFailureReason(
  provider: ServerProviderStatus,
  result: ServerProviderUpdateResult,
): string | null {
  const refreshed = result.providers.find((entry) => entry.provider === provider.provider);
  if (!refreshed) {
    return "The provider status was missing after updating.";
  }

  const updateState = refreshed.updateState;
  if (updateState?.status === "failed" || updateState?.status === "unchanged") {
    return updateState.message ?? "The update command did not complete successfully.";
  }
  if (refreshed.versionAdvisory?.status === "behind_latest") {
    return "The provider still appears outdated after updating.";
  }
  return null;
}

function normalizeProviderUpdateError(error: unknown): string {
  return error instanceof Error ? error.message : "The update request failed.";
}

export async function runProviderUpdateBatch(input: {
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  readonly updateProvider: (provider: ProviderKind) => Promise<ServerProviderUpdateResult>;
  readonly timeoutMs?: number;
}): Promise<ProviderUpdateBatchOutcome> {
  const failures: ProviderUpdateFailure[] = [];

  for (const provider of input.providers) {
    try {
      const result = await withProviderUpdateTimeout({
        provider: provider.provider,
        request: input.updateProvider(provider.provider),
        ...(input.timeoutMs === undefined ? {} : { timeoutMs: input.timeoutMs }),
      });
      const reason = providerUpdateFailureReason(provider, result);
      if (reason) {
        failures.push({ provider, reason });
      }
    } catch (error) {
      failures.push({
        provider,
        reason: normalizeProviderUpdateError(error),
      });
    }
  }

  const manualCommands = Array.from(
    new Set(
      failures
        .map(({ provider }) => provider.versionAdvisory?.updateCommand)
        .filter(
          (command): command is string =>
            typeof command === "string" && command.trim().length > 0,
        ),
    ),
  );

  return {
    providers: input.providers,
    failures,
    manualCommands,
    status:
      failures.length === 0
        ? "succeeded"
        : failures.length === input.providers.length
          ? "failed"
          : "partially_failed",
  };
}

export function providerUpdateOutcomeCopy(outcome: ProviderUpdateBatchOutcome): {
  readonly title: string;
  readonly description: string;
  readonly copyText?: string;
} {
  if (outcome.status === "succeeded") {
    return {
      title:
        outcome.providers.length === 1
          ? `${PROVIDER_DISPLAY_NAMES[outcome.providers[0]!.provider]} updated`
          : `${outcome.providers.length} providers updated`,
      description: "New sessions will use the refreshed provider tools.",
    };
  }

  const failureLines = outcome.failures
    .map(
      ({ provider, reason }) => `${PROVIDER_DISPLAY_NAMES[provider.provider]}: ${reason}`,
    )
    .join("\n");
  const hasManualCommands = outcome.manualCommands.length > 0;
  return {
    title:
      outcome.status === "failed" ? "Provider updates failed" : "Some provider updates failed",
    description: hasManualCommands
      ? `${failureLines}\n\nCopy the command${outcome.manualCommands.length === 1 ? "" : "s"} below to update manually in a terminal.`
      : failureLines,
    ...(hasManualCommands ? { copyText: outcome.manualCommands.join("\n") } : {}),
  };
}

type ProviderUpdateFilterInput = {
  readonly providers: ReadonlyArray<ServerProviderStatus>;
  readonly hiddenProviders?: ReadonlyArray<ProviderKind>;
  readonly serverSettings?:
    | Pick<ServerSettings, "providers" | "enableProviderUpdateChecks">
    | null
    | undefined;
  readonly oneClickOnly?: boolean;
};

type ProviderUpdateVisibilityInput = {
  readonly provider: ServerProviderStatus;
  readonly hiddenProviders?: ReadonlyArray<ProviderKind>;
  readonly hiddenProviderSet?: ReadonlySet<ProviderKind>;
  readonly serverSettings?:
    | Pick<ServerSettings, "providers" | "enableProviderUpdateChecks">
    | null
    | undefined;
  readonly oneClickOnly?: boolean;
};

export function isProviderUpdateActive(provider: ServerProviderStatus): boolean {
  return provider.updateState?.status === "queued" || provider.updateState?.status === "running";
}

export function shouldOfferProviderUpdateAction(provider: ServerProviderStatus): boolean {
  const advisory = provider.versionAdvisory;
  return (
    advisory?.canUpdate === true &&
    advisory.updateCommand !== null &&
    (advisory.status === "behind_latest" || advisory.status === "unknown")
  );
}

function isProviderEnabled(
  provider: ProviderKind,
  serverSettings: Pick<ServerSettings, "providers"> | null | undefined,
): boolean {
  if (!serverSettings) {
    return false;
  }
  return serverSettings.providers[provider]?.enabled !== false;
}

// Central visibility gate used by both global toasts and Settings update rows.
export function shouldShowProviderUpdateStatus(input: ProviderUpdateVisibilityInput): boolean {
  const advisory = input.provider.versionAdvisory;
  const hiddenProviderSet = input.hiddenProviderSet ?? new Set(input.hiddenProviders ?? []);
  if (
    !advisory ||
    input.serverSettings?.enableProviderUpdateChecks === false ||
    advisory.status !== "behind_latest" ||
    advisory.latestVersion === null ||
    hiddenProviderSet.has(input.provider.provider) ||
    !isProviderEnabled(input.provider.provider, input.serverSettings)
  ) {
    return false;
  }

  return input.oneClickOnly === true
    ? advisory.canUpdate === true && advisory.updateCommand !== null
    : true;
}

export function getVisibleProviderUpdateStatuses(
  input: ProviderUpdateFilterInput,
): ServerProviderStatus[] {
  const hiddenProviderSet = new Set(input.hiddenProviders ?? []);
  const oneClickOnly = input.oneClickOnly ?? false;

  return input.providers.filter((provider) =>
    shouldShowProviderUpdateStatus({
      provider,
      serverSettings: input.serverSettings,
      hiddenProviderSet,
      oneClickOnly,
    }),
  );
}

export function providerUpdateNotificationKey(
  providers: ReadonlyArray<ServerProviderStatus>,
): string | null {
  const parts = providers
    .map((provider) =>
      [provider.provider, provider.versionAdvisory?.latestVersion ?? "unknown"].join(":"),
    )
    .toSorted();

  return parts.length > 0 ? parts.join("|") : null;
}
