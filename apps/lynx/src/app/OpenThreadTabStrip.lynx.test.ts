import { readFileSync } from "node:fs";

import { describe, expect, it } from "@rstest/core";
import type { ThreadId } from "@synara/contracts";

const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
const source = read("./OpenThreadTabStrip.lynx.tsx");
const upstream = read("../../../web/src/components/chat/OpenThreadTabStrip.tsx");

/** The exported table and resolver, evaluated without the component's Lynx imports. */
async function menuLogic() {
  const { resolveOpenThreadTabsInCloseScope } = await import("@synara-web/openThreadTabs.logic");
  const rows = Array.from(
    source.matchAll(/\{ scope: "(left|right|others)", label: "([^"]+)" \}/g),
    ([, scope, label]) => ({ scope: scope as "left" | "right" | "others", label: label! }),
  );
  return (tabs: readonly { threadId: ThreadId }[], anchor: ThreadId) =>
    rows
      .filter((row) => resolveOpenThreadTabsInCloseScope(tabs, anchor, row.scope).length > 0)
      .map((row) => row.label);
}

const tabs = ["a", "b", "c"].map((threadId) => ({ threadId: threadId as ThreadId }));

describe("open thread tab shortcuts, reorder and thread actions", () => {
  it("steps through the strip with upstream's commands and wrap-around", () => {
    expect(upstream).toContain(
      'if (command !== "threadTab.next" && command !== "threadTab.previous") return;',
    );
    expect(source).toContain('useKeybindingCommand("threadTab.next", () => stepTab("forward"));');
    expect(source).toContain(
      'useKeybindingCommand("threadTab.previous", () => stepTab("backward"));',
    );
    expect(source).toContain("const nextThreadId = getNextVisibleSidebarThreadId({");
  });

  it("reorders through upstream's store action", () => {
    expect(upstream).toContain("onMove={moveThreadTab}");
    expect(source).toContain(
      "const moveThreadTab = useOpenThreadTabsStore((state) => state.moveThreadTab);",
    );
    expect(source).toContain("if (result.overKey) moveThreadTab(session.key, result.overKey);");
    // Slots are resolved against the store's order, not the last render's: the host
    // reports one pointer move as two events, and the second must see the first's move.
    expect(source).toContain("keys: readTabOrder(),");
    expect(source).toContain(
      "return useOpenThreadTabsStore.getState().threadIds.filter((threadId) => shown.has(threadId));",
    );
  });

  it("opens the sidebar's thread menu with the close rows, and falls back to them", () => {
    expect(upstream).toContain("showThreadContextMenu(tab.threadId, position, {");
    expect(source).toContain("showThreadContextMenu(tab.threadId, position, {");
    expect(source).toContain("extraItems: closeItems,");
    expect(source).toContain("const itemId = await showContextMenu(closeItems, position);");
    const sidebar = read("../components/sidebar/Sidebar.lynx.tsx");
    expect(sidebar).toContain(
      "return registerThreadContextMenu(async (threadId, position, options) => {",
    );
    expect(sidebar).toContain("if (extraItems.some((item) => item.id === action)) {");
    // Upstream's ids and grouping for the close rows.
    expect(upstream).toContain('const CLOSE_TABS_MENU_ID_PREFIX = "close-tabs:";');
    expect(source).toContain('export const CLOSE_TABS_MENU_ID_PREFIX = "close-tabs:";');
    expect(source).toContain("separatorBefore: index === 0,");
  });
});

describe("open thread tab context menu", () => {
  it("lists upstream's rows, in upstream's order", () => {
    const table = /const CLOSE_TABS_MENU_ROWS[^=]*=\s*\[([\s\S]*?)\];/;
    const rows = (text: string) =>
      Array.from(
        (table.exec(text)?.[1] ?? "").matchAll(/scope: "(\w+)", label: "([^"]+)"/g),
        ([, scope, label]) => `${scope}:${label}`,
      );
    expect(rows(upstream)).toEqual([
      "left:Close Tabs to the Left",
      "right:Close Tabs to the Right",
      "others:Close Other Tabs",
    ]);
    expect(rows(source)).toEqual(rows(upstream));
  });

  it("offers only the scopes that have tabs in them", async () => {
    const labels = await menuLogic();
    expect(labels(tabs, "b" as ThreadId)).toEqual([
      "Close Tabs to the Left",
      "Close Tabs to the Right",
      "Close Other Tabs",
    ]);
    expect(labels(tabs, "a" as ThreadId)).toEqual(["Close Tabs to the Right", "Close Other Tabs"]);
    expect(labels(tabs, "c" as ThreadId)).toEqual(["Close Tabs to the Left", "Close Other Tabs"]);
    expect(labels([tabs[0]!], "a" as ThreadId)).toEqual([]);
  });

  it("closes through upstream's logic and store, one close at a time", () => {
    expect(source).toContain("return closeOpenThreadTabs({");
    expect(source).toContain("const [enqueueClose] = useState(createOpenThreadTabCloseQueue);");
    expect(source).toContain(
      "closeTabs: (threadIds) => pruneThreadTabs((threadId) => !threadIds.includes(threadId)),",
    );
    expect(source).toContain("keptThreadId: tab.threadId,");
    expect(source).toContain("if (scope) closeTabsInScope(tab, scope);");
    expect(source).toContain(
      "onContextMenu={(position) => void openTabContextMenu(tab, position)}",
    );
    // The shared tab primitive reports a secondary click the way sidebar rows do.
    const tab = read("./EditorSurfaceTab.lynx.tsx");
    expect(tab).toContain("const offset = resolveSecondaryPointerOffset(event);");
    expect(tab).toContain(
      "props.onContextMenu?.({ x: rect.left + offset.x, y: rect.top + offset.y });",
    );
  });
});
