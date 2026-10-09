import { globSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

import { describe, expect, it } from "@rstest/core";

const source = (relative: string) => readFileSync(new URL(relative, import.meta.url), "utf8");
const sourceRoot = fileURLToPath(new URL("..", import.meta.url));

/**
 * Lynx does not inherit `pointer-events: none`: a container hidden with it (and opacity 0)
 * still lets its interactive children take taps over whatever is visible beneath. Every
 * such hidden region therefore either refuses touch for its whole subtree with
 * `user-interaction-enabled`, unmounts while hidden, or is listed below with the reason
 * its children cannot intercept anything.
 */
const HIDDEN_REGION_RULES: Readonly<Record<string, string>> = {
  // Gated with user-interaction-enabled (asserted below).
  ".EnvironmentOverlay": "gated",
  ".ThreadRightDockHost--closed": "gated",
  ".ThreadRightDockTerminalPane--hidden": "gated",
  ".ExplorerDock--closed": "gated",
  ".DiffDock--closed": "gated",
  ".BrowserDockPane--hidden": "gated",
  ".DockTerminalPaneSession--hidden": "gated",
  ".TranscriptMessageTrailTooltip": "gated",
  // A childless native field focused programmatically; the rule applies to the node itself.
  ".ThreadTerminalInputProxy": "no-children",
  // Hover-reveal controls: a pointer always hovers (revealing them) before it can click,
  // and they only overlap their own row.
  ".SharedSidebarListSectionHeaderAction": "hover-reveal",
  ".AppSidebarRowHoverActions": "hover-reveal",
  ".ComponentsLabMessageActions--hidden": "hover-reveal",
};

function hiddenRegionSelectors(css: string): string[] {
  return Array.from(css.matchAll(/([^{}]+)\{([^}]*)\}/g))
    .filter(([, , body]) => /pointer-events:\s*none/.test(body!) && /opacity:\s*0;/.test(body!))
    .flatMap(([, selectors]) => selectors!.split(",").map((selector) => selector.trim()))
    .filter((selector) => !selector.startsWith("/*"));
}

describe("hidden region interaction", () => {
  it("accounts for every stylesheet rule that hides a region with pointer-events: none", () => {
    const unaccounted: string[] = [];
    for (const file of globSync("**/*.css", { cwd: sourceRoot })) {
      if (file.startsWith("generated/")) continue;
      for (const selector of hiddenRegionSelectors(readFileSync(`${sourceRoot}/${file}`, "utf8"))) {
        const known = Object.keys(HIDDEN_REGION_RULES).some((rule) => selector.includes(rule));
        if (!known) unaccounted.push(`${file}: ${selector}`);
      }
    }
    expect(unaccounted).toEqual([]);
  });

  it("closes right-side panels for touch as well as sight", () => {
    const panel = source("./ResizableRightPanel.lynx.tsx");
    expect(panel).toContain("user-interaction-enabled={props.interactive ?? true}");
    expect(source("./ThreadRightDockHost.lynx.tsx")).toMatch(
      /ThreadRightDockHost--closed"\s*\}[^`]*`\}\s*interactive=\{props\.open\}/s,
    );
    expect(source("./DiffDock.lynx.tsx")).toMatch(
      /DiffDock--closed"\}`\}\s*interactive=\{props\.open\}/s,
    );
    const explorer = source("./ExplorerDock.lynx.tsx");
    expect(explorer).toMatch(/ExplorerDock--closed"\}`\}\s*interactive=\{props\.open\}/s);
    expect(explorer).toMatch(
      /ExplorerDock--closed"\}`\}\s*aria-hidden=\{!props\.open\}\s*user-interaction-enabled=\{props\.open\}/s,
    );
  });

  it("stops hidden stacked panes from taking taps meant for the visible one", () => {
    expect(source("./router.tsx")).toMatch(
      /ThreadRightDockTerminalPane--hidden"[\s\S]{0,200}user-interaction-enabled=\{terminalOpen\}/,
    );
    expect(source("./BrowserDockPane.lynx.tsx")).toMatch(
      /BrowserDockPane--hidden"\}`\}[\s\S]{0,160}user-interaction-enabled=\{props\.active\}/,
    );
    const terminals = source("./DockTerminalPane.lynx.tsx");
    expect(terminals).toContain("user-interaction-enabled={tab.id === activeId}");
  });

  it("keeps the passive trail preview from taking taps over the transcript", () => {
    expect(source("./Transcript.tsx")).toContain(
      '<view className="TranscriptMessageTrailTooltip" user-interaction-enabled={false}>',
    );
  });

  it("closes the sidebar for native fields too, not only shared primitives", () => {
    // SidebarDisclosure is `overflow: visible` at width 0, so its content overhangs the
    // main pane; LynxInteractionScope alone leaves native inputs and scroll views live.
    expect(source("./SidebarDisclosure.lynx.tsx")).toContain(
      "user-interaction-enabled={interactive}",
    );
  });
});
