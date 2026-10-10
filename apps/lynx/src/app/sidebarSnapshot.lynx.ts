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
//
// Session sync reports no failure of its own, so "never hydrated" is turned
// into an error with a Retry by `sessionShellBootstrap.logic.ts`.

import { useEffect, useMemo } from "@lynx-js/react";
import { useStore } from "@synara-web/store";
import { create } from "zustand";

import {
  getActiveComposerSendThreadIds,
  subscribeComposerSends,
} from "@synara-web/lib/composerSendOwnership";
import { fetchSidebarSearchSnapshot, type SidebarSnapshot, type ThreadSummary } from "./queries";
import { createShellBootstrapWatch, type ShellBootstrapWatch } from "./sessionShellBootstrap.logic";
import {
  createRouteThreadSummariesSelector,
  createSidebarSnapshotSelector,
  projectFreshSidebarSnapshot,
  type SidebarSnapshotLocalInputs,
} from "./sidebarSnapshot.logic";

const useSidebarSnapshotLocalInputs = create<SidebarSnapshotLocalInputs>(() => ({
  ready: false,
  searchSnapshot: undefined,
  dismissedThreadStatusKeyByThreadId: {},
}));

/** Set while the store has never hydrated and session sync is not going to get there unaided. */
const useShellBootstrapError = create<{ readonly error: Error | null }>(() => ({ error: null }));

// One selector instance for every consumer: they all pass the same local-input
// object, so the projection runs once per store change, not once per observer.
const selectSidebarSnapshot = createSidebarSnapshotSelector();
const selectRouteThreadSummaries = createRouteThreadSummariesSelector();

let localInputsRequest: Promise<void> | null = null;
let searchSnapshotRequest: Promise<void> | null = null;
let shellBootstrapWatch: ShellBootstrapWatch | null = null;

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
      activeComposerSendThreadIds: getActiveComposerSendThreadIds(),
    });
    // Upstream's sidebar reads the same store with useSyncExternalStore.
    subscribeComposerSends(() => {
      useSidebarSnapshotLocalInputs.setState({
        activeComposerSendThreadIds: getActiveComposerSendThreadIds(),
      });
    });
  })().catch((error: unknown) => {
    // Dismissed status keys only hide pills the user already dismissed. Losing
    // them must not hold every sidebar surface in "loading": mounted consumers
    // only start this once, so readiness is settled here either way.
    console.error("[sidebar] local inputs unavailable", error);
    useSidebarSnapshotLocalInputs.setState({ ready: true });
  });
  return localInputsRequest;
}

function ensureShellBootstrapWatch(): ShellBootstrapWatch {
  "background only";
  if (shellBootstrapWatch) return shellBootstrapWatch;
  const watch = createShellBootstrapWatch({
    isHydrated: () => useStore.getState().threadsHydrated,
    setError: (error) => {
      if (useShellBootstrapError.getState().error !== error) {
        useShellBootstrapError.setState({ error });
      }
    },
    startTimeout: (milliseconds, onTimeout) => {
      const timer = setTimeout(onTimeout, milliseconds);
      return () => clearTimeout(timer);
    },
    getShellSnapshot: async () => {
      const { ensureNativeApi } = await import(/* webpackMode: "eager" */ "~/nativeApi");
      return ensureNativeApi().orchestration.getShellSnapshot();
    },
    // The same store action session sync's own bootstrap uses. Reached only
    // from an explicit Retry while the store has never hydrated, so there is no
    // streamed state it could roll back; the stream's snapshot replaces it.
    commitShellSnapshot: (snapshot) => useStore.getState().syncServerShellSnapshot(snapshot),
  });
  shellBootstrapWatch = watch;
  let hydrated = useStore.getState().threadsHydrated;
  useStore.subscribe((state) => {
    if (state.threadsHydrated === hydrated) return;
    hydrated = state.threadsHydrated;
    watch.hydrationChanged();
  });
  void import(/* webpackMode: "eager" */ "@synara-web/wsTransportEvents").then(
    ({ addWsTransportStateListener }) => {
      addWsTransportStateListener(watch.transportChanged);
    },
  );
  watch.start();
  return watch;
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

/** Retry for every sidebar surface: the shell if it never loaded, then the search messages. */
async function refetchSidebarSnapshot(): Promise<void> {
  "background only";
  void ensureSidebarSnapshotLocalInputs();
  await ensureShellBootstrapWatch().retry();
  await refreshSidebarSearchSnapshot();
}

export interface SidebarSnapshotResult {
  /** `undefined` until session sync has hydrated the store. */
  readonly data: SidebarSnapshot | undefined;
  /** Not hydrated yet and not failed. */
  readonly isPending: boolean;
  /** Set while the store has never hydrated and the shell is not arriving. */
  readonly error: Error | null;
  readonly isError: boolean;
  readonly isFetching: boolean;
  /** Retries the shell bootstrap if it never completed, and refreshes the search messages. */
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
  const bootstrapError = useShellBootstrapError((state) => state.error);

  useEffect(() => {
    "background only";
    void ensureSidebarSnapshotLocalInputs();
    ensureShellBootstrapWatch();
  }, []);
  useEffect(() => {
    "background only";
    // The first read waits for hydration: before it the server may not be
    // reachable yet, and nothing can render the result anyway.
    if (!hydrated) return;
    if (useSidebarSnapshotLocalInputs.getState().searchSnapshot !== undefined) return;
    void refreshSidebarSearchSnapshot();
  }, [hydrated]);

  return useMemo(() => {
    const error = data === undefined ? bootstrapError : null;
    return {
      data,
      isPending: data === undefined && error === null,
      error,
      isError: error !== null,
      isFetching: false,
      refetch: refetchSidebarSnapshot,
    };
  }, [bootstrapError, data]);
}

/**
 * The sidebar snapshot as the server has it now, for an action that must not
 * decide on a read that may lag the shell stream (deleting a worktree with
 * `force`). Issues one shell request through the upstream facade and projects
 * it without writing the store. Throws while session sync has not hydrated the
 * store, and when the server cannot be reached.
 */
export async function readFreshSidebarSnapshot(): Promise<SidebarSnapshot> {
  "background only";
  await ensureSidebarSnapshotLocalInputs();
  if (!useStore.getState().threadsHydrated) {
    throw new Error("Synara has not finished loading projects and threads.");
  }
  const { ensureNativeApi } = await import(/* webpackMode: "eager" */ "~/nativeApi");
  const shell = await ensureNativeApi().orchestration.getShellSnapshot();
  return projectFreshSidebarSnapshot(
    useStore.getState(),
    shell,
    useSidebarSnapshotLocalInputs.getState(),
  );
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
