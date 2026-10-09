import { fireEvent, render } from "@lynx-js/react/testing-library";
import { describe, expect, it, rs } from "@rstest/core";
import { readFileSync } from "node:fs";

import { SidebarPrimaryNavigationShortcutElement } from "./SidebarPrimaryNavigationElements.lynx";
import { SidebarPrimaryActionButtonElement } from "./SidebarPrimaryActionElements.lynx";
import { SidebarChatsSectionHeaderElement } from "./SidebarChatsSectionElements.lynx";
import { markProgrammaticLynxFocus } from "../components/ui/focus.lynx";

describe("sidebar primary navigation shortcut", () => {
  it("renders each shortcut part as a separate key pill", () => {
    render(<SidebarPrimaryNavigationShortcutElement parts={["⌘", "N"]} />);

    const shortcut = elementTree.root?.querySelector(".AppSidebarShortcut");
    expect(shortcut?.querySelectorAll(".AppSidebarShortcutKey")).toHaveLength(2);
    expect(shortcut?.textContent).toBe("⌘N");
  });

  it("matches the measured Web key geometry and typography", () => {
    const sidebarStyles = readFileSync(
      new URL("../components/sidebar/sidebar.css", import.meta.url),
      "utf8",
    );
    const sidebarSource = readFileSync(
      new URL("../components/sidebar/Sidebar.lynx.tsx", import.meta.url),
      "utf8",
    );
    const chatsSource = readFileSync(
      new URL("./SidebarChatsSectionElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const primaryActionStyles = readFileSync(
      new URL("./sidebar-primary-action-elements.css", import.meta.url),
      "utf8",
    );
    const sectionHeaderStyles = readFileSync(
      new URL("./sidebar-list-section-header-elements.css", import.meta.url),
      "utf8",
    );

    expect(sidebarStyles).toMatch(/\.AppSidebarShortcut\s*\{[^}]*height:\s*20px;[^}]*gap:\s*4px;/s);
    expect(sidebarStyles).toMatch(
      /\.AppSidebarShortcut\s*\{[^}]*opacity:\s*0;[^}]*transition:\s*opacity 150ms cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\);/s,
    );
    expect(sidebarStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton\.ui-hover \.AppSidebarShortcut,\s*\.SharedSidebarPrimaryActionButton\.ui-focus \.AppSidebarShortcut\s*\{[^}]*opacity:\s*1;/s,
    );
    expect(sidebarStyles).toMatch(/\.AppSidebarPrimaryNav\s*\{[^}]*padding:\s*4px 6px 6px;/s);
    expect(sidebarStyles).not.toMatch(/\.AppSidebarPrimaryNav\s*\{[^}]*margin-bottom:/s);
    expect(sidebarStyles).toMatch(/\.SharedSidebarProjectsRoot,[^{]*\{[^}]*padding:\s*6px;/s);
    expect(sidebarStyles).toMatch(
      /\.SharedSidebarProjectsState\s*\{[^}]*padding:\s*16px 8px 0;[^}]*font-size:\s*12px;[^}]*line-height:\s*18px;/s,
    );
    expect(sidebarStyles).toMatch(/\.SharedSidebarChatsRoot\s*\{[^}]*padding:\s*4px 6px 8px;/s);
    expect(sidebarStyles).toMatch(
      /\.SharedSidebarChatsHeaderButton\s*\{[^}]*padding-left:\s*8px;[^}]*padding-right:\s*8px;/s,
    );
    expect(sidebarStyles).toMatch(
      /\.SharedSidebarChatsChevron\s*\{[^}]*width:\s*14px;[^}]*height:\s*14px;[^}]*flex-shrink:\s*0;[^}]*margin-left:\s*4px;[^}]*opacity:\s*0\.79;/s,
    );
    expect(chatsSource).toContain("{present ? props.children : null}");
    expect(chatsSource).not.toContain("if (!present) return null");
    expect(sidebarStyles).not.toMatch(/\.AppSidebarPrimaryNav\s*\{[^}]*border-bottom:/s);
    expect(sidebarStyles).toMatch(/\.AppSidebarFooter\s*\{[^}]*padding:\s*8px;/s);
    expect(sidebarStyles).toMatch(
      /\.AppSidebarFooter \.SharedSidebarPrimaryActionItem\s*\{[^}]*margin-bottom:\s*0;/s,
    );
    expect(sidebarStyles).not.toMatch(/\.AppSidebarFooter\s*\{[^}]*border-top:/s);
    expect(sidebarStyles).not.toMatch(/\.AppSidebar\s*\{[^}]*border-right:/s);
    expect(sidebarStyles).toMatch(
      /\.AppSidebar\s*\{[^}]*background-color:\s*var\(--app-sidebar-surface, var\(--sidebar\)\);/s,
    );
    // The panel sits under upstream's top strip: the title row's `pt-1.5` above, the
    // footer's `p-2 pt-0` below, and no titlebar hairline of its own.
    expect(sidebarStyles).toMatch(/\.AppSidebar\s*\{[^}]*padding:\s*6px 0 8px;/s);
    expect(sidebarStyles).not.toMatch(/\.AppSidebar\s*\{[^}]*box-shadow:/s);
    expect(sidebarStyles).toMatch(
      /\.AppSidebarShortcutKey\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*4px;[^}]*background-color:\s*var\(--muted\);[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*font-weight:\s*500;/s,
    );
    expect(primaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton\.ui-focus\s*\{[^}]*outline:\s*none;[^}]*box-shadow:\s*inset 0 0 0 1px var\(--ring\);/s,
    );
    expect(primaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton\s*\{[^}]*border-radius:\s*8px;/s,
    );
    expect(primaryActionStyles).not.toContain("var(--radius-md)");
    expect(primaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton\.ui-pressed\s*\{[^}]*color:\s*var\(--sidebar-accent-foreground\);[^}]*background-color:\s*var\(--sidebar-accent-active\);/s,
    );
    expect(primaryActionStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton--active\s*\{[^}]*color:\s*var\(--sidebar-accent-foreground\);[^}]*background-color:\s*var\(--sidebar-accent-active\);/s,
    );
    expect(primaryActionStyles).not.toMatch(
      /\.SharedSidebarPrimaryActionButton\.ui-pressed\s*\{[^}]*opacity:/s,
    );
    expect(sectionHeaderStyles).toMatch(
      /\.SharedSidebarListSectionHeaderText\s*\{[^}]*font-size:\s*var\(--app-font-size-ui,\s*12px\);[^}]*line-height:\s*18px;[^}]*font-weight:\s*400;[^}]*opacity:\s*0\.58;/s,
    );
    expect(sidebarSource).toContain(
      "shortcutParts: splitShortcutLabel(LYNX_PRIMARY_SHORTCUT_LABELS.newThread),",
    );
  });

  it("reveals shortcut keys through the shared row hover and focus states", () => {
    render(
      <SidebarPrimaryActionButtonElement
        active={false}
        accessibleLabel="New thread"
        disabled={false}
        onActivate={rs.fn()}
      >
        <SidebarPrimaryNavigationShortcutElement parts={["⌘", "N"]} />
      </SidebarPrimaryActionButtonElement>,
    );

    const row = elementTree.root?.querySelector(".SharedSidebarPrimaryActionButton");
    if (!row) throw new Error("expected primary action row");

    fireEvent(row, new Event("bindEvent:mouseenter", { bubbles: true }));
    expect(row.getAttribute("class")).toContain("ui-hover");
    fireEvent.focus(row);
    expect(row.getAttribute("class")).toContain("ui-focus");
  });

  it("keeps programmatic palette-close focus without painting a focus-visible ring", () => {
    render(
      <SidebarPrimaryActionButtonElement
        active={false}
        elementId="synara-sidebar-search-trigger"
        accessibleLabel="Search"
        disabled={false}
        onActivate={rs.fn()}
      >
        Search
      </SidebarPrimaryActionButtonElement>,
    );
    const row = elementTree.root?.querySelector(".SharedSidebarPrimaryActionButton");
    if (!row) throw new Error("expected Search row");

    markProgrammaticLynxFocus("synara-sidebar-search-trigger");
    fireEvent.focus(row);
    expect(row.getAttribute("class")).not.toContain("ui-focus");

    fireEvent.blur(row);
    fireEvent.focus(row);
    expect(row.getAttribute("class")).toContain("ui-focus");
  });

  it("uses stable shared SVG states for the Chats disclosure", () => {
    const { rerender } = render(
      <SidebarChatsSectionHeaderElement expanded={false} onActivate={() => undefined} />,
    );

    let chevron = elementTree.root?.querySelector(".SharedSidebarChatsChevron");
    expect(chevron?.nodeName).toBe("SVG");
    expect(chevron?.textContent).toBe("");
    expect(chevron?.getAttribute("content")).toContain("M9 6l6 6l-6 6");

    rerender(<SidebarChatsSectionHeaderElement expanded onActivate={() => undefined} />);
    chevron = elementTree.root?.querySelector(".SharedSidebarChatsChevron");
    expect(chevron?.getAttribute("content")).toContain("M6 9l6 6l6 -6");
    expect(chevron?.getAttribute("class")).not.toContain("LynxDisclosureChevron--open");
  });
});
