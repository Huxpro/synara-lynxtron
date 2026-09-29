import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";
import { readFileSync } from "node:fs";

import { SidebarThreadStatusCompletedElement } from "./SidebarThreadStatusIndicatorElements.lynx";

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
      "import circleCheckSvg from '@synara-central-icons-fill/circle-check.svg?raw';",
    );
    expect(source).not.toContain(">✓</text>");
    expect(styles).toMatch(
      /\.LynxSidebarThreadStatus--completed\s*\{[^}]*width:\s*15px;[^}]*height:\s*15px;[^}]*background-color:\s*transparent;/s,
    );
  });
});
