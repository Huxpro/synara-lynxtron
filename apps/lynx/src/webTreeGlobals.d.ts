// The Lynx bundle compiles parts of apps/web/src (through `@synara-web` and the
// `~` alias). Those files are typed against apps/web/src/vite-env.d.ts, which
// this program cannot include (it pulls in vite/client). Mirror only the
// ambient declarations the compiled Web tree relies on; at runtime on Lynx both
// are absent, so every Web call site already guards them.

import type { DesktopBridge } from "@synara/contracts";

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
  }

  interface ImportMeta {
    /** Vite HMR handle; undefined under Rspeedy. */
    readonly hot?: { dispose(callback: () => void): void };
  }
}

export {};
