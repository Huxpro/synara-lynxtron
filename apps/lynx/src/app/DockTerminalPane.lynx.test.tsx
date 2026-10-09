import { describe, expect, it } from "@rstest/core";
import { readFileSync } from "node:fs";

// The dock terminal follows upstream's flat model: one row of tabs, one PTY per
// tab, no groups and no splits (upstream removed both from the terminal store).
describe("Native dock terminal pane", () => {
  it("composes one real PTY surface per terminal tab and keeps inactive sessions mounted", () => {
    const source = readFileSync(new URL("./DockTerminalPane.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain("selectThreadTerminalState(");
    expect(source).toContain("dockTerminalThreadId(props.threadId");
    expect(source).toContain("terminalState.terminalIds");
    expect(source).toContain("<EditorSurfaceTab");
    expect(source).toContain("<ThreadTerminal");
    expect(source).toContain("onAddTerminalContext={addTerminalSelectionToChat}");
    expect(source).toContain("addTerminalContext(props.threadId");
    expect(source).toContain("threadId={scopeId}");
    expect(source).toContain("showHeader={false}");
    expect(source).toContain('" DockTerminalPaneSession--hidden"');
    expect(source).toContain("terminalId={tab.id}");
    expect(source).not.toContain("threadId={props.threadId}");
    expect(source).toContain("user-interaction-enabled={tab.id === activeId}");
  });

  it("matches the Electron flat terminal tab chrome", () => {
    const source = readFileSync(new URL("./DockTerminalPane.lynx.tsx", import.meta.url), "utf8");
    const styles = readFileSync(new URL("./dock-terminal-pane.css", import.meta.url), "utf8");
    expect(styles).toMatch(
      /\.DockTerminalPaneToolbar\s*\{[^}]*height:\s*36px;[^}]*min-height:\s*36px;[^}]*padding:\s*0 6px;/s,
    );
    expect(styles).toMatch(
      /\.DockTerminalPaneToolbarButton\s*\{[^}]*width:\s*28px;[^}]*height:\s*28px;/s,
    );
    expect(source).toContain('label="New terminal tab"');
    expect(source.match(/<IndependentTabRow/g)).toHaveLength(1);
    expect(source).toContain('scrollerClassName="DockTerminalPaneTabScroller"');
    expect(source).toContain('label="Close active terminal tab"');
    expect(source).toContain('const toolbarIconColor = semanticIconColor("secondary")');
    expect(source).toContain("resolveTerminalVisualIdentityMap({");
    expect(source).toContain("resolveTerminalVisualIdentity({");
    expect(source).toContain("defaultTerminalTitleForCliKind(event.cliKind)");
    expect(source).toContain("<ActivityIndicator state={identity.state} />");
    expect(styles).toContain(".DockTerminalPaneActivity--running");
    expect(styles).toContain(".DockTerminalPaneActivity--attention");
    for (const removed of ["Split right", "Split down", "newTerminalGroup", "splitTerminal"]) {
      expect(source).not.toContain(removed);
    }
  });

  it("persists dock terminal ownership and metadata in the canonical store", () => {
    const source = readFileSync(new URL("./DockTerminalPane.lynx.tsx", import.meta.url), "utf8");
    expect(source).toContain('from "@synara-web/terminalStateStore"');
    expect(source).toContain('from "@synara-web/lib/dockTerminalScope"');
    expect(source).toContain("openTerminalThreadPage(scopeId");
    expect(source).toContain("newTerminal(scopeId, `terminal-${randomUUID()}`)");
    expect(source).toContain("setActiveTerminal(scopeId, id)");
    expect(source).toContain("closeTerminal(scopeId, id)");
    expect(source).toContain("setTerminalMetadata(scopeId, id");
    expect(source).toContain("setTerminalActivity(scopeId, id");
    expect(source).toContain("flushTerminalStatePersistence()");
    expect(source).not.toContain("shellSetTerminalSearchEnabled");
  });
});
