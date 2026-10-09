// FILE: platform/windowTimers.ts
// Purpose: the `window` timer surface for upstream source that Lynx runs
//   verbatim. Lynx injects `window` into the background bundle with no value,
//   so `window.setTimeout(...)` throws there. The generated `EventRouter`
//   (scripts/generate-event-router.mjs, `EVENT_ROUTER_GLOBAL_PORTS`) binds this
//   object to the name `window`; its members must match that list.
// Layer: L1 platform port (lynx implementation)
//
// Thread-neutral: each call reads the runtime's own timer global when it runs.
// Like the DOM, the handles are numbers and clearing a missing handle is a no-op.

export interface WindowTimers {
  readonly setTimeout: (handler: () => void, timeout?: number) => number;
  readonly clearTimeout: (handle: number | null | undefined) => void;
  readonly setInterval: (handler: () => void, timeout?: number) => number;
  readonly clearInterval: (handle: number | null | undefined) => void;
}

export const lynxWindowTimers: WindowTimers = {
  setTimeout: (handler, timeout) => setTimeout(handler, timeout) as unknown as number,
  clearTimeout: (handle) => {
    if (handle != null) clearTimeout(handle as unknown as ReturnType<typeof setTimeout>);
  },
  setInterval: (handler, timeout) => setInterval(handler, timeout) as unknown as number,
  clearInterval: (handle) => {
    if (handle != null) clearInterval(handle as unknown as ReturnType<typeof setInterval>);
  },
};
