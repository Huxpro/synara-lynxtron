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
