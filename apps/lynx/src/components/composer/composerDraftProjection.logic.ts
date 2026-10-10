import type { ProviderMentionReference, ProviderSkillReference } from "@synara/contracts";
import {
  formatTerminalContextLabel,
  INLINE_TERMINAL_CONTEXT_PLACEHOLDER,
  type TerminalContextDraft,
} from "@synara-web/lib/terminalContext";
import { formatComposerSkillChipLabel } from "@synara-web/components/composerInlineChip.logic";

export const NATIVE_COMPOSER_TOKEN_ANCHOR = "\u2063";

export interface NativeComposerDisplayToken {
  readonly canonicalText: string;
  readonly key: string;
  readonly kind: "mention" | "skill" | "terminal-context";
  readonly label: string;
}

export interface NativeComposerDraftProjection {
  readonly canonicalText: string;
  readonly displayText: string;
  readonly displayTokens: ReadonlyArray<NativeComposerDisplayToken>;
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly plainSegments: ReadonlyArray<string>;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
  readonly terminalContexts: ReadonlyArray<TerminalContextDraft>;
}

export interface NativeComposerProjectionEdit {
  readonly canonicalSelectionEnd: number;
  readonly canonicalSelectionStart: number;
  readonly canonicalText: string;
  readonly displaySelectionEnd: number;
  readonly displaySelectionStart: number;
  readonly displayText: string;
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
  readonly terminalContexts: ReadonlyArray<TerminalContextDraft>;
}

interface TokenRange {
  readonly canonicalText: string;
  readonly end: number;
  readonly key: string;
  readonly kind: "mention" | "skill" | "terminal-context";
  readonly label: string;
  readonly start: number;
}

