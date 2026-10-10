// The Automations state layer on Lynx: upstream's, generated from the route
// module that keeps it (`src/generated/automationsState.generated.ts`).
//
// `useAutomations` is upstream's list query (key `automationQueryKey`) and its
// mutations, including the optimistic definition patch and its rollback.
// Upstream keeps the list live by folding the server's automation stream into
// the query cache with `applyAutomationEvent`; its sidebar owns that
// subscription because it is always mounted. On Lynx the surfaces that show
// automations share one subscription for as long as any of them is mounted.

import { useEffect } from "@lynx-js/react";
import type { AutomationListResult } from "@synara/contracts";
import { useQueryClient, type QueryClient } from "@tanstack/react-query";
import { ensureNativeApi } from "~/nativeApi";

import {
  applyAutomationEvent,
  automationQueryKey,
  useAutomations,
} from "../generated/automationsState.generated";

const subscriptions = new Map<QueryClient, { count: number; unsubscribe: () => void }>();

/** Holds the automation stream open for `queryClient`; returns the release. */
export function retainAutomationEvents(queryClient: QueryClient): () => void {
  "background only";
  let entry = subscriptions.get(queryClient);
  if (!entry) {
    entry = {
      count: 0,
      // The same handler as upstream's `Sidebar.tsx`.
      unsubscribe: ensureNativeApi().automation.onEvent((event) => {
        queryClient.setQueryData<AutomationListResult>(automationQueryKey, (prev) =>
          applyAutomationEvent(prev, event),
        );
      }),
    };
    subscriptions.set(queryClient, entry);
  }
  entry.count += 1;
  let released = false;
  return () => {
    if (released) return;
    released = true;
    const current = subscriptions.get(queryClient);
    if (!current) return;
    current.count -= 1;
    if (current.count > 0) return;
    subscriptions.delete(queryClient);
    current.unsubscribe();
  };
}

/** Upstream's `useAutomations`, kept current by the server's automation stream. */
export function useLiveAutomations(...args: Parameters<typeof useAutomations>) {
  const automations = useAutomations(...args);
  const queryClient = useQueryClient();
  useEffect(() => {
    "background only";
    return retainAutomationEvents(queryClient);
  }, [queryClient]);
  return automations;
}
