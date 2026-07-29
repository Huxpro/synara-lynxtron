import { Debouncer } from "@tanstack/react-pacer";
import type { PersistStorage, StorageValue } from "zustand/middleware";

// flushStorageBeforePageHide lives in the platform zone (it touches
// window/document); re-exported here so existing imports keep working.
export { flushStorageBeforePageHide } from "~/platform/storage";
export type { FlushBeforePageHideEnv } from "~/platform/storage";

export interface StateStorage<R = unknown> {
  getItem: (name: string) => string | null | Promise<string | null>;
  setItem: (name: string, value: string) => R;
  removeItem: (name: string) => R;
}

export interface DeferredPersistStorage<S> extends PersistStorage<S> {
  /** Serialize the latest captured state and write it through synchronously. */
  flush: () => void;
}

export function createMemoryStorage(): StateStorage {
  const store = new Map<string, string>();
  return {
    getItem: (name) => store.get(name) ?? null,
    setItem: (name, value) => {
      store.set(name, value);
    },
    removeItem: (name) => {
      store.delete(name);
    },
  };
}

/**
 * A zustand-persist-compatible storage that defers BOTH `partialize` and
 * `JSON.stringify` off the hot `set()` path.
 *
 * `createJSONStorage` (the zustand default) runs `partialize(get())` and the full
 * `JSON.stringify` of the entire store synchronously on every state change; only
 * the underlying `localStorage.setItem` I/O can be debounced. For large stores
 * (e.g. drafts carrying base64 image attachments) that per-keystroke serialization
 * is the dominant cost and stalls typing.
 *
 * Here, `setItem` only captures the latest `StorageValue` reference. The expensive
 * `partialize` + `JSON.stringify` runs a single time inside the debounced flush,
 * over the most recent captured state. The persisted bytes are identical to
 * `createJSONStorage` + a `partialize` config for the same final state — only
 * *when* serialization happens changes. At most one debounce window of changes can
 * be lost on a crash; wire `flush()` to `pagehide`/`visibilitychange` to bound that.
 *
 * IMPORTANT: pass `partialize` here and DO NOT also set `partialize` in the persist
 * config, otherwise partialize would run eagerly on every `set()` (defeating the
 * deferral) and then again at flush.
 */
export function createDeferredPersistStorage<State, Persisted = State>(options: {
  readonly getStorage: () => StateStorage;
  readonly partialize: (state: State) => Persisted;
  readonly debounceMs?: number;
}): DeferredPersistStorage<Persisted> {
  const { getStorage, partialize, debounceMs = 300 } = options;

  // Latest pending write, captured lazily. Serialization is deferred to flush time.
  // zustand's persist calls setItem with the FULL store state as `value.state`
  // (there must be no `partialize` in the persist config — see the doc above), so
  // it is typed as `Persisted` per the PersistStorage contract but is really `State`.
  let pending: { readonly name: string; readonly value: StorageValue<Persisted> } | null = null;

  const writePending = (): void => {
    if (pending === null) {
      return;
    }
    const { name, value } = pending;
    pending = null;
    // Mirror zustand's `{ state, version }` StorageValue key order so the produced
    // bytes stay identical to createJSONStorage for the same state.
    getStorage().setItem(
      name,
      JSON.stringify({
        state: partialize(value.state as unknown as State),
        version: value.version,
      }),
    );
  };

  const debouncedWrite = new Debouncer(() => writePending(), { wait: debounceMs });

  const parse = (value: string | null): StorageValue<Persisted> | null =>
    value === null ? null : (JSON.parse(value) as StorageValue<Persisted>);

  return {
    getItem: (name) => {
      const raw = getStorage().getItem(name);
      return raw instanceof Promise ? raw.then(parse) : parse(raw);
    },
    setItem: (name, value) => {
      pending = { name, value };
      debouncedWrite.maybeExecute();
    },
    removeItem: (name) => {
      pending = null;
      debouncedWrite.cancel();
      getStorage().removeItem(name);
    },
    flush: () => {
      debouncedWrite.cancel();
      writePending();
    },
  };
}
