// FILE: app/persistedStoreHydration.lynx.ts
// Purpose: Load the shared stores' persisted state once the storage mirror holds
//   the disk contents. The upstream stores read storage when their module is
//   evaluated; on Lynx that happens while the mirror is still empty (App imports
//   the router, the router imports the stores), so each one starts from defaults
//   and its next write would replace what was saved.
// Layer: Lynx app bootstrap (background thread)
// Exports: rehydratePersistedStores
//
// Call after `hydrateStorage()` and before SessionSync mounts: no store writes
// before the first shell snapshot, so nothing can be persisted in between.

/**
 * Re-reads every eagerly created persisted store from the hydrated mirror.
 *
 * - `store.ts` keeps remembered project names, appearance, expansion and order in
 *   `storePersistence`; `readPersistedState` reloads them (it returns the state it
 *   was given, so the store itself needs no write).
 * - The zustand `persist` stores hydrate synchronously at creation; `rehydrate()`
 *   repeats that against the hydrated mirror.
 *
 * Not listed because they need nothing: `spacesUiStore` (session storage, empty at
 * launch by definition), `threadVisitedPersistence` and `Sidebar.uiState` (read on
 * first use, which is after hydration), and the composer draft store (Lynx adapter
 * with its own hydration).
 */
export async function rehydratePersistedStores(): Promise<void> {
  "background only";
  const [
    { readPersistedState },
    { useStore },
    { useTerminalStateStore },
    { useRecentViewsStore },
    { useRightDockStore },
    { useSplitViewStore },
    { useLatestProjectStore },
    { useWorkspacePathsStore },
    { usePinnedThreadsStore },
    { usePinnedProjectsStore },
    { useProjectInstructionsStore },
  ] = await Promise.all([
    import(/* webpackMode: "eager" */ "@synara-web/storePersistence"),
    import(/* webpackMode: "eager" */ "@synara-web/store"),
    import(/* webpackMode: "eager" */ "@synara-web/terminalStateStore"),
    import(/* webpackMode: "eager" */ "@synara-web/recentViewsStore"),
    import(/* webpackMode: "eager" */ "@synara-web/rightDockStore"),
    import(/* webpackMode: "eager" */ "@synara-web/splitViewStore"),
    import(/* webpackMode: "eager" */ "@synara-web/latestProjectStore"),
    import(/* webpackMode: "eager" */ "@synara-web/workspacePathsStore"),
    import(/* webpackMode: "eager" */ "@synara-web/pinnedThreadsStore"),
    import(/* webpackMode: "eager" */ "@synara-web/pinnedProjectsStore"),
    import(/* webpackMode: "eager" */ "@synara-web/projectInstructionsStore"),
  ]);
  readPersistedState(useStore.getState());
  await Promise.all(
    [
      useTerminalStateStore,
      useRecentViewsStore,
      useRightDockStore,
      useSplitViewStore,
      useLatestProjectStore,
      useWorkspacePathsStore,
      usePinnedThreadsStore,
      usePinnedProjectsStore,
      useProjectInstructionsStore,
    ].map((store) => store.persist.rehydrate()),
  );
}
