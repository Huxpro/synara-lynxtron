import { describe, expect, it } from "vitest";

import {
  buildPortableUnifiedDiffView,
  buildPullRequestCodeView,
} from "./pullRequestCode.logic";

const PATCH = [
  "diff --git a/src/z.ts b/src/z.ts",
  "index 1111111..2222222 100644",
  "--- a/src/z.ts",
  "+++ b/src/z.ts",
  "@@ -1,3 +1,3 @@",
  " keep",
  "-old",
  "+new",
  " tail",
  "diff --git a/src/a.ts b/src/a.ts",
  "new file mode 100644",
  "--- /dev/null",
  "+++ b/src/a.ts",
  "@@ -0,0 +1 @@",
  "+added",
  "",
].join("\n");

describe("buildPullRequestCodeView", () => {
  it("projects canonical parsed files into sorted portable line rows", () => {
    const view = buildPullRequestCodeView(PATCH, "pull-request:test");
    expect(view.kind).toBe("files");
    if (view.kind !== "files") return;

    expect(view.files.map((file) => file.path)).toEqual(["src/a.ts", "src/z.ts"]);
    expect({ additions: view.additions, deletions: view.deletions }).toEqual({
      additions: 2,
      deletions: 1,
    });
    expect(view.files[1]?.lines.map((line) => [line.kind, line.oldLine, line.newLine, line.text]))
      .toEqual([
        ["hunk", null, null, "@@ -1,3 +1,3 @@"],
        ["context", 1, 1, "keep"],
        ["deletion", 2, null, "old"],
        ["addition", null, 2, "new"],
        ["context", 3, 3, "tail"],
      ]);
  });

  it("parses the unified diff body from a GitHub mbox patch", () => {
    const mboxPatch = [
      "From 496a6ff146ac2e3420a63e1159c7fc6c8eed03ac Mon Sep 17 00:00:00 2001",
      "From: Example Author <author@example.com>",
      "Subject: [PATCH] update files",
      "---",
      " 1 file changed, 1 insertion(+)",
      "",
      PATCH,
    ].join("\n");

    const view = buildPullRequestCodeView(mboxPatch, "pull-request:mbox-test");
    expect(view.kind).toBe("files");
    if (view.kind !== "files") return;
    expect(view.files.map((file) => file.path)).toEqual(["src/a.ts", "src/z.ts"]);
    expect({ additions: view.additions, deletions: view.deletions }).toEqual({
      additions: 2,
      deletions: 1,
    });

    const portable = buildPortableUnifiedDiffView(mboxPatch);
    expect(portable?.files.map((file) => file.path)).toEqual(["src/a.ts", "src/z.ts"]);
    expect(portable?.files[1]?.lines.map((line) => [line.kind, line.oldLine, line.newLine]))
      .toEqual([
        ["hunk", null, null],
        ["context", 1, 1],
        ["deletion", 2, null],
        ["addition", null, 2],
        ["context", 3, 3],
      ]);
  });

  it("keeps empty and unparsable patches explicit", () => {
    expect(buildPullRequestCodeView("  ")).toEqual({ kind: "empty" });
    const raw = buildPullRequestCodeView("not a unified diff");
    expect(raw.kind).toBe("raw");
    if (raw.kind === "raw") expect(raw.lines[0]?.text).toBe("not a unified diff");
  });
});