function escaped(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectMentionRanges(
  canonicalText: string,
  mentions: ReadonlyArray<ProviderMentionReference>,
): TokenRange[] {
  const ranges: TokenRange[] = [];
  for (const mention of mentions) {
    const candidates = [`@"${mention.name.replaceAll('"', '\\"')}"`, `@${mention.name}`];
    for (const candidate of candidates) {
      let offset = 0;
      while (offset < canonicalText.length) {
        const start = canonicalText.indexOf(candidate, offset);
        if (start === -1) break;
        ranges.push({
          canonicalText: candidate,
          end: start + candidate.length,
          key: `mention:${mention.path}`,
          kind: "mention",
          label: mention.name,
          start,
        });
        offset = start + candidate.length;
      }
    }
  }
  return ranges;
}

function collectSkillRanges(
  canonicalText: string,
  skills: ReadonlyArray<ProviderSkillReference>,
): TokenRange[] {
  const ranges: TokenRange[] = [];
  for (const skill of skills) {
    const matcher = new RegExp(`(^|\\s)([$/])${escaped(skill.name)}(?=\\s|$)`, "g");
    for (const match of canonicalText.matchAll(matcher)) {
      const whitespace = match[1] ?? "";
      const token = `${match[2] ?? "/"}${skill.name}`;
      const start = (match.index ?? 0) + whitespace.length;
      ranges.push({
        canonicalText: token,
        end: start + token.length,
        key: `skill:${skill.path}`,
        kind: "skill",
        label: formatComposerSkillChipLabel(skill.name),
        start,
      });
    }
  }
  return ranges;
}

function collectTerminalContextRanges(
  canonicalText: string,
  terminalContexts: ReadonlyArray<TerminalContextDraft>,
): TokenRange[] {
  const ranges: TokenRange[] = [];
  let contextIndex = 0;
  for (let index = 0; index < canonicalText.length; index += 1) {
    if (canonicalText[index] !== INLINE_TERMINAL_CONTEXT_PLACEHOLDER) continue;
    const context = terminalContexts[contextIndex];
    contextIndex += 1;
    if (!context) continue;
    ranges.push({
      canonicalText: INLINE_TERMINAL_CONTEXT_PLACEHOLDER,
      end: index + 1,
      key: `terminal-context:${context.id}`,
      kind: "terminal-context",
      label: formatTerminalContextLabel(context),
      start: index,
    });
  }
  return ranges;
}

function nonOverlappingRanges(ranges: ReadonlyArray<TokenRange>): TokenRange[] {
  const sorted = [...ranges].sort(
    (left, right) => left.start - right.start || right.end - right.start - (left.end - left.start),
  );
  const result: TokenRange[] = [];
  for (const range of sorted) {
    const previous = result[result.length - 1];
    if (previous && range.start < previous.end) continue;
    result.push(range);
  }
  return result;
}

export function createNativeComposerDraftProjection(input: {
  readonly canonicalText: string;
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
  readonly terminalContexts?: ReadonlyArray<TerminalContextDraft>;
}): NativeComposerDraftProjection {
  const ranges = nonOverlappingRanges([
    ...collectTerminalContextRanges(input.canonicalText, input.terminalContexts ?? []),
    ...collectMentionRanges(input.canonicalText, input.mentions),
    ...collectSkillRanges(input.canonicalText, input.skills),
  ]);
  const plainSegments: string[] = [];
  const displayTokens: NativeComposerDisplayToken[] = [];
  let cursor = 0;
  for (const range of ranges) {
    plainSegments.push(input.canonicalText.slice(cursor, range.start));
    displayTokens.push({
      canonicalText: range.canonicalText,
      key: range.key,
      kind: range.kind,
      label: range.label,
    });
    cursor = range.end;
  }
  plainSegments.push(input.canonicalText.slice(cursor));
  return {
    canonicalText: input.canonicalText,
    displayText: plainSegments.join(NATIVE_COMPOSER_TOKEN_ANCHOR),
    displayTokens,
    mentions: input.mentions,
    plainSegments,
    skills: input.skills,
    terminalContexts: input.terminalContexts ?? [],
  };
}

function editDistance(left: string, right: string): number {
  const previous = Array.from({ length: right.length + 1 }, (_, index) => index);
  for (let leftIndex = 1; leftIndex <= left.length; leftIndex += 1) {
    const current = [leftIndex];
    for (let rightIndex = 1; rightIndex <= right.length; rightIndex += 1) {
      current[rightIndex] = Math.min(
        current[rightIndex - 1]! + 1,
        previous[rightIndex]! + 1,
        previous[rightIndex - 1]! + (left[leftIndex - 1] === right[rightIndex - 1] ? 0 : 1),
      );
    }
    previous.splice(0, previous.length, ...current);
  }
  return previous[right.length] ?? 0;
}

function combinations(count: number, choose: number, start = 0, prefix: number[] = []): number[][] {
  if (choose === 0) return [prefix];
  const result: number[][] = [];
  for (let index = start; index <= count - choose; index += 1) {
    result.push(...combinations(count, choose - 1, index + 1, [...prefix, index]));
  }
  return result;
}

function expectedPlainSegments(
  projection: NativeComposerDraftProjection,
  retainedTokenIndexes: ReadonlyArray<number>,
): string[] {
  const result: string[] = [];
  let plainStart = 0;
  for (const tokenIndex of retainedTokenIndexes) {
    result.push(projection.plainSegments.slice(plainStart, tokenIndex + 1).join(""));
    plainStart = tokenIndex + 1;
  }
  result.push(projection.plainSegments.slice(plainStart).join(""));
  return result;
}

function retainedTokenIndexes(
  projection: NativeComposerDraftProjection,
  nextPlainSegments: ReadonlyArray<string>,
): number[] {
  const retainedCount = Math.min(nextPlainSegments.length - 1, projection.displayTokens.length);
  let best: number[] = [];
  let bestScore = Number.POSITIVE_INFINITY;
  for (const candidate of combinations(projection.displayTokens.length, retainedCount)) {
    const expected = expectedPlainSegments(projection, candidate);
    const score = expected.reduce(
      (total, segment, index) => total + editDistance(segment, nextPlainSegments[index] ?? ""),
      0,
    );
    if (score < bestScore) {
      best = candidate;
      bestScore = score;
    }
  }
  return best;
}

function canonicalOffset(input: {
  readonly displayOffset: number;
  readonly plainSegments: ReadonlyArray<string>;
  readonly tokens: ReadonlyArray<NativeComposerDisplayToken>;
}): number {
  let displayCursor = 0;
  let canonicalCursor = 0;
  for (let index = 0; index < input.plainSegments.length; index += 1) {
    const plain = input.plainSegments[index] ?? "";
    if (input.displayOffset <= displayCursor + plain.length) {
      return canonicalCursor + input.displayOffset - displayCursor;
    }
    displayCursor += plain.length;
    canonicalCursor += plain.length;
    const token = input.tokens[index];
    if (!token) break;
    if (input.displayOffset === displayCursor) return canonicalCursor;
    displayCursor += NATIVE_COMPOSER_TOKEN_ANCHOR.length;
    canonicalCursor += token.canonicalText.length;
  }
  return canonicalCursor;
}

/**
 * Whether the native editor has to be rewritten to show `displayText`.
 *
 * `appliedDisplayText` is the last text known to be in the editor: what a sync
 * wrote there, or what the user typed (the input handler records every edit).
 * A sync writes the whole value and puts the caret at its end, so it must run
 * only when the draft differs from what the editor shows (a restored draft, a
 * token the projection collapsed, undo), never as an echo of the user's own
 * keystroke.
 */
export function nativeComposerEditorNeedsSync(input: {
  readonly appliedDisplayText: string | null;
  readonly displayText: string;
  readonly nativeValue: string;
}): boolean {
  return input.appliedDisplayText !== input.displayText || input.nativeValue !== input.displayText;
}

export function applyNativeComposerDisplayEdit(input: {
  readonly displaySelectionEnd: number;
  readonly displaySelectionStart: number;
  readonly displayText: string;
  readonly projection: NativeComposerDraftProjection;
}): NativeComposerProjectionEdit {
  const plainSegments = input.displayText.split(NATIVE_COMPOSER_TOKEN_ANCHOR);
  const indexes = retainedTokenIndexes(input.projection, plainSegments);
  const tokens = indexes.map((index) => input.projection.displayTokens[index]!);
  let canonicalText = plainSegments[0] ?? "";
  for (let index = 0; index < tokens.length; index += 1) {
    canonicalText += tokens[index]!.canonicalText;
    canonicalText += plainSegments[index + 1] ?? "";
  }
  const retainedKeys = new Set(tokens.map((token) => token.key));
  return {
    canonicalSelectionEnd: canonicalOffset({
      displayOffset: input.displaySelectionEnd,
      plainSegments,
      tokens,
    }),
    canonicalSelectionStart: canonicalOffset({
      displayOffset: input.displaySelectionStart,
      plainSegments,
      tokens,
    }),
    canonicalText,
    displaySelectionEnd: input.displaySelectionEnd,
    displaySelectionStart: input.displaySelectionStart,
    displayText: input.displayText,
    mentions: input.projection.mentions.filter((mention) =>
      retainedKeys.has(`mention:${mention.path}`),
    ),
    skills: input.projection.skills.filter((skill) => retainedKeys.has(`skill:${skill.path}`)),
    terminalContexts: input.projection.terminalContexts.filter((context) =>
      retainedKeys.has(`terminal-context:${context.id}`),
    ),
  };
}

export function displayOffsetForCanonicalOffset(input: {
  readonly canonicalOffset: number;
  readonly projection: NativeComposerDraftProjection;
}): number {
  let canonicalCursor = 0;
  let displayCursor = 0;
  for (let index = 0; index < input.projection.plainSegments.length; index += 1) {
    const plain = input.projection.plainSegments[index] ?? "";
    if (input.canonicalOffset <= canonicalCursor + plain.length) {
      return displayCursor + input.canonicalOffset - canonicalCursor;
    }
    canonicalCursor += plain.length;
    displayCursor += plain.length;
    const token = input.projection.displayTokens[index];
    if (!token) break;
    if (input.canonicalOffset <= canonicalCursor + token.canonicalText.length) {
      return displayCursor + NATIVE_COMPOSER_TOKEN_ANCHOR.length;
    }
    canonicalCursor += token.canonicalText.length;
    displayCursor += NATIVE_COMPOSER_TOKEN_ANCHOR.length;
  }
  return displayCursor;
}
