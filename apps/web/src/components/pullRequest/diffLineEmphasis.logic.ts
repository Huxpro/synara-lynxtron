import { diffWordsWithSpace } from "diff";

import type { PullRequestCodeSyntaxToken } from "./pullRequestCode.logic";

interface TextRange {
  readonly end: number;
  readonly start: number;
}

function changedRanges(before: string, after: string) {
  let beforeOffset = 0;
  let afterOffset = 0;
  const beforeRanges: TextRange[] = [];
  const afterRanges: TextRange[] = [];
  for (const change of diffWordsWithSpace(before, after)) {
    const length = change.value.length;
    if (change.removed) {
      beforeRanges.push({ start: beforeOffset, end: beforeOffset + length });
      beforeOffset += length;
    } else if (change.added) {
      afterRanges.push({ start: afterOffset, end: afterOffset + length });
      afterOffset += length;
    } else {
      beforeOffset += length;
      afterOffset += length;
    }
  }
  return { before: beforeRanges, after: afterRanges };
}

function splitTokensAtRanges(
  tokens: readonly PullRequestCodeSyntaxToken[],
  ranges: readonly TextRange[],
): PullRequestCodeSyntaxToken[] {
  const result: PullRequestCodeSyntaxToken[] = [];
  let offset = 0;
  for (const token of tokens) {
    const tokenStart = offset;
    const tokenEnd = tokenStart + token.content.length;
    const boundaries = new Set([tokenStart, tokenEnd]);
    for (const range of ranges) {
      if (range.start > tokenStart && range.start < tokenEnd) boundaries.add(range.start);
      if (range.end > tokenStart && range.end < tokenEnd) boundaries.add(range.end);
    }
    const points = [...boundaries].sort((left, right) => left - right);
    for (let index = 0; index < points.length - 1; index += 1) {
      const start = points[index]!;
      const end = points[index + 1]!;
      result.push({
        ...token,
        content: token.content.slice(start - tokenStart, end - tokenStart),
        emphasized: ranges.some((range) => start >= range.start && end <= range.end),
      });
    }
    offset = tokenEnd;
  }
  return result;
}

export function emphasizePairedDiffTokens(input: {
  readonly addition: {
    readonly text: string;
    readonly tokens: readonly PullRequestCodeSyntaxToken[];
  };
  readonly deletion: {
    readonly text: string;
    readonly tokens: readonly PullRequestCodeSyntaxToken[];
  };
}) {
  const ranges = changedRanges(input.deletion.text, input.addition.text);
  return {
    deletion: splitTokensAtRanges(input.deletion.tokens, ranges.before),
    addition: splitTokensAtRanges(input.addition.tokens, ranges.after),
  };
}
