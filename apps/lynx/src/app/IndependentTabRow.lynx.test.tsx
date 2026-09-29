import { describe, expect, it, rs } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { IndependentTabRow } from "./IndependentTabRow.lynx";

describe("Native independent tab row", () => {
  it("keeps tabs in a horizontal scroller and actions in a fixed sibling lane", () => {
    const styles = readFileSync(new URL("./independent-tab-row.css", import.meta.url), "utf8");
    render(
      <IndependentTabRow
        actions={<view className="TestAction" />}
        owner="terminal-pane"
        tabs={<view className="TestTab" />}
      />,
    );

    expect(elementTree.root?.querySelector(".IndependentTabRowScroller")).not.toBeNull();
    expect(elementTree.root?.querySelector(".IndependentTabRowActions")).not.toBeNull();
    expect(
      elementTree.root?.querySelector(".IndependentTabRow--owner-terminal-pane"),
    ).not.toBeNull();
    expect(styles).toMatch(/\.IndependentTabRowScroller\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s);
    expect(styles).toMatch(/\.IndependentTabRowActions\s*\{[^}]*flex-shrink:\s*0;/s);
  });

  it("collapses to tabs-only and restores the fixed actions", () => {
    const onAction = rs.fn();
    render(
      <IndependentTabRow
        actions={<view className="TestAction" bindtap={onAction} />}
        tabs={<view className="TestTab" />}
      />,
    );

    expect(elementTree.root?.querySelector(".TestTab")).not.toBeNull();
    expect(elementTree.root?.querySelector(".TestAction")).not.toBeNull();
    const collapse = elementTree.root?.querySelector(
      '[accessibility-label="Collapse to tabs only"]',
    );
    fireEvent.tap(collapse!);
    expect(elementTree.root?.querySelector(".IndependentTabRow--tabs-only")).not.toBeNull();
    expect(elementTree.root?.querySelector(".TestTab")).not.toBeNull();
    expect(elementTree.root?.querySelector(".TestAction")).toBeNull();
    const restore = elementTree.root?.querySelector('[accessibility-label="Restore tab actions"]');
    fireEvent.tap(restore!);
    expect(elementTree.root?.querySelector(".IndependentTabRow--expanded")).not.toBeNull();
    expect(elementTree.root?.querySelector(".TestAction")).not.toBeNull();
  });
});
