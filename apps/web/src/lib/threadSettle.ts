// FILE: threadSettle.ts
// Purpose: Dispatches the thread settle/unsettle toggle from the client.
// Layer: Web orchestration helper
// Exports: setThreadSettledFromClient

import type { NativeApi, ThreadId } from "@synara/contracts";

import { newCommandId } from "./utils";

type ThreadCommandDispatcher = Pick<NativeApi["orchestration"], "dispatchCommand">;

export interface OptimisticSettledMutation {
  readonly desiredSettled: boolean;
  /** Durable sequence returned after the latest settle command is accepted. */
  readonly commandSequence: number | null;
  /**
   * True once the projection has represented a state different from the latest
   * desired value. This prevents Done → Undo from treating the pre-Done snapshot
   * as acknowledgement of Undo before either command has projected.
   */
  readonly observedDifferentState: boolean;
}

export function createOptimisticSettledMutation(input: {
  desiredSettled: boolean;
  serverSettledAtDispatch: boolean;
}): OptimisticSettledMutation {
  return {
    desiredSettled: input.desiredSettled,
    commandSequence: null,
    observedDifferentState: input.serverSettledAtDispatch !== input.desiredSettled,
  };
}

export function recordOptimisticSettledMutationSequence(
  mutation: OptimisticSettledMutation,
  commandSequence: number,
): OptimisticSettledMutation {
  if (mutation.commandSequence === commandSequence) return mutation;
  return { ...mutation, commandSequence };
}

export function reconcileOptimisticSettledMutation(
  mutation: OptimisticSettledMutation,
  serverSettled: boolean,
  projectionSequence: number = 0,
): { acknowledged: boolean; mutation: OptimisticSettledMutation } {
  // Reconnect replay can fold Done -> Undo into one store update, so the UI may
  // never render the intermediate boolean. The durable sequence proves that the
  // latest command has passed through the projection even in that batched case.
  if (mutation.commandSequence !== null && projectionSequence >= mutation.commandSequence) {
    return { acknowledged: true, mutation };
  }
  if (serverSettled === mutation.desiredSettled) {
    return { acknowledged: mutation.observedDifferentState, mutation };
  }
  if (mutation.observedDifferentState) {
    return { acknowledged: false, mutation };
  }
  return {
    acknowledged: false,
    mutation: { ...mutation, observedDifferentState: true },
  };
}

/**
 * Reconciles every pending settle override against the projected threads. Returns the
 * same map when nothing changed, and the ids whose latest command the projection has
 * acknowledged (or whose thread is gone) so callers can drop their expiry timers.
 */
export function reconcileOptimisticSettledMutations(
  current: ReadonlyMap<ThreadId, OptimisticSettledMutation>,
  resolveServerSettled: (threadId: ThreadId) => boolean | undefined,
  projectionSequence: number,
): {
  next: ReadonlyMap<ThreadId, OptimisticSettledMutation>;
  releasedThreadIds: ThreadId[];
} {
  let next: Map<ThreadId, OptimisticSettledMutation> | null = null;
  const releasedThreadIds: ThreadId[] = [];
  for (const [threadId, mutation] of current) {
    const serverSettled = resolveServerSettled(threadId);
    if (serverSettled === undefined) {
      next ??= new Map(current);
      next.delete(threadId);
      releasedThreadIds.push(threadId);
      continue;
    }
    const reconciliation = reconcileOptimisticSettledMutation(
      mutation,
      serverSettled,
      projectionSequence,
    );
    if (reconciliation.acknowledged) {
      next ??= new Map(current);
      next.delete(threadId);
      releasedThreadIds.push(threadId);
    } else if (reconciliation.mutation !== mutation) {
      next ??= new Map(current);
      next.set(threadId, reconciliation.mutation);
    }
  }
  return { next: next ?? current, releasedThreadIds };
}

// Marks a thread settled (done, dimmed at the bottom of the Activity view) or
// restores it. The server stamps the authoritative `settledAt` timestamp from
// the `isSettled` intent, so two clients toggling concurrently converge on the
// last write instead of racing on client clocks.
export async function setThreadSettledFromClient(
  api: ThreadCommandDispatcher,
  threadId: ThreadId,
  isSettled: boolean,
): Promise<number> {
  const result = await api.dispatchCommand({
    type: "thread.meta.update",
    commandId: newCommandId(),
    threadId,
    isSettled,
  });
  return result.sequence;
}
