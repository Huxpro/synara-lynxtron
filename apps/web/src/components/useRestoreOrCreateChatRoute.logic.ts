import { useEffect, useRef, useState } from "react";

import {
  type EmptyRouteRestoreRecoveryState,
  type LastThreadRoute,
  shouldHoldRememberedRouteFallback,
  shouldStartRememberedRouteRecovery,
} from "../chatRouteRestore";

export type RestoreRouteResolverInput = {
  readonly availableSplitViewIds: ReadonlySet<string>;
};

export type RestoreRouteResolver = (input: RestoreRouteResolverInput) => LastThreadRoute | null;

export interface RestoreOrCreateResult {
  readonly ok: boolean;
  readonly error?: string | undefined;
}

export interface RestoreOrCreateChatRouteControllerInput {
  readonly enabled?: boolean | undefined;
  readonly threadsHydrated: boolean;
  readonly threadIds: readonly string[];
  readonly splitViewsHydrated: boolean;
  readonly splitViewIds: readonly string[];
  readonly readLastThreadRoute: () => LastThreadRoute | null;
  readonly resolveRestoreRoute: RestoreRouteResolver;
  readonly navigateToRoute: (route: LastThreadRoute) => Promise<void>;
  readonly createFreshChat: () => Promise<RestoreOrCreateResult>;
  readonly refreshEmptySnapshot: () => Promise<unknown>;
  readonly waitForFallbackDelay: () => Promise<unknown>;
}

/**
 * Platform-neutral cold-start controller shared by Web and Lynx route hosts.
 *
 * Stores, history, native snapshot refresh, and the loading/error surface are
 * injected by the host. This module owns the recovery state machine and the
 * single-flight guarantee for fresh chat creation.
 */
export function useRestoreOrCreateChatRouteController(
  input: RestoreOrCreateChatRouteControllerInput,
) {
  const splitViewIdsKey = input.splitViewIds.join("\u0000");
  const [attempt, setAttempt] = useState(0);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [emptyRestoreRecoveryState, setEmptyRestoreRecoveryState] =
    useState<EmptyRouteRestoreRecoveryState>("idle");
  const mountedRef = useRef(true);
  const emptyRestoreRecoveryRunRef = useRef(0);
  const createFreshChatInFlightRef = useRef(false);

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!(input.threadIds.length > 0 && emptyRestoreRecoveryState !== "idle")) {
      return;
    }
    const timeoutId = setTimeout(() => {
      emptyRestoreRecoveryRunRef.current += 1;
      setEmptyRestoreRecoveryState("idle");
    }, 0);
    return () => clearTimeout(timeoutId);
  }, [emptyRestoreRecoveryState, input.threadIds.length]);

  useEffect(() => {
    if (input.enabled === false || !input.threadsHydrated || !input.splitViewsHydrated) {
      return;
    }

    let cancelled = false;

    void (async () => {
      await Promise.resolve();
      if (cancelled) return;

      setErrorMessage(null);
      const lastThreadRoute = input.readLastThreadRoute();
      if (
        shouldStartRememberedRouteRecovery({
          lastThreadRoute,
          availableThreadCount: input.threadIds.length,
          recoveryState: emptyRestoreRecoveryState,
        })
      ) {
        const recoveryRun = (emptyRestoreRecoveryRunRef.current += 1);
        setEmptyRestoreRecoveryState("pending");
        await Promise.all([
          input.refreshEmptySnapshot().catch(() => false),
          input.waitForFallbackDelay(),
        ]);
        if (mountedRef.current && emptyRestoreRecoveryRunRef.current === recoveryRun) {
          setEmptyRestoreRecoveryState("done");
        }
        return;
      }

      if (
        shouldHoldRememberedRouteFallback({
          lastThreadRoute,
          availableThreadCount: input.threadIds.length,
          recoveryState: emptyRestoreRecoveryState,
        })
      ) {
        return;
      }

      const restorableRoute = input.resolveRestoreRoute({
        availableSplitViewIds: new Set(input.splitViewIds),
      });
      if (restorableRoute) {
        if (!cancelled) await input.navigateToRoute(restorableRoute);
        return;
      }

      if (cancelled || createFreshChatInFlightRef.current) return;
      createFreshChatInFlightRef.current = true;
      const result = await input.createFreshChat().finally(() => {
        createFreshChatInFlightRef.current = false;
      });
      if (!cancelled && !result.ok) {
        setErrorMessage(result.error ?? "Unable to create a fresh chat.");
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [
    attempt,
    emptyRestoreRecoveryState,
    input.createFreshChat,
    input.enabled,
    input.navigateToRoute,
    input.readLastThreadRoute,
    input.refreshEmptySnapshot,
    input.resolveRestoreRoute,
    splitViewIdsKey,
    input.splitViewsHydrated,
    input.threadIds.length,
    input.threadsHydrated,
    input.waitForFallbackDelay,
  ]);

  return {
    errorMessage,
    retry: errorMessage ? () => setAttempt((value) => value + 1) : null,
  };
}
