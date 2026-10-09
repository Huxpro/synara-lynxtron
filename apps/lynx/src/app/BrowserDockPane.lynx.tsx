import { useEffect, useRef, useState } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import { useQuery } from "@tanstack/react-query";
import linkSvg from "@synara-central-icons/chain-link-3.svg?raw";

import { useTheme } from "../adapters/useTheme.lynx";
import { Button } from "../components/ui/button.lynx";
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  EllipsisIcon,
  ExternalLinkIcon,
  GlobeIcon,
  PlusIcon,
  RefreshCwIcon,
  XIcon,
} from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { Menu, MenuItem, MenuPopup, MenuSeparator, MenuTrigger } from "../components/ui/menu.lynx";
import {
  BROWSER_BLANK_URL,
  buildBrowserAddressSuggestions,
  classifyBrowserWindowOpen,
  isBlankBrowserTabUrl,
  normalizeBrowserUrlInput,
  resolveCopyableBrowserTabUrl,
  type BrowserAddressHistoryEntry,
  type BrowserAddressSuggestion,
} from "@synara/shared/browserSession";
import {
  browserLocalServerUrl,
  localServerAddressLabel,
  localServerFolderLabel,
  localServerPrimaryLabel,
} from "@synara/shared/localServers";
import { BROWSER_COPY_LINK_TOAST_TITLE } from "@synara/shared/browserShortcuts";
import { browserView } from "../platform/browserView.lynx";
import { sleepOnHost } from "../platform/timer";
import type { BrowserViewState } from "../main/desktop/browserViewProbe";
import { serverLocalServersQueryOptions } from "@synara-web/lib/serverReactQuery";
import { platformWindow } from "../platform/window";
import { readBrowserTabsState, storeBrowserTabsState } from "./browserTabsPersistence.lynx";
import { resolveBrowserViewBounds } from "./browserViewBounds.lynx";
import "./browser-dock-pane.css";

const INITIAL_BROWSER_URL = BROWSER_BLANK_URL;
const INACTIVE_TAB_SUSPEND_DELAY_MS = 1_500;
const INACTIVE_BROWSER_SUSPEND_DELAY_MS = 30_000;
const BROWSER_HISTORY_LIMIT = 12;
// 46px chat-surface toolbar + 45px tab bar (Electron BrowserPanel chrome).
const BROWSER_CHROME_HEIGHT_PX = 91;
interface NativeBrowserTab {
  readonly faviconUrl: string;
  readonly id: string;
  readonly title: string;
  readonly url: string;
}

function upsertBrowserHistory(
  entries: readonly BrowserAddressHistoryEntry[],
  next: BrowserAddressHistoryEntry,
): readonly BrowserAddressHistoryEntry[] {
  if (next.url === BROWSER_BLANK_URL) return entries;
  if (
    entries[0]?.url === next.url &&
    entries[0]?.title === next.title &&
    entries[0]?.tabId === next.tabId
  )
    return entries;
  return [next, ...entries.filter((entry) => entry.url !== next.url)].slice(
    0,
    BROWSER_HISTORY_LIMIT,
  );
}

