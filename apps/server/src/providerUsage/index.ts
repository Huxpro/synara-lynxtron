// FILE: providerUsage/index.ts
// Purpose: Orchestrate the live provider-usage fetchers — defensive batch fetch (one failure never
// blocks the others), and enrichment of Codex/Claude live
// snapshots with the locally-derived token-total usage lines. Exposes both a plain async API
// (for tests) and an Effect that reads ServerConfig (for the WS RPC handler).

import type {
  ProviderKind,
  ServerListProviderUsageInput,
  ServerListProviderUsageResult,
  ServerProviderUsageSnapshot,
} from "@synara/contracts";
import { Effect } from "effect";

import { ServerConfig } from "../config";
import { buildProviderChildEnvironment, type ProviderChildKind } from "../providerChildEnvironment";
import { loadLocalProviderUsageSnapshot } from "../providerUsageSnapshot";
import { errorSnapshot } from "./parse";
import { PROVIDER_USAGE_FETCHERS } from "./registry";
import type { ProviderUsageContext } from "./types";

// Providers whose live snapshot is enriched with on-disk token-total lines (24h/7d/30d).
const LOCAL_ARCHIVE_PROVIDERS: ReadonlySet<ProviderKind> = new Set(["codex", "claudeAgent"]);

const providerChildKind = (provider: ProviderKind): ProviderChildKind =>
  provider === "claudeAgent" ? "claude" : provider;

function buildContext(): ProviderUsageContext {
  return {
    homeDir: "",
    env: process.env,
    platform: process.platform,
    nowMs: Date.now(),
  };
}

async function fetchProviderUsage(
  provider: ProviderKind,
  ctx: ProviderUsageContext,
): Promise<ServerProviderUsageSnapshot | null> {
  const fetcher = PROVIDER_USAGE_FETCHERS[provider];
  if (!fetcher) {
    return null;
  }

  const providerContext: ProviderUsageContext = {
    ...ctx,
    env: buildProviderChildEnvironment({
      provider: providerChildKind(provider),
      baseEnv: ctx.env,
    }),
  };
  return fetcher
    .fetch(providerContext)
    .catch(() =>
      errorSnapshot(provider, ctx.nowMs, "live-usage", "Usage fetch failed unexpectedly."),
    );
}

export function mergeLiveWithLocalUsage(
  snapshot: ServerProviderUsageSnapshot,
  localSnapshot: ServerProviderUsageSnapshot | null,
): ServerProviderUsageSnapshot {
  if (!localSnapshot) {
    return snapshot;
  }
  const hasLocalUsage =
    localSnapshot.limits.length > 0 || localSnapshot.usageLines.length > 0;
  if (!hasLocalUsage) {
    return snapshot;
  }
  if ((snapshot.status ?? "ok") === "ok") {
    return {
      ...snapshot,
      limits:
        snapshot.limits.length > 0 ? snapshot.limits : localSnapshot.limits,
      usageLines: [...snapshot.usageLines, ...localSnapshot.usageLines],
    };
  }
  return {
    ...localSnapshot,
    status: "ok",
    detail: [
      snapshot.detail?.trim() || "Live provider usage is unavailable.",
      "Showing the latest usage recorded by the local CLI.",
    ].join(" "),
  };
}

async function enrichWithLocalUsage(
  snapshot: ServerProviderUsageSnapshot,
  ctx: ProviderUsageContext,
): Promise<ServerProviderUsageSnapshot> {
  if (!LOCAL_ARCHIVE_PROVIDERS.has(snapshot.provider)) {
    return snapshot;
  }
  const localSnapshot = await loadLocalProviderUsageSnapshot({
    provider: snapshot.provider,
    homeDir: ctx.homeDir,
  });
  return mergeLiveWithLocalUsage(snapshot, localSnapshot);
}

/** Plain async batch fetch for supported providers. Never throws. */
export async function collectProviderUsageSnapshots(
  ctx: ProviderUsageContext,
  options: { forceRefresh?: boolean; provider?: ProviderKind } = {},
): Promise<ServerProviderUsageSnapshot[]> {
  const providers = options.provider
    ? ([options.provider] as ProviderKind[])
    : (Object.keys(PROVIDER_USAGE_FETCHERS) as ProviderKind[]);
  const settled = await Promise.allSettled(
    providers.map(async (provider) => {
      const snapshot = await fetchProviderUsage(provider, ctx);
      return snapshot ? enrichWithLocalUsage(snapshot, ctx) : null;
    }),
  );

  return settled
    .map((result) => (result.status === "fulfilled" ? result.value : null))
    .filter((snapshot): snapshot is ServerProviderUsageSnapshot => snapshot !== null);
}

export const listProviderUsage = Effect.fn(function* (input: ServerListProviderUsageInput) {
  const serverConfig = yield* ServerConfig;
  return yield* Effect.tryPromise({
    try: () =>
      collectProviderUsageSnapshots(
        {
          ...buildContext(),
          homeDir: serverConfig.homeDir,
        },
        {
          forceRefresh: input.forceRefresh === true,
          ...(input.provider ? { provider: input.provider } : {}),
        },
      ),
    catch: () => [] as unknown as ServerListProviderUsageResult,
  });
});
