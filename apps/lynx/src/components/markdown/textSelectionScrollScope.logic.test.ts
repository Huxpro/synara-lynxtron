import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

import { TEXT_SELECTION_SCROLL_SCOPE_PROPS } from "./textSelectionScrollScope.logic";

describe("text selection scroll scope", () => {
  it("is a scroller that takes no pan or wheel input and draws no scroll bar", () => {
    expect(TEXT_SELECTION_SCROLL_SCOPE_PROPS).toEqual({
      "scroll-orientation": "vertical",
      "enable-scroll": false,
      "scroll-bar-enable": false,
    });
  });

  it("wraps selectable markdown, and only selectable markdown, as its nearest scroller", () => {
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    // The scope is the root's parent: every selectable <text> is below it, and nothing that
    // scrolls sits between it and the markdown root.
    expect(source).toMatch(
      /if \(!selectable\) return root;[\s\S]*<scroll-view\s+className=\{[^}]*\}\s+\{\.\.\.TEXT_SELECTION_SCROLL_SCOPE_PROPS\}\s*>\s*\{root\}\s*<\/scroll-view>/,
    );
    expect(source.match(/TEXT_SELECTION_SCROLL_SCOPE_PROPS\}/g)).toHaveLength(1);
  });

  it("sizes the scope like the markdown root, with room for list markers in a reply", () => {
    const styles = readFileSync(new URL("./markdown.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.MdSelectionScrollScope\s*\{[^}]*width:\s*100%;[^}]*min-width:\s*0;[^}]*flex-shrink:\s*0;/s,
    );
    // The scope clips: it is wider than the root by the marker box's overhang on each side,
    // and the root keeps its place and width inside it.
    expect(styles).toMatch(
      /\.MdSelectionScrollScope--bleed\s*\{[^}]*position:\s*relative;[^}]*left:\s*-32px;[^}]*width:\s*calc\(100% \+ 64px\);/s,
    );
    expect(styles).toMatch(
      /\.MdSelectionScrollScope--bleed \.MdRoot\s*\{[^}]*position:\s*relative;[^}]*left:\s*32px;[^}]*width:\s*calc\(100% - 64px\);/s,
    );
    expect(styles).toMatch(/\.MdListMarkerText\s*\{[^}]*right:\s*4px;[^}]*width:\s*48px;/s);
    const source = readFileSync(new URL("./ChatMarkdown.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain('? "MdSelectionScrollScope"');
    expect(source).toContain(': "MdSelectionScrollScope MdSelectionScrollScope--bleed"');
  });
});
