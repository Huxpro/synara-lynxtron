// @lynx-js/lynxtron@0.0.28's web-host.d.ts disagrees with its own runtime
// (web-host/index.js): the nodejs service is loaded from `nodejs.scriptURL`
// (there is no `workerURL`/`methods`), and bridge handlers are invoked with the
// Lynx call's arguments spread (`handler(...args)`). This overload describes the
// real runtime contract.
import "@lynx-js/lynxtron/web-host";

declare module "@lynx-js/lynxtron/web-host" {
  interface LynxtronWebHostConfig {
    bridge?: Readonly<Record<string, (...args: never[]) => unknown>>;
    nodejs?: { readonly scriptURL: string };
  }

  export function setupSymmetricHost(lynxView: HTMLElement, config?: LynxtronWebHostConfig): void;
}
