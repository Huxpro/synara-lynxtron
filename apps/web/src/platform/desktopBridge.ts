// FILE: platform/desktopBridge.ts
// Purpose: L1 platform port — single typed access point for the Electron
//   preload `window.desktopBridge` global. Capability domains that have their
//   own port (window controls, clipboard, socket URL, dialogs) must use that
//   port instead; this accessor exists for the remaining desktop-only domains
//   (appSnap, browser control, notifications, updater, storageMigration…)
//   until they get dedicated ports or stay desktop-exclusive.
// Layer: L1 platform port (web implementation)
// Exports: getDesktopBridge

import type { DesktopBridge } from "@synara/contracts";

export function getDesktopBridge(): DesktopBridge | undefined {
  return typeof window === "undefined" ? undefined : window.desktopBridge;
}
