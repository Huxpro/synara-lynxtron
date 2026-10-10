import type { ComposerPromptSegment } from "@synara-web/composer-editor-mentions";
import { formatComposerSkillChipLabel } from "@synara-web/components/composerInlineChip.logic";
import { dedentCode, parseCodeFenceDisplayInfo } from "@synara-web/lib/codeFenceCore";

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
  const displayCode = code.replace(/\n$/, "");
  return {
    // react-markdown gives Web fenced blocks a trailing newline, while the
    // mdast value used by Lynx omits it. Normalize here so copied text follows
    // the same contract on both targets.
    code,
    // What is drawn: a `<pre>` does not give its final newline a line box, a
    // Lynx `<text>` does, so the drawn text ends on the last line of code.
    displayCode,
    lineCount: displayCode.split("\n").length,
    // A file fence is highlighted by its own path; a language fence by name.
    highlightPath:
      fence.isFileReference && fence.filePath
        ? fence.filePath
        : resolveMarkdownCodeHighlightPath(fence.language),
    directory: fence.directory,
    filePath: fence.filePath,
    isFileReference: fence.isFileReference,
    lineRange: fence.lineRange,
    title: fence.isFileReference && fence.fileName ? fence.fileName : fence.language,
  };
}

// The host highlighter picks a grammar by file extension; a fence names a
// language. Names that are not already an extension map here.
const CODE_LANGUAGE_EXTENSIONS: Readonly<Record<string, string>> = {
  bash: "sh",
  shell: "sh",
  zsh: "sh",
  console: "sh",
  javascript: "js",
  typescript: "ts",
  python: "py",
  ruby: "rb",
  rust: "rs",
  golang: "go",
  kotlin: "kt",
  csharp: "cs",
  "c++": "cpp",
  markdown: "md",
  yml: "yaml",
  dockerfile: "dockerfile",
};

