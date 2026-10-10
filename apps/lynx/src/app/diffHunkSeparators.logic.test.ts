import { describe, expect, it } from "@rstest/core";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";

import { buildDiffHunkSeparators, buildDiffLineNumberDigits } from "./diffHunkSeparators.logic";

function filesOf(patch: string) {
  const view = buildPullRequestCodeView(patch, "test");
  if (view.kind !== "files") throw new Error(`expected files, got ${view.kind}`);
  return view.files;
}

const TWO_HUNKS = `diff --git a/src/math.ts b/src/math.ts
index 1111111..2222222 100644
--- a/src/math.ts
+++ b/src/math.ts
@@ -5,3 +5,4 @@ export function add() {
 a
 b
+c
 d
@@ -20,3 +21,2 @@ export function sub() {
 e
-f
 g
`;

const FROM_FIRST_LINE = `diff --git a/README.md b/README.md
index 1111111..2222222 100644
--- a/README.md
+++ b/README.md
@@ -1,2 +1,3 @@
+title
 a
 b
`;

describe("buildDiffHunkSeparators", () => {
  it("puts a separator in front of each hunk with the unchanged lines it skips", () => {
    const [file] = filesOf(TWO_HUNKS);
    const hunks = file!.lines.filter((line) => line.kind === "hunk");
    const separators = buildDiffHunkSeparators([file!]);

    // Lines 1-4 precede the first hunk; old 8-19 (new 9-20) sit between the two.
    expect(separators[hunks[0]!.id]).toEqual({ unmodifiedLines: 4, first: true });
    expect(separators[hunks[1]!.id]).toEqual({ unmodifiedLines: 12, first: false });
  });

  it("names each separator by the hunk's first code line too, for the split grid", () => {
    const [file] = filesOf(TWO_HUNKS);
    const separators = buildDiffHunkSeparators([file!]);
    const firstCodeLines = file!.lines.filter(
      (_line, index) => file!.lines[index - 1]?.kind === "hunk",
    );

    expect(firstCodeLines.map((line) => separators[line.id]?.unmodifiedLines)).toEqual([4, 12]);
    expect(Object.keys(separators)).toHaveLength(4);
  });

  it("has no separator for a hunk that starts at the top of the file", () => {
    expect(buildDiffHunkSeparators(filesOf(FROM_FIRST_LINE))).toEqual({});
  });

  it("counts every file from its own first line", () => {
    const files = filesOf(`${TWO_HUNKS}${FROM_FIRST_LINE}`);
    const separators = buildDiffHunkSeparators(files);

    expect(Object.values(separators).filter((separator) => separator.first)).toHaveLength(2);
    const readme = files.find((file) => file.path === "README.md")!;
    expect(readme.lines.some((line) => separators[line.id])).toBe(false);
  });
});

describe("buildDiffLineNumberDigits", () => {
  it("gives every line of a file the digit count of that file's largest line number", () => {
    const files = filesOf(`${TWO_HUNKS}${FROM_FIRST_LINE}`);
    const digits = buildDiffLineNumberDigits(files);
    const math = files.find((file) => file.path === "src/math.ts")!;
    const readme = files.find((file) => file.path === "README.md")!;

    // math.ts reaches line 22; README.md stops at line 3.
    expect(new Set(math.lines.map((line) => digits[line.id]))).toEqual(new Set([2]));
    expect(new Set(readme.lines.map((line) => digits[line.id]))).toEqual(new Set([1]));
  });
});
