// FILE: app/settingsServerData.lynx.ts
// Purpose: The Settings data paths that upstream keeps inside React components
//   (`useAppSettings` in `apps/web/src/appSettings.ts`, `ExternalMcpSettingsPanel`)
//   and therefore cannot be imported: the same facade calls and the same query
//   keys, as plain functions the Lynx Settings surfaces share. Everything that
//   upstream does export as an option factory is used directly by the panels.
// Layer: L3 orchestration (Lynx); no relay, no Lynx-only cache keys.

import type { ServerConfig, ServerSettingsPatch, ServerSettingsView } from "@synara/contracts";
import { queryOptions, type QueryClient } from "@tanstack/react-query";
import {
  reconcileServerProviderStatuses,
  serverConfigQueryOptions,
  serverQueryKeys,
  serverSettingsQueryOptions,
} from "@synara-web/lib/serverReactQuery";
import { ensureNativeApi } from "~/nativeApi";

/**
 * Server settings through upstream's query, so the value EventRouter keeps
 * current from the `serverSettingsUpdated` push is the one Settings shows.
 */
export function readServerSettings(queryClient: QueryClient): Promise<ServerSettingsView> {
  "background only";
  return queryClient.fetchQuery(serverSettingsQueryOptions());
}

/** Server config through upstream's query (EventRouter invalidates it on config pushes). */
export function readServerConfig(queryClient: QueryClient): Promise<ServerConfig> {
  "background only";
  return queryClient.fetchQuery(serverConfigQueryOptions());
}

/**
 * Asks the server to re-probe the providers and folds the result into
 * upstream's config query, as `useAppSettings` does after an enablement
 * change. Returns the config every reader of that query now sees.
 */
export async function refreshServerProviderStatuses(
  queryClient: QueryClient,
): Promise<ServerConfig> {
  "background only";
  const result = await ensureNativeApi().server.refreshProviders();
  await reconcileServerProviderStatuses(queryClient, result.providers);
  return (
    queryClient.getQueryData<ServerConfig>(serverQueryKeys.config()) ??
    readServerConfig(queryClient)
  );
}

/**
 * One server-settings write, as `useAppSettings().updateSettings` performs it:
 * the facade request, then the confirmed view into upstream's settings query.
 * A failed write invalidates that query so the surface returns to server state.
 */
export async function writeServerSettings(
  queryClient: QueryClient,
  patch: ServerSettingsPatch,
): Promise<ServerSettingsView> {
  "background only";
  try {
    const settings = await ensureNativeApi().server.updateSettings(patch);
    queryClient.setQueryData(serverQueryKeys.settings(), settings);
    return settings;
  } catch (error) {
    void queryClient.invalidateQueries({ queryKey: serverQueryKeys.settings() });
    throw error;
  }
}

/**
 * `INTEGRATIONS_QUERY_KEY` of upstream's `ExternalMcpSettingsPanel.tsx`, which
 * does not export it. `settingsServerData.lynx.test.ts` pins the two together.
 */
export const EXTERNAL_MCP_INTEGRATIONS_QUERY_KEY = ["server", "externalMcpIntegrations"] as const;

/**
 * The integrations list as upstream's panel queries it. Upstream also polls
 * every 2 s while a pairing is pending; Lynx never did and does not start to.
 */
export function externalMcpIntegrationsQueryOptions() {
  return queryOptions({
    queryKey: EXTERNAL_MCP_INTEGRATIONS_QUERY_KEY,
    queryFn: () => ensureNativeApi().server.listExternalMcpIntegrations(),
    staleTime: 5_000,
  });
}
