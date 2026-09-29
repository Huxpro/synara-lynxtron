import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { Separator } from "./separator.lynx";

describe("Separator", () => {
  it("defaults to a presentation-only horizontal rule", () => {
    render(<Separator />);
    const separator = elementTree.root?.querySelector(".LxSeparator");
    expect(separator?.getAttribute("class")).toContain("LxSeparator--horizontal");
    expect(separator?.getAttribute("aria-hidden")).toBe("true");
  });
});
