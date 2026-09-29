import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

function source(path: string): string {
  return readFileSync(new URL(path, import.meta.url), "utf8");
}

describe("Native production independent tab rows", () => {
  it("routes chat, pane-local terminal, and terminal-group rows through one primitive", () => {
    const chat = source("./EditorRailTabs.lynx.tsx");
    const terminal = source("./DockTerminalPane.lynx.tsx");

    expect(chat).toContain("<IndependentTabRow");
    expect(chat).toContain('actionPlacement="start"');
    expect(chat).toContain('owner="chat"');
    expect(chat).toContain('scrollerClassName="ThreadEditorRailTabScroller"');
    expect(terminal.match(/<IndependentTabRow/g)).toHaveLength(2);
    expect(terminal).toContain('scrollerClassName="DockTerminalPaneTabScroller"');
    expect(terminal).toContain('scrollerClassName="DockTerminalPaneGroupScroller"');
    expect(terminal).toContain('owner="terminal-pane"');
    expect(terminal).toContain('owner="terminal-groups"');
  });
});
