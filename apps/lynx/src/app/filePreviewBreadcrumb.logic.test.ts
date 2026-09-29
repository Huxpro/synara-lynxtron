import { describe, expect, it } from "@rstest/core";
import { deriveFilePreviewBreadcrumb } from "@synara/shared/filePreviewBreadcrumb";

describe("shared file preview breadcrumb projection in Native", () => {
  it("prefixes workspace-relative files and gives repeated folders stable cumulative keys", () => {
    expect(
      deriveFilePreviewBreadcrumb({
        filePath: "src/src/index.ts",
        workspaceRoot: "/Users/tester/project",
      }),
    ).toEqual({
      fileIsOutsideWorkspace: false,
      fileSegment: "index.ts",
      openTarget: "/Users/tester/project/src/src/index.ts",
      prefixSegments: [
        { name: "project", key: "project" },
        { name: "src", key: "project/src" },
        { name: "src", key: "project/src/src" },
      ],
    });
  });

  it("does not invent a workspace prefix for absolute paths", () => {
    expect(
      deriveFilePreviewBreadcrumb({
        filePath: "/private/tmp/report.txt",
        workspaceRoot: "/Users/tester/project",
      }),
    ).toMatchObject({
      fileIsOutsideWorkspace: true,
      fileSegment: "report.txt",
      openTarget: "/private/tmp/report.txt",
    });
  });

  it("normalizes Windows separators while preserving the native open target", () => {
    expect(
      deriveFilePreviewBreadcrumb({
        filePath: "docs\\guide.md",
        workspaceRoot: "C:\\work\\project",
      }),
    ).toEqual({
      fileIsOutsideWorkspace: false,
      fileSegment: "guide.md",
      openTarget: "C:\\work\\project\\docs\\guide.md",
      prefixSegments: [
        { name: "project", key: "project" },
        { name: "docs", key: "project/docs" },
      ],
    });
  });
});
