import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { PlusIcon } from "./icons.lynx";

describe("generated Lynx icon accessibility", () => {
  it("keeps decorative icons out of the accessibility tree by default", () => {
    render(<PlusIcon />);
    const icon = elementTree.root?.querySelector("svg");
    expect(icon?.getAttribute("accessibility-element")).toBe("false");
    expect(icon?.getAttribute("accessibility-label")).toBeNull();
    expect(icon?.getAttribute("accessibility-trait")).toBeNull();
  });

  it("exposes a labeled standalone icon as an image", () => {
    render(<PlusIcon accessibilityLabel="Add" />);
    const icon = elementTree.root?.querySelector("svg");
    expect(icon?.getAttribute("accessibility-element")).toBe("true");
    expect(icon?.getAttribute("accessibility-label")).toBe("Add");
    expect(icon?.getAttribute("accessibility-trait")).toBe("image");
  });
});
