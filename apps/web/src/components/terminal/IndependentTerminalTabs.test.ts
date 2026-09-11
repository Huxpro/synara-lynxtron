import { describe, expect, it } from "vitest";
import { readFileSync } from "node:fs";

describe("terminal independent tab rows", () => {
  it("uses one tab/action split for pane-local and group tabs", () => {
    const pane = readFileSync(new URL("./TerminalViewportPane.tsx", import.meta.url), "utf8");
    const chrome = readFileSync(new URL("./TerminalChrome.tsx", import.meta.url), "utf8");
    expect(pane).toContain('import { IndependentTabRow }');
    expect(pane).toContain('<IndependentTabRow');
    expect(pane).toContain('label="New terminal tab"');
    expect(pane).toContain('label="Split right"');
    expect(pane).toContain('label="Close active terminal tab"');
    expect(chrome).toContain('import { IndependentTabRow }');
    expect(chrome).toContain('<IndependentTabRow');
    expect(chrome).toContain('actions={<TerminalChromeActions');
  });
});
