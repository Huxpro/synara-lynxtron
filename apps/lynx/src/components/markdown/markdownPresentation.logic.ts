import type { ComposerPromptSegment } from "@synara-web/composer-editor-mentions";
import { formatComposerSkillChipLabel } from "@synara-web/components/composerInlineChip.logic";
import { dedentCode, parseCodeFenceDisplayInfo } from "@synara-web/lib/codeFenceCore";

const MARKDOWN_CODE_LINE_HEIGHT_PX = 16.5;

export type MarkdownInlineTokenSegment = Exclude<ComposerPromptSegment, { readonly type: "text" }>;

export function resolveMarkdownInlineTokenPresentation(segment: MarkdownInlineTokenSegment): {
  readonly label: string;
  readonly openExternalUrl: string | null;
} {
  let label: string;
  if (segment.type === "mention") {
    label = segment.path.split(/[\\/]/).pop() || segment.path;
  } else if (segment.type === "skill") {
    label = formatComposerSkillChipLabel(segment.name);
  } else if (segment.type === "slash-command") {
    label = `/${segment.command}`;
  } else if (segment.type === "agent-mention") {
    label = `@${segment.alias}`;
  } else if (segment.type === "terminal-context") {
    label = segment.context?.terminalLabel ?? "Terminal context";
  } else {
    label = segment.url;
  }
  return {
    label,
    openExternalUrl: segment.type === "link" ? segment.url : null,
  };
}

export function resolveMarkdownCodeBlockPresentation(input: {
  readonly code: string;
  readonly language: string | null | undefined;
}) {
  const fence = parseCodeFenceDisplayInfo(input.language ?? "text");
  const dedentedCode = dedentCode(input.code);
  const code = dedentedCode.endsWith("\n") ? dedentedCode : `${dedentedCode}\n`;
  return {
    // react-markdown gives Web fenced blocks a trailing newline, while the
    // mdast value used by Lynx omits it. Normalize here so line geometry and
    // copied text follow the same contract on both targets.
    code,
    minimumTextHeightPx: code.split("\n").length * MARKDOWN_CODE_LINE_HEIGHT_PX,
    directory: fence.directory,
    filePath: fence.filePath,
    isFileReference: fence.isFileReference,
    lineRange: fence.lineRange,
    title: fence.isFileReference && fence.fileName ? fence.fileName : fence.language,
  };
}

export function toggleMarkdownCodeWrap(current: boolean): boolean {
  return !current;
}

const UNORDERED_LIST_MARKERS = ["•", "◦", "▪"] as const;

function toLowerAlpha(value: number): string {
  let remaining = Math.max(1, value);
  let result = "";
  while (remaining > 0) {
    remaining -= 1;
    result = String.fromCharCode(97 + (remaining % 26)) + result;
    remaining = Math.floor(remaining / 26);
  }
  return result;
}

const ROMAN_NUMERALS: ReadonlyArray<readonly [number, string]> = [
  [1000, "m"],
  [900, "cm"],
  [500, "d"],
  [400, "cd"],
  [100, "c"],
  [90, "xc"],
  [50, "l"],
  [40, "xl"],
  [10, "x"],
  [9, "ix"],
  [5, "v"],
  [4, "iv"],
  [1, "i"],
];

function toLowerRoman(value: number): string {
  let remaining = Math.max(1, value);
  let result = "";
  for (const [amount, numeral] of ROMAN_NUMERALS) {
    while (remaining >= amount) {
      result += numeral;
      remaining -= amount;
    }
  }
  return result;
}

/**
 * The list marker Electron's `.chat-markdown` list styles draw: decimal → lower-alpha →
 * lower-roman for nested ordered lists, and disc → circle → square for unordered ones.
 * `depth` counts enclosing lists of the same kind, starting at 0.
 */
export function resolveMarkdownListMarker(input: {
  readonly ordered: boolean;
  readonly index: number;
  readonly start?: number | null | undefined;
  readonly depth: number;
}): string {
  if (!input.ordered) {
    return UNORDERED_LIST_MARKERS[Math.min(input.depth, UNORDERED_LIST_MARKERS.length - 1)]!;
  }
  const value = (input.start ?? 1) + input.index;
  const label =
    input.depth === 0
      ? String(value)
      : input.depth === 1
        ? toLowerAlpha(value)
        : toLowerRoman(value);
  return `${label}.`;
}

/** Loose lists keep paragraph margins inside items; tight lists render them flush. */
export function isMarkdownListLoose(list: {
  readonly spread?: boolean;
  readonly children?: ReadonlyArray<{ readonly spread?: boolean }>;
}): boolean {
  return list.spread === true || (list.children ?? []).some((item) => item.spread === true);
}
