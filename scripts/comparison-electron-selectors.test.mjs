import { readFileSync } from "node:fs";

import { describe, expect, it } from "vitest";

import {
  ELECTRON_SELECTED_ROW_CLASS,
  ELECTRON_THREAD_ROW_SCOPES,
  electronActiveThreadIdExpression,
  electronAnyThreadRowSelector,
  electronProjectNewThreadButtonSelector,
  electronThreadRowSelector,
} from "./comparison-electron-selectors.mjs";
import { electronSelectorFor } from "./comparison-workflow.mjs";

function upstream(path) {
  return readFileSync(new URL(`../apps/web/src/${path}`, import.meta.url), "utf8");
}

describe("Electron sidebar selectors", () => {
  it("resolves a thread row through upstream's hover anchors, one selector per scope", () => {
    expect(electronThreadRowSelector("thread-a/b")).toBe(
      [
        '[data-thread-hover-anchor="pinned:thread-a/b"] [data-thread-item][role="button"]',
        '[data-thread-hover-anchor="chat:thread-a/b"] [data-sidebar="menu-sub-button"]',
        '[data-thread-hover-anchor="project:thread-a/b"] [data-sidebar="menu-sub-button"]',
      ].join(", "),
    );
    expect(electronAnyThreadRowSelector()).toContain('[data-thread-hover-anchor^="pinned:"]');
  });

  it("maps the renderer-neutral data-thread-id target onto those anchors, and nothing else", () => {
    expect(electronSelectorFor({ attribute: ["data-thread-id", "t1"] })).toBe(
      electronThreadRowSelector("t1"),
    );
    expect(electronSelectorFor({ attribute: ["data-message-id", "m1"] })).toBe(
      '[data-message-id="m1"]',
    );
    expect(electronSelectorFor({ label: "Settings" })).toBe('[aria-label="Settings"]');
    expect(electronSelectorFor({ testId: "new-thread-button" })).toBe(
      '[data-testid="new-thread-button"]',
    );
    expect(electronSelectorFor({ selector: "main" })).toBe("main");
  });

  it("reads the active thread id back out of the anchor", () => {
    const expression = electronActiveThreadIdExpression();
    expect(expression).toContain("data-thread-hover-anchor");
    expect(expression).toContain("getAttribute('data-active') === 'true'");
    expect(expression).toContain(ELECTRON_SELECTED_ROW_CLASS);
  });

  it("finds a project's new-thread button inside its header anchor", () => {
    expect(electronProjectNewThreadButtonSelector("project one")).toBe(
      '[data-project-hover-anchor="project one"] [data-testid="new-thread-button"]',
    );
  });

  // The names above belong to upstream. These assertions fail when upstream
  // renames one, before a comparison run certifies against a selector that no
  // longer matches anything.
  it("uses names upstream's sidebar still renders", () => {
    const sidebar = upstream("components/Sidebar.tsx");
    const sidebarLogic = upstream("components/Sidebar.logic.ts");
    const sidebarPrimitives = upstream("components/ui/sidebar.tsx");
    const rowStyles = upstream("sidebarRowStyles.ts");

    expect(sidebarLogic).toContain("return `${input.scope}:${input.threadId}`;");
    for (const scope of ELECTRON_THREAD_ROW_SCOPES) {
      expect(sidebarLogic).toMatch(new RegExp(`SidebarThreadHoverAnchorScope =[^;]*"${scope}"`));
    }
    // Pinned rows: anchor wrapper, then the row button.
    expect(sidebar).toMatch(
      /data-thread-hover-anchor=\{hoverAnchorId\}[\s\S]{0,400}role="button"\s+tabIndex=\{0\}\s+data-thread-item/,
    );
    expect(sidebar).toContain('scope: "pinned"');
    // Project and chat rows: the anchor is the list item, the row is the sub button.
    expect(sidebar).toMatch(
      /<SidebarMenuSubItem[\s\S]{0,200}data-thread-hover-anchor=\{hoverAnchorId\}[\s\S]{0,400}<SidebarMenuSubButton/,
    );
    expect(sidebar).toContain('scope: topLevel ? "chat" : "project"');
    expect(sidebarPrimitives).toContain('"data-sidebar": "menu-sub-button"');
    expect(sidebarPrimitives).toContain('"data-active": isActive');
    expect(rowStyles).toMatch(
      new RegExp(
        `SIDEBAR_ROW_ACTIVE_CLASS_NAME =\\s*"${ELECTRON_SELECTED_ROW_CLASS.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")} `,
      ),
    );
    // Project header: anchor wrapper containing the toolbar's new-thread button.
    expect(sidebar).toContain("data-project-hover-anchor={project.id}");
    expect(sidebar).toContain('data-testid="new-thread-button"');
  });
});