/** The path the host highlighter is asked about, or `null` for plain text. */
export function resolveMarkdownCodeHighlightPath(
  language: string | null | undefined,
): string | null {
  const name = (language ?? "").trim().toLowerCase();
  if (!name || name === "text" || name === "plaintext" || name === "txt") return null;
  return `snippet.${CODE_LANGUAGE_EXTENSIONS[name] ?? name}`;
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

/**
 * Soft line breaks of authored (assistant) markdown. The Web paragraph collapses
 * a newline inside a text node to one space; a Lynx `<text>` would draw it as a
 * line break.
 */
export function collapseMarkdownSoftBreaks(value: string): string {
  return value.replace(/[ \t]*\r?\n[ \t]*/g, " ");
}

/**
 * Relative widths of a table's columns. The Web table is `table-layout: auto`,
 * which shares the width by the columns' content; Lynx has no table layout, so
 * each column grows by its longest cell (in characters, floored so a narrow
 * column keeps room for a short word).
 */
export function resolveMarkdownTableColumnWeights(
  rows: ReadonlyArray<ReadonlyArray<string>>,
): number[] {
  const weights: number[] = [];
  for (const row of rows) {
    row.forEach((cell, index) => {
      weights[index] = Math.max(weights[index] ?? 0, cell.trim().length);
    });
  }
  return weights.map((weight) => Math.max(4, weight));
}

/** Plain text of an inline subtree, for measuring a table cell. */
export function markdownNodePlainText(node: MarkdownSpacingNode & { value?: string }): string {
  if (typeof node.value === "string") return node.value;
  return (node.children ?? []).map((child) => markdownNodePlainText(child)).join("");
}

// ── Block spacing ───────────────────────────────────────────────────────────
//
// `.chat-markdown` (apps/web/src/index.css) spaces blocks with vertical margins
// that collapse: two neighbours are separated by the larger of their margins,
// and a first/last child's margin passes through a parent without padding (a
// list, an item, a blockquote). Lynx lays blocks out in a flex column, where
// margins add up, so the gap each block needs is resolved here and applied as
// the only vertical margin.

export interface MarkdownSpacingNode {
  readonly type: string;
  readonly depth?: number;
  readonly spread?: boolean;
  readonly children?: ReadonlyArray<MarkdownSpacingNode>;
}

/** `px`, or `em` of the block's own font size (headings scale with the chat font). */
export interface MarkdownSpacing {
  readonly value: number;
  readonly unit: "px" | "em";
}

const NO_SPACING: MarkdownSpacing = { value: 0, unit: "px" };
// rem is 16px in the Web app: 0.65rem, 0.45rem (user bubble), 1.5rem, 0.85rem, 0.25rem.
const BLOCK_MARGIN_PX = 10.4;
const USER_BLOCK_MARGIN_PX = 7.2;
const RULE_MARGIN_PX = 24;
const MATH_BLOCK_MARGIN_PX = 13.6;
const LIST_ITEM_GAP_PX = 4;
const HEADING_MARGIN_TOP_EM = 1.1;
const HEADING_AFTER_PARENT_HEADING_MARGIN_TOP_EM = 0.5;
const COLLAPSE_THROUGH_TYPES = new Set(["list", "listItem", "blockquote"]);

interface SpacingPosition {
  readonly previous: MarkdownSpacingNode | null;
  readonly index: number;
  /** Inside a tight list item: paragraphs have no margins. */
  readonly tight: boolean;
  readonly variant: "assistant" | "user";
}

function larger(left: MarkdownSpacing, right: MarkdownSpacing): MarkdownSpacing {
  // A heading's top margin (1.1em or 0.5em of at least the chat font size) is
  // above every px margin of this stylesheet's range of chat font sizes, and
  // its bottom margin (0.35em) below them, so `em` only ever comes from a
  // heading's top and always wins.
  if (left.unit === "em") return left;
  if (right.unit === "em") return right;
  return left.value >= right.value ? left : right;
}

function ownTopMargin(node: MarkdownSpacingNode, position: SpacingPosition): MarkdownSpacing {
  switch (node.type) {
    case "heading":
      return {
        unit: "em",
        value:
          position.previous?.type === "heading" &&
          (position.previous.depth ?? 0) + 1 === (node.depth ?? 0)
            ? HEADING_AFTER_PARENT_HEADING_MARGIN_TOP_EM
            : HEADING_MARGIN_TOP_EM,
      };
    case "listItem":
      return { unit: "px", value: position.index > 0 ? LIST_ITEM_GAP_PX : 0 };
    default:
      return ownBottomMargin(node, position);
  }
}

function ownBottomMargin(node: MarkdownSpacingNode, position: SpacingPosition): MarkdownSpacing {
  const blockMargin = position.variant === "user" ? USER_BLOCK_MARGIN_PX : BLOCK_MARGIN_PX;
  switch (node.type) {
    case "paragraph":
      return position.tight ? NO_SPACING : { unit: "px", value: blockMargin };
    case "list":
    case "blockquote":
    case "table":
    case "html":
      return { unit: "px", value: blockMargin };
    // `.chat-markdown-codeblock` keeps 0.65rem in the user bubble too.
    case "code":
      return { unit: "px", value: BLOCK_MARGIN_PX };
    case "math":
      return { unit: "px", value: MATH_BLOCK_MARGIN_PX };
    case "thematicBreak":
      return { unit: "px", value: RULE_MARGIN_PX };
    // A heading's 0.35em bottom margin never exceeds the next block's top (see `larger`).
    default:
      return NO_SPACING;
  }
}

function childPosition(
  parent: MarkdownSpacingNode,
  index: number,
  position: SpacingPosition,
): SpacingPosition {
  const children = parent.children ?? [];
  return {
    previous: index > 0 ? (children[index - 1] ?? null) : null,
    index,
    tight:
      parent.type === "list"
        ? !isMarkdownListLoose(parent)
        : parent.type === "listItem"
          ? position.tight
          : false,
    variant: position.variant,
  };
}

function nestedTopMargin(node: MarkdownSpacingNode, position: SpacingPosition): MarkdownSpacing {
  const first = node.children?.[0];
  if (!first || !COLLAPSE_THROUGH_TYPES.has(node.type)) return NO_SPACING;
  return effectiveTopMargin(first, childPosition(node, 0, position));
}

function nestedBottomMargin(node: MarkdownSpacingNode, position: SpacingPosition): MarkdownSpacing {
  const children = node.children ?? [];
  const last = children[children.length - 1];
  if (!last || !COLLAPSE_THROUGH_TYPES.has(node.type)) return NO_SPACING;
  return effectiveBottomMargin(last, childPosition(node, children.length - 1, position));
}

function effectiveTopMargin(node: MarkdownSpacingNode, position: SpacingPosition): MarkdownSpacing {
  return larger(ownTopMargin(node, position), nestedTopMargin(node, position));
}

function effectiveBottomMargin(
  node: MarkdownSpacingNode,
  position: SpacingPosition,
): MarkdownSpacing {
  // A heading's own bottom margin is the one px-vs-em case that matters to a
  // following block; it is below every block margin, so it is left out.
  return larger(ownBottomMargin(node, position), nestedBottomMargin(node, position));
}

export interface MarkdownChildSpacing {
  readonly marginTop: MarkdownSpacing;
  readonly marginBottom: MarkdownSpacing;
}

/**
 * The vertical margins of a container's block children. Inside a list, an item
 * or a blockquote the outer margins belong to the container (they collapsed
 * through it); at the root they are dropped, as `.chat-markdown > :first-child`
 * and `> :last-child` do, except for what collapsed through that child.
 */
export function resolveMarkdownChildSpacing(input: {
  readonly parent: MarkdownSpacingNode;
  readonly variant: "assistant" | "user";
  /** The parent is (inside) a tight list item. */
  readonly tight?: boolean;
}): MarkdownChildSpacing[] {
  const children = input.parent.children ?? [];
  const parentPosition: SpacingPosition = {
    previous: null,
    index: 0,
    tight: input.tight === true,
    variant: input.variant,
  };
  const isRoot = input.parent.type === "root";
  return children.map((child, index) => {
    const position = childPosition(input.parent, index, parentPosition);
    const previous = position.previous;
    const marginTop = previous
      ? larger(
          effectiveBottomMargin(previous, childPosition(input.parent, index - 1, parentPosition)),
          effectiveTopMargin(child, position),
        )
      : isRoot
        ? nestedTopMargin(child, position)
        : NO_SPACING;
    const marginBottom =
      isRoot && index === children.length - 1 ? nestedBottomMargin(child, position) : NO_SPACING;
    return { marginTop, marginBottom };
  });
}

function spacingCss(value: MarkdownSpacing | undefined): string {
  return value && value.value !== 0 ? `${value.value}${value.unit}` : "0px";
}

export function markdownSpacingStyle(spacing: MarkdownChildSpacing | undefined): {
  marginTop: string;
  marginBottom: string;
} {
  return {
    marginTop: spacingCss(spacing?.marginTop),
    marginBottom: spacingCss(spacing?.marginBottom),
  };
}
