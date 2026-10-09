// The Lynx bundle compiles parts of apps/web/src (through `@synara-web` and the
// `~` alias). Those files are typed against apps/web/src/vite-env.d.ts, which
// this program cannot include (it pulls in vite/client). Mirror only the
// ambient declarations the compiled Web tree relies on; at runtime on Lynx both
// are absent, so every Web call site already guards them.

import type { DesktopBridge, NativeApi } from "@synara/contracts";
import type { HTMLAttributes, RefAttributes } from "react";

declare module "@lynx-js/react/jsx-runtime" {
  namespace JSX {
    interface IntrinsicElements {
      /** Web-only element used by shared Web components; not rendered by native Lynx routes. */
      span: HTMLAttributes<HTMLSpanElement> & RefAttributes<HTMLSpanElement>;
    }
  }
}

declare global {
  interface Window {
    desktopBridge?: DesktopBridge;
    nativeApi?: NativeApi;
  }

  interface ImportMeta {
    /** Vite HMR handle; undefined under Rspeedy. */
    readonly hot?: { dispose(callback: () => void): void };
  }
}

export {};
