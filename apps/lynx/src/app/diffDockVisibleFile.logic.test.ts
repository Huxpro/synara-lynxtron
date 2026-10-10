import { describe, expect, it } from "@rstest/core";
import { resolveAdjacentDiffFilePath } from "@synara-web/components/DiffPanel.logic";

import { resolveVisibleDiffDockFilePath } from "./diffDockVisibleFile.logic";

const files = (tops: readonly (number | null)[]) =>
  tops.map((top, index) => ({ path: `file-${index}`, top }));

describe("diff dock visible file", () => {
  it("is the file under the viewport's top edge, with upstream's 8px tolerance", () => {
    // Viewport top at y=88. File 1 starts 8px below it: still the visible one.
    expect(resolveVisibleDiffDockFilePath({ viewportTop: 88, files: files([-300, 96, 500]) })).toBe(
      "file-1",
    );
    expect(resolveVisibleDiffDockFilePath({ viewportTop: 88, files: files([-300, 97, 500]) })).toBe(
      "file-0",
    );
  });

  it("is the first file before anything scrolled, and null with nothing laid out", () => {
    expect(resolveVisibleDiffDockFilePath({ viewportTop: 88, files: files([100, 400]) })).toBe(
      "file-0",
    );
    expect(resolveVisibleDiffDockFilePath({ viewportTop: 88, files: files([null, null]) })).toBe(
      null,
    );
    expect(resolveVisibleDiffDockFilePath({ viewportTop: 88, files: [] })).toBe(null);
  });

  it("skips files that are not mounted yet", () => {
    expect(
      resolveVisibleDiffDockFilePath({ viewportTop: 88, files: files([-900, -200, null]) }),
    ).toBe("file-1");
  });

  it("feeds upstream's adjacent-file step: Previous/Next change walk files from it", () => {
    const paths = ["file-0", "file-1", "file-2"];
    const active = resolveVisibleDiffDockFilePath({
      viewportTop: 88,
      files: files([-300, 90, 500]),
    });
    expect(resolveAdjacentDiffFilePath(paths, active, "next")).toBe("file-2");
    expect(resolveAdjacentDiffFilePath(paths, active, "previous")).toBe("file-0");
    // Nothing active yet: Next goes to the first file and Previous is unavailable.
    expect(resolveAdjacentDiffFilePath(paths, null, "next")).toBe("file-0");
    expect(resolveAdjacentDiffFilePath(paths, null, "previous")).toBe(null);
  });
});
