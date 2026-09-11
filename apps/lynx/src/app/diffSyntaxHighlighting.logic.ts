import type {
  PullRequestCodeSyntaxToken,
  PullRequestDiffFileView,
} from '@synara-web/components/pullRequest/pullRequestCode.logic';

import type { NativeSyntaxHighlightThemes } from '../main/syntaxHighlightingContract.logic';

export interface DiffSyntaxHighlightRequest {
  readonly code: string;
  readonly lineIds: readonly string[];
  readonly path: string;
}

export const DIFF_INITIAL_VISIBLE_FILE_COUNT = 24;
export const DIFF_MORE_VISIBLE_FILE_COUNT = 24;

export function visibleDiffFiles(
  files: readonly PullRequestDiffFileView[],
  visibleFileCount: number,
  selectedPath: string | null
): readonly PullRequestDiffFileView[] {
  const boundedCount = Math.max(0, Math.min(files.length, visibleFileCount));
  const selectedIndex = selectedPath
    ? files.findIndex((file) => file.path === selectedPath)
    : -1;
  const visible = files.slice(0, boundedCount);
  if (selectedIndex >= boundedCount) visible.push(files[selectedIndex]!);
  return visible;
}

function isSourceLine(kind: string): boolean {
  return kind !== 'hunk' && !kind.startsWith('no-newline-');
}

export function buildDiffSyntaxHighlightRequests(
  files: readonly PullRequestDiffFileView[]
): DiffSyntaxHighlightRequest[] {
  return files.flatMap((file) => {
    const oldLines = file.lines.filter(
      (line) =>
        isSourceLine(line.kind) &&
        (line.kind === 'context' || line.kind === 'deletion')
    );
    const newLines = file.lines.filter(
      (line) =>
        isSourceLine(line.kind) &&
        (line.kind === 'context' || line.kind === 'addition')
    );
    return [oldLines, newLines]
      .filter((lines) => lines.length > 0)
      .map((lines) => ({
        code: lines.map((line) => line.text).join('\n'),
        lineIds: lines.map((line) => line.id),
        path: file.path,
      }));
  });
}

export function mergeDiffSyntaxHighlightResults(input: {
  readonly requests: readonly DiffSyntaxHighlightRequest[];
  readonly results: readonly (NativeSyntaxHighlightThemes | null)[];
  readonly theme: 'dark' | 'light';
}): Readonly<Record<string, readonly PullRequestCodeSyntaxToken[]>> {
  const tokensByLineId: Record<string, readonly PullRequestCodeSyntaxToken[]> = {};
  input.requests.forEach((request, requestIndex) => {
    const highlighted = input.results[requestIndex]?.[input.theme];
    if (!highlighted || highlighted.lines.length !== request.lineIds.length) {
      return;
    }
    request.lineIds.forEach((lineId, lineIndex) => {
      // Context lines occur in both streams. Either side is source-identical,
      // so retaining the first successful token stream keeps the mapping stable.
      tokensByLineId[lineId] ??= highlighted.lines[lineIndex] ?? [];
    });
  });
  return tokensByLineId;
}
