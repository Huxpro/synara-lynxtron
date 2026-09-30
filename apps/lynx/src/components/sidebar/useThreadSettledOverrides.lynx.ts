import { useEffect, useMemo, useRef, useState } from "@lynx-js/react";

import type { ThreadId } from "@synara/contracts";
import {
  createOptimisticSettledMutation,
  recordOptimisticSettledMutationSequence,
  reconcileOptimisticSettledMutations,
  setThreadSettledFromClient,
  type OptimisticSettledMutation,
} from "@synara-web/lib/threadSettle";
import type { SidebarThreadSummary } from "@synara-web/types";

import { sleepOnHost } from "../../platform/timer";

/** The command is durable; the override only bridges the gap until the projection lands. */
const SETTLE_OVERRIDE_MAX_LIFETIME_MS = 15_000;

/**
 * Done/Undo for the Activity view: dispatches `thread.meta.update` and shows the desired
 * state until the sidebar snapshot acknowledges it, with the same reconciliation Electron's
 * useSidebarThreadActions runs.
 */
export function useThreadSettledOverrides(input: {
  readonly threads: readonly SidebarThreadSummary[];
  readonly snapshotSequence: number;
  readonly onSettled: () => void;
}) {
  const [mutations, setMutations] = useState<ReadonlyMap<ThreadId, OptimisticSettledMutation>>(
    () => new Map(),
  );
  const threadsRef = useRef(input.threads);
  threadsRef.current = input.threads;
  const versionByThreadIdRef = useRef(new Map<ThreadId, number>());

  const clear = (threadId: ThreadId) =>
    setMutations((current) => {
      if (!current.has(threadId)) return current;
      const next = new Map(current);
      next.delete(threadId);
      return next;
    });

  const setThreadSettled = async (threadId: ThreadId, isSettled: boolean) => {
    "background only";
    const version = (versionByThreadIdRef.current.get(threadId) ?? 0) + 1;
    versionByThreadIdRef.current.set(threadId, version);
    const isLatest = () => versionByThreadIdRef.current.get(threadId) === version;
    const serverSettledAtDispatch =
      (threadsRef.current.find((thread) => thread.id === threadId)?.settledAt ?? null) !== null;
    setMutations((current) =>
      new Map(current).set(
        threadId,
        createOptimisticSettledMutation({ desiredSettled: isSettled, serverSettledAtDispatch }),
      ),
    );
    try {
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      const sequence = await setThreadSettledFromClient(
        { dispatchCommand: dispatchSynaraCommand },
        threadId,
        isSettled,
      );
      if (isLatest()) {
        setMutations((current) => {
          const mutation = current.get(threadId);
          if (!mutation) return current;
          return new Map(current).set(
            threadId,
            recordOptimisticSettledMutationSequence(mutation, sequence),
          );
        });
      }
      input.onSettled();
    } catch (error) {
      // A newer toggle owns the override now; dropping it would revert past the user's intent.
      if (isLatest()) clear(threadId);
      throw error;
    }
    await sleepOnHost(SETTLE_OVERRIDE_MAX_LIFETIME_MS).catch(() => undefined);
    if (isLatest()) clear(threadId);
  };

  useEffect(() => {
    if (mutations.size === 0) return;
    const { next } = reconcileOptimisticSettledMutations(
      mutations,
      (threadId) => {
        const thread = threadsRef.current.find((candidate) => candidate.id === threadId);
        return thread ? (thread.settledAt ?? null) !== null : undefined;
      },
      input.snapshotSequence,
    );
    if (next !== mutations) setMutations(next);
  }, [input.snapshotSequence, input.threads, mutations]);

  const settledOverrideByThreadId = useMemo(
    () =>
      new Map(
        Array.from(
          mutations,
          ([threadId, mutation]) => [threadId, mutation.desiredSettled] as const,
        ),
      ),
    [mutations],
  );
  return { settledOverrideByThreadId, setThreadSettled };
}
