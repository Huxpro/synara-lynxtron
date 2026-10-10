import { describe, expect, it } from "@rstest/core";
import type { ThreadId } from "@synara/contracts";
import { resolveProviderHandoffOutcome } from "@synara-web/lib/threadHandoff";
import type { AppState } from "@synara-web/storeState";
import { makeState, makeThread } from "@synara-web/storeTestFixtures";
import { getThreadFromState } from "@synara-web/threadDerivation";

import { withLeasedThreadDetail } from "./threadDetailLease.lynx";

const THREAD_ID = "thread-1" as ThreadId;

/** A store whose only writer is the test, standing in for session sync. */
function fakeStore(initial: AppState) {
  let state = initial;
  const listeners = new Set<() => void>();
  return {
    getState: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    setState: (next: AppState) => {
      state = next;
      for (const listener of listeners) listener();
    },
    listenerCount: () => listeners.size,
  };
}

const tick = () => new Promise<void>((resolve) => setTimeout(resolve, 0));

const withSync = (state: AppState, sync: "synced" | "failed" | undefined): AppState => ({
  ...state,
  threadDetailSyncById: sync ? ({ [THREAD_ID]: sync } as AppState["threadDetailSyncById"]) : {},
});

describe("thread detail lease for an operation on a thread that may not be open", () => {
  it("leases the unopened thread, waits for its synced detail, and releases when done", async () => {
    // Listed in the sidebar, never opened: the store has its shell but no synced detail.
    const unsynced = withSync(makeState(makeThread()), undefined);
    const store = fakeStore(unsynced);
    const events: string[] = [];
    const operation = withLeasedThreadDetail(
      THREAD_ID,
      async (thread) => {
        events.push(`run:${thread.id}:${thread.activities.length}`);
        return "done";
      },
      {
        ...store,
        retain: (threadId) => {
          events.push(`retain:${threadId}`);
          return () => events.push("release");
        },
        timeoutMs: 1_000,
      },
    );
    await tick();
    // Nothing runs on a projected or stale thread: the operation waits for session sync.
    expect(events).toEqual(["retain:thread-1"]);
    store.setState(withSync(unsynced, "synced"));
    await expect(operation).resolves.toBe("done");
    expect(events).toEqual(["retain:thread-1", "run:thread-1:0", "release"]);
    expect(store.listenerCount()).toBe(0);
  });

  it("keeps the lease while the operation waits for the handoff outcome on the store", async () => {
    const base = withSync(makeState(makeThread()), "synced");
    const store = fakeStore(base);
    let released = false;
    const commandId = "command-1";
    // What upstream's `continueThreadHandoff` does after dispatching: wait until the
    // store's thread carries the server's outcome activity.
    const operation = withLeasedThreadDetail(
      THREAD_ID,
      () =>
        new Promise<string>((resolve) => {
          const unsubscribe = store.subscribe(() => {
            const outcome = resolveProviderHandoffOutcome(
              getThreadFromState(store.getState(), THREAD_ID),
              commandId,
            );
            if (outcome.status === "pending") return;
            unsubscribe();
            resolve(outcome.status === "failed" ? `failed:${outcome.detail}` : outcome.status);
          });
        }),
      { ...store, retain: () => () => (released = true), timeoutMs: 1_000 },
    );
    await tick();
    expect(released).toBe(false);
    // Session sync delivers the outcome row because the thread is leased.
    store.setState(
      withSync(
        makeState(
          makeThread({
            activities: [
              {
                id: `provider-handoff-failed:${commandId}`,
                kind: "provider.handoff.failed",
                tone: "error",
                summary: "Handoff failed",
                payload: { detail: "claude is signed out" },
                turnId: null,
                createdAt: "2026-10-10T00:00:00.000Z",
              } as never,
            ],
          }),
        ),
        "synced",
      ),
    );
    // The real start error reaches the caller instead of a 120 s "still starting".
    await expect(operation).resolves.toBe("failed:claude is signed out");
    expect(released).toBe(true);
  });

  it("releases the lease and reports it when the detail never arrives or fails to load", async () => {
    const unsynced = withSync(makeState(makeThread()), undefined);
    for (const [arrange, message] of [
      [() => undefined, "This thread is still loading. Open it and try again."],
      [
        (store: ReturnType<typeof fakeStore>) => store.setState(withSync(unsynced, "failed")),
        "This thread could not be loaded. Open it and try again.",
      ],
    ] as const) {
      const store = fakeStore(unsynced);
      let released = false;
      let ran = false;
      const operation = withLeasedThreadDetail(
        THREAD_ID,
        async () => {
          ran = true;
        },
        { ...store, retain: () => () => (released = true), timeoutMs: 30 },
      );
      await tick();
      arrange(store);
      await expect(operation).rejects.toThrow(message);
      expect(ran).toBe(false);
      expect(released).toBe(true);
      expect(store.listenerCount()).toBe(0);
    }
  });

  it("does not take a failure recorded before the lease for this attempt's", async () => {
    const stale = withSync(makeState(makeThread()), "failed");
    const store = fakeStore(stale);
    const operation = withLeasedThreadDetail(THREAD_ID, async () => "done", {
      ...store,
      retain: () => () => undefined,
      timeoutMs: 1_000,
    });
    await tick();
    // An unrelated store change while the old failure is still recorded.
    store.setState({ ...stale });
    await tick();
    store.setState(withSync(stale, "synced"));
    await expect(operation).resolves.toBe("done");
  });
});
