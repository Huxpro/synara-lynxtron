// Message search for the search palette: upstream's server-side thread search.
//
// This is the read `SidebarSearchPalette.tsx` makes, moved out of the component
// because the Lynx palette is its own surface: the same facade method
// (`orchestration.searchThreads`), query key, limit, minimum length, debounce,
// stale time and `placeholderData`, and upstream's
// `buildSidebarSearchServerThreadMatches` to drop stale hits. Upstream defines
// the query inline, so there are no query options to import; the two timing
// constants are recorded in `plan/upstream-parallel-copies.json`.
//
// Thread detail is only loaded for leased threads, so message hits for every
// other thread come from the server's persisted history. The palette also
// scans the messages the store holds, as upstream does, which covers text that
// is still streaming.

import { useEffect, useMemo, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import {
  ORCHESTRATION_SEARCH_THREADS_MAX_LIMIT,
  ORCHESTRATION_SEARCH_THREADS_MIN_QUERY_LENGTH,
} from "@synara/contracts";
import {
  buildSidebarSearchServerThreadMatches,
  type SidebarSearchServerThreadMatch,
  type SidebarSearchThread,
} from "@synara-web/components/SidebarSearchPalette.logic";
import { readNativeApi } from "~/nativeApi";
import { useStore } from "@synara-web/store";
import { createAllThreadsSelector } from "@synara-web/storeSelectors";
import type { Thread } from "@synara-web/types";

export const THREAD_SEARCH_DEBOUNCE_MS = 150;
export const THREAD_SEARCH_STALE_TIME_MS = 10_000;

function useDebouncedValue<Value>(value: Value, wait: number): Value {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    if (Object.is(value, debounced)) return;
    const timer = setTimeout(() => setDebounced(value), wait);
    return () => clearTimeout(timer);
  }, [debounced, value, wait]);
  return debounced;
}

/** Server message hits for `query`, keyed by thread id; `undefined` below the minimum length. */
export function useSidebarThreadSearch(input: {
  readonly query: string;
  /** The palette is open and the query is not a filesystem path. */
  readonly enabled: boolean;
}): ReadonlyMap<string, SidebarSearchServerThreadMatch> | undefined {
  const trimmedQuery = input.query.trim();
  const debouncedThreadQuery = useDebouncedValue(trimmedQuery, THREAD_SEARCH_DEBOUNCE_MS);
  const { data: serverThreadSearch } = useQuery({
    queryKey: ["sidebar-palette-thread-search", debouncedThreadQuery],
    queryFn: async () => {
      "background only";
      const api = readNativeApi();
      if (!api) return null;
      const result = await api.orchestration.searchThreads({
        query: debouncedThreadQuery,
        limit: ORCHESTRATION_SEARCH_THREADS_MAX_LIMIT,
      });
      return { query: debouncedThreadQuery, matches: result.matches };
    },
    enabled:
      input.enabled && debouncedThreadQuery.length >= ORCHESTRATION_SEARCH_THREADS_MIN_QUERY_LENGTH,
    staleTime: THREAD_SEARCH_STALE_TIME_MS,
    placeholderData: (previous) => previous,
  });
  return useMemo(
    () =>
      trimmedQuery.length >= ORCHESTRATION_SEARCH_THREADS_MIN_QUERY_LENGTH
        ? buildSidebarSearchServerThreadMatches(serverThreadSearch, trimmedQuery)
        : undefined,
    [serverThreadSearch, trimmedQuery],
  );
}

const EMPTY_THREADS: readonly Thread[] = [];
const selectNoThreads = (): readonly Thread[] => EMPTY_THREADS;

// Upstream's `searchPaletteMessagesFor`: one projection per messages array.
const searchMessagesByThreadMessages = new WeakMap<
  Thread["messages"],
  SidebarSearchThread["messages"]
>();

function searchMessagesFor(thread: Thread): SidebarSearchThread["messages"] {
  const cached = searchMessagesByThreadMessages.get(thread.messages);
  if (cached) return cached;
  const projected = thread.messages.map((message) => ({ text: message.text }));
  searchMessagesByThreadMessages.set(thread.messages, projected);
  return projected;
}

/**
 * `threads` with the message bodies the store holds, while the palette is open.
 * Closed, it subscribes to nothing that changes with streamed text.
 */
export function useSidebarSearchThreadsWithLoadedMessages(
  threads: readonly SidebarSearchThread[],
  open: boolean,
): readonly SidebarSearchThread[] {
  const selectAllThreads = useMemo(() => createAllThreadsSelector(), []);
  const storeThreads = useStore(open ? selectAllThreads : selectNoThreads);
  return useMemo(() => {
    if (storeThreads.length === 0) return threads;
    const messagesByThreadId = new Map<string, SidebarSearchThread["messages"]>();
    for (const thread of storeThreads) {
      if (thread.messages.length > 0) messagesByThreadId.set(thread.id, searchMessagesFor(thread));
    }
    if (messagesByThreadId.size === 0) return threads;
    return threads.map((thread) => {
      const messages = messagesByThreadId.get(thread.id);
      return messages ? { ...thread, messages } : thread;
    });
  }, [storeThreads, threads]);
}
