// The Lynx thread page reads the shared Web store (plan Step 4 / M3b).
//
// Upstream's session sync (`EventRouter`, mounted by `SessionSync`) leases the
// detail stream of the routed thread and is the only writer of its messages,
// activities and turn state. This hook subscribes to that thread through
// upstream's selectors, the way `ChatView.tsx` does (`createThreadSelector` plus
// `threadDetailSyncById`), and projects it into what the page renders. There is
// no request here and nothing to invalidate: a streamed delta, an approval, a
// rename or a reconnect all arrive as store changes.

import { useEffect, useMemo, useRef } from "@lynx-js/react";
import { replaceEqualDeep } from "@tanstack/react-query";
import type { ThreadId } from "@synara/contracts";
import { useStore } from "@synara-web/store";
import { createProjectSelector, createThreadSelector } from "@synara-web/storeSelectors";

import { useSynaraTransportState } from "../data/useSynaraTransportState.lynx";
import {
  createThreadMarkdownCache,
  projectThreadHeaderSummary,
  projectThreadTranscriptRows,
  resolveThreadPageRead,
  type ThreadMarkdownCache,
  type ThreadPageData,
  type ThreadPageRead,
} from "./threadPageProjection.logic";

/**
 * Rows and header summary of `threadId`, live from the shared store.
 *
 * Main-thread safe: the render body only reads store state, and the store has
 * no thread before session sync hydrates it on the background thread, so the
 * projection (markdown parsing included) never runs in the first-screen pass.
 */
export function useThreadPageData(
  threadId: string | null,
  // `retain: false` for a thread upstream leases by other means: the dock's Side
  // thread is leased from the dock store and excluded from retention.
  options: { readonly retain?: boolean } = {},
): ThreadPageRead {
  const retain = options.retain ?? true;
  const id = threadId as ThreadId | null;
  const thread = useStore(useMemo(() => createThreadSelector(id), [id]));
  const project = useStore(
    useMemo(() => createProjectSelector(thread?.projectId ?? null), [thread?.projectId]),
  );
  const detailSyncState = useStore((state) =>
    id ? (state.threadDetailSyncById?.[id] ?? null) : null,
  );
  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const transport = useSynaraTransportState();

  // Upstream keeps the detail of recently opened threads through its retention
  // registry (its sidebar retains the active thread); without an entry, session
  // sync frees the detail the moment the route leaves. Retaining here is what
  // lets a thread that was open a moment ago show at once when it is reopened,
  // as the query cache did. Eviction, the cap and the stream leases stay
  // upstream's (`threadDetailSubscriptionRetention.ts`).
  useEffect(() => {
    "background only";
    if (!id || !retain) return;
    let active = true;
    let release: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "@synara-web/threadDetailSubscriptionRetention").then(
      ({ retainThreadDetailSubscription }) => {
        if (active) release = retainThreadDetailSubscription(id);
      },
    );
    return () => {
      active = false;
      release?.();
    };
  }, [id, retain]);

  const markdownRef = useRef<{ threadId: string | null; cache: ThreadMarkdownCache } | null>(null);
  const previousDataRef = useRef<ThreadPageData | undefined>(undefined);

  // The projection depends on the thread and its project only. Kept apart from
  // the read state below so a transport or sync-state change does not rebuild
  // the rows.
  const projected = useMemo(() => {
    if (!thread) return null;
    if (markdownRef.current?.threadId !== threadId) {
      markdownRef.current = { threadId, cache: createThreadMarkdownCache() };
    }
    return {
      data: projectThreadTranscriptRows(thread, markdownRef.current.cache),
      summary: projectThreadHeaderSummary(thread, project),
    };
  }, [project, thread, threadId]);

  return useMemo(() => {
    const read = resolveThreadPageRead({
      threadsHydrated,
      thread,
      detailSyncState,
      transport,
      // Guarded by `resolveThreadPageRead`: only called with a thread.
      project: () => projected!,
    });
    if (read.data === undefined) return read;
    // Unchanged rows keep their reference across store changes (what the query
    // cache's structural sharing did for the polled snapshot).
    const data = replaceEqualDeep(previousDataRef.current, read.data);
    previousDataRef.current = data;
    return data === read.data ? read : { ...read, data };
  }, [detailSyncState, projected, thread, threadsHydrated, transport]);
}
