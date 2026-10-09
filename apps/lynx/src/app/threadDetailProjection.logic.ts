// Thread-detail read model for the Lynx polling read path (`queries.ts`).
//
// Upstream's session sync (`EventRouter`) is the only writer of thread detail in
// the shared store: it applies one snapshot and then streamed deltas in sequence
// order. A second writer that replaces the thread from its own polled snapshot
// corrupts that sequence (a streamed text delta the snapshot already contains is
// appended again once the sync flushes it). So the polling path normalizes its
// snapshot with the same pure store projection, on top of the current state,
// and never commits the result.

import type { OrchestrationReadModel } from "@synara/contracts";
import { syncServerThreadDetail } from "@synara-web/storeProjection";
import type { AppState } from "@synara-web/storeState";
import { getThreadFromState } from "@synara-web/threadDerivation";
import type { Thread } from "@synara-web/types";

export function projectThreadDetailSnapshot(
  state: AppState,
  thread: OrchestrationReadModel["threads"][number],
): Thread | undefined {
  return getThreadFromState(syncServerThreadDetail(state, thread), thread.id);
}
