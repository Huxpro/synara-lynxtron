import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { inspectLocalPdf, renderLocalPdfPage } from "./localPdfPreview";
import { writePdfFixture } from "./localPdfTestFixture";

const tempDirs: string[] = [];

afterEach(() => {
  for (const dir of tempDirs.splice(0)) {
    rmSync(dir, { recursive: true, force: true });
  }
});

describe("local PDF preview", () => {
  it("inspects and renders a safe workspace PDF", async () => {
    const workspace = mkdtempSync(path.join(os.tmpdir(), "synara-pdf-preview-"));
    tempDirs.push(workspace);
    writeFileSync(path.join(workspace, ".git"), "gitdir: .git");
    writePdfFixture(path.join(workspace, "report.pdf"));
    const input = { requestedPath: "report.pdf", cwd: workspace };

    await expect(inspectLocalPdf(input)).resolves.toEqual({
      pageCount: 1,
      width: 300,
      height: 180,
    });
    const page = await renderLocalPdfPage({ ...input, page: 1, width: 600 });
    expect(page).toMatchObject({ pageCount: 1, width: 600, height: 360 });
    expect(Array.from(page.bytes.slice(0, 8))).toEqual([137, 80, 78, 71, 13, 10, 26, 10]);
    await expect(renderLocalPdfPage({ ...input, page: 2, width: 600 })).rejects.toThrow(
      "out of range",
    );
  });
});
