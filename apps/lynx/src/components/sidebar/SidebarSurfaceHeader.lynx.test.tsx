import { fireEvent, render, waitFor } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";

import { markProgrammaticLynxFocus } from "../ui/focus.lynx";
import { SidebarSurfaceHeader } from "./SidebarSurfaceHeader.lynx";

const SEARCH_ID = "synara-sidebar-search-trigger";

function renderHeader(overrides: Partial<Parameters<typeof SidebarSurfaceHeader>[0]> = {}) {
  const props = {
    views: ["threads", "studio"] as const,
    activeView: "threads" as const,
    onSelectView: rs.fn(),
    searchElementId: SEARCH_ID,
    searchOpen: false,
    onOpenSearch: rs.fn(),
    ...overrides,
  };
  render(<SidebarSurfaceHeader {...props} />);
  return props;
}

function query(selector: string): Element {
  const element = elementTree.root?.querySelector(selector);
  if (!element) throw new Error(`expected ${selector}`);
  return element;
}

describe("SidebarSurfaceHeader", () => {
  it("titles the picker with the active surface", () => {
    renderHeader({ activeView: "studio" });
    expect(query(".SidebarSurfacePickerTitle").textContent).toBe("Studio");
    expect(query(".SidebarSurfacePickerTrigger").getAttribute("aria-label")).toBe(
      "Switch sidebar surface",
    );
  });

  it("lists every surface with its description and switches on selection", async () => {
    const props = renderHeader();
    fireEvent.tap(query(".SidebarSurfacePickerTrigger"));
    const items = await waitFor(() => {
      const elements = elementTree.root?.querySelectorAll(".SidebarSurfacePickerItem") ?? [];
      if (elements.length !== 2) throw new Error("expected two surface entries");
      return elements;
    });
    expect(items[0]?.textContent).toContain("Synara");
    expect(items[0]?.textContent).toContain("Build, debug, and ship");
    expect(items[0]?.getAttribute("aria-checked")).toBe("true");
    expect(items[0]?.getAttribute("class")).toContain("SidebarSurfacePickerItem--checked");
    expect(items[1]?.textContent).toContain("Open-ended agent work");

    fireEvent.tap(items[1]!);
    expect(props.onSelectView).toHaveBeenCalledWith("studio");
  });

  it("opens search without forwarding the tap event as a query", () => {
    const props = renderHeader();
    fireEvent.tap(query(".SidebarHeaderIconButton"));
    expect(props.onOpenSearch).toHaveBeenCalledWith();
  });

  it("anchors palette focus return on the search button without painting a ring", () => {
    renderHeader({ searchOpen: true });
    const search = query(`#${SEARCH_ID}`);
    expect(search.getAttribute("accessibility-value")).toBe("Expanded");

    markProgrammaticLynxFocus(SEARCH_ID);
    fireEvent.focus(search);
    expect(search.getAttribute("class")).not.toContain("ui-focus");

    fireEvent.blur(search);
    fireEvent.focus(search);
    expect(search.getAttribute("class")).toContain("ui-focus");
  });

  it("toggles the Activity view from the bell and marks unread work", () => {
    const onToggle = rs.fn();
    renderHeader({ activity: { active: false, showUnreadDot: true, onToggle } });
    const bell = query(".SidebarActivityBell");
    expect(bell.getAttribute("aria-label")).toBe("Switch to activity view");
    expect(elementTree.root?.querySelector(".SidebarActivityBellDot")).not.toBeNull();
    fireEvent.tap(bell);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  it("omits the bell when the surface has no Activity view", () => {
    renderHeader();
    expect(elementTree.root?.querySelector(".SidebarActivityBell")).toBeNull();
  });
});
