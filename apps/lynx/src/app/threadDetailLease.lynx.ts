// FILE: app/threadDetailLease.lynx.ts
// Purpose: Run an operation on a thread while upstream's session sync holds its
//   detail, whether or not the thread is on screen.
// Layer: L3 orchestration (Lynx)
//
// Upstream's `EventRouter` is the only writer of thread detail in the shared
// store and streams it only for leased threads: the routed one, the dock's, and
// the ones in its retention registry. An operation that waits for an event on a
// thread (the same-thread handoff waits for the server's outcome activity) would
// never see it on a thread that is merely listed in the sidebar. This holds a
// retention entry for the operation, the way `threadPageStore.lynx.ts` does for
// the routed thread, waits until the store has the synced detail, and hands the
// store's own thread to the operation. Nothing here writes thread state.

import type { ThreadId } from "@synara/contracts";
import { useStore } from "@synara-web/store";
import type { AppState } from "@synara-web/storeState";
import { getThreadFromState } from "@synara-web/threadDerivation";
import type { Thread } from "@synara-web/types";

/** How long the detail of a thread that was not open may take to arrive. */
export const THREAD_DETAIL_LEASE_SYNC_TIMEOUT_MS = 20_000;

export interface ThreadDetailLeaseDependencies {
  readonly retain: (threadId: ThreadId) => () => void;
  readonly getState: () => AppState;
  readonly subscribe: (listener: () => void) => () => void;
  readonly timeoutMs: number;
}

async function defaultDependencies(): Promise<ThreadDetailLeaseDependencies> {
  "background only";
  const { retainThreadDetailSubscription } = await import(
    /* webpackMode: "eager" */ "@synara-web/threadDetailSubscriptionRetention"
  );
  return {
    retain: retainThreadDetailSubscription,
    getState: useStore.getState,
    subscribe: useStore.subscribe,
    timeoutMs: THREAD_DETAIL_LEASE_SYNC_TIMEOUT_MS,
  };
}

function readSyncedThread(state: AppState, threadId: ThreadId): Thread | "failed" | null {
  const sync = state.threadDetailSyncById?.[threadId];
  if (sync === "failed") return "failed";
  if (sync !== "synced") return null;
  return getThreadFromState(state, threadId) ?? null;
}

function waitForSyncedThread(
  threadId: ThreadId,
  dependencies: ThreadDetailLeaseDependencies,
): Promise<Thread> {
  const initial = readSyncedThread(dependencies.getState(), threadId);
  if (initial !== null && initial !== "failed") return Promise.resolve(initial);
  // A failure recorded before this lease is from an earlier attempt to load the thread;
  // only a failure that arrives while the lease is held settles the wait.
  let staleFailure = initial === "failed";
  return new Promise((resolve, reject) => {
    const finish = (settle: () => void) => {
      clearTimeout(timeout);
      unsubscribe();
      settle();
    };
    const check = () => {
      const current = readSyncedThread(dependencies.getState(), threadId);
      if (current !== "failed") staleFailure = false;
      if (current === null || (current === "failed" && staleFailure)) return;
      if (current === "failed") {
        finish(() => reject(new Error("This thread could not be loaded. Open it and try again.")));
      } else {
        finish(() => resolve(current));
      }
    };
    const unsubscribe = dependencies.subscribe(check);
    const timeout = setTimeout(
      () => finish(() => reject(new Error("This thread is still loading. Open it and try again."))),
      dependencies.timeoutMs,
    );
  });
}

/**
 * Runs `operation` with the store's synced thread while its detail stays leased, and
 * releases the lease when the operation settles. The operation's own store reads
 * (`getThreadFromState(useStore.getState(), threadId)`) see live detail throughout.
 */
export async function withLeasedThreadDetail<Result>(
  threadId: string,
  operation: (thread: Thread) => Promise<Result>,
  overrides?: Partial<ThreadDetailLeaseDependencies>,
): Promise<Result> {
  "background only";
  const id = threadId as ThreadId;
  const dependencies = { ...(await defaultDependencies()), ...overrides };
  const release = dependencies.retain(id);
  try {
    return await operation(await waitForSyncedThread(id, dependencies));
  } finally {
    release();
  }
}
