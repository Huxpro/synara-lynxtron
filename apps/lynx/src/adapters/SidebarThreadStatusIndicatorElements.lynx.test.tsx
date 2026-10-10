import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import {
  SidebarThreadStatusCompletedElement,
  SidebarThreadStatusDotElement,
  SidebarThreadStatusRunningElement,
} from "./SidebarThreadStatusIndicatorElements.lynx";

describe("Sidebar thread status icon fidelity", () => {
  it("uses Webs filled circle-check identity at the 15px trailing role", () => {
    render(<SidebarThreadStatusCompletedElement colorClass="text-status-success" />);

    const icon = elementTree.root?.querySelector(".LynxSidebarThreadStatusCheck");
    expect(icon?.nodeName).toBe("SVG");
    expect(icon?.getAttribute("content")).toContain("#00a240");
    expect(icon?.textContent).toBe("");

    const source = readFileSync(
      new URL("./SidebarThreadStatusIndicatorElements.lynx.tsx", import.meta.url),
      "utf8",
    );
    const styles = readFileSync(
      new URL("./sidebar-thread-status-indicator-elements.css", import.meta.url),
      "utf8",
    );
    expect(source).toContain(
      'import circleCheckSvg from "@synara-central-icons-fill/circle-check.svg?raw";',
    );
    expect(source).not.toContain(">✓</text>");
    expect(styles).toMatch(
      /\.LynxSidebarThreadStatus--completed\s*\{[^}]*width:\s*15px;[^}]*height:\s*15px;[^}]*background-color:\s*transparent;/s,
    );
  });

  it("draws upstream's glyphs for a snooze reminder, background work and a pending approval", () => {
    render(
      <view>
        <SidebarThreadStatusDotElement
          label="Snooze reminder"
          colorClass="text-info"
          dotClass="bg-info"
        />
        <SidebarThreadStatusDotElement
          label="In background · 2 tasks"
          colorClass="text-sky-600"
          dotClass="bg-sky-500"
        />
        <SidebarThreadStatusDotElement
          label="Pending Approval"
          colorClass="text-amber-600"
          dotClass="bg-amber-500"
        />
        <SidebarThreadStatusRunningElement label="Preparing worktree" />
      </view>,
    );
    const byLabel = (label: string) =>
      Array.from(elementTree.root?.querySelectorAll("view") ?? []).find(
        (node) => node.getAttribute("aria-label") === label,
      );
    // A clock from upstream's ClockIcon (Hugeicons ClockHour7), 12px.
    const reminder = byLabel("Snooze reminder");
    expect(reminder?.getAttribute("class")).toBe("LynxSidebarThreadStatusGlyph");
    expect(reminder?.querySelector("svg")?.getAttribute("content")).toContain('stroke-width="1.5"');
    // The dashed ring of ThreadBackgroundWorkSpinner, with the count in the name.
    const background = byLabel("In background · 2 tasks");
    expect(background?.querySelector("svg")?.getAttribute("content")).toContain(
      'stroke-dasharray="2 2.6"',
    );
    expect(byLabel("Pending Approval")?.getAttribute("class")).toContain(
      "LynxSidebarThreadStatus--attention",
    );
    expect(byLabel("Preparing worktree")?.getAttribute("class")).toContain(
      "LynxSidebarThreadStatus--running",
    );
  });
});
