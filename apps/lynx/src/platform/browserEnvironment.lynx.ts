// FILE: platform/browserEnvironment.lynx.ts
// Purpose: the browser globals upstream `apps/web` source expects (`window`,
//   `document`, `navigator`, `location`, `localStorage`, `sessionStorage`,
//   `crypto`),
//   implemented on the Lynx platform ports. Lynx hands every bundle these names
//   as wrapper parameters with no value, so upstream code that reads a member
//   throws. `scripts/browser-environment-loader.mjs` binds the names used by an
//   upstream file to the exports below, so the file compiles byte-identical to
//   upstream (docs/architecture-principles.md, "environment injection").
// Layer: L1 platform port (lynx implementation)
//
// Scope: only `apps/web/src` gets these bindings. Lynx-owned code and npm
//   packages keep seeing the real runtime, so their own `typeof window` probes
//   (TanStack Query's `isServer`, zustand, …) do not change.
//
// Threading: importable from both threads. Nothing here touches the host
//   bridge at import; members that need it call a `'background only'` function
//   with an eager dynamic import when they are invoked (plan/04 P-16, P-72).
//
// Semantics, by kind (each member below says which it is):
//   - backed:  works on Lynx through a platform port.
//   - inert:   accepted and ignored, because Lynx has no source for it (DOM
//              events on `document`, styles on the root element). Reads return
//              the value an idle browser page would report.
//   - absent:  left `undefined` on purpose, so upstream feature detection
//              (`navigator.mediaDevices?.…`, `typeof document.execCommand`)
//              takes its "unavailable" branch.
//   - throws:  cannot work and has no safe default; throws a
//              `BrowserEnvironmentUnsupportedError` naming the member.

import { getLocationOrigin } from "./env.lynx";
import { addWindowEventListener, dispatchWindowEvent, removeWindowEventListener } from "./events";
import { type KeyValueStorage, sessionWebStorage, webStorage } from "./storage";
import { lynxWindowTimers } from "./windowTimers";

export class BrowserEnvironmentUnsupportedError extends Error {
  constructor(member: string) {
    super(`${member} is not available in the Lynx renderer.`);
    this.name = "BrowserEnvironmentUnsupportedError";
  }
}

function unsupported(member: string): never {
  throw new BrowserEnvironmentUnsupportedError(member);
}

// ── storage (backed) ─────────────────────────────────────────────────

export const localStorage: KeyValueStorage = webStorage;
export const sessionStorage: KeyValueStorage = sessionWebStorage;

// ── crypto (backed where the runtime has it) ─────────────────────────

type HostCrypto = {
  readonly randomUUID?: () => string;
  readonly getRandomValues?: <T extends ArrayBufferView>(array: T) => T;
};

function hostCrypto(): HostCrypto | undefined {
  return (globalThis as { readonly crypto?: HostCrypto }).crypto;
}

export interface LynxCrypto {
  /** The runtime's own function, or absent: upstream probes it and falls back. */
  readonly randomUUID: (() => string) | undefined;
  readonly getRandomValues: (<T extends ArrayBufferView>(array: T) => T) | undefined;
}

/**
 * PrimJS has no `crypto` global, and the bare name throws there. Each member is
 * the runtime's own function when one exists and `undefined` otherwise, read
 * when asked; nothing is emulated.
 */
export const crypto: LynxCrypto = {
  get randomUUID() {
    const host = hostCrypto();
    return typeof host?.randomUUID === "function" ? () => host.randomUUID!() : undefined;
  },
  get getRandomValues() {
    const host = hostCrypto();
    return typeof host?.getRandomValues === "function"
      ? <T extends ArrayBufferView>(array: T) => host.getRandomValues!(array)
      : undefined;
  },
};

// ── frames (backed) ──────────────────────────────────────────────────

type FrameCallback = (time: number) => void;
type FrameGlobals = {
  readonly requestAnimationFrame?: (callback: FrameCallback) => number;
  readonly cancelAnimationFrame?: (handle: number) => void;
};
const FALLBACK_FRAME_MS = 16;
/** Handles issued by the timer fallback, so cancel reaches the right API. */
const fallbackFrameHandles = new Set<number>();

function requestFrame(callback: FrameCallback): number {
  // Read at call time: the background runtime exposes the global, the test
  // runtime may not. A timer at one frame's distance keeps the contract (the
  // callback runs later, once, with a timestamp) where it is missing.
  const host = (globalThis as FrameGlobals).requestAnimationFrame;
  // Lynx's frame callback may arrive without the DOM's timestamp argument.
  if (typeof host === "function") {
    return host((time) => callback(typeof time === "number" ? time : Date.now()));
  }
  const handle = lynxWindowTimers.setTimeout(() => {
    fallbackFrameHandles.delete(handle);
    callback(Date.now());
  }, FALLBACK_FRAME_MS);
  fallbackFrameHandles.add(handle);
  return handle;
}

