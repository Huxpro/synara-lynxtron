import { describe, expect, it } from "vitest";
import { deriveFilePreviewBreadcrumb } from "./filePreviewBreadcrumb";

describe("file preview breadcrumb projection", () => {
  it("prefixes safe relative paths with the workspace folder", () => {
    expect(
      deriveFilePreviewBreadcrumb({
        filePath: "docs/guides/README.md",
        workspaceRoot: "/Users/tester/project",
      }),
    ).toEqual({
      fileIsOutsideWorkspace: false,
      fileSegment: "README.md",
      openTarget: "/Users/tester/project/docs/guides/README.md",
      prefixSegments: [
        { name: "project", key: "project" },
        { name: "docs", key: "project/docs" },
        { name: "guides", key: "project/docs/guides" },
      ],
    });
  });

  it("keeps an absolute path outside the workspace", () => {
    expect(
      deriveFilePreviewBreadcrumb({
        filePath: "/private/tmp/report.txt",
        workspaceRoot: "/Users/tester/project",
      }),
    ).toEqual({
      fileIsOutsideWorkspace: true,
      fileSegment: "report.txt",
      openTarget: "/private/tmp/report.txt",
      prefixSegments: [
        { name: "private", key: "private" },
        { name: "tmp", key: "private/tmp" },
      ],
    });
  });
});
