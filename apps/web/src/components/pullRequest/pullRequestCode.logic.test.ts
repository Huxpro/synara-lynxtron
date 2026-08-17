import { describe, expect, it } from "vitest";

import {
  buildPortableUnifiedDiffView,
  buildPullRequestCodeView,
  formatGitPathForDisplay,
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
  it("escapes control characters only at the path presentation boundary", () => {
    expect(formatGitPathForDisplay("line\nbreak\tname\r.txt\u0000")).toBe(
      "line\\nbreak\\tname\\r.txt\\x00",
    );
    expect(formatGitPathForDisplay("src/文档.txt")).toBe("src/文档.txt");
  });

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

  it("preserves literal Git binary patch identity", () => {
    const binaryPatch = [
      "diff --git a/assets/data.bin b/assets/data.bin",
      "index 1111111..2222222 100644",
      "GIT binary patch",
      "literal 2",
      "JcmZQ@0ssI+07C!(",
      "",
      "literal 2",
      "JcmZQ@1ONa-073u&",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(
      binaryPatch,
      "pull-request:literal-binary-test",
    );
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]).toMatchObject({
      path: "assets/data.bin",
      binary: true,
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

  it("preserves no-newline markers after their deletion and addition rows", () => {
    const patch = [
      "diff --git a/note.txt b/note.txt",
      "index ee2363a..5c80f32 100644",
      "--- a/note.txt",
      "+++ b/note.txt",
      "@@ -1 +1 @@",
      "-before",
      "\\ No newline at end of file",
      "+after",
      "\\ No newline at end of file",
      "",
    ].join("\n");
    const expectedLines = [
      ["hunk", null, null, "@@ -1 +1 @@"],
      ["deletion", 1, null, "before"],
      ["no-newline-deletion", null, null, "No newline at end of file"],
      ["addition", null, 1, "after"],
      ["no-newline-addition", null, null, "No newline at end of file"],
    ];

    const parsed = buildPullRequestCodeView(patch, "pull-request:no-newline-test");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(
      parsed.files[0]?.lines.map((line) => [
        line.kind,
        line.oldLine,
        line.newLine,
        line.text,
      ]),
    ).toEqual(expectedLines);

    const portable = buildPortableUnifiedDiffView(patch);
    expect(
      portable?.files[0]?.lines.map((line) => [
        line.kind,
        line.oldLine,
        line.newLine,
        line.text,
      ]),
    ).toEqual(expectedLines);
  });

  it("preserves a no-newline marker after a shared context row", () => {
    const patch = [
      "diff --git a/note.txt b/note.txt",
      "index 6f6bc1f..aeaf40f 100644",
      "--- a/note.txt",
      "+++ b/note.txt",
      "@@ -1,2 +1,2 @@",
      "-before",
      "+after",
      " tail",
      "\\ No newline at end of file",
      "",
    ].join("\n");
    const expectedLines = [
      ["hunk", "@@ -1,2 +1,2 @@"],
      ["deletion", "before"],
      ["addition", "after"],
      ["context", "tail"],
      ["no-newline-context", "No newline at end of file"],
    ];

    const parsed = buildPullRequestCodeView(
      patch,
      "pull-request:no-newline-context-test",
    );
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]?.lines.map((line) => [line.kind, line.text])).toEqual(
      expectedLines,
    );

    const portable = buildPortableUnifiedDiffView(patch);
    expect(portable?.files[0]?.lines.map((line) => [line.kind, line.text])).toEqual(
      expectedLines,
    );
  });

  it("decodes quoted Git paths and preserves their no-newline metadata", () => {
    const patch = [
      'diff --git "a/\\346\\226\\207\\346\\241\\243.txt" "b/\\346\\226\\207\\346\\241\\243.txt"',
      "index ee2363a..5c80f32 100644",
      '--- "a/\\346\\226\\207\\346\\241\\243.txt"',
      '+++ "b/\\346\\226\\207\\346\\241\\243.txt"',
      "@@ -1 +1 @@",
      "-before",
      "\\ No newline at end of file",
      "+after",
      "\\ No newline at end of file",
      "",
    ].join("\n");
    const expected = {
      path: "文档.txt",
      previousPath: null,
      kinds: [
        "hunk",
        "deletion",
        "no-newline-deletion",
        "addition",
        "no-newline-addition",
      ],
    };

    const parsed = buildPullRequestCodeView(patch, "pull-request:quoted-unicode");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect({
      path: parsed.files[0]?.path,
      previousPath: parsed.files[0]?.previousPath,
      kinds: parsed.files[0]?.lines.map((line) => line.kind),
    }).toEqual(expected);

    const portable = buildPortableUnifiedDiffView(patch);
    expect({
      path: portable?.files[0]?.path,
      previousPath: portable?.files[0]?.previousPath,
      kinds: portable?.files[0]?.lines.map((line) => line.kind),
    }).toEqual(expected);
  });

  it("uses rename metadata to resolve an ambiguous unquoted diff header", () => {
    const patch = [
      "diff --git a/foo b/old.txt b/foo b/new.txt",
      "similarity index 100%",
      "rename from foo b/old.txt",
      "rename to foo b/new.txt",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(patch, "pull-request:ambiguous-rename");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]).toMatchObject({
      path: "foo b/new.txt",
      previousPath: "foo b/old.txt",
      relation: "renamed",
    });

    const portable = buildPortableUnifiedDiffView(patch);
    expect(portable?.files[0]).toMatchObject({
      path: "foo b/new.txt",
      previousPath: "foo b/old.txt",
      relation: "renamed",
    });
  });

  it("distinguishes copied files from renamed files", () => {
    const patch = [
      "diff --git a/original.txt b/copied.txt",
      "similarity index 100%",
      "copy from original.txt",
      "copy to copied.txt",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(patch, "pull-request:copy");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files[0]).toMatchObject({
      path: "copied.txt",
      previousPath: "original.txt",
      relation: "copied",
    });

    const portable = buildPortableUnifiedDiffView(patch);
    expect(portable?.files[0]).toMatchObject({
      path: "copied.txt",
      previousPath: "original.txt",
      relation: "copied",
    });
  });

  it("preserves lifecycle order when a file changes from regular to symlink", () => {
    const patch = [
      "diff --git a/node b/node",
      "deleted file mode 100644",
      "index 2e65efe..0000000",
      "--- a/node",
      "+++ /dev/null",
      "@@ -1 +0,0 @@",
      "-a",
      "\\ No newline at end of file",
      "diff --git a/node b/node",
      "new file mode 120000",
      "index 0000000..1de5659",
      "--- /dev/null",
      "+++ b/node",
      "@@ -0,0 +1 @@",
      "+target",
      "\\ No newline at end of file",
      "",
    ].join("\n");

    const parsed = buildPullRequestCodeView(patch, "pull-request:type-change");
    expect(parsed.kind).toBe("files");
    if (parsed.kind !== "files") return;
    expect(parsed.files.map((file) => [file.path, file.lifecycle])).toEqual([
      ["node", "deleted"],
      ["node", "added"],
    ]);

    const portable = buildPortableUnifiedDiffView(patch);
    expect(portable?.files.map((file) => [file.path, file.lifecycle])).toEqual([
      ["node", "deleted"],
      ["node", "added"],
    ]);
  });

  it("falls back to a complete raw view for combined merge diffs", () => {
    const patch = [
      "diff --cc file.txt",
      "index b19a1e9,950b81b..0000000",
      "--- a/file.txt",
      "+++ b/file.txt",
      "@@@ -1,1 -1,1 +1,1 @@@",
      "- ours",
      " -theirs",
      "++base",
      "",
    ].join("\n");

    const view = buildPullRequestCodeView(patch, "pull-request:combined");
    expect(view.kind).toBe("raw");
    if (view.kind !== "raw") return;
    expect(view.reason).toBe(
      "Combined merge diff has multiple parents. Showing the complete raw patch.",
    );
    expect(view.lines.map((line) => line.text)).toEqual(patch.split("\n"));
  });

  it("keeps empty and unparsable patches explicit", () => {
    expect(buildPullRequestCodeView("  ")).toEqual({ kind: "empty" });
    const raw = buildPullRequestCodeView("not a unified diff");
    expect(raw.kind).toBe("raw");
    if (raw.kind === "raw") expect(raw.lines[0]?.text).toBe("not a unified diff");
  });
});
