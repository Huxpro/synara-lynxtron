import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import type { RightDockPane } from "@synara/shared/rightDock";
import { readFileSync } from "node:fs";

import { ThreadRightDockTabs } from "./ThreadRightDockTabs.lynx";

const panes: readonly RightDockPane[] = [
  {
    id: "diff",
    kind: "diff",
    threadId: null,
    diffTurnId: null,
    diffFilePath: null,
    filePath: null,
    pullRequestProjectId: null,
    pullRequestRepository: null,
    pullRequestNumber: null,
    pullRequestInitialTab: null,
  },
  {
    id: "file:src/example.js",
    kind: "file",
    threadId: null,
    diffTurnId: null,
    diffFilePath: null,
    filePath: "src/example.js",
    pullRequestProjectId: null,
    pullRequestRepository: null,
    pullRequestNumber: null,
    pullRequestInitialTab: null,
  },
];

const terminalPane: RightDockPane = {
  id: "terminal",
  kind: "terminal",
  threadId: null,
  diffTurnId: null,
  diffFilePath: null,
  filePath: null,
  pullRequestProjectId: null,
  pullRequestRepository: null,
  pullRequestNumber: null,
  pullRequestInitialTab: null,
};

const sidechatPane: RightDockPane = {
  ...terminalPane,
  id: "sidechat:thread-2",
  kind: "sidechat",
  threadId: "thread-2" as never,
};

