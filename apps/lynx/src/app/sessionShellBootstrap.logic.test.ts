import { describe, expect, it, rs } from "@rstest/core";
import type { OrchestrationShellSnapshot } from "@synara/contracts";

import {
  createShellBootstrapWatch,
  SHELL_BOOTSTRAP_DEADLINE_MS,
  SHELL_BOOTSTRAP_NOT_LOADED_MESSAGE,
  SHELL_BOOTSTRAP_STALLED_MESSAGE,
  SHELL_BOOTSTRAP_UNREACHABLE_MESSAGE,
} from "./sessionShellBootstrap.logic";

const SNAPSHOT = { snapshotSequence: 3 } as unknown as OrchestrationShellSnapshot;

function harness(options: {
  readonly getShellSnapshot?: () => Promise<OrchestrationShellSnapshot>;
}) {
  let hydrated = false;
  let error: Error | null = null;
  const timers: { fire: () => void; cancelled: boolean; ms: number }[] = [];
  const commitShellSnapshot = rs.fn(() => {
    hydrated = true;
  });
  const getShellSnapshot = rs.fn(options.getShellSnapshot ?? (async () => SNAPSHOT));
  const watch = createShellBootstrapWatch({
    isHydrated: () => hydrated,
    setError: (next) => {
      error = next;
    },
    startTimeout: (ms, onTimeout) => {
      const timer = { fire: onTimeout, cancelled: false, ms };
      timers.push(timer);
      return () => {
        timer.cancelled = true;
      };
    },
    getShellSnapshot,
    commitShellSnapshot,
  });
  return {
    watch,
    commitShellSnapshot,
    getShellSnapshot,
    error: () => error as Error | null,
    hydrate: () => {
      hydrated = true;
      watch.hydrationChanged();
    },
    /** Fires the armed deadline, if one is still armed. */
    elapse: () => {
      const timer = timers.findLast((candidate) => !candidate.cancelled);
      if (!timer) return false;
      timer.cancelled = true;
      timer.fire();
      return true;
    },
    armed: () => timers.filter((timer) => !timer.cancelled).length,
    lastDeadline: () => timers.at(-1)?.ms,
  };
}

describe("shell bootstrap watch", () => {
  it("is loading, not failed, until the deadline", () => {
    const h = harness({});
    h.watch.start();
    expect(h.error()).toBeNull();
    expect(h.armed()).toBe(1);
    expect(h.lastDeadline()).toBe(SHELL_BOOTSTRAP_DEADLINE_MS);
  });

  it("reports a connected transport that never hydrates as an application error", () => {
    const h = harness({});
    h.watch.start();
    h.watch.transportChanged("open");
    expect(h.error()).toBeNull();
    expect(h.elapse()).toBe(true);
    expect(h.error()?.message).toBe(SHELL_BOOTSTRAP_STALLED_MESSAGE);
  });

  it("reports a closed transport at once, and returns to loading on reconnect", () => {
    const h = harness({});
    h.watch.start();
    h.watch.transportChanged("open");
    h.watch.transportChanged("closed");
    expect(h.error()?.message).toBe(SHELL_BOOTSTRAP_UNREACHABLE_MESSAGE);
    expect(h.armed()).toBe(0);

    h.watch.transportChanged("open");
    expect(h.error()).toBeNull();
    expect(h.armed()).toBe(1);
  });

  it("does not claim a connection it never saw when the deadline passes", () => {
    // Lynx reports "connecting" for a host socket that has never connected.
    const h = harness({});
    h.watch.start();
    h.watch.transportChanged("connecting");
    h.elapse();
    expect(h.error()?.message).toBe(SHELL_BOOTSTRAP_NOT_LOADED_MESSAGE);
  });

  it("hydration clears the failure and disarms the deadline for good", () => {
    const h = harness({});
    h.watch.start();
    h.elapse();
    expect(h.error()).not.toBeNull();
    h.hydrate();
    expect(h.error()).toBeNull();
    // A later disconnect is not a bootstrap failure: the store has data.
    h.watch.transportChanged("closed");
    expect(h.error()).toBeNull();
    expect(h.armed()).toBe(0);
  });

  it("a deadline that fires after hydration says nothing", () => {
    const h = harness({});
    h.watch.start();
    // Hydrated without the watch being told (store subscription not yet run).
    h.commitShellSnapshot();
    h.elapse();
    expect(h.error()).toBeNull();
  });

  it("Retry loads the shell and commits it while session sync has not hydrated", async () => {
    const h = harness({});
    h.watch.start();
    h.elapse();
    expect(h.error()).not.toBeNull();

    await h.watch.retry();
    expect(h.getShellSnapshot).toHaveBeenCalledTimes(1);
    expect(h.commitShellSnapshot).toHaveBeenCalledWith(SNAPSHOT);
    expect(h.error()).toBeNull();
  });

  it("Retry does not replace state session sync delivered in the meantime", async () => {
    const pending: { release?: (snapshot: OrchestrationShellSnapshot) => void } = {};
    const h = harness({
      getShellSnapshot: () =>
        new Promise<OrchestrationShellSnapshot>((resolve) => {
          pending.release = resolve;
        }),
    });
    h.watch.start();
    h.elapse();
    const retry = h.watch.retry();
    // Pending again while the request is in flight.
    expect(h.error()).toBeNull();
    h.hydrate();
    pending.release?.(SNAPSHOT);
    await retry;
    expect(h.commitShellSnapshot).not.toHaveBeenCalled();
    expect(h.error()).toBeNull();
  });

  it("a failed Retry surfaces the server's error and can be retried again", async () => {
    let attempts = 0;
    const h = harness({
      getShellSnapshot: async () => {
        attempts += 1;
        if (attempts === 1) throw new Error("projection reader unavailable");
        return SNAPSHOT;
      },
    });
    h.watch.start();
    h.elapse();
    await h.watch.retry();
    expect(h.error()?.message).toBe("projection reader unavailable");
    expect(h.commitShellSnapshot).not.toHaveBeenCalled();

    await h.watch.retry();
    expect(h.error()).toBeNull();
    expect(h.commitShellSnapshot).toHaveBeenCalledTimes(1);
  });

  it("Retry after hydration requests nothing", async () => {
    const h = harness({});
    h.watch.start();
    h.hydrate();
    await h.watch.retry();
    expect(h.getShellSnapshot).not.toHaveBeenCalled();
  });
});
