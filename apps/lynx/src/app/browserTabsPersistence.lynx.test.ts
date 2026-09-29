import { beforeEach, describe, expect, it, rs } from "@rstest/core";

import { webStorage } from "../platform/storage";
import {
  BROWSER_TABS_STORAGE_KEY,
  readBrowserTabsState,
  storeBrowserTabsState,
} from "./browserTabsPersistence.lynx";

describe("Native Browser tab persistence", () => {
  beforeEach(() => {
    rs.stubGlobal("NativeModules", {
      bridge: {
        call: (_name: string, _params: unknown, reply: (value: string) => void) => reply("{}"),
      },
    });
    webStorage.removeItem(BROWSER_TABS_STORAGE_KEY);
  });

  it("round-trips thread-scoped tab order and active identity", () => {
    const state = {
      activeTabId: "tab-2",
      recentHistory: [{ tabId: "tab-1", title: "Earlier", url: "https://earlier.example/" }],
      tabs: [
        { id: "tab-1", faviconUrl: "", title: "Example", url: "https://example.com/" },
        { id: "tab-2", faviconUrl: "", title: "Browser", url: "about:blank" },
      ],
    } as const;
    storeBrowserTabsState("thread-1", state);
    expect(readBrowserTabsState("thread-1")).toEqual(state);
    expect(readBrowserTabsState("thread-2").tabs).toHaveLength(1);
  });

  it("restores tabs without relying on the Web URL constructor", () => {
    rs.stubGlobal("URL", undefined);
    const state = {
      activeTabId: "tab-2",
      recentHistory: [],
      tabs: [
        { id: "tab-1", faviconUrl: "", title: "Example", url: "https://example.com/" },
        { id: "tab-2", faviconUrl: "", title: "Synara", url: "http://127.0.0.1:8891/" },
      ],
    } as const;
    storeBrowserTabsState("thread", state);
    expect(readBrowserTabsState("thread")).toEqual(state);
  });

  it("drops unsafe URLs, duplicate IDs, and invalid active IDs", () => {
    webStorage.setItem(
      BROWSER_TABS_STORAGE_KEY,
      JSON.stringify({
        state: {
          tabsByThreadId: {
            thread: {
              activeTabId: "missing",
              recentHistory: [
                { tabId: "old", title: "Older", url: "https://older.example/" },
                { tabId: "duplicate", title: "Duplicate", url: "https://older.example/" },
                { tabId: "unsafe", title: "Unsafe", url: "javascript:bad" },
              ],
              tabs: [
                {
                  id: "safe",
                  url: "https://example.com/",
                  title: "Example",
                  faviconUrl: "javascript:bad",
                },
                { id: "safe", url: "https://duplicate.test/" },
                { id: "unsafe", url: "file:///etc/passwd" },
              ],
            },
          },
        },
        version: 1,
      }),
    );
    expect(readBrowserTabsState("thread")).toEqual({
      activeTabId: "safe",
      recentHistory: [{ tabId: "old", title: "Older", url: "https://older.example/" }],
      tabs: [{ id: "safe", faviconUrl: "", title: "Example", url: "https://example.com/" }],
    });
  });
});
