// FILE: platform/storage.ts
// Purpose: L1 platform port — key-value storage. Web impl = window.localStorage
//   with an in-memory fallback (SSR/tests). The Lynx impl swaps in a NativeModule
//   KV bridge; callers must not touch window.localStorage directly.
// Layer: L1 platform port (web implementation)
// Exports: KeyValueStorage, webStorage

export interface KeyValueStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
  clear: () => void;
}

function createMemoryKeyValueStorage(): KeyValueStorage {
  const store = new Map<string, string>();
  return {
    getItem: (key) => store.get(key) ?? null,
    setItem: (key, value) => {
      store.set(key, value);
    },
    removeItem: (key) => {
      store.delete(key);
    },
    clear: () => {
      store.clear();
    },
  };
}

let memoryFallback: KeyValueStorage | null = null;

function resolveWebStorage(): KeyValueStorage {
  // Resolve per call (never cache a global): pre-port code touched
  // window.localStorage / bare localStorage at call time, so tests that
  // redefine globalThis.window or stub localStorage between cases must see
  // the current object, not the one present at module load.
  try {
    const win = globalThis.window;
    if (win?.localStorage) {
      return win.localStorage;
    }
  } catch {
    // access can throw in locked-down contexts — fall through
  }
  try {
    const ls = globalThis.localStorage;
    if (ls) {
      return ls;
    }
  } catch {
    // fall through to memory
  }
  memoryFallback ??= createMemoryKeyValueStorage();
  return memoryFallback;
}

/**
 * DOM-free handle to the web KV store. Same get/set/remove semantics the app
 * relied on before the port existed (see hooks/useLocalStorage.ts); when no
 * global localStorage is available the store degrades to process-local memory
 * instead of throwing, matching the previous isomorphic fallback behavior.
 */
/**
 * True when a `StorageEvent.storageArea` is the store `webStorage` writes to.
 * `webStorage` is a wrapper, so comparing an event's area with it by identity
 * never matches; this compares with the real `localStorage` behind it.
 */
export function isWebStorageArea(area: unknown): boolean {
  return area === resolveWebStorage();
}

export const webStorage: KeyValueStorage = {
  getItem: (key) => resolveWebStorage().getItem(key),
  setItem: (key, value) => resolveWebStorage().setItem(key, value),
  removeItem: (key) => resolveWebStorage().removeItem(key),
  clear: () => resolveWebStorage().clear(),
};

function resolveSessionWebStorage(): KeyValueStorage {
  try {
    const win = globalThis.window;
    if (win?.sessionStorage) {
      return win.sessionStorage;
    }
  } catch {
    // fall through
  }
  memorySessionFallback ??= createMemoryKeyValueStorage();
  return memorySessionFallback;
}

let memorySessionFallback: KeyValueStorage | null = null;

/**
 * Session-scoped KV (window.sessionStorage on web; memory-only semantics are
 * the Lynx fallback, which matches session scope there).
 */
export const sessionWebStorage: KeyValueStorage = {
  getItem: (key) => resolveSessionWebStorage().getItem(key),
  setItem: (key, value) => resolveSessionWebStorage().setItem(key, value),
  removeItem: (key) => resolveSessionWebStorage().removeItem(key),
  clear: () => resolveSessionWebStorage().clear(),
};

// --- persist flush lifecycle (moved from lib/storage.ts; it touches window/document
// directly and therefore belongs in the platform zone) -------------------------

interface PageHideEventTarget {
  readonly addEventListener: (type: string, listener: () => void) => void;
}

interface PageVisibilityTarget extends PageHideEventTarget {
  readonly visibilityState: string;
}

export interface FlushBeforePageHideEnv {
  readonly window?: PageHideEventTarget | undefined;
  readonly document?: PageVisibilityTarget | undefined;
}

/**
 * Flush a debounced/deferred storage before the page goes away, so at most one
 * debounce window of changes can be lost. Wires `beforeunload`, `pagehide`, and
 * `visibilitychange`→hidden — the latter two fire on mobile/bfcache navigations
 * where `beforeunload` does not. No-ops when the DOM globals are unavailable
 * (SSR / non-browser test environments), and is injectable for testing.
 */
export function flushStorageBeforePageHide(
  flush: () => void,
  env: FlushBeforePageHideEnv = {
    window: typeof window !== "undefined" ? window : undefined,
    document: typeof document !== "undefined" ? document : undefined,
  },
): void {
  // Guard each capability separately: SSR-style test environments stub partial
  // globals (e.g. a `document` with only `documentElement`), and this runs at
  // module scope in store files — a missing listener API must degrade to a
  // no-op, never crash module evaluation.
  const win = env.window;
  if (typeof win?.addEventListener === "function") {
    win.addEventListener("beforeunload", flush);
    win.addEventListener("pagehide", flush);
  }
  const doc = env.document;
  if (typeof doc?.addEventListener === "function") {
    doc.addEventListener("visibilitychange", () => {
      if (doc.visibilityState === "hidden") {
        flush();
      }
    });
  }
}
