import "background-only";

import { bridgeCall, onGlobalEvent } from "./bridge";
import type { BrowserViewBounds, BrowserViewState } from "../main/desktop/browserViewProbe";

export const browserView = {
  attach: (bounds: BrowserViewBounds, tabId: string, url: string) =>
    bridgeCall<{ readonly ok: boolean }>("browserViewAttach", { bounds, tabId, url }),
  setBounds: (bounds: BrowserViewBounds) =>
    bridgeCall<{ readonly ok: boolean }>("browserViewSetBounds", { bounds }),
  setVisible: (visible: boolean) =>
    bridgeCall<{ readonly ok: boolean }>("browserViewSetVisible", { visible }),
  navigate: (url: string) => bridgeCall<{ readonly ok: boolean }>("browserViewNavigate", { url }),
  goBack: () => bridgeCall<{ readonly ok: boolean }>("browserViewGoBack"),
  goForward: () => bridgeCall<{ readonly ok: boolean }>("browserViewGoForward"),
  reload: () => bridgeCall<{ readonly ok: boolean }>("browserViewReload"),
  newTab: (tabId: string, url = "about:blank") =>
    bridgeCall<{ readonly ok: boolean }>("browserViewNewTab", { tabId, url }),
  selectTab: (tabId: string) =>
    bridgeCall<{ readonly ok: boolean }>("browserViewSelectTab", { tabId }),
  closeTab: (tabId: string) =>
    bridgeCall<{ readonly ok: boolean }>("browserViewCloseTab", { tabId }),
  copyScreenshotToClipboard: () =>
    bridgeCall<{ readonly ok: boolean }>("browserViewCopyScreenshot"),
  getState: () => bridgeCall<BrowserViewState>("browserViewGetState"),
  onStateChange: (listener: (state: BrowserViewState) => void) =>
    onGlobalEvent("browser:view-state", (state: unknown) => listener(state as BrowserViewState)),
  onCopyLink: (listener: () => void) => onGlobalEvent("browser:copy-link", listener),
  onOpenWindow: (
    listener: (request: {
      readonly url: string;
      readonly frameName: string;
      readonly hasFeatures: boolean;
    }) => void,
  ) =>
    onGlobalEvent("browser:open-window", (payload: unknown) => {
      const request = payload as {
        readonly url?: unknown;
        readonly frameName?: unknown;
        readonly hasFeatures?: unknown;
      } | null;
      if (typeof request?.url !== "string") return;
      listener({
        url: request.url,
        frameName: typeof request.frameName === "string" ? request.frameName : "",
        hasFeatures: request.hasFeatures === true,
      });
    }),
  destroy: () => bridgeCall<{ readonly ok: boolean }>("browserViewDestroy"),
};