function cancelFrame(handle: number): void {
  if (fallbackFrameHandles.delete(handle)) {
    lynxWindowTimers.clearTimeout(handle);
    return;
  }
  (globalThis as FrameGlobals).cancelAnimationFrame?.(handle);
}

// ── external links (backed) ──────────────────────────────────────────

async function openExternally(url: string): Promise<void> {
  "background only";
  const { platformWindow } = await import(/* webpackMode: "eager" */ "./window");
  platformWindow.openWindow(url);
}

/**
 * `window.open` hands the URL to the host's default handler, best effort, and
 * returns `null`: there is no window handle, as with `noopener` in a browser.
 * Upstream's `openExternalLink` falls back to this when the shell call fails.
 */
function openWindow(url?: string | URL): null {
  if (url !== undefined && String(url) !== "") {
    void openExternally(String(url)).catch(() => undefined);
  }
  return null;
}

// ── navigator ────────────────────────────────────────────────────────

async function writeClipboardText(value: string): Promise<void> {
  "background only";
  const { clipboard } = await import(/* webpackMode: "eager" */ "./clipboard");
  await clipboard.writeText(value);
}

export interface LynxNavigator {
  /** backed: Lynxtron ships for macOS only. */
  readonly platform: string;
  readonly userAgent: string;
  readonly language: string;
  readonly languages: ReadonlyArray<string>;
  /** backed: the renderer talks to a local backend; there is no offline state. */
  readonly onLine: boolean;
  /** backed for text (host clipboard); `write`/`read*` are absent. */
  readonly clipboard: { readonly writeText: (value: string) => Promise<void> };
  /** absent: no worker pool on Lynx; upstream falls back to its default. */
  readonly hardwareConcurrency: undefined;
  /** absent: capture goes through the Lynx voice recorder port. */
  readonly mediaDevices: undefined;
}

export const navigator: LynxNavigator = {
  platform: "MacIntel",
  userAgent: "Lynxtron",
  language: "en-US",
  languages: ["en-US"],
  onLine: true,
  clipboard: { writeText: (value) => writeClipboardText(value) },
  hardwareConcurrency: undefined,
  mediaDevices: undefined,
};

// ── location ─────────────────────────────────────────────────────────

export interface LynxLocation {
  /** backed: the HTTP origin of the backend this renderer is connected to. */
  readonly origin: string;
  readonly href: string;
  /** inert: the renderer is not loaded from a URL scheme upstream knows. */
  readonly protocol: string;
  readonly hostname: string;
  readonly host: string;
  readonly pathname: string;
  readonly search: string;
  readonly hash: string;
  /** throws: Lynx navigates through its memory history, not `location`. */
  readonly assign: (url: string) => never;
  readonly replace: (url: string) => never;
  readonly reload: () => never;
}

export const location: LynxLocation = {
  // Getters: the endpoint comes from host init data, read when asked.
  get origin() {
    return getLocationOrigin();
  },
  get href() {
    return getLocationOrigin();
  },
  protocol: "",
  hostname: "",
  host: "",
  pathname: "/",
  search: "",
  hash: "",
  assign: () => unsupported("location.assign"),
  replace: () => unsupported("location.replace"),
  reload: () => unsupported("location.reload"),
};

// ── document ─────────────────────────────────────────────────────────

/** inert: a style/class sink. Lynx themes through its own adapter (`useTheme.lynx`). */
export interface LynxRootElement {
  readonly style: {
    readonly setProperty: (name: string, value: string) => void;
    readonly removeProperty: (name: string) => string;
    readonly getPropertyValue: (name: string) => string;
  };
  readonly classList: {
    readonly add: (...tokens: string[]) => void;
    readonly remove: (...tokens: string[]) => void;
    readonly toggle: (token: string, force?: boolean) => boolean;
    readonly contains: (token: string) => boolean;
  };
  readonly dataset: Record<string, string | undefined>;
  readonly setAttribute: (name: string, value: string) => void;
  readonly removeAttribute: (name: string) => void;
  readonly getAttribute: (name: string) => null;
}

const rootElement: LynxRootElement = {
  style: {
    setProperty: () => {},
    removeProperty: () => "",
    getPropertyValue: () => "",
  },
  classList: {
    add: () => {},
    remove: () => {},
    toggle: (_token, force) => force === true,
    contains: () => false,
  },
  dataset: {},
  setAttribute: () => {},
  removeAttribute: () => {},
  getAttribute: () => null,
};

