import { act, fireEvent, render } from "@lynx-js/react/testing-library";
import { describe, expect, it } from "@rstest/core";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "./collapsible.lynx";

describe("Collapsible", () => {
  it("reuses the shared disclosure motion while closing", async () => {
    render(
      <Collapsible defaultOpen>
        <CollapsibleTrigger className="Trigger">
          <text>Toggle</text>
        </CollapsibleTrigger>
        <CollapsiblePanel className="Panel">
          <text>Content</text>
        </CollapsiblePanel>
      </Collapsible>,
    );

    expect(elementTree.root?.querySelector(".Panel")?.getAttribute("class")).toContain(
      "LynxDisclosureMotion--open",
    );

    await act(async () => {
      fireEvent.tap(elementTree.root!.querySelector(".Trigger")!);
    });

    const closingPanel = elementTree.root?.querySelector(".Panel");
    expect(closingPanel?.getAttribute("class")).toContain("LynxDisclosureMotion--closed");
    expect(closingPanel?.getAttribute("aria-hidden")).toBe("true");
  });
});
