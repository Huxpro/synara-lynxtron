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

  it("preserves binary file identity in parsed and portable views", () => {
    const binaryPatch = [
      "diff --git a/assets/data.bin b/assets/data.bin",
      "index 1111111..2222222 100644",
      "Binary files a/assets/data.bin and b/assets/data.bin differ",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(binaryPatch, "pull-request:binary-test");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files).toHaveLength(1);
    expect(parsed.files[0]).toMatchObject({
      path: "assets/data.bin",
      additions: 0,
      deletions: 0,
      binary: true,
      modeChange: null,
      lifecycle: null,
      lines: [],
    });

    const portable = buildPortableUnifiedDiffView(binaryPatch);
    expect(portable?.files[0]).toMatchObject({
      path: "assets/data.bin",
      binary: true,
      lines: [],
    });
  });

  it("preserves file mode changes in parsed and portable views", () => {
    const modePatch = [
      "diff --git a/scripts/run.sh b/scripts/run.sh",
      "old mode 100644",
      "new mode 100755",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(modePatch, "pull-request:mode-test");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]).toMatchObject({
      path: "scripts/run.sh",
      binary: false,
      modeChange: {
        previous: "100644",
        next: "100755",
      },
      lines: [],
    });

    const portable = buildPortableUnifiedDiffView(modePatch);
    expect(portable?.files[0]).toMatchObject({
      path: "scripts/run.sh",
      modeChange: {
        previous: "100644",
        next: "100755",
      },
      lines: [],
    });
  });

  it.each([
    {
      label: "added",
      patch: [
        "diff --git a/added.empty b/added.empty",
        "new file mode 100644",
        "index 0000000..e69de29",
        "",
      ].join("\n"),
      path: "added.empty",
      lifecycle: "added" as const,
    },
    {
      label: "deleted",
      patch: [
        "diff --git a/deleted.empty b/deleted.empty",
        "deleted file mode 100644",
        "index e69de29..0000000",
        "",
      ].join("\n"),
      path: "deleted.empty",
      lifecycle: "deleted" as const,
    },
  ])("preserves empty $label file lifecycle in parsed and portable views", (fixture) => {
    const parsed = buildPullRequestCodeView(
      fixture.patch,
      `pull-request:empty-${fixture.label}-test`,
    );
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]).toMatchObject({
      path: fixture.path,
      lifecycle: fixture.lifecycle,
      lines: [],
    });

    const portable = buildPortableUnifiedDiffView(fixture.patch);
    expect(portable?.files[0]).toMatchObject({
      path: fixture.path,
      lifecycle: fixture.lifecycle,
      lines: [],
    });
  });

  it("keeps empty and unparsable patches explicit", () => {
    expect(buildPullRequestCodeView("  ")).toEqual({ kind: "empty" });
    const raw = buildPullRequestCodeView("not a unified diff");
    expect(raw.kind).toBe("raw");
    if (raw.kind === "raw") expect(raw.lines[0]?.text).toBe("not a unified diff");
  });
});
