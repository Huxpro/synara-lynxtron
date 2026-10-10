// FILE: app/diffDockVisibleFile.logic.ts
// Purpose: Which file of the patch sits under the top of the diff viewport, from
//   measured rectangles. Upstream answers the same question from DOM anchors
//   (`resolveVisibleDiffFilePath` in hooks/useVisibleDiffFilePath.ts). That module
//   and its `diffScrollSurface` helper are typed against the DOM, so the rule is
//   restated here over rectangles; the stepping itself is upstream's
//   `resolveAdjacentDiffFilePath`.
// Layer: Lynx diff dock logic

/** Upstream's VISIBLE_DIFF_FILE_TOLERANCE_PX (not exported there). */
export const VISIBLE_DIFF_FILE_TOLERANCE_PX = 8;

export interface DiffDockFileTop {
  readonly path: string;
  /** Window y of the file's box; `null` while the file is not mounted. */
  readonly top: number | null;
}

/**
 * The last file whose top edge is at or above the viewport's top (plus upstream's
 * tolerance), or the first file while none has scrolled that far. `null` when no
 * file is laid out.
 */
export function resolveVisibleDiffDockFilePath(input: {
  readonly viewportTop: number;
  readonly files: readonly DiffDockFileTop[];
}): string | null {
  const mounted = input.files.filter(
    (file): file is { path: string; top: number } => file.top !== null,
  );
  if (mounted.length === 0) return null;
  const threshold = input.viewportTop + VISIBLE_DIFF_FILE_TOLERANCE_PX;
  // Files stack in order, so the last one at or above the threshold is the visible one.
  let index = 0;
  for (let candidate = 0; candidate < mounted.length; candidate += 1) {
    if (mounted[candidate]!.top <= threshold) index = candidate;
  }
  return mounted[index]?.path ?? null;
}
