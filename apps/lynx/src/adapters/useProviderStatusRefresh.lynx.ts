// FILE: adapters/useProviderStatusRefresh.lynx.ts
// Purpose: Lynx replacement for upstream's `hooks/useProviderStatusRefresh`
//   (resolved in its place by lynx.config.ts for `~/hooks/…` specifiers; the
//   generated `useThreadHandoff` is its consumer).
// Layer: L1 platform adapter (lynx implementation)
//
// The upstream module imports its toast relatively (`../components/ui/toast`),
// which no alias redirects, so importing it would put the DOM toast in the Lynx
// bundle. `useRefreshProviderStatusesNow` is copied here with the Lynx toast;
// `plan/upstream-parallel-copies.json` fails the build when upstream changes
// it. The focus/periodic `useProviderStatusRefresh` has no Lynx consumer.

import type { ServerProviderStatus } from "@synara/contracts";
import { useQueryClient } from "@tanstack/react-query";
import { reconcileServerProviderStatuses } from "@synara-web/lib/serverReactQuery";
import { readNativeApi } from "~/nativeApi";

import { toastManager } from "../components/ui/toast.lynx";

export type RefreshProviderStatusesOptions = {
  readonly silent?: boolean;
};

export type RefreshProviderStatusesNow = (
  options?: RefreshProviderStatusesOptions,
) => Promise<readonly ServerProviderStatus[] | null>;

/**
 * Imperative one-shot provider-status refresh: re-checks providers on the server
 * and folds the result into the cached server config. Surfaces failures as a toast.
 */
export function useRefreshProviderStatusesNow(): RefreshProviderStatusesNow {
  const queryClient = useQueryClient();
  return async (options?: RefreshProviderStatusesOptions) => {
    const api = readNativeApi();
    if (!api) return null;
    try {
      const result = await api.server.refreshProviders();
      await reconcileServerProviderStatuses(queryClient, result.providers);
      return result.providers;
    } catch (error) {
      if (!options?.silent) {
        toastManager.add({
          type: "error",
          title: "Unable to refresh provider status",
          description:
            error instanceof Error ? error.message : "Unknown error refreshing provider status.",
        });
      }
      return null;
    }
  };
}
