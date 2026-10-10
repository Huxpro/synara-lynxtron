// FILE: app/diffHunkSeparators.logic.ts
// Purpose: Where the diff dock shows upstream's "N unmodified lines" band: in
//   front of every hunk that leaves unchanged lines out above it. Upstream's
//   renderer (@pierre/diffs) draws the band from each hunk's collapsed-line
//   count; the portable row model keeps line numbers instead, so the count is
//   read from the gap between consecutive hunks.
// Layer: Lynx diff dock (pure)
// Exports: buildDiffHunkSeparators, buildDiffLineNumberDigits

import type { PullRequestDiffFileView } from "@synara-web/components/pullRequest/pullRequestCode.logic";

import type { PullRequestCodeHunkSeparator } from "../adapters/PullRequestCodeCompositionElements.lynx";

/**
 * Separators keyed by line id: each one under its hunk row (what the stacked
 * view renders in its place) and under the hunk's first code line (what the
 * split view, which has no hunk rows, finds it by).
 */
export function buildDiffHunkSeparators(
  files: readonly Pick<PullRequestDiffFileView, "lines">[],
): Record<string, PullRequestCodeHunkSeparator> {
  const separators: Record<string, PullRequestCodeHunkSeparator> = {};
  for (const file of files) {
    let lastOldLine = 0;
    let lastNewLine = 0;
    let first = true;
    file.lines.forEach((line, index) => {
      if (line.kind !== "hunk") {
        if (line.oldLine !== null) lastOldLine = line.oldLine;
        if (line.newLine !== null) lastNewLine = line.newLine;
        return;
      }
      const firstCodeLine = file.lines[index + 1];
      if (!firstCodeLine || firstCodeLine.kind === "hunk") return;
      // Unchanged lines advance both sides alike, so either side measures the gap.
      const unmodifiedLines =
        firstCodeLine.newLine !== null
          ? firstCodeLine.newLine - lastNewLine - 1
          : firstCodeLine.oldLine !== null
            ? firstCodeLine.oldLine - lastOldLine - 1
            : 0;
      if (unmodifiedLines > 0) {
        const separator = { unmodifiedLines, first };
        separators[line.id] = separator;
        separators[firstCodeLine.id] = separator;
      }
      first = false;
    });
  }
  return separators;
}

/**
 * For every line id, the digit count of the largest line number in its file:
 * the width upstream's split gutter takes for that file.
 */
export function buildDiffLineNumberDigits(
  files: readonly Pick<PullRequestDiffFileView, "lines">[],
): Record<string, number> {
  const digitsByLineId: Record<string, number> = {};
  for (const file of files) {
    let largest = 0;
    for (const line of file.lines)
      largest = Math.max(largest, line.oldLine ?? 0, line.newLine ?? 0);
    const digits = String(largest).length;
    for (const line of file.lines) digitsByLineId[line.id] = digits;
  }
  return digitsByLineId;
}
