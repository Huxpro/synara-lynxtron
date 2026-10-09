// When does "the shell has not loaded yet" stop being loading and become a
// failure the user can retry?
//
// Upstream's session sync swallows its bootstrap failures (the shell stream
// subscription and its one fallback query both end in `.catch(() => undefined)`)
// and exposes no status, so the store alone cannot tell "still loading" from
// "will never load". This is the smallest Lynx-side derivation: the transport
// reports closed, or a deadline passes without hydration. It only ever speaks
// before the first hydration; afterwards the store is live and has no error.

import type { OrchestrationShellSnapshot } from "@synara/contracts";
import type { WsTransportState } from "@synara-web/wsTransportEvents";

/**
 * Session sync's own fallback query fires 1.5 s after mount; a healthy server
 * hydrates well inside this window.
 */
export const SHELL_BOOTSTRAP_DEADLINE_MS = 10_000;

export const SHELL_BOOTSTRAP_UNREACHABLE_MESSAGE =
  "Synara server is unreachable. Projects and threads will load once it reconnects.";
export const SHELL_BOOTSTRAP_STALLED_MESSAGE =
  "Synara is connected, but projects and threads did not load.";
/** The deadline passed before the transport reported either way. */
export const SHELL_BOOTSTRAP_NOT_LOADED_MESSAGE =
  "Projects and threads did not load. Check that the Synara server is running.";

export interface ShellBootstrapWatch {
  /** Begins watching; safe to call again. */
  readonly start: () => void;
  readonly transportChanged: (state: WsTransportState) => void;
  /** Call whenever the store's hydration flag may have changed. */
  readonly hydrationChanged: () => void;
  /**
   * One explicit shell read, committed only if session sync still has not
   * hydrated the store. The stream keeps retrying on its own; this is the
   * user's Retry.
   */
  readonly retry: () => Promise<void>;
}

export function createShellBootstrapWatch(deps: {
  readonly isHydrated: () => boolean;
  readonly setError: (error: Error | null) => void;
  readonly startTimeout: (milliseconds: number, onTimeout: () => void) => () => void;
  readonly getShellSnapshot: () => Promise<OrchestrationShellSnapshot>;
  readonly commitShellSnapshot: (snapshot: OrchestrationShellSnapshot) => void;
}): ShellBootstrapWatch {
  let started = false;
  let transport: WsTransportState | null = null;
  let cancelDeadline: (() => void) | null = null;
  let retryRun = 0;

  const disarm = () => {
    cancelDeadline?.();
    cancelDeadline = null;
  };
  const arm = () => {
    disarm();
    cancelDeadline = deps.startTimeout(SHELL_BOOTSTRAP_DEADLINE_MS, () => {
      cancelDeadline = null;
      if (deps.isHydrated()) return;
      deps.setError(
        new Error(
          transport === "open"
            ? SHELL_BOOTSTRAP_STALLED_MESSAGE
            : transport === "closed"
              ? SHELL_BOOTSTRAP_UNREACHABLE_MESSAGE
              : SHELL_BOOTSTRAP_NOT_LOADED_MESSAGE,
        ),
      );
    });
  };
  const settleIfHydrated = (): boolean => {
    if (!deps.isHydrated()) return false;
    disarm();
    deps.setError(null);
    return true;
  };

  return {
    start() {
      if (started) return;
      started = true;
      if (!settleIfHydrated()) arm();
    },
    transportChanged(state) {
      transport = state;
      if (!started || settleIfHydrated()) return;
      if (state === "closed") {
        disarm();
        deps.setError(new Error(SHELL_BOOTSTRAP_UNREACHABLE_MESSAGE));
      } else if (state === "open") {
        // Reconnected: session sync's stream restarts; give it a fresh window.
        deps.setError(null);
        arm();
      }
    },
    hydrationChanged() {
      if (started) settleIfHydrated();
    },
    async retry() {
      if (settleIfHydrated()) return;
      const run = (retryRun += 1);
      disarm();
      deps.setError(null);
      try {
        const snapshot = await deps.getShellSnapshot();
        // Session sync may have hydrated while the request was in flight; its
        // state is newer than this read and must not be replaced.
        if (!deps.isHydrated()) deps.commitShellSnapshot(snapshot);
        settleIfHydrated();
      } catch (error) {
        if (run !== retryRun || settleIfHydrated()) return;
        deps.setError(error instanceof Error ? error : new Error(String(error)));
      }
    },
  };
}
