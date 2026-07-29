// FILE: platform/window.ts
// Purpose: L1 platform port — desktop window controls and shell integration.
//   Web impl delegates to the Electron preload `window.desktopBridge`; the Lynx
//   impl drives `LynxWindow` over the lynxBridge. All functions no-op (or return
//   a neutral value) when no desktop bridge is present, matching the guards
//   callers had in place.
// Layer: L1 platform port (web implementation)
// Exports: WindowPort, platformWindow

import type { DesktopWindowState } from "@synara/contracts";

export interface WindowPort {
  /** True when a desktop bridge with window controls is attached (Electron preload). */
  hasWindowControls: () => boolean;
  minimize: () => Promise<void>;
  toggleMaximize: () => Promise<DesktopWindowState | undefined>;
  close: () => Promise<void>;
  getWindowState: () => Promise<DesktopWindowState | undefined>;
  onWindowState: (listener: (state: DesktopWindowState) => void) => () => void;
  openExternal: (url: string) => Promise<boolean>;
  /** window.open(url, _blank, noopener) — in-page navigation to an external URL. */
  openWindow: (url: string) => void;
  getZoomFactor: () => number;
  onZoomFactorChange: (listener: (zoomFactor: number) => void) => () => void;
}

const controls = () =>
  typeof window !== "undefined" ? window.desktopBridge?.windowControls : undefined;
const bridge = () => (typeof window !== "undefined" ? window.desktopBridge : undefined);

const noop = () => {};

export const platformWindow: WindowPort = {
  hasWindowControls: () => controls() !== undefined,
  minimize: () => controls()?.minimize() ?? Promise.resolve(),
  toggleMaximize: () => controls()?.toggleMaximize() ?? Promise.resolve(undefined),
  close: () => controls()?.close() ?? Promise.resolve(),
  getWindowState: () => controls()?.getState() ?? Promise.resolve(undefined),
  onWindowState: (listener) => controls()?.onState(listener) ?? noop,
  openExternal: (url) => bridge()?.openExternal(url) ?? Promise.resolve(false),
  openWindow: (url) => {
    if (typeof window === "undefined") return;
    window.open(url, "_blank", "noopener,noreferrer");
  },
  getZoomFactor: () => bridge()?.getZoomFactor() ?? 1,
  onZoomFactorChange: (listener) => bridge()?.onZoomFactorChange(listener) ?? noop,
};
