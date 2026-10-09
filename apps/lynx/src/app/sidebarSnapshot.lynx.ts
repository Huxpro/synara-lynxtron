// The Lynx sidebar surfaces read the shared Web store (plan Step 3).
//
// Upstream's session sync (`EventRouter`, mounted by `SessionSync`) is the only
// writer of server state in the store and keeps it live from the shell stream.
// These hooks subscribe to the store through the upstream selectors, so the
// sidebar, the search palette, Kanban and the Settings panels follow every
// shell change without a request and without a poll.
//
// Two inputs of the projection are not in the store and stay Lynx-side:
// the dismissed status keys (renderer UI state in storage) and the sidebar
// search snapshot (message windows for the search palette; a server read that
// upstream does not have). Both live in a small local store next to it.

import { useEffect, useMemo } from "@lynx-js/react";
import { useStore } from "@synara-web/store";
import { create } from "zustand";

import { fetchSidebarSearchSnapshot, type SidebarSnapshot, type ThreadSummary } from "./queries";
import {
  createRouteThreadSummariesSelector,
  createSidebarSnapshotSelector,
  type SidebarSnapshotLocalInputs,
} from "./sidebarSnapshot.logic";

const useSidebarSnapshotLocalInputs = create<SidebarSnapshotLocalInputs>(() => ({
  ready: false,
  searchSnapshot: undefined,
  dismissedThreadStatusKeyByThreadId: {},
}));

// One selector instance for every consumer: they all pass the same local-input
// object, so the projection runs once per store change, not once per observer.
const selectSidebarSnapshot = createSidebarSnapshotSelector();
const selectRouteThreadSummaries = createRouteThreadSummariesSelector();

let localInputsRequest: Promise<void> | null = null;
let searchSnapshotRequest: Promise<void> | null = null;

function ensureSidebarSnapshotLocalInputs(): Promise<void> {
  "background only";
  localInputsRequest ??= (async () => {
    const [{ hydrateStorage }, { readSidebarUiState }] = await Promise.all([
      import(/* webpackMode: "eager" */ "../platform/storage"),
      import(/* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"),
    ]);
    await hydrateStorage();
    useSidebarSnapshotLocalInputs.setState({
      ready: true,
      dismissedThreadStatusKeyByThreadId: readSidebarUiState().dismissedThreadStatusKeyByThreadId,
    });
  })().catch((error: unknown) => {
    localInputsRequest = null;
    console.error("[sidebar] local inputs unavailable", error);
  });
  return localInputsRequest;
}

/**
 * Reads the sidebar search snapshot from the server. Requests are coalesced;
 * a failure keeps the previous snapshot (the palette then searches titles and
 * whatever messages the store holds).
 */
export function refreshSidebarSearchSnapshot(): Promise<void> {
  "background only";
  searchSnapshotRequest ??= (async () => {
    const searchSnapshot = await fetchSidebarSearchSnapshot();
    if (
      useSidebarSnapshotLocalInputs.getState().searchSnapshot?.snapshotSequence ===
      searchSnapshot.snapshotSequence
    ) {
      return;
    }
    useSidebarSnapshotLocalInputs.setState({ searchSnapshot });
  })()
    .catch((error: unknown) => {
      console.warn("[slice] sidebar search projection unavailable", String(error));
    })
    .finally(() => {
      searchSnapshotRequest = null;
    });
  return searchSnapshotRequest;
}

export interface SidebarSnapshotResult {
  /** `undefined` until session sync has hydrated the store. */
  readonly data: SidebarSnapshot | undefined;
  readonly isPending: boolean;
  /** The store has no failure state of its own: an unreachable server reads as pending. */
  readonly error: Error | null;
  readonly isError: boolean;
  readonly isFetching: boolean;
  /** Refreshes the only request-backed input (search message windows). */
  readonly refetch: () => Promise<void>;
}

/**
 * The sidebar snapshot, live from the shared store. The render body only reads
 * store state (main-thread safe: the projection does not run before hydration,
 * which only ever happens on the background thread).
 */
export function useSidebarSnapshot(): SidebarSnapshotResult {
  const local = useSidebarSnapshotLocalInputs();
  const hydrated = useStore((state) => state.threadsHydrated);
  const data = useStore((state) => selectSidebarSnapshot(state, local));

  useEffect(() => {
    "background only";
    void ensureSidebarSnapshotLocalInputs();
  }, []);
  useEffect(() => {
    "background only";
    // The first read waits for hydration: before it the server may not be
    // reachable yet, and nothing can render the result anyway.
    if (!hydrated) return;
    if (useSidebarSnapshotLocalInputs.getState().searchSnapshot !== undefined) return;
    void refreshSidebarSearchSnapshot();
  }, [hydrated]);

  return useMemo(
    () => ({
      data,
      isPending: data === undefined,
      error: null,
      isError: false,
      isFetching: false,
      refetch: refreshSidebarSearchSnapshot,
    }),
    [data],
  );
}

/**
 * The current sidebar snapshot for an action that must decide on fresh state.
 * Throws while session sync has not hydrated the store.
 */
export async function readSidebarSnapshot(): Promise<SidebarSnapshot> {
  "background only";
  await ensureSidebarSnapshotLocalInputs();
  const snapshot = selectSidebarSnapshot(
    useStore.getState(),
    useSidebarSnapshotLocalInputs.getState(),
  );
  if (!snapshot) throw new Error("Synara has not finished loading projects and threads.");
  return snapshot;
}

/**
 * Unarchived threads for the route shell, with whether session sync has
 * hydrated the store. Before that the list is empty and must not drive a
 * decision (restore, pruning).
 */
export function useRouteThreadSummaries(): readonly [readonly ThreadSummary[], boolean] {
  const threads = useStore(selectRouteThreadSummaries);
  return useMemo(() => [threads ?? EMPTY_THREADS, threads !== undefined] as const, [threads]);
}

const EMPTY_THREADS: readonly ThreadSummary[] = [];
