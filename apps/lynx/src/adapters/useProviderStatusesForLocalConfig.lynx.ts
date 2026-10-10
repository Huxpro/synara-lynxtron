// FILE: adapters/useProviderStatusesForLocalConfig.lynx.ts
// Purpose: Lynx replacement for upstream's `hooks/useProviderStatusesForLocalConfig`
//   (resolved in its place by lynx.config.ts for `~/hooks/…` specifiers; the
//   generated `useThreadHandoff` is its consumer).
// Layer: L1 platform adapter (lynx implementation)
//
// Upstream folds two local settings into the server's provider statuses: a
// custom binary path that has not been confirmed yet, and the local
// `disabledProviders` list, both read through `useAppSettings`. Lynx does not
// run `useAppSettings` (it re-encodes the whole settings record on mount) and
// has no custom binary path setting, so the statuses are the server's own, from
// upstream's config query. A provider disabled in Settings is not offered as a
// handoff target in the first place (`threadHandoff.lynx.ts`).

import type { ServerProviderStatus } from "@synara/contracts";
import { useQuery } from "@tanstack/react-query";
import { serverConfigQueryOptions } from "@synara-web/lib/serverReactQuery";

const EMPTY_PROVIDER_STATUSES: readonly ServerProviderStatus[] = [];

export function useProviderStatusesForLocalConfig(): readonly ServerProviderStatus[] {
  return useQuery(serverConfigQueryOptions()).data?.providers ?? EMPTY_PROVIDER_STATUSES;
}
