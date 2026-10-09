// Shell read model (spaces, projects, thread shells) on Lynx.
//
// Upstream's `EventRouter` is the only writer of server state in the shared
// store, and the sidebar surfaces read that store (`sidebarSnapshot.lynx.ts`).
// A shell snapshot fetched on the side must not be committed next to the
// engine: the bounded sidebar snapshot (the 80 most recently updated threads)
// committed as if complete removes older threads and their detail behind the
// engine's sequence bookkeeping, and a request that resolves late rolls back a
// newer streamed change. The remaining request-backed readers (the landing
// bootstrap, the fresh read a destructive action decides on) therefore
// normalize their snapshot with the same pure store projection, on top of the
// current state, without committing. Code that reads the store directly waits
// for the engine's hydration.

import type { OrchestrationShellSnapshot } from "@synara/contracts";
import { useStore } from "@synara-web/store";
import { syncServerShellSnapshot } from "@synara-web/storeProjection";
import type { AppState } from "@synara-web/storeState";
import type { Project, Space } from "@synara-web/types";

/** The store state this snapshot would produce. The store itself is not touched. */
export function projectShellSnapshot(
  state: AppState,
  snapshot: OrchestrationShellSnapshot,
): AppState {
  return syncServerShellSnapshot(state, snapshot);
}

/**
 * Projects from the shared store, with whether session sync has delivered its
 * first shell snapshot. Until then `projects` is the persisted/empty initial
 * value and must not drive a decision (restore, pruning).
 */
export function useSessionShellProjects(): readonly [readonly Project[], boolean] {
  const projects = useStore((state) => state.projects);
  const hydrated = useStore((state) => state.threadsHydrated);
  return [projects, hydrated] as const;
}

/** Spaces from the shared store; empty until session sync hydrates, then live. */
export function useSessionShellSpaces(): readonly Space[] {
  return useStore((state) => state.spaces);
}
