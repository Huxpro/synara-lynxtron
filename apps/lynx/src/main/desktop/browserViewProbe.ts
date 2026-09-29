import path from "node:path";
import { createRequire } from "node:module";

export interface BrowserViewBounds {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface BrowserViewState {
  readonly tabId: string;
  readonly supported: boolean;
  readonly attached: boolean;
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly isLoading: boolean;
  readonly lastError: string | null;
  readonly title: string;
  readonly faviconUrl: string;
  readonly url: string;
  readonly visible: boolean;
}

interface NativeBrowserViewHost {
  attach(
    nativeViewHandle: Buffer,
    x: number,
    y: number,
    width: number,
    height: number,
    tabId: string,
    url: string,
  ): boolean;
  setBounds(x: number, y: number, width: number, height: number): boolean;
  setVisible(visible: boolean): boolean;
  navigate(url: string): boolean;
  goBack(): boolean;
  goForward(): boolean;
  reload(): boolean;
  newTab(tabId: string, url: string): boolean;
  selectTab(tabId: string): boolean;
  closeTab(tabId: string): boolean;
  copyScreenshotToClipboard(): Promise<boolean>;
  getState(): BrowserViewState;
  setStateListener(listener: (() => void) | null): void;
  setCopyLinkListener(listener: (() => void) | null): void;
  setOpenWindowListener(listener: ((request: BrowserOpenWindowRequest) => void) | null): void;
  destroy(): void;
}

export interface BrowserViewHost {
  attach(bounds: BrowserViewBounds, tabId: string, url: string): boolean;
  setBounds(bounds: BrowserViewBounds): boolean;
  setVisible(visible: boolean): boolean;
  navigate(url: string): boolean;
  goBack(): boolean;
  goForward(): boolean;
  reload(): boolean;
  newTab(tabId: string, url: string): boolean;
  selectTab(tabId: string): boolean;
  closeTab(tabId: string): boolean;
  copyScreenshotToClipboard(): Promise<boolean>;
  getState(): BrowserViewState;
  dispose(): void;
}

export interface BrowserOpenWindowRequest {
  readonly url: string;
  readonly frameName: string;
  readonly hasFeatures: boolean;
}

const EMPTY_STATE: BrowserViewState = {
  tabId: "",
  supported: false,
  attached: false,
  canGoBack: false,
  canGoForward: false,
  isLoading: false,
  lastError: null,
  title: "",
  faviconUrl: "",
  url: "",
  visible: false,
};

export function createBrowserViewHost(input: {
  readonly nativeViewHandle: Buffer;
  readonly onStateChange?: (state: BrowserViewState) => void;
  readonly onCopyLink?: () => void;
  readonly onOpenWindow?: (request: BrowserOpenWindowRequest) => void;
  readonly platform?: NodeJS.Platform;
  readonly requireNative?: (path: string) => NativeBrowserViewHost;
}): BrowserViewHost {
  if ((input.platform ?? process.platform) !== "darwin") {
    return {
      attach: () => false,
      setBounds: () => false,
      setVisible: () => false,
      navigate: () => false,
      goBack: () => false,
      goForward: () => false,
      newTab: () => false,
      selectTab: () => false,
      closeTab: () => false,
      reload: () => false,
      copyScreenshotToClipboard: async () => false,
      getState: () => EMPTY_STATE,
      dispose() {},
    };
  }
  const requireNative = input.requireNative ?? createRequire(import.meta.url);
  let native: NativeBrowserViewHost | null = null;
  const load = () => {
    if (!native) {
      native = requireNative(path.join(__dirname, "native", "browser-view-probe.node"));
      native.setStateListener(
        input.onStateChange ? () => input.onStateChange?.(native?.getState() ?? EMPTY_STATE) : null,
      );
      native.setCopyLinkListener(input.onCopyLink ?? null);
      native.setOpenWindowListener(input.onOpenWindow ?? null);
    }
    return native;
  };
  return {
    attach: (bounds, tabId, url) =>
      load().attach(
        input.nativeViewHandle,
        bounds.x,
        bounds.y,
        bounds.width,
        bounds.height,
        tabId,
        url,
      ),
    setBounds: (bounds) => load().setBounds(bounds.x, bounds.y, bounds.width, bounds.height),
    setVisible: (visible) => load().setVisible(visible),
    navigate: (url) => load().navigate(url),
    goBack: () => load().goBack(),
    goForward: () => load().goForward(),
    reload: () => load().reload(),
    newTab: (tabId, url) => load().newTab(tabId, url),
    selectTab: (tabId) => load().selectTab(tabId),
    closeTab: (tabId) => load().closeTab(tabId),
    copyScreenshotToClipboard: () => load().copyScreenshotToClipboard(),
    getState: () => load().getState(),
    dispose: () => {
      native?.setStateListener(null);
      native?.setCopyLinkListener(null);
      native?.setOpenWindowListener(null);
      native?.destroy();
      native = null;
    },
  };
}
