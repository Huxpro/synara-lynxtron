import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";

import { ExplorerImagePreview } from "./ExplorerImagePreview.lynx";

describe("Explorer image preview", () => {
  it("replaces bytes that fail to decode with the shared error state", () => {
    render(<ExplorerImagePreview path="corrupt.png" previewUrl="http://localhost/corrupt.png" />);

    const image = elementTree.root?.querySelector(".ExplorerDockImage");
    expect(image?.getAttribute("src")).toBe("http://localhost/corrupt.png");

    fireEvent(image!, new Event("bindEvent:error", { bubbles: true }));

    expect(elementTree.root?.querySelector(".ExplorerDockImage")).toBeNull();
    expect(elementTree.root?.querySelector(".ExplorerDockState--error")?.textContent).toBe(
      "Could not load this image.",
    );
  });
});
