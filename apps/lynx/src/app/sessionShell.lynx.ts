// Shell read model (spaces, projects, thread shells) on Lynx while the polling
// read path still exists next to upstream's session sync.
//
// Upstream's `EventRouter` is the only writer of server state in the shared
// store. A polled shell snapshot must not be committed next to it: the sidebar
// poll is bounded (the 80 most recently updated threads), so committing it as
// if complete removes older threads and their detail behind the engine's
// sequence bookkeeping, and a poll that resolves late rolls back a newer
// streamed change. The polling path therefore normalizes its snapshot with the
// same pure store projection, on top of the current state, without committing.
// Code that reads the store directly waits for the engine's hydration.

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
