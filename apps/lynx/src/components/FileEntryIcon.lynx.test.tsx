import { describe, expect, it } from "@rstest/core";
import { render } from "@lynx-js/react/testing-library";

import { FileEntryIcon } from "./FileEntryIcon.lynx";

function renderIcon(pathValue: string) {
  render(<FileEntryIcon className="TestFileIcon" pathValue={pathValue} />);
  return elementTree.root?.querySelector(".TestFileIcon");
}

describe("Lynx file entry icon", () => {
  it("uses the shared TypeScript glyph and color", () => {
    const icon = renderIcon("src/tree.ts");
    expect(icon?.getAttribute("content")).toContain('fill="#3178c6"');
    expect(icon?.getAttribute("content")).toContain("M7.16146 3H16.8386");
  });

  it("uses the shared Markdown glyph and color", () => {
    const icon = renderIcon("README.md");
    expect(icon?.getAttribute("content")).toContain('stroke="#6cb6ff"');
    expect(icon?.getAttribute("content")).toContain("M6.75 14.25V9.75");
  });

  it("falls back to the shared code-brackets glyph and color", () => {
    const icon = renderIcon("src/main.go");
    expect(icon?.getAttribute("content")).toContain('stroke="#9ca3af"');
    expect(icon?.getAttribute("content")).toContain("M9.75 20.25L14.25 3.75");
  });

  it("uses attachment-aware identity with inherited secondary paint", () => {
    render(
      <FileEntryIcon
        className="AttachmentIcon"
        colorMode="inherit"
        kind="file"
        mimeType="application/pdf"
        pathValue="report.pdf"
      />,
    );
    const icon = elementTree.root?.querySelector(".AttachmentIcon");
    expect(icon?.getAttribute("content")).toContain('stroke="rgba(13, 13, 13, 0.598)"');
    expect(icon?.getAttribute("content")).toContain("M3.75 20.25V14.75H5.75");
    expect(icon?.getAttribute("content")).not.toContain("M9.75 20.25L14.25 3.75");
  });
});
