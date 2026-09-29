import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { IconButton } from "./icon-button.lynx";

describe("IconButton", () => {
  it("provides the shared ghost/icon-xs defaults and accessible label", () => {
    render(
      <IconButton label="Add item">
        <text>+</text>
      </IconButton>,
    );
    const button = elementTree.root?.querySelector(".LxButton");
    expect(button?.getAttribute("class")).toContain("LxButton--ghost");
    expect(button?.getAttribute("class")).toContain("LxButton--icon-xs");
    expect(button?.getAttribute("accessibility-label")).toBe("Add item");
  });
});
