// FILE: platform/dialogs.ts
// Purpose: L1 platform port — native dialogs (confirm / pickFolder / saveFile).
//   Web impl delegates to the current NativeApi (Electron preload when present,
//   otherwise the WS-backed api with DOM fallbacks). The Lynx impl maps to
//   Lynxtron `dialog` over the lynxBridge.
// Layer: L1 platform port (web implementation)
// Exports: DialogsPort, dialogs

import type { NativeApi } from "@synara/contracts";

import { readNativeApi } from "../nativeApi";

export type DialogsPort = NativeApi["dialogs"];

// Resolve through readNativeApi only (never ensureNativeApi): existing tests
// and call sites mock/provide readNativeApi, and the thrown message matches
// ensureNativeApi's for the genuinely-unavailable case.
function resolveDialogs(): DialogsPort {
  const api = readNativeApi();
  if (!api) {
    throw new Error("Native API not found");
  }
  return api.dialogs;
}

/**
 * Lazily delegates every call so the active NativeApi implementation is
 * resolved at call time (same timing as the previous inline `readNativeApi()`
 * call sites). `saveFile` stays optional, mirroring the underlying contract so
 * feature checks keep working.
 */
export const dialogs: DialogsPort = {
  pickFolder: () => resolveDialogs().pickFolder(),
  confirm: (message) => resolveDialogs().confirm(message),
  get saveFile() {
    return resolveDialogs().saveFile;
  },
};
