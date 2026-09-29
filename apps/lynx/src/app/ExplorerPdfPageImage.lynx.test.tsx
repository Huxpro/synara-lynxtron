import { describe, expect, it } from "@rstest/core";
import { fireEvent, render } from "@lynx-js/react/testing-library";

import { ExplorerPdfPageImage } from "./ExplorerPdfPageImage.lynx";

describe("Explorer PDF page image", () => {
  it("replaces a failed page response with the shared PDF error", () => {
    render(
      <ExplorerPdfPageImage
        accessibilityLabel="report.pdf, page 2 of 2"
        height={720}
        pageUrl="http://localhost/page-2.png"
        width={1200}
      />,
    );

    const image = elementTree.root?.querySelector(".ExplorerDockPdfPageImage");
    expect(image?.getAttribute("src")).toBe("http://localhost/page-2.png");
    expect(image?.getAttribute("style")).toContain("width: 1200px");
    expect(image?.getAttribute("style")).toContain("height: 720px");

    fireEvent(image!, new Event("bindEvent:error", { bubbles: true }));

    expect(elementTree.root?.querySelector(".ExplorerDockPdfPageImage")).toBeNull();
    expect(elementTree.root?.querySelector(".ExplorerDockPdfStatus")?.textContent).toBe(
      "Could not render this PDF.",
    );
  });
});
