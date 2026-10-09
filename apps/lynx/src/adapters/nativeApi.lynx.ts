// FILE: adapters/nativeApi.lynx.ts
// Purpose: Lynx replacement for the Web `nativeApi.ts` (resolved in its place
//   by lynx.config.ts, for `~/nativeApi` and relative `./nativeApi` imports
//   alike). It returns the upstream `createWsNativeApi()` facade, which runs on
//   the Lynx transport compat (`adapters/wsTransport.lynx.ts`), and overrides
//   only the namespaces whose Web implementation reaches for `window`,
//   `document` or browser `fetch`: those go to the Lynx host ports instead.
// Layer: L1 platform adapter (lynx implementation)
//
// Thread-neutral at module scope (shared Web modules import it on both Lynx
// threads); every host port is reached from a `'background only'` function.

import {
  WS_METHODS,
  type NativeApi,
  type ThreadBrowserState,
  type ThreadId,
} from "@synara/contracts";
import { createWsNativeApi } from "@synara-web/wsNativeApi";
import { requireHttpExternalUrl } from "@synara-web/lib/externalUrl";

import { nativeRpcRequest } from "../data/nativeRpcBridge";

let testOverride: NativeApi | undefined;
let instance: NativeApi | null = null;

export function setNativeApiForTest(api: NativeApi | undefined): void {
  testOverride = api;
  instance = null;
}

export function readNativeApi(): NativeApi | null {
  if (testOverride) return testOverride;
  instance ??= createLynxNativeApi();
  return instance;
}

/** Same contract as the Web `ensureNativeApi`; on Lynx the facade always exists. */
export function ensureNativeApi(): NativeApi {
  return readNativeApi() as NativeApi;
}

const BROWSER_UNAVAILABLE = "The embedded browser is not available on this renderer.";
const AUTH_UNAVAILABLE = "Auth sessions are managed by the Lynxtron host, not the renderer.";

function unavailable(message: string): () => Promise<never> {
  return () => Promise.reject(new Error(message));
}

function closedBrowserState(threadId: ThreadId): ThreadBrowserState {
  return {
    threadId,
    version: 0,
    open: false,
    activeTabId: null,
    tabs: [],
    lastError: null,
  };
}

async function hostDialogs() {
  "background only";
  const { dialogs } = await import(/* webpackMode: "eager" */ "../platform/dialogs");
  return dialogs;
}

async function hostWindow() {
  "background only";
  const { platformWindow } = await import(/* webpackMode: "eager" */ "../platform/window");
  return platformWindow;
}

async function hostContextMenu() {
  "background only";
  const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
  return showContextMenu;
}

function createLynxNativeApi(): NativeApi {
  const api = createWsNativeApi();
  return {
    ...api,
    dialogs: {
      pickFolder: async () => (await hostDialogs()).pickFolder(),
      saveFile: async (input) => {
        const dialogs = await hostDialogs();
        return dialogs.saveFile ? dialogs.saveFile(input) : null;
      },
      confirm: async (message) => (await hostDialogs()).confirm(message),
    },
    shell: {
      ...api.shell,
      openExternal: async (url) => {
        const externalUrl = requireHttpExternalUrl(url);
        const opened = await (await hostWindow()).openExternal(externalUrl);
        if (!opened) throw new Error("Unable to open link.");
      },
      showInFolder: async (path) => {
        await (await hostWindow()).showInFolder(path);
      },
    },
    contextMenu: {
      show: async (items, position) => (await hostContextMenu())(items, position ?? { x: 0, y: 0 }),
    },
    server: {
      ...api.server,
      // The Web facade uploads audio over HTTP with browser `fetch`; the host
      // relay carries the same RPC the Electron preload uses.
      transcribeVoice: (input) => nativeRpcRequest(WS_METHODS.serverTranscribeVoice, input),
      // `/api/auth/*` is a same-origin browser HTTP surface; the Lynx renderer
      // has no origin, and the host authenticates its own socket.
      getAuthSession: unavailable(AUTH_UNAVAILABLE),
      bootstrapAuth: unavailable(AUTH_UNAVAILABLE),
      bootstrapBearerAuth: unavailable(AUTH_UNAVAILABLE),
      issueAuthWebSocketToken: unavailable(AUTH_UNAVAILABLE),
      createAuthPairingToken: unavailable(AUTH_UNAVAILABLE),
      listAuthPairingLinks: unavailable(AUTH_UNAVAILABLE),
      revokeAuthPairingLink: unavailable(AUTH_UNAVAILABLE),
      listAuthClients: unavailable(AUTH_UNAVAILABLE),
      revokeAuthClient: unavailable(AUTH_UNAVAILABLE),
      revokeOtherAuthClients: unavailable(AUTH_UNAVAILABLE),
      logoutAuthSession: unavailable(AUTH_UNAVAILABLE),
    },
    // The embedded browser is a placeholder on Lynx (plan decision D3/D13).
    // The Web facade's in-memory fallback is unreachable here because every
    // branch first probes `window.desktopBridge`.
    browser: {
      open: unavailable(BROWSER_UNAVAILABLE),
      close: unavailable(BROWSER_UNAVAILABLE),
      hide: async () => undefined,
      getState: async (input) => closedBrowserState(input.threadId),
      setPanelBounds: async () => undefined,
      attachWebview: async (input) => closedBrowserState(input.threadId),
      detachWebview: async () => undefined,
      copyLink: unavailable(BROWSER_UNAVAILABLE),
      copyScreenshotToClipboard: unavailable(BROWSER_UNAVAILABLE),
      captureScreenshot: unavailable(BROWSER_UNAVAILABLE),
      executeCdp: unavailable(BROWSER_UNAVAILABLE),
      navigate: unavailable(BROWSER_UNAVAILABLE),
      reload: async (input) => closedBrowserState(input.threadId),
      goBack: async (input) => closedBrowserState(input.threadId),
      goForward: async (input) => closedBrowserState(input.threadId),
      newTab: unavailable(BROWSER_UNAVAILABLE),
      closeTab: async (input) => closedBrowserState(input.threadId),
      selectTab: async (input) => closedBrowserState(input.threadId),
      openDevTools: async () => undefined,
      onState: () => () => undefined,
      onCopyLink: () => () => undefined,
    },
  };
}
