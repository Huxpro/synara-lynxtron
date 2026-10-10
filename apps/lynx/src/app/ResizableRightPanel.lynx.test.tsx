import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { beforeEach, describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { ResizableRightPanel } from "./ResizableRightPanel.lynx";
import { webStorage } from "../platform/storage";

let viewportWidth = 1280;

describe("Lynx resizable right panels", () => {
  beforeEach(() => {
    viewportWidth = 1280;
    Object.defineProperty(globalThis, "NativeModules", {
      configurable: true,
      value: {
        bridge: {
          call: (
            method: string,
            _params: Record<string, unknown>,
            callback: (reply: string) => void,
          ) =>
            callback(
              JSON.stringify(
                method === "windowGetViewport"
                  ? { width: viewportWidth, height: 820 }
                  : method === "storageDump"
                    ? { entries: {} }
                    : { ok: true },
              ),
            ),
        },
      },
    });
    webStorage.clear();
  });

  it("drags from the left edge and persists a consumer-owned width", async () => {
    render(
      <ResizableRightPanel
        availableWidth={1280}
        className="PanelProbe"
        defaultWidth={640}
        maxWidth={720}
        minimumMainWidth={320}
        minWidth={320}
        resizable
        storageKey="panel_probe_width"
      >
        <view className="PanelContent" />
      </ResizableRightPanel>,
    );

    const panel = elementTree.root?.querySelector(".PanelProbe");
    const sash = elementTree.root?.querySelector(".RightPanelResizeSash");
    expect(panel?.getAttribute("style")).toContain("width: 640px");
    fireEvent(
      sash!,
      new CustomEvent("bindEvent:mousedown", {
        bubbles: true,
        detail: { button: 0, buttons: 1, clientX: 640 },
      }),
    );
    const overlay = await waitFor(() => {
      const current = elementTree.root?.querySelector(".RightPanelResizeOverlay");
      expect(current).not.toBeNull();
      return current!;
    });
    fireEvent(
      overlay,
      new CustomEvent("bindEvent:mousemove", {
        bubbles: true,
        detail: { buttons: 1, clientX: 560 },
      }),
    );
    await waitFor(() => expect(panel?.getAttribute("style")).toContain("width: 720px"));
    fireEvent(overlay, new CustomEvent("bindEvent:mouseup", { bubbles: true }));
    await waitFor(() =>
      expect(elementTree.root?.querySelector(".RightPanelResizeOverlay")).toBeNull(),
    );
    expect(webStorage.getItem("panel_probe_width")).toBe("720");
  });

  it("wires the diff dock; Code review resizes its list column on the same session logic", () => {
    const diffSource = readFileSync(new URL("./DiffDock.lynx.tsx", import.meta.url), "utf8");
    const inboxSource = readFileSync(
      new URL("./GitHubInboxPage.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(new URL("./github-inbox.css", import.meta.url), "utf8");

    expect(diffSource).toContain("<ResizableRightPanel");
    expect(diffSource).toContain("maxWidth={720}");
    expect(diffSource).not.toContain('storageKey="chat_right_panel_width:working-tree"');
    // Upstream's inbox resizes the list (left) column and never persists its width.
    expect(inboxSource).toContain("createLynxSidebarResizeSession({");
    expect(inboxSource).toContain("minWidth: LIST_MIN_WIDTH,");
    expect(inboxSource).toContain("minimumContentWidth: DETAIL_MIN_WIDTH,");
    expect(inboxSource).not.toContain("storageKey");
    expect(styles).toMatch(
      /\.SliceRoot--viewport-compact \.GitHubInboxBody--detail-open \.GitHubInboxDetail\s*\{[^}]*display:\s*flex;/s,
    );
  });

  it("clears parent layout width when a viewport breakpoint disables resizing", async () => {
    const widths: number[] = [];
    const onWidthChange = (width: number) => widths.push(width);
    const { rerender } = render(
      <ResizableRightPanel
        availableWidth={1280}
        className="PanelProbe"
        defaultWidth={640}
        minimumMainWidth={320}
        minWidth={320}
        onWidthChange={onWidthChange}
        resizable
      >
        <view className="PanelContent" />
      </ResizableRightPanel>,
    );

    await waitFor(() => expect(widths.at(-1)).toBe(640));
    viewportWidth = 700;
    rerender(
      <ResizableRightPanel
        key="compact"
        availableWidth={700}
        className="PanelProbe"
        defaultWidth={350}
        minimumMainWidth={320}
        minWidth={320}
        onWidthChange={onWidthChange}
        resizable
      >
        <view className="PanelContent" />
      </ResizableRightPanel>,
    );
    await waitFor(() => expect(widths.at(-1)).toBe(0));
  });
});