describe("Lynx thread right dock tabs", () => {
  it("reserves intrinsic label width instead of collapsing tabs to icon-only chips", () => {
    const sharedStyles = readFileSync(new URL("./editor-surface-tab.css", import.meta.url), "utf8");
    const dockStyles = readFileSync(
      new URL("./thread-right-dock-tabs.css", import.meta.url),
      "utf8",
    );
    expect(sharedStyles).toMatch(/\.EditorSurfaceTabLabel\s*\{[^}]*flex-shrink:\s*1;/s);
    expect(sharedStyles).not.toMatch(/\.EditorSurfaceTabLabel\s*\{[^}]*flex:\s*1;/s);
    expect(dockStyles).toMatch(/\.ThreadRightDockTab\s*\{[^}]*min-width:\s*68px;/s);
    expect(dockStyles).toMatch(
      /\.ThreadRightDockTabHeader\s*\{[^}]*height:\s*46px;[^}]*border-bottom-width:\s*1px;[^}]*border-bottom-style:\s*solid;[^}]*border-bottom-color:\s*var\(--border\);/s,
    );
    expect(sharedStyles).toMatch(
      /\.EditorSurfaceTabRestingIcon\s*\{[^}]*color:\s*var\(--color-icon-secondary\);/s,
    );
    expect(dockStyles).toMatch(
      /\.ThreadRightDockHeaderButton,[\s\S]*?color:\s*var\(--color-icon-secondary\);/s,
    );
    expect(dockStyles).not.toMatch(
      /ThreadRightDockHeaderButton\.ui-hover[\s\S]{0,500}color:\s*var\(--foreground\)/s,
    );
    const source = readFileSync(new URL("./ThreadRightDockTabs.lynx.tsx", import.meta.url), "utf8");
    expect(source.match(/semanticIconColor\('secondary'\)/g)?.length).toBeGreaterThanOrEqual(5);
  });

  it("renders shared selectable tabs and closes without selecting the parent", async () => {
    const onClosePane = rs.fn();
    const onSelectPane = rs.fn();
    render(
      <ThreadRightDockTabs
        activePaneId="diff"
        panes={panes}
        onAddPane={rs.fn()}
        onClosePane={onClosePane}
        onCollapse={rs.fn()}
        onSelectPane={onSelectPane}
      />,
    );

    const tabs = elementTree.root?.querySelectorAll(".EditorSurfaceTab") ?? [];
    expect(tabs).toHaveLength(2);
    expect(tabs[0]?.textContent).toContain("Diff");
    expect(tabs[1]?.textContent).toContain("example.js");

    fireEvent(tabs[0]!, new Event("bindEvent:mouseenter", { bubbles: true }));
    await waitFor(() => expect(tabs[0]?.getAttribute("class")).toContain("ui-hover"));
    const closes = elementTree.root?.querySelectorAll(".EditorSurfaceTabClose") ?? [];
    closes[0]!.dispatchEvent(new CustomEvent("catchEvent:tap", { bubbles: true }));
    expect(onClosePane).toHaveBeenCalledWith("diff");
    expect(onSelectPane).not.toHaveBeenCalled();
  });

  it("uses the shared tab and add-menu lifecycle for Terminal", () => {
    const onAddPane = rs.fn();
    render(
      <ThreadRightDockTabs
        activePaneId="terminal"
        panes={[...panes, terminalPane]}
        onAddPane={onAddPane}
        onClosePane={rs.fn()}
        onCollapse={rs.fn()}
        onSelectPane={rs.fn()}
      />,
    );

    const tabs = elementTree.root?.querySelectorAll(".EditorSurfaceTab") ?? [];
    expect(tabs).toHaveLength(3);
    expect(tabs[2]?.textContent).toContain("Terminal");
    expect(tabs[2]?.querySelector(".ThreadRightDockTabIcon")).not.toBeNull();

    const source = readFileSync(new URL("./ThreadRightDockTabs.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("'terminal',");
    expect(source).toContain("terminalSvg");
  });

  it("can open the real add menu deterministically for Components Lab", () => {
    render(
      <ThreadRightDockTabs
        activePaneId="terminal"
        addMenuKinds={["diff", "browser"]}
        defaultAddMenuOpen
        panes={[terminalPane]}
        onAddPane={rs.fn()}
        onClosePane={rs.fn()}
        onCollapse={rs.fn()}
        onSelectPane={rs.fn()}
      />,
    );
    expect(elementTree.root?.textContent).toContain("Diff");
    expect(elementTree.root?.textContent).toContain("Browser");
  });

  it("renders persisted Side-chat panes with the shared tab primitive", () => {
    render(
      <ThreadRightDockTabs
        activePaneId={sidechatPane.id}
        panes={[sidechatPane]}
        onAddPane={rs.fn()}
        onClosePane={rs.fn()}
        onCollapse={rs.fn()}
        onSelectPane={rs.fn()}
      />,
    );
    expect(elementTree.root?.querySelector(".EditorSurfaceTab")?.textContent).toContain("Side");
  });

  it("renders Git in the shared Add panel and persisted tab strip", () => {
    const onAddPane = rs.fn();
    const gitPane: RightDockPane = {
      ...terminalPane,
      id: "git",
      kind: "git",
    };
    render(
      <ThreadRightDockTabs
        activePaneId="git"
        addMenuKinds={["diff", "git"]}
        defaultAddMenuOpen
        panes={[gitPane]}
        onAddPane={onAddPane}
        onClosePane={rs.fn()}
        onCollapse={rs.fn()}
        onSelectPane={rs.fn()}
      />,
    );
    expect(elementTree.root?.querySelector(".EditorSurfaceTab")?.textContent).toContain("Git");
    expect(elementTree.root?.textContent).toContain("Git");
    const gitMenuItem = Array.from(elementTree.root?.querySelectorAll(".LxMenuItem") ?? []).find(
      (item) => item.textContent.includes("Git"),
    );
    expect(gitMenuItem).toBeDefined();
    if (gitMenuItem) fireEvent.tap(gitMenuItem);
    expect(onAddPane).toHaveBeenCalledWith("git");
  });

  it("renders Browser in the shared Add panel and persisted tab strip", () => {
    const onAddPane = rs.fn();
    const browserPane: RightDockPane = {
      ...terminalPane,
      id: "browser",
      kind: "browser",
    };
    render(
      <ThreadRightDockTabs
        activePaneId="browser"
        addMenuKinds={["browser", "diff"]}
        defaultAddMenuOpen
        panes={[browserPane]}
        onAddPane={onAddPane}
        onClosePane={rs.fn()}
        onCollapse={rs.fn()}
        onSelectPane={rs.fn()}
      />,
    );
    expect(elementTree.root?.querySelector(".EditorSurfaceTab")?.textContent).toContain("Browser");
    expect(elementTree.root?.textContent).toContain("Browser");
    const browserMenuItem = Array.from(
      elementTree.root?.querySelectorAll(".LxMenuItem") ?? [],
    ).find((item) => item.textContent.includes("Browser"));
    expect(browserMenuItem).toBeDefined();
    if (browserMenuItem) fireEvent.tap(browserMenuItem);
    expect(onAddPane).toHaveBeenCalledWith("browser");
  });
});