export interface LynxDocument {
  /** inert: no DOM tree. */
  readonly documentElement: LynxRootElement;
  readonly activeElement: null;
  /** inert: a Lynxtron window has no page-visibility lifecycle. */
  readonly visibilityState: "visible";
  readonly hidden: false;
  readonly hasFocus: () => boolean;
  /** inert: Lynx has no source for document-level DOM events. */
  readonly addEventListener: (type: string, listener: unknown, options?: unknown) => void;
  readonly removeEventListener: (type: string, listener: unknown, options?: unknown) => void;
  /** inert: nothing to find. */
  readonly getElementById: (id: string) => null;
  readonly querySelector: (selector: string) => null;
  readonly querySelectorAll: (selector: string) => ReadonlyArray<never>;
  readonly getSelection: () => null;
  /** throws: no DOM nodes can be created or attached. */
  readonly createElement: (tagName: string) => never;
  readonly body: never;
  /** absent: upstream probes `typeof document.execCommand` before its copy fallback. */
  readonly execCommand: undefined;
}

export const document: LynxDocument = {
  documentElement: rootElement,
  activeElement: null,
  visibilityState: "visible",
  hidden: false,
  hasFocus: () => true,
  addEventListener: () => {},
  removeEventListener: () => {},
  getElementById: () => null,
  querySelector: () => null,
  querySelectorAll: () => [],
  getSelection: () => null,
  createElement: () => unsupported("document.createElement"),
  get body(): never {
    return unsupported("document.body");
  },
  execCommand: undefined,
};

// ── window ───────────────────────────────────────────────────────────

/** inert: no CSS media environment; a query never matches and never changes. */
export interface LynxMediaQueryList {
  readonly media: string;
  readonly matches: false;
  readonly addEventListener: (type: string, listener: unknown) => void;
  readonly removeEventListener: (type: string, listener: unknown) => void;
  readonly addListener: (listener: unknown) => void;
  readonly removeListener: (listener: unknown) => void;
}

function matchMedia(query: string): LynxMediaQueryList {
  return {
    media: query,
    matches: false,
    addEventListener: () => {},
    removeEventListener: () => {},
    addListener: () => {},
    removeListener: () => {},
  };
}

export interface LynxWindow {
  // backed
  readonly localStorage: KeyValueStorage;
  readonly sessionStorage: KeyValueStorage;
  readonly setTimeout: (handler: () => void, timeout?: number) => number;
  readonly clearTimeout: (handle: number | null | undefined) => void;
  readonly setInterval: (handler: () => void, timeout?: number) => number;
  readonly clearInterval: (handle: number | null | undefined) => void;
  readonly requestAnimationFrame: (callback: FrameCallback) => number;
  readonly cancelAnimationFrame: (handle: number) => void;
  /** backed: the in-memory bus of `platform/events.ts` (renderer-local `synara:*` events). */
  readonly addEventListener: typeof addWindowEventListener;
  readonly removeEventListener: typeof removeWindowEventListener;
  readonly dispatchEvent: typeof dispatchWindowEvent;
  /** backed: opens the URL in the host's default handler; never returns a window. */
  readonly open: (url?: string | URL, target?: string, features?: string) => null;
  readonly navigator: LynxNavigator;
  readonly location: LynxLocation;
  readonly document: LynxDocument;
  // inert
  readonly matchMedia: (query: string) => LynxMediaQueryList;
  /** inert: Lynx screens take their viewport from layout, not from `window`. */
  readonly innerWidth: number;
  readonly innerHeight: number;
  readonly devicePixelRatio: number;
  readonly getSelection: () => null;
  readonly focus: () => void;
  readonly isSecureContext: boolean;
  // absent
  /** absent: there is no Electron preload bridge. */
  readonly desktopBridge: undefined;
  readonly nativeApi: undefined;
  // throws
  readonly getComputedStyle: (element: unknown) => never;
  /** Upstream attaches debug handles (`window.__…ForTests`); they are kept, unused. */
  [debugHandle: `__${string}`]: unknown;
}

export const window: LynxWindow = {
  localStorage,
  sessionStorage,
  setTimeout: lynxWindowTimers.setTimeout,
  clearTimeout: lynxWindowTimers.clearTimeout,
  setInterval: lynxWindowTimers.setInterval,
  clearInterval: lynxWindowTimers.clearInterval,
  requestAnimationFrame: requestFrame,
  cancelAnimationFrame: cancelFrame,
  addEventListener: addWindowEventListener,
  removeEventListener: removeWindowEventListener,
  dispatchEvent: dispatchWindowEvent,
  navigator,
  location,
  document,
  matchMedia,
  innerWidth: 0,
  innerHeight: 0,
  devicePixelRatio: 1,
  getSelection: () => null,
  focus: () => {},
  isSecureContext: false,
  desktopBridge: undefined,
  nativeApi: undefined,
  getComputedStyle: () => unsupported("window.getComputedStyle"),
  open: openWindow,
};

/**
 * The names the loader may bind. Must match this module's value exports; the
 * loader test asserts it.
 */
export const BROWSER_ENVIRONMENT_GLOBALS = [
  "window",
  "document",
  "navigator",
  "location",
  "localStorage",
  "sessionStorage",
  "crypto",
] as const;
