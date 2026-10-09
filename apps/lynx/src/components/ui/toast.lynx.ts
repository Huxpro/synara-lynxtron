// FILE: components/ui/toast.lynx.ts
// Purpose: Lynx replacement for the Web `components/ui/toast` module as the
//   shared state layer uses it: the imperative `toastManager` (`add`, `update`,
//   `close`). The Web module is a Base UI toast surface (DOM, portals) and does
//   not compile for Lynx.
// Layer: L2 primitive (lynx implementation, sink only)
//
// There is no Lynx toast surface yet, so a toast is kept in memory, logged, and
// offered to subscribers; a future host can render `readLynxToasts()` without
// changing any caller. Thread-neutral: no host calls, no timers.

export type LynxToastType = "error" | "info" | "loading" | "success" | "warning";

export interface LynxToastActionProps {
  readonly children?: unknown;
  readonly onClick?: (...args: never[]) => unknown;
}

export interface LynxToastOptions {
  readonly id?: string | undefined;
  readonly type?: string | undefined;
  readonly title?: unknown;
  readonly description?: unknown;
  readonly timeout?: number | undefined;
  readonly actionProps?: LynxToastActionProps | undefined;
  readonly data?: unknown;
}

export interface LynxToast extends LynxToastOptions {
  readonly id: string;
}

const toastsById = new Map<string, LynxToast>();
const listeners = new Set<() => void>();
let snapshot: readonly LynxToast[] = [];
let nextToastSequence = 0;

function publish(): void {
  snapshot = [...toastsById.values()];
  for (const listener of listeners) listener();
}

function describe(value: unknown): string {
  return typeof value === "string" ? value : "";
}

export const toastManager = {
  /** Queues a toast and returns its id (the caller's `id` when it gave one). */
  add(options: LynxToastOptions): string {
    const id = options.id ?? `lynx-toast-${++nextToastSequence}`;
    toastsById.set(id, { ...options, id });
    // `info`, whatever the toast type: a toast is product copy, not a runtime
    // fault, and the harness counts console errors.
    console.info(
      `[toast:${options.type ?? "default"}] ${describe(options.title)}${
        describe(options.description) ? `: ${describe(options.description)}` : ""
      }`,
    );
    publish();
    return id;
  },
  /** Merges `updates` into a queued toast; unknown ids are ignored, as upstream. */
  update(id: string, updates: Omit<LynxToastOptions, "id">): void {
    const current = toastsById.get(id);
    if (!current) return;
    toastsById.set(id, { ...current, ...updates, id });
    publish();
  },
  /** Removes one toast, or every toast when called without an id. */
  close(id?: string): void {
    if (id === undefined) {
      if (toastsById.size === 0) return;
      toastsById.clear();
    } else if (!toastsById.delete(id)) {
      return;
    }
    publish();
  },
};

/** Queued toasts, oldest first. The array identity changes only on a change. */
export function readLynxToasts(): readonly LynxToast[] {
  return snapshot;
}

export function subscribeLynxToasts(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}