export function BrowserDockPane(props: {
  readonly active: boolean;
  readonly supported: boolean;
  readonly threadId: string;
  readonly onClose?: () => void;
  readonly onTitleChange?: (title: string) => void;
}) {
  const { semanticIconColor, svgColors } = useTheme();
  const primaryIconColor = svgColors.foreground;
  const secondaryIconColor = semanticIconColor("secondary");
  const paneRef = useRef<NodesRef>(null);
  const contentRef = useRef<NodesRef>(null);
  const addressRef = useRef<NodesRef>(null);
  const nativeAddressRef = useRef(INITIAL_BROWSER_URL);
  const attachedRef = useRef(false);
  const attachPromiseRef = useRef<Promise<boolean> | null>(null);
  const copyFeedbackVersionRef = useRef(0);
  const initialTabsRef = useRef(readBrowserTabsState(props.threadId));
  const [tabsStateThreadId, setTabsStateThreadId] = useState(props.threadId);
  const hostTabIdsRef = useRef(new Set<string>());
  const warmInactiveTabIdRef = useRef<string | null>(null);
  const suspendVersionByTabIdRef = useRef(new Map<string, number>());
  const browserSuspendVersionRef = useRef(0);
  const disposedRef = useRef(false);
  const activeRef = useRef(props.active);
  activeRef.current = props.active;
  const nextTabIdRef = useRef(initialTabsRef.current.tabs.length + 1);
  const [tabs, setTabs] = useState<readonly NativeBrowserTab[]>(initialTabsRef.current.tabs);
  const [recentHistory, setRecentHistory] = useState<readonly BrowserAddressHistoryEntry[]>(
    initialTabsRef.current.recentHistory,
  );
  const [activeTabId, setActiveTabId] = useState(initialTabsRef.current.activeTabId);
  const activeTabIdRef = useRef(activeTabId);
  activeTabIdRef.current = activeTabId;
  const [address, setAddress] = useState(
    initialTabsRef.current.tabs.find((tab) => tab.id === initialTabsRef.current.activeTabId)?.url ??
      INITIAL_BROWSER_URL,
  );
  const [state, setState] = useState<BrowserViewState | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copyStatus, setCopyStatus] = useState<string | null>(null);
  const [actionsOpen, setActionsOpen] = useState(false);
  const [addressFocused, setAddressFocused] = useState(false);
  const displayedAddress = address === BROWSER_BLANK_URL ? "" : address;
  const addressSuggestions = buildBrowserAddressSuggestions({
    activeTabId,
    query: displayedAddress,
    recentHistory,
    tabs,
  });
  const suggestionsOpen = addressFocused && addressSuggestions.length > 0;
  const showLocalServersHome = isBlankBrowserTabUrl(state ?? { url: address });
  const showNativeView = !showLocalServersHome && !actionsOpen && !suggestionsOpen && !error;
  // As the Web browser panel does: upstream's cadence while the home is shown.
  const localServersQuery = useQuery(
    serverLocalServersQueryOptions(props.active && props.supported && showLocalServersHome),
  );
  const localServers = localServersQuery.data?.servers ?? [];
  const copyableUrl = resolveCopyableBrowserTabUrl({ url: state?.url ?? address });
  const applyState = (next: BrowserViewState) => {
    const stateTabId = next.tabId || activeTabIdRef.current;
    if (stateTabId === activeTabIdRef.current) {
      setState(next);
      setError(next.lastError);
      if (next.url) setAddress(next.url);
      if (isBlankBrowserTabUrl(next)) props.onTitleChange?.("Browser");
      else if (next.title) props.onTitleChange?.(next.title);
    }
    setTabs((current) =>
      current.map((tab) =>
        tab.id === stateTabId
          ? {
              ...tab,
              faviconUrl: next.faviconUrl || tab.faviconUrl,
              title: isBlankBrowserTabUrl(next) ? "Browser" : next.title || tab.title,
              url: next.url || tab.url,
            }
          : tab,
      ),
    );
    if (next.url && next.url !== BROWSER_BLANK_URL) {
      setRecentHistory((current) =>
        upsertBrowserHistory(current, {
          tabId: stateTabId,
          title: next.title || next.url,
          url: next.url,
        }),
      );
    }
  };
  const showCopyStatus = (message: string) => {
    const version = ++copyFeedbackVersionRef.current;
    setCopyStatus(message);
    void sleepOnHost(1_600).then(() => {
      if (copyFeedbackVersionRef.current === version) setCopyStatus(null);
    });
  };
  const cancelTabSuspend = (tabId: string) => {
    suspendVersionByTabIdRef.current.set(
      tabId,
      (suspendVersionByTabIdRef.current.get(tabId) ?? 0) + 1,
    );
    if (warmInactiveTabIdRef.current === tabId) {
      warmInactiveTabIdRef.current = null;
    }
  };
  const suspendHostTab = async (tabId: string) => {
    "background only";
    cancelTabSuspend(tabId);
    if (!hostTabIdsRef.current.has(tabId)) return;
    await browserView.closeTab(tabId);
    hostTabIdsRef.current.delete(tabId);
  };
  const scheduleInactiveTabSuspend = (tabId: string) => {
    "background only";
    if (!hostTabIdsRef.current.has(tabId)) return;
    const previousWarmTabId = warmInactiveTabIdRef.current;
    if (previousWarmTabId && previousWarmTabId !== tabId) {
      void suspendHostTab(previousWarmTabId);
    }
    warmInactiveTabIdRef.current = tabId;
    const version = (suspendVersionByTabIdRef.current.get(tabId) ?? 0) + 1;
    suspendVersionByTabIdRef.current.set(tabId, version);
    void sleepOnHost(INACTIVE_TAB_SUSPEND_DELAY_MS).then(async () => {
      if (
        disposedRef.current ||
        suspendVersionByTabIdRef.current.get(tabId) !== version ||
        activeTabIdRef.current === tabId
      )
        return;
      await suspendHostTab(tabId);
    });
  };
  const cancelBrowserSuspend = () => {
    browserSuspendVersionRef.current += 1;
  };
  const scheduleBrowserSuspend = () => {
    "background only";
    const version = ++browserSuspendVersionRef.current;
    void sleepOnHost(INACTIVE_BROWSER_SUSPEND_DELAY_MS).then(async () => {
      if (disposedRef.current || browserSuspendVersionRef.current !== version) return;
      await browserView.destroy();
      attachedRef.current = false;
      attachPromiseRef.current = null;
      hostTabIdsRef.current.clear();
      warmInactiveTabIdRef.current = null;
      suspendVersionByTabIdRef.current.clear();
      if (!disposedRef.current && activeRef.current) {
        void syncBounds().catch((cause) => setError(String(cause)));
      }
    });
  };

  const syncBounds = async () => {
    "background only";
    if (!props.active || !props.supported || !paneRef.current || !contentRef.current) return;
    const [paneRect, contentRect] = await Promise.all([
      getRectByRef(paneRef, true),
      getRectByRef(contentRef, true),
    ]);
    // The empty content slot can briefly report the pane's top during a cold
    // restore. Never let a host-owned WKWebView cover the two 40px Lynx chrome
    // rows while a later layout pass catches up.
    const bounds = resolveBrowserViewBounds(paneRect, contentRect, BROWSER_CHROME_HEIGHT_PX);
    if (!bounds) return;
    if (!attachedRef.current) {
      attachPromiseRef.current ??= browserView
        .attach(bounds, activeTabId, address)
        .then((result) => {
          attachedRef.current = result.ok;
          if (result.ok) hostTabIdsRef.current.add(activeTabId);
          return result.ok;
        })
        .finally(() => {
          attachPromiseRef.current = null;
        });
      await attachPromiseRef.current;
    } else {
      await browserView.setBounds(bounds);
    }
    await browserView.setVisible(showNativeView);
  };

  useEffect(() => {
    return browserView.onStateChange(applyState);
  }, []);
  useEffect(() => {
    if (nativeAddressRef.current === displayedAddress) return;
    nativeAddressRef.current = displayedAddress;
    try {
      addressRef.current
        ?.invoke({ method: "setValue", params: { value: displayedAddress } })
        .exec();
    } catch {
      // The address field can unmount while its Native update is queued.
    }
  }, [displayedAddress]);
  useEffect(() => {
    return browserView.onCopyLink(() => showCopyStatus(BROWSER_COPY_LINK_TOAST_TITLE));
  }, []);
  useEffect(() => {
    return browserView.onOpenWindow((request) => {
      const kind = classifyBrowserWindowOpen({
        url: request.url,
        frameName: request.frameName,
        features: request.hasFeatures ? "native-window-features" : "",
        disposition: "new-window",
      });
      if (kind === "popup") {
        showCopyStatus("This sign-in popup requires the CEF browser backend.");
        return;
      }
      void createTab(request.url);
    });
  }, []);
  useEffect(() => {
    "background only";
    if (props.active && props.supported) {
      cancelBrowserSuspend();
      void syncBounds().catch((cause) => setError(String(cause)));
    } else if (attachedRef.current) {
      void browserView.setVisible(false);
      scheduleBrowserSuspend();
    }
    return () => {
      if (attachedRef.current) void browserView.setVisible(false);
    };
  }, [props.active, showNativeView]);
  useEffect(() => {
    if (tabsStateThreadId === props.threadId) return;
    const restored = readBrowserTabsState(props.threadId);
    activeTabIdRef.current = restored.activeTabId;
    nextTabIdRef.current = restored.tabs.length + 1;
    setTabs(restored.tabs);
    setRecentHistory(restored.recentHistory);
    setActiveTabId(restored.activeTabId);
    setAddress(
      restored.tabs.find((tab) => tab.id === restored.activeTabId)?.url ?? INITIAL_BROWSER_URL,
    );
    setState(null);
    setError(null);
    setTabsStateThreadId(props.threadId);
  }, [props.threadId, tabsStateThreadId]);
  useEffect(() => {
    if (!props.threadId || tabsStateThreadId !== props.threadId) return;
    storeBrowserTabsState(props.threadId, { activeTabId, recentHistory, tabs });
  }, [activeTabId, props.threadId, recentHistory, tabs, tabsStateThreadId]);
  useEffect(() => {
    return () => {
      "background only";
      disposedRef.current = true;
      cancelBrowserSuspend();
      suspendVersionByTabIdRef.current.clear();
      warmInactiveTabIdRef.current = null;
      hostTabIdsRef.current.clear();
      attachedRef.current = false;
      attachPromiseRef.current = null;
      void browserView.destroy();
    };
  }, []);

  const navigate = async () => {
    "background only";
    const url = normalizeBrowserUrlInput(address);
    setAddress(url);
    setError(null);
    if (!attachedRef.current) await syncBounds();
    const result = await browserView.navigate(url);
    if (!result.ok) setError("Could not open this address.");
  };
  const chooseAddressSuggestion = async (suggestion: BrowserAddressSuggestion) => {
    "background only";
    setAddressFocused(false);
    if (suggestion.kind === "tab" && suggestion.tabId) {
      const tab = tabs.find((candidate) => candidate.id === suggestion.tabId);
      if (tab) await selectTab(tab);
      return;
    }
    setAddress(suggestion.url);
    setError(null);
    if (!attachedRef.current) await syncBounds();
    const result = await browserView.navigate(suggestion.url);
    if (!result.ok) setError("Could not open this address.");
  };
  const navigateToLocalServer = async (url: string) => {
    "background only";
    setAddress(url);
    setError(null);
    if (!attachedRef.current) await syncBounds();
    const result = await browserView.navigate(url);
    if (!result.ok) setError("Could not open this address.");
  };
  const copyLink = async () => {
    "background only";
    if (!copyableUrl) return;
    const { clipboard } = await import(/* webpackMode: "eager" */ "../platform/clipboard");
    await clipboard.writeText(copyableUrl);
    showCopyStatus(BROWSER_COPY_LINK_TOAST_TITLE);
  };
  const copyScreenshot = async () => {
    "background only";
    const result = await browserView.copyScreenshotToClipboard();
    showCopyStatus(result.ok ? "Browser screenshot copied" : "Could not copy screenshot.");
  };
  const createTab = async (url = BROWSER_BLANK_URL) => {
    "background only";
    const previousActiveTabId = activeTabIdRef.current;
    let tabId = `browser-tab-${nextTabIdRef.current++}`;
    while (tabs.some((tab) => tab.id === tabId)) {
      tabId = `browser-tab-${nextTabIdRef.current++}`;
    }
    const result = await browserView.newTab(tabId, url);
    if (!result.ok) {
      setError("Could not create a new browser tab.");
      return;
    }
    hostTabIdsRef.current.add(tabId);
    setTabs((current) => [...current, { id: tabId, faviconUrl: "", title: "Untitled", url }]);
    activeTabIdRef.current = tabId;
    cancelTabSuspend(tabId);
    setActiveTabId(tabId);
    setAddress(url);
    applyState(await browserView.getState());
    scheduleInactiveTabSuspend(previousActiveTabId);
  };
  const selectTab = async (tab: NativeBrowserTab) => {
    "background only";
    if (tab.id === activeTabId) return;
    const previousActiveTabId = activeTabIdRef.current;
    const result = hostTabIdsRef.current.has(tab.id)
      ? await browserView.selectTab(tab.id)
      : await browserView.newTab(tab.id, tab.url);
    if (!result.ok) return;
    hostTabIdsRef.current.add(tab.id);
    activeTabIdRef.current = tab.id;
    cancelTabSuspend(tab.id);
    setActiveTabId(tab.id);
    setAddress(tab.url);
    applyState(await browserView.getState());
    scheduleInactiveTabSuspend(previousActiveTabId);
  };
  const closeTab = async (tabId: string) => {
    "background only";
    const index = tabs.findIndex((tab) => tab.id === tabId);
    if (index < 0) return;
    await browserView.closeTab(tabId);
    hostTabIdsRef.current.delete(tabId);
    cancelTabSuspend(tabId);
    const remaining = tabs.filter((tab) => tab.id !== tabId);
    if (remaining.length === 0) {
      props.onClose?.();
      return;
    }
    setTabs(remaining);
    if (tabId !== activeTabId) return;
    const fallback = remaining[Math.min(index, remaining.length - 1)]!;
    if (hostTabIdsRef.current.has(fallback.id)) {
      await browserView.selectTab(fallback.id);
    } else {
      await browserView.newTab(fallback.id, fallback.url);
      hostTabIdsRef.current.add(fallback.id);
    }
    activeTabIdRef.current = fallback.id;
    cancelTabSuspend(fallback.id);
    setActiveTabId(fallback.id);
    setAddress(fallback.url);
    applyState(await browserView.getState());
  };
  if (!props.supported) {
    return (
      <view className="BrowserDockPane">
        <text className="BrowserDockState">
          The embedded browser is unavailable on this platform.
        </text>
      </view>
    );
  }
  return (
    <view
      ref={paneRef}
      flatten={false}
      className={`BrowserDockPane${props.active ? "" : " BrowserDockPane--hidden"}`}
      // Inactive browser panes stay mounted over the dock; refuse touch while hidden.
      user-interaction-enabled={props.active}
    >
      <view className="BrowserDockToolbar chat-surface-divider">
        <Button
          aria-label="Go back"
          disabled={!state?.canGoBack}
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void browserView.goBack();
          }}
        >
          <ArrowLeftIcon color={primaryIconColor} size={14} />
        </Button>
        <Button
          aria-label="Go forward"
          disabled={!state?.canGoForward}
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void browserView.goForward();
          }}
        >
          <ArrowRightIcon color={primaryIconColor} size={14} />
        </Button>
        <Button
          aria-label="Reload page"
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void browserView.reload();
          }}
        >
          <RefreshCwIcon
            className={state?.isLoading ? "BrowserDockRefreshIcon--loading" : undefined}
            color={primaryIconColor}
            size={14}
          />
        </Button>
        <textarea
          ref={addressRef}
          className="BrowserDockAddress"
          aria-label="Browser address"
          accessibility-element={true}
          accessibility-label="Browser address"
          focusable={true}
          placeholder="Search or enter a URL"
          default-value={displayedAddress}
          maxlength={2048}
          maxlines={1}
          confirm-type="search"
          bindinput={(event) => {
            "background only";
            const nextValue = event.detail.value;
            if (nativeAddressRef.current !== nextValue) {
              setAddressFocused(true);
            }
            nativeAddressRef.current = nextValue;
            setAddress(nextValue);
          }}
          bindfocus={() => setAddressFocused(true)}
          bindblur={() => {
            "background only";
            void sleepOnHost(120).then(() => setAddressFocused(false));
          }}
          bindconfirm={() => {
            "background only";
            setAddressFocused(false);
            void navigate();
          }}
        />
        <Button
          aria-label="Copy screenshot"
          disabled={!copyableUrl}
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void copyScreenshot().catch(() => showCopyStatus("Could not copy screenshot."));
          }}
        >
          <CameraIcon color={primaryIconColor} size={14} />
        </Button>
        <Button
          aria-label="Copy link"
          disabled={!copyableUrl}
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void copyLink().catch(() => showCopyStatus("Could not copy link."));
          }}
        >
          <svg
            className="BrowserDockToolbarIcon"
            content={colorizeLynxSvg(linkSvg, primaryIconColor)}
          />
        </Button>
        <Menu open={actionsOpen} onOpenChange={setActionsOpen}>
          <MenuTrigger ariaLabel="Browser actions" className="BrowserDockActionTrigger">
            <EllipsisIcon color={primaryIconColor} size={14} />
          </MenuTrigger>
          <MenuPopup align="end" side="bottom" className="BrowserDockActionsPopup">
            <MenuItem onClick={() => void createTab()}>
              <PlusIcon color={secondaryIconColor} size={14} />
              <text>New tab</text>
            </MenuItem>
            <MenuItem
              disabled={!copyableUrl}
              onClick={() => {
                "background only";
                void copyScreenshot().catch(() => showCopyStatus("Could not copy screenshot."));
              }}
            >
              <CameraIcon color={secondaryIconColor} size={14} />
              <text>Capture screenshot</text>
            </MenuItem>
            <MenuItem
              disabled={!copyableUrl}
              onClick={() => {
                "background only";
                if (!copyableUrl) return;
                void platformWindow.openExternal(copyableUrl).then((opened) => {
                  if (!opened) showCopyStatus("Could not open externally.");
                });
              }}
            >
              <ExternalLinkIcon color={secondaryIconColor} size={14} />
              <text>Open externally</text>
            </MenuItem>
            <MenuSeparator />
            <MenuItem onClick={() => props.onClose?.()}>
              <XIcon color={secondaryIconColor} size={14} />
              <text>Close browser panel</text>
            </MenuItem>
          </MenuPopup>
        </Menu>
      </view>
      {suggestionsOpen ? (
        <view className="BrowserDockAddressSuggestions">
          {addressSuggestions.map((suggestion) => (
            <Button
              key={suggestion.id}
              className="BrowserDockAddressSuggestion"
              variant="ghost"
              aria-label={`${suggestion.title} ${suggestion.detail}`}
              onClick={() => {
                "background only";
                void chooseAddressSuggestion(suggestion);
              }}
            >
              <view className="BrowserDockAddressSuggestionIcon">
                {suggestion.kind === "navigate" ? (
                  <ExternalLinkIcon color={secondaryIconColor} size={12} />
                ) : suggestion.faviconUrl ? (
                  <image src={suggestion.faviconUrl} />
                ) : (
                  <GlobeIcon color={secondaryIconColor} size={12} />
                )}
              </view>
              <view className="BrowserDockAddressSuggestionCopy">
                <text className="BrowserDockAddressSuggestionTitle">{suggestion.title}</text>
                <text className="BrowserDockAddressSuggestionDetail">{suggestion.detail}</text>
              </view>
            </Button>
          ))}
        </view>
      ) : null}
      <view className="BrowserDockTabBar">
        <scroll-view className="BrowserDockTabScroller" scroll-orientation="horizontal">
          <view className="BrowserDockTabList">
            {tabs.map((tab) => (
              <view
                className={`BrowserDockTab${tab.id === activeTabId ? " BrowserDockTab--active" : ""}`}
                key={tab.id}
              >
                <view
                  className="BrowserDockTabSelect"
                  bindtap={() => {
                    "background only";
                    void selectTab(tab);
                  }}
                >
                  {tab.faviconUrl ? (
                    <image className="BrowserDockTabFavicon" src={tab.faviconUrl} />
                  ) : (
                    <GlobeIcon
                      color={tab.id === activeTabId ? primaryIconColor : secondaryIconColor}
                      size={12}
                    />
                  )}
                  <text className="BrowserDockTabLabel">{tab.title || "Untitled"}</text>
                </view>
                <Button
                  aria-label={`Close ${tab.title || "Untitled"}`}
                  size="icon-xs"
                  variant="ghost"
                  onClick={() => {
                    "background only";
                    void closeTab(tab.id);
                  }}
                >
                  <XIcon color={secondaryIconColor} size={12} />
                </Button>
              </view>
            ))}
          </view>
        </scroll-view>
        <Button
          aria-label="New tab"
          size="icon-xs"
          variant="ghost"
          onClick={() => {
            "background only";
            void createTab();
          }}
        >
          <PlusIcon color={primaryIconColor} size={13} />
        </Button>
      </view>
      {copyStatus ? <text className="BrowserDockStatus">{copyStatus}</text> : null}
      {error ? <text className="BrowserDockError">{error}</text> : null}
      {showLocalServersHome ? (
        <view className="BrowserDockHome BrowserDockHome--withTabs">
          <view className="BrowserDockHomeHeader">
            <text className="BrowserDockHomeTitle">Local</text>
            <Button
              aria-label="Refresh local servers"
              disabled={localServersQuery.isFetching}
              size="icon-xs"
              variant="ghost"
              onClick={() => {
                "background only";
                void localServersQuery.refetch();
              }}
            >
              <RefreshCwIcon
                className={
                  localServersQuery.isFetching ? "BrowserDockRefreshIcon--loading" : undefined
                }
                color="rgba(255, 255, 255, 0.35)"
                size={14}
              />
            </Button>
          </view>
          {localServersQuery.isPending ? (
            <view className="BrowserDockHomeEmpty">
              <RefreshCwIcon
                className="BrowserDockHomeEmptyIcon BrowserDockRefreshIcon--loading"
                color="rgba(255, 255, 255, 0.2)"
                size={42}
              />
              <text className="BrowserDockHomeEmptyTitle">Scanning local servers</text>
              <text className="BrowserDockHomeEmptyDetail">Checking localhost ports</text>
            </view>
          ) : localServers.length === 0 ? (
            <view className="BrowserDockHomeEmpty">
              <GlobeIcon
                className="BrowserDockHomeEmptyIcon"
                color="rgba(255, 255, 255, 0.3)"
                size={52}
                strokeWidth={1.5}
              />
              <text className="BrowserDockHomeEmptyTitle">No local servers</text>
              <text className="BrowserDockHomeEmptyDetail">Try another browser URL</text>
            </view>
          ) : (
            <scroll-view className="BrowserDockServerList" scroll-orientation="vertical">
              {localServers.map((server) => {
                const url = browserLocalServerUrl(server);
                return (
                  <view
                    className={`BrowserDockServerCard${url ? "" : " BrowserDockServerCard--disabled"}`}
                    key={server.id}
                    bindtap={() => {
                      "background only";
                      if (url) void navigateToLocalServer(url);
                    }}
                  >
                    <view className="BrowserDockServerThumbnail">
                      <view className="BrowserDockServerTrafficLights">
                        <view className="BrowserDockServerLight BrowserDockServerLight--red" />
                        <view className="BrowserDockServerLight BrowserDockServerLight--yellow" />
                        <view className="BrowserDockServerLight BrowserDockServerLight--green" />
                      </view>
                      <text className="BrowserDockServerThumbnailTitle">
                        {localServerPrimaryLabel(server)}
                      </text>
                      <text className="BrowserDockServerThumbnailAddress">
                        {localServerAddressLabel(server)}
                      </text>
                    </view>
                    <view className="BrowserDockServerIdentity">
                      <text className="BrowserDockServerTitle">
                        {localServerPrimaryLabel(server)}
                      </text>
                      <text className="BrowserDockServerDetail">
                        {localServerAddressLabel(server)}
                        {localServerFolderLabel(server)
                          ? ` · ${localServerFolderLabel(server)}`
                          : ""}
                      </text>
                    </view>
                    <view className="BrowserDockServerOnline" />
                  </view>
                );
              })}
            </scroll-view>
          )}
        </view>
      ) : null}
      <view
        ref={contentRef}
        flatten={false}
        className="BrowserDockContentSlot"
        bindlayoutchange={() => {
          "background only";
          void syncBounds();
        }}
      />
    </view>
  );
}
