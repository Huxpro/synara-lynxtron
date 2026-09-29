import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

describe("Native Browser right-dock pane", () => {
  it("keeps one host-owned view mounted and toggles visibility by active pane", () => {
    const source = readFileSync(new URL("./BrowserDockPane.lynx.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(source).toContain("getRectByRef(paneRef, true)");
    expect(source).toContain("getRectByRef(contentRef, true)");
    expect(source).toContain("resolveBrowserViewBounds(");
    expect(source).toContain("if (!bounds) return");
    expect(source).toContain(".attach(bounds, activeTabId, address)");
    expect(source).toContain("attachPromiseRef.current ??= browserView");
    expect(source).toContain("<textarea");
    expect(source).toContain("maxlines={1}");
    expect(source).toContain("default-value={displayedAddress}");
    expect(source).toContain('method: "setValue"');
    expect(source).toContain("nativeAddressRef.current === displayedAddress");
    expect(source).not.toContain("<Input");
    expect(source).toContain("browserView.setVisible(false)");
    expect(source).toContain("browserView.setBounds(bounds)");
    expect(source).toContain("browserView.destroy()");
    expect(source).not.toContain("await refreshState()");
    expect(router).toContain('activePane?.kind === "browser"');
    expect(router).toContain("browserPane && dockThread ? (");
    expect(router).toContain("<BrowserDockPane");
    expect(router).toContain("active={browserOpen}");
    expect(router).toContain("supported={browserSupported}");
    expect(router).toContain("threadId={dockThread.id}");
    expect(router).toContain("key={dockThread.id}");
    expect(router).toContain("onTitleChange={(title) => {");
  });

  it("advertises Browser only on supported hosts and preserves an unavailable persisted pane", () => {
    const source = readFileSync(new URL("./BrowserDockPane.lynx.tsx", import.meta.url), "utf8");
    const router = readFileSync(new URL("./router.tsx", import.meta.url), "utf8");
    expect(router).toContain('queryKey: ["browser-view-capability"]');
    expect(router).toContain("browserViewState?.supported === true");
    expect(router).toContain('command !== "browser.toggle" || !browserSupported');
    expect(router.indexOf("command !== 'browser.toggle' || !browserSupported")).toBeLessThan(
      router.indexOf("function ThreadPage("),
    );
    expect(router).toContain('paneId: "browser"');
    expect(router).toContain('browserSupported ? ["browser" as const] : []');
    expect(router).toContain('pane.kind === "browser"');
    expect(source).toContain("if (!props.supported)");
    expect(source).toContain("The embedded browser is unavailable on this platform.");
  });

  it("provides Electron-equivalent first-tab navigation controls", () => {
    const source = readFileSync(new URL("./BrowserDockPane.lynx.tsx", import.meta.url), "utf8");
    const nativeHost = readFileSync(
      new URL("../../native/browser-view-probe.mm", import.meta.url),
      "utf8",
    );
    for (const label of [
      "Browser address",
      "Go back",
      "Go forward",
      "Reload page",
      "Copy screenshot",
      "Copy link",
    ]) {
      expect(source).toContain(label);
    }
    expect(source).toContain("normalizeBrowserUrlInput(address)");
    expect(source).toContain('placeholder="Search or enter a URL"');
    expect(source).toContain("browserView.navigate(url)");
    expect(source).toContain("browserView.onStateChange(applyState)");
    expect(source).toContain("const stateTabId = next.tabId || activeTabIdRef.current");
    expect(source).toContain("tab.id === stateTabId");
    expect(source).toContain('props.onTitleChange?.("Browser")');
    expect(source).toContain("setError(next.lastError)");
    expect(source).toContain("if (next.url) setAddress(next.url)");
    expect(source).toContain("props.onTitleChange?.(next.title)");
    expect(source).not.toContain("BROWSER_STATE_POLL_ATTEMPTS");
    expect(source).toContain("sleepOnHost(1_600)");
    expect(nativeHost).toContain("SynaraBrowserNavigationDelegate");
    expect(nativeHost).toContain('@"canGoForward"');
    expect(nativeHost).toContain("NSURLErrorFailingURLErrorKey");
    expect(nativeHost).toContain('@"Connection refused."');
    expect(source).toContain("resolveCopyableBrowserTabUrl");
    expect(source).toContain("clipboard.writeText(copyableUrl)");
    expect(source).toContain("browserView.copyScreenshotToClipboard()");
    expect(source).toContain("Browser screenshot copied");
    expect(nativeHost).toContain("takeSnapshotWithConfiguration:nil");
    expect(nativeHost).toContain("writeObjects:@[ image ]");
    expect(nativeHost).toContain("decidePolicyForNavigationAction");
    expect(nativeHost).toContain("This link uses a blocked external protocol.");
    expect(nativeHost).toContain("g_failed_url = nil");
    expect(nativeHost).toContain("WKNavigationActionPolicyCancel");
    expect(nativeHost).toContain("document.querySelector('link[rel~=icon]')");
    expect(nativeHost).toContain('set_string("faviconUrl", favicon_url)');
    expect(nativeHost).toContain("[WKWebsiteDataStore defaultDataStore]");
    expect(source).toContain('className="BrowserDockTabFavicon"');
    expect(source).toContain('ariaLabel="Browser actions"');
    expect(source).toContain("<ArrowRightIcon color={primaryIconColor} size={14} />");
    expect(source).not.toContain("<ChevronRightIcon size={14} />");
    expect(source).toContain('import linkSvg from "@synara-central-icons/chain-link-3.svg?raw"');
    expect(source).toContain("content={colorizeLynxSvg(linkSvg, primaryIconColor)}");
    expect(source).toContain('const secondaryIconColor = semanticIconColor("secondary")');
    expect(source).toContain("platformWindow.openExternal(copyableUrl)");
    expect(source).toContain("Close browser panel");
    expect(source).toContain("<text>Capture screenshot</text>");
    expect(source).toContain("<MenuSeparator />");
    expect(source.indexOf("<text>New tab</text>")).toBeLessThan(
      source.indexOf("<text>Capture screenshot</text>"),
    );
    expect(source.indexOf("<text>Capture screenshot</text>")).toBeLessThan(
      source.indexOf("<text>Open externally</text>"),
    );
    expect(source.indexOf("<MenuSeparator />")).toBeLessThan(
      source.indexOf("<text>Close browser panel</text>"),
    );
    expect(source).toContain("browserView.setVisible(showNativeView)");
    expect(source).toContain("!showLocalServersHome && !actionsOpen && !suggestionsOpen && !error");
    expect(source).toContain("buildBrowserAddressSuggestions({");
    expect(source).toContain("initialTabsRef.current.recentHistory");
    expect(source).toContain('className="BrowserDockAddressSuggestions"');
    expect(source).toContain("void chooseAddressSuggestion(suggestion)");
    expect(source).toContain("nativeAddressRef.current !== nextValue");
    expect(source).toContain("browserView.newTab(tabId, url)");
    expect(source).toContain("browserView.selectTab(tab.id)");
    expect(source).toContain("browserView.closeTab(tabId)");
    expect(source).toContain("browserView.onOpenWindow");
    expect(source).toContain("classifyBrowserWindowOpen");
    expect(source).toContain("void createTab(request.url)");
    expect(source).toContain('features: request.hasFeatures ? "native-window-features" : ""');
    expect(source).toContain("requires the CEF browser backend");
    expect(source).toContain('className="BrowserDockTabBar"');
    expect(source).toContain('aria-label="New tab"');
    expect(source).toContain("readBrowserTabsState(props.threadId)");
    expect(source).toContain("storeBrowserTabsState(props.threadId");
    expect(source).toContain("tabsStateThreadId !== props.threadId");
    expect(source).toContain("if (!props.threadId || tabsStateThreadId !== props.threadId) return");
    expect(source).toContain("hostTabIdsRef.current.has(tab.id)");
    expect(source).toContain("const INACTIVE_TAB_SUSPEND_DELAY_MS = 1_500");
    expect(source).toContain("const INACTIVE_BROWSER_SUSPEND_DELAY_MS = 30_000");
    expect(source).toContain("warmInactiveTabIdRef");
    expect(source).toContain("scheduleInactiveTabSuspend(previousActiveTabId)");
    expect(source).toContain("await browserView.closeTab(tabId)");
    expect(source).toContain("scheduleBrowserSuspend()");
    expect(source).toContain("await browserView.destroy()");
    expect(source).toContain("activeRef.current = props.active");
    expect(source).toContain("if (!disposedRef.current && activeRef.current)");
    expect(source).toContain("BROWSER_COPY_LINK_TOAST_TITLE");
    expect(source).toContain("browserView.onCopyLink");
    expect(nativeHost).toContain("SynaraBrowserWebView");
    expect(nativeHost).toContain("NSEventModifierFlagCommand");
  });

  it("reuses the canonical local-server launcher for blank tabs", () => {
    const source = readFileSync(new URL("./BrowserDockPane.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./browser-dock-pane.css", import.meta.url), "utf8");
    expect(source).toContain("isBlankBrowserTabUrl");
    expect(source).toContain("fetchLocalServers()");
    expect(source).toContain("browserLocalServerUrl(server)");
    expect(source).toContain("localServerPrimaryLabel(server)");
    expect(source).toContain("localServerAddressLabel(server)");
    expect(source).toContain("Refresh local servers");
    expect(source).toContain("Scanning local servers");
    expect(source).toContain("No local servers");
    expect(source).toContain("browserView.setVisible(showNativeView)");
    expect(styles).toContain(".BrowserDockServerThumbnail");
    expect(styles).toContain("background-color: var(--browser-home-thumbnail-surface)");
    expect(styles).toMatch(
      /\.BrowserDockAddress\s*\{[^}]*border-width:\s*1px;[^}]*border-style:\s*solid;[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.BrowserDockTab--active\s*\{[^}]*border-left-color:\s*var\(--border\);[^}]*border-right-color:\s*var\(--border\);[^}]*border-top-color:\s*var\(--border\);[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(styles).toMatch(
      /\.BrowserDockServerCard\s*\{[^}]*border-left-color:\s*var\(--browser-home-card-border\);[^}]*border-right-color:\s*var\(--browser-home-card-border\);[^}]*border-top-color:\s*var\(--browser-home-card-border\);[^}]*border-bottom-color:\s*var\(--browser-home-card-border\);/s,
    );
    expect(styles).toMatch(
      /\.BrowserDockServerThumbnail\s*\{[^}]*border-left-color:\s*var\(--browser-home-thumbnail-border\);[^}]*border-right-color:\s*var\(--browser-home-thumbnail-border\);[^}]*border-top-color:\s*var\(--browser-home-thumbnail-border\);[^}]*border-bottom-color:\s*var\(--browser-home-thumbnail-border\);/s,
    );
    for (const token of [
      "--browser-home-surface",
      "--browser-home-foreground",
      "--browser-home-foreground-secondary",
      "--browser-home-card-border",
      "--browser-home-thumbnail-surface",
      "--browser-home-online",
    ]) {
      expect(styles).toContain(`var(${token})`);
    }
    expect(styles).not.toContain("#0d0d0d");
    expect(styles).not.toContain("rgba(255,255,255");
  });

  it("matches Electron's Browser chrome dividers", () => {
    const styles = readFileSync(new URL("./browser-dock-pane.css", import.meta.url), "utf8");
    const source = readFileSync(new URL("./BrowserDockPane.lynx.tsx", import.meta.url), "utf8");
    // Toolbar: the 46px chat-surface header row with its layout-neutral hairline.
    expect(styles).toMatch(/\.BrowserDockToolbar\s*\{[^}]*height:\s*46px;/s);
    expect(styles).not.toMatch(/\.BrowserDockToolbar\s*\{[^}]*border-bottom/s);
    expect(source).toContain('className="BrowserDockToolbar chat-surface-divider"');
    // Tab bar: border-b border-border (full strength).
    expect(styles).toMatch(
      /\.BrowserDockTabBar\s*\{[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
  });
});
