// FILE: platform/queryCoreEnvironment.lynx.ts
// Purpose: The `window` that `@tanstack/query-core` sees on Lynx (provided to
//   its modules by `scripts/query-core-environment-loader.mjs`). query-core
//   only asks two things of it: that it exists (otherwise it runs in server
//   mode: no refetch intervals, no stale timers) and that it is an event
//   target for `visibilitychange` / `online` / `offline`.
// Layer: L1 platform port (Lynx implementation).
//
// Thread rule: the main thread renders the first screen and must not own
// timers, so query-core stays in server mode there (`undefined`). The
// background thread, where effects and observers run, is the client.

type Listener = () => void;

export interface QueryCoreWindow {
  readonly addEventListener: (type: string, listener: Listener, options?: unknown) => void;
  readonly removeEventListener: (type: string, listener: Listener) => void;
}

const listenersByType = new Map<string, Set<Listener>>();

const backgroundWindow: QueryCoreWindow = {
  addEventListener: (type, listener) => {
    let listeners = listenersByType.get(type);
    if (!listeners) {
      listeners = new Set();
      listenersByType.set(type, listeners);
    }
    listeners.add(listener);
  },
  removeEventListener: (type, listener) => {
    listenersByType.get(type)?.delete(listener);
  },
};

// Rspeedy defines `__MAIN_THREAD__` per bundle; the typeof guard keeps the
// module loadable where the macro is absent (tests, tools).
const isMainThread = typeof __MAIN_THREAD__ === "undefined" ? false : __MAIN_THREAD__;

export const queryCoreWindow: QueryCoreWindow | undefined = isMainThread
  ? undefined
  : backgroundWindow;

/**
 * Host signals for query-core's focus and online managers. `visibilitychange`
 * makes focused, stale queries refetch (`refetchOnWindowFocus`); `offline` /
 * `online` pause and resume fetching. Nothing dispatches these yet: the host
 * publishes no product-level window focus event, and the socket state is
 * reported through the transport, where a closed socket fails requests instead
 * of pausing them.
 */
export function dispatchQueryCoreWindowEvent(
  type: "visibilitychange" | "online" | "offline",
): void {
  for (const listener of Array.from(listenersByType.get(type) ?? [])) listener();
}
