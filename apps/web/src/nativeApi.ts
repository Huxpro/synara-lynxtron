import type { NativeApi } from "@synara/contracts";

import { createWsNativeApi } from "./wsNativeApi";

// The Electron preload exposes `desktopBridge` only; the old `window.nativeApi`
// indirection was removed (P1-F3) — the renderer api is always the WS-backed
// implementation. Tests override through setNativeApiForTest instead of poking
// a global onto window.
let testOverride: NativeApi | undefined;

export function setNativeApiForTest(api: NativeApi | undefined): void {
  testOverride = api;
}

export function readNativeApi(): NativeApi | undefined {
  if (testOverride) return testOverride;
  if (typeof window === "undefined") return undefined;
  return createWsNativeApi();
}

export function ensureNativeApi(): NativeApi {
  const api = readNativeApi();
  if (!api) {
    throw new Error("Native API not found");
  }
  return api;
}
