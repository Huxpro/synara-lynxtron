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

import { dispatchWindowEvent } from "./events";
import { window as browserWindow } from "./browserEnvironment.lynx";

// One event target for the whole renderer: this is the same `window` upstream
// Web source is bound to, so a host focus or connectivity signal dispatched
// once reaches upstream listeners and query-core's managers alike.
export type QueryCoreWindow = Pick<
  typeof browserWindow,
  "addEventListener" | "removeEventListener"
>;

// Rspeedy defines `__MAIN_THREAD__` per bundle; the typeof guard keeps the
// module loadable where the macro is absent (tests, tools).
const isMainThread = typeof __MAIN_THREAD__ === "undefined" ? false : __MAIN_THREAD__;

export const queryCoreWindow: QueryCoreWindow | undefined = isMainThread
  ? undefined
  : browserWindow;

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
  dispatchWindowEvent({ type } as Event);
}
