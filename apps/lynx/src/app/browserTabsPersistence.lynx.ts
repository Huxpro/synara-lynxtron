import {
  BROWSER_BLANK_URL,
  type BrowserAddressHistoryEntry,
} from '@synara/shared/browserSession';

import { webStorage } from '../platform/storage';

export const BROWSER_TABS_STORAGE_KEY = 'synara:browser-tabs:v1';
const MAX_PERSISTED_TABS_PER_THREAD = 20;
const MAX_PERSISTED_HISTORY_PER_THREAD = 12;

export interface PersistedBrowserTab {
  readonly faviconUrl: string;
  readonly id: string;
  readonly title: string;
  readonly url: string;
}

export interface PersistedBrowserTabsState {
  readonly activeTabId: string;
  readonly recentHistory: readonly BrowserAddressHistoryEntry[];
  readonly tabs: readonly PersistedBrowserTab[];
}

function safeString(value: unknown, maximum: number): string {
  return typeof value === 'string' ? value.trim().slice(0, maximum) : '';
}

function safeBrowserUrl(value: unknown): string | null {
  const raw = safeString(value, 8_192);
  if (!raw) return null;
  if (raw === BROWSER_BLANK_URL) return raw;
  // The Lynx background runtime does not provide the Web URL constructor.
  // Persistence only needs to enforce the host browser's protocol allowlist;
  // the WKWebView validates the full URL when a restored tab is instantiated.
  return /^https?:\/\/[^\s]+$/i.test(raw) ? raw : null;
}

function readAll(): Record<string, PersistedBrowserTabsState> {
  const raw = webStorage.getItem(BROWSER_TABS_STORAGE_KEY);
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as {
      state?: { tabsByThreadId?: unknown };
    };
    const source = parsed.state?.tabsByThreadId;
    if (!source || typeof source !== 'object' || Array.isArray(source)) return {};
    const result: Record<string, PersistedBrowserTabsState> = {};
    for (const [threadId, value] of Object.entries(source)) {
      if (!value || typeof value !== 'object' || Array.isArray(value)) continue;
      const candidate = value as {
        activeTabId?: unknown;
        recentHistory?: unknown;
        tabs?: unknown;
      };
      if (!Array.isArray(candidate.tabs)) continue;
      const seen = new Set<string>();
      const tabs = candidate.tabs
        .slice(0, MAX_PERSISTED_TABS_PER_THREAD)
        .flatMap((entry): PersistedBrowserTab[] => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
          const tab = entry as Record<string, unknown>;
          const id = safeString(tab.id, 128);
          const url = safeBrowserUrl(tab.url);
          if (!id || !url || seen.has(id)) return [];
          seen.add(id);
          return [{
            id,
            url,
            title: safeString(tab.title, 200) || (url === BROWSER_BLANK_URL ? 'Browser' : url),
            faviconUrl: safeBrowserUrl(tab.faviconUrl) ?? '',
          }];
        });
      if (tabs.length === 0) continue;
      const requestedActive = safeString(candidate.activeTabId, 128);
      const seenHistoryUrls = new Set<string>();
      const recentHistory = (Array.isArray(candidate.recentHistory)
        ? candidate.recentHistory
        : []
      )
        .slice(0, MAX_PERSISTED_HISTORY_PER_THREAD)
        .flatMap((entry): BrowserAddressHistoryEntry[] => {
          if (!entry || typeof entry !== 'object' || Array.isArray(entry)) return [];
          const history = entry as Record<string, unknown>;
          const url = safeBrowserUrl(history.url);
          if (!url || url === BROWSER_BLANK_URL || seenHistoryUrls.has(url)) return [];
          seenHistoryUrls.add(url);
          return [{
            tabId: safeString(history.tabId, 128),
            title: safeString(history.title, 200) || url,
            url,
          }];
        });
      result[threadId] = {
        tabs,
        recentHistory,
        activeTabId: tabs.some((tab) => tab.id === requestedActive)
          ? requestedActive
          : tabs[0]!.id,
      };
    }
    return result;
  } catch {
    return {};
  }
}

export function readBrowserTabsState(threadId: string): PersistedBrowserTabsState {
  return readAll()[threadId] ?? {
    activeTabId: 'browser-tab-1',
    recentHistory: [],
    tabs: [{ id: 'browser-tab-1', faviconUrl: '', title: 'Browser', url: BROWSER_BLANK_URL }],
  };
}

export function storeBrowserTabsState(
  threadId: string,
  state: PersistedBrowserTabsState
): void {
  const tabsByThreadId = { ...readAll(), [threadId]: state };
  webStorage.setItem(
    BROWSER_TABS_STORAGE_KEY,
    JSON.stringify({ state: { tabsByThreadId }, version: 1 })
  );
}
