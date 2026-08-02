// FILE: platform/storage.ts (Lynx impl)
// Purpose: L1 storage port for the Lynx target, contract-aligned with
//   synara/apps/web/src/platform/storage.ts (KeyValueStorage: get/set/remove/clear).
//   Sync localStorage semantics via an in-memory mirror; writes go through to
//   the main-process JSON file over the bridge; hydrate once before render
//   (hydrateStorage) to make disk state visible.
// Layer: L1 platform port (lynx implementation)
//
// Threading (P6-C1): this module must stay importable from BOTH threads. The
// shared Web graph reaches the storage port through ordinary static imports, so
// a module-level `background-only` marker fails the main-thread compile of any
// screen that pulls it in. The host bridge itself is still background-only, so
// it is reached exclusively from `'background only'` functions with an eager
// dynamic import; the main thread keeps the synchronous mirror as a read cache
// and simply drops persistence (it never owns app state).

export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

const mirror = new Map<string, string>();
let hydrated = false;
let hydratePromise: Promise<void> | null = null;
let hydrationError: unknown = null;
let persistQueue = Promise.resolve();

function isBackgroundThread(): boolean {
  // Rspeedy defines `__MAIN_THREAD__` per bundle; the typeof guard keeps the
  // module usable under Rstest, where the flag may not be injected.
  return typeof __MAIN_THREAD__ === 'undefined' ? true : !__MAIN_THREAD__;
}

async function callBridge(
  method: string,
  params: Record<string, unknown>
): Promise<unknown> {
  'background only';
  const { bridgeCall } = await import(/* webpackMode: "eager" */ './bridge');
  return bridgeCall(method, params);
}

function enqueuePersist(
  method: string,
  params: Record<string, unknown> = {}
): Promise<void> {
  // Keep localStorage-style mirror writes synchronous while serializing host
  // writes. Serialization preserves set/remove/clear order even if bridge
  // callbacks complete out of order.
  if (!isBackgroundThread()) return Promise.resolve();
  const operation = persistQueue.then(() => callBridge(method, params));
  persistQueue = operation.then(
    () => undefined,
    (error) => {
      console.warn('[storage] persist failed', method, String(error));
    }
  );
  return operation.then(() => undefined);
}

function persist(method: string, params: Record<string, unknown> = {}): void {
  void enqueuePersist(method, params);
}

/** Load the on-disk KV into the mirror. Await before first render. */
export async function hydrateStorage(): Promise<void> {
  if (hydrated) return;
  if (!isBackgroundThread()) return;
  hydratePromise ??= (async () => {
    try {
      const res = (await callBridge('storageDump', {})) as {
        entries?: Record<string, string>;
      };
      for (const [k, v] of Object.entries(res.entries ?? {})) {
        mirror.set(k, v);
      }
    } catch (e) {
      hydrationError = e;
      console.warn('[storage] hydrate failed (starting empty)', String(e));
    }
    hydrated = true;
  })();
  await hydratePromise;
}

export function getStorageHydrationError(): unknown {
  return hydrationError;
}

export async function retryHydrateStorage(): Promise<void> {
  hydrated = false;
  hydratePromise = null;
  hydrationError = null;
  mirror.clear();
  await hydrateStorage();
}

export async function setPersistedStorageItem(
  key: string,
  value: string
): Promise<void> {
  mirror.set(key, value);
  await enqueuePersist('storageSet', { key, value });
}

/** Await all queued host writes (tests, shutdown hooks, and explicit exports). */
export async function flushStorage(): Promise<void> {
  await persistQueue;
}

/**
 * Web registers `beforeunload`/`pagehide`/`visibilitychange` so a debounced
 * persist cannot lose the last write. Lynxtron has no page-hide lifecycle and
 * every write already reaches the host bridge immediately, so there is nothing
 * to hook. The signature is kept identical so shared call sites stay unchanged.
 */
export function flushStorageBeforePageHide(_flush: () => void): void {
  // Intentionally empty: no page-hide lifecycle on this platform.
}

export const webStorage: KeyValueStorage = {
  getItem: (key) => mirror.get(key) ?? null,
  setItem: (key, value) => {
    mirror.set(key, value);
    persist('storageSet', { key, value });
  },
  removeItem: (key) => {
    mirror.delete(key);
    persist('storageRemove', { key });
  },
  clear: () => {
    mirror.clear();
    persist('storageClear');
  },
};

export const sessionWebStorage: KeyValueStorage = (() => {
  const session = new Map<string, string>();
  return {
    getItem: (key) => session.get(key) ?? null,
    setItem: (key, value) => {
      session.set(key, value);
    },
    removeItem: (key) => {
      session.delete(key);
    },
    clear: () => {
      session.clear();
    },
  };
})();
