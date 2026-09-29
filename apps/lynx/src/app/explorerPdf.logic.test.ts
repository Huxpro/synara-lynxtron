import { describe, expect, it } from "@rstest/core";

import { resolveExplorerPdfOpenTarget } from "./explorerPdf.logic";

describe("Explorer PDF open target", () => {
  it("joins safe workspace-relative paths using the workspace separator", () => {
    expect(
      resolveExplorerPdfOpenTarget({
        workspaceRoot: "/Users/dev/project",
        relativePath: "reports/quarterly.pdf",
      }),
    ).toBe("/Users/dev/project/reports/quarterly.pdf");
    expect(
      resolveExplorerPdfOpenTarget({
        workspaceRoot: "C:\\Users\\dev\\project",
        relativePath: "reports/quarterly.pdf",
      }),
    ).toBe("C:\\Users\\dev\\project\\reports\\quarterly.pdf");
  });

  it("rejects absolute and traversal paths", () => {
    expect(
      resolveExplorerPdfOpenTarget({
        workspaceRoot: "/Users/dev/project",
        relativePath: "../secret.pdf",
      }),
    ).toBeNull();
    expect(
      resolveExplorerPdfOpenTarget({
        workspaceRoot: "/Users/dev/project",
        relativePath: "/tmp/report.pdf",
      }),
    ).toBeNull();
  });
});
