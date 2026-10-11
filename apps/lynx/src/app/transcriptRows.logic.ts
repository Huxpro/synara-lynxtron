import type { ThreadTranscriptRow } from "./queries";
import { MAX_VISIBLE_CHANGED_FILES } from "../generated/transcriptCardActions.generated";
import { getChatTranscriptLineHeightPx } from "@synara-web/components/chat/chatTypography";
import type { MarkdownNode } from "../components/markdown/markdownAst.lynx";
import {
  collapseMarkdownSoftBreaks,
  markdownNodePlainText,
  isMarkdownListLoose,
  resolveMarkdownChildSpacing,
  resolveMarkdownTableColumnWeights,
} from "../components/markdown/markdownPresentation.logic";
import { DEFAULT_CHAT_FONT_SIZE_PX, normalizeChatFontSizePx } from "@synara-web/chatFontSize";
import {
  formatAgentActivityEntryPreview,
  isReasoningUpdateWorkEntry,
} from "@synara-web/components/chat/agentActivity.logic";
import { isFileChangeWorkLogEntry } from "@synara-web/session-logic";
import { basenameOfPath } from "@synara-web/file-icons";
import { workEntryDisplayText, workEntryLiveActivityMeta } from "./transcriptWorkEntryText.logic";

export type MessageTranscriptRow = Extract<ThreadTranscriptRow, { kind: "message" }>;
export type WorkLogEntry = Extract<ThreadTranscriptRow, { kind: "work" }>["groupedEntries"][number];

export function resolveTranscriptWorkEntryDisplayText(
  entry: WorkLogEntry,
  nowMs: number = Date.now(),
): string {
  if (isReasoningUpdateWorkEntry(entry)) {
    return formatAgentActivityEntryPreview(entry) ?? entry.label;
  }
  if (isFileChangeWorkLogEntry(entry) && (entry.changedFiles?.length ?? 0) > 0) {
    const changedFiles = entry.changedFiles ?? [];
    return changedFiles.length === 1
      ? `Edited ${basenameOfPath(changedFiles[0] ?? "")}`
      : `Edited ${changedFiles.length} files`;
  }
  // Upstream's sentence for the row, then its state when it is not simply done
  // ("Ran ./release.sh · Failed · 2s elapsed").
  const text = workEntryDisplayText(entry);
  const meta = workEntryLiveActivityMeta(entry, nowMs);
  return meta ? `${text} · ${meta}` : text;
}

const TRANSCRIPT_ESTIMATED_CHARS_PER_LINE = 72;
// Cached markdown trees already carry the renderer's tight/loose block structure.
// This is a size hint, not measured layout or a scroll-follow feedback input.
export interface TranscriptScrollToPositionParams {
  readonly position: number;
  readonly offset: number;
  readonly alignTo: "bottom";
  readonly smooth: boolean;
}

export interface TranscriptScrollDetail {
  readonly deltaY?: number;
  readonly eventSource?: number;
  readonly listHeight?: number;
  readonly scrollHeight?: number;
  readonly scrollTop?: number;
}

export function resolveTranscriptPinnedFromSample(input: {
  readonly currentPinned: boolean;
  readonly previousScrollTop: number | null;
  readonly scrollTop: number;
  readonly scrollHeight: number;
  readonly listHeight: number;
  readonly bottomEpsilon: number;
}): boolean {
  if (input.previousScrollTop !== null && input.scrollTop < input.previousScrollTop - 1) {
    return false;
  }
  if (input.scrollTop + input.listHeight >= input.scrollHeight - input.bottomEpsilon) {
    return true;
  }
  return input.currentPinned;
}

export function resolveTranscriptPinnedFromScroll(input: {
  readonly currentPinned: boolean;
  readonly detail: TranscriptScrollDetail | undefined;
  readonly isWebRelayMode: boolean;
  readonly nativeUserEventSource: number;
  readonly bottomEpsilon: number;
}): boolean {
  const { detail } = input;
  if (!detail) return input.currentPinned;

  if (input.isWebRelayMode) {
    // Some Lynx-for-Web releases expose the native `lynxscroll` shape without
    // eventSource/listHeight. Keep a negative-delta fallback for those builds;
    // the host metrics sample remains authoritative for live-edge reattachment.
    return typeof detail.deltaY === "number" && detail.deltaY < 0 ? false : input.currentPinned;
  }

  if (
    detail.eventSource !== input.nativeUserEventSource ||
    detail.scrollTop === undefined ||
    detail.scrollHeight === undefined ||
    detail.listHeight === undefined
  ) {
    return input.currentPinned;
  }
  return detail.scrollTop + detail.listHeight >= detail.scrollHeight - input.bottomEpsilon;
}

export function buildTranscriptScrollToBottomParams(
  rowCount: number,
  trailingChromeRowCount = 0,
): TranscriptScrollToPositionParams | null {
  const targetCount = rowCount + trailingChromeRowCount;
  if (targetCount <= 0) return null;
  return {
    position: targetCount - 1,
    offset: 0,
    alignTo: "bottom",
    smooth: false,
  };
}

export function estimateTranscriptRowMainAxisSize(
  row: ThreadTranscriptRow,
  chatFontSizePx = DEFAULT_CHAT_FONT_SIZE_PX,
): number {
  if (row.kind !== "message") return 96;

  const normalizedChatFontSizePx = normalizeChatFontSizePx(chatFontSizePx);
  const typographyScale = normalizedChatFontSizePx / DEFAULT_CHAT_FONT_SIZE_PX;
  const estimatedCharsPerLine = TRANSCRIPT_ESTIMATED_CHARS_PER_LINE / typographyScale;
  const lineHeight = getChatTranscriptLineHeightPx(normalizedChatFontSizePx);
  const variant = row.message.role === "user" ? "user" : "assistant";
  const textHeight = (text: string) =>
    text
      .split("\n")
      .reduce(
        (height, line) =>
          height + Math.max(1, Math.ceil(line.length / estimatedCharsPerLine)) * lineHeight,
        0,
      );
  const nodeHeight = (node: MarkdownNode, tight = false): number => {
    const children = node.children ?? [];
    if (["root", "list", "listItem", "blockquote"].includes(node.type)) {
      const spacing = resolveMarkdownChildSpacing({ parent: node, variant, tight });
      return children.reduce((height, child, index) => {
        const childTight =
          node.type === "list" ? !isMarkdownListLoose(node) : node.type === "listItem" && tight;
        const gap = spacing[index];
        const pixels = (value: { value: number; unit: string } | undefined) =>
          (value?.value ?? 0) * (value?.unit === "em" ? normalizedChatFontSizePx : 1);
        return (
          height +
          nodeHeight(child, childTight) +
          pixels(gap?.marginTop) +
          pixels(gap?.marginBottom)
        );
      }, 0);
    }
    if (node.type === "table") {
      const cells = children.map((row) => (row.children ?? []).map(markdownNodePlainText));
      const weights = resolveMarkdownTableColumnWeights(cells);
      const totalWeight = weights.reduce((sum, weight) => sum + weight, 0) || 1;
      return (
        2 +
        cells.reduce(
          (height, row) =>
            height +
            12.2 +
            Math.max(
              lineHeight,
              ...row.map(
                (cell, index) =>
                  Math.ceil(
                    cell.length /
                      Math.max(1, (estimatedCharsPerLine * (weights[index] ?? 1)) / totalWeight),
                  ) * lineHeight,
              ),
            ),
          0,
        )
      );
    }
    if (node.type === "code") {
      // The existing code header (24px control + 3.2px padding) and pre's 16px padding.
      return 43.2 + textHeight(node.value ?? "");
    }
    const text = markdownNodePlainText(node);
    return textHeight(
      variant === "assistant" && node.type !== "code" ? collapseMarkdownSoftBreaks(text) : text,
    );
  };
  // Missing trees are transient during derivation. Use line boxes without
  // inventing a paragraph margin for every soft newline.
  const bodyHeight = row.markdownTree
    ? nodeHeight(row.markdownTree)
    : textHeight(row.message.text ?? "");
  const fileCount = row.assistantTurnInProgress
    ? 0
    : (row.assistantTurnDiffSummary?.files.length ?? 0);
  // Default expanded changes card: 3em summary, header padding/border, outer
  // margins/borders and its existing 40.5px file rows (last row omits a border).
  const changesHeight =
    fileCount > 0
      ? normalizedChatFontSizePx * 3 + 26 + Math.min(fileCount, MAX_VISIBLE_CHANGED_FILES) * 40.5
      : 0;
  return Math.max(100, 72 + bodyHeight + changesHeight);
}

export function resolveMessageWorkPlacement(row: MessageTranscriptRow) {
  const collapsedTurnItems = row.collapsedTurnItems ?? [];
  const hasCollapsedWork = collapsedTurnItems.length > 0;
  return {
    collapsedTurnItems,
    hasCollapsedWork,
    leadingWorkEntries: hasCollapsedWork ? [] : (row.leadingWorkEntries ?? []),
    inlineWorkEntries: hasCollapsedWork ? [] : (row.inlineWorkEntries ?? []),
  };
}

export function transcriptRowVersion(row: ThreadTranscriptRow | undefined): string {
  if (!row) return "";
  if (row.kind === "message") {
    const workVersion = [
      ...(row.leadingWorkEntries ?? []),
      ...(row.inlineWorkEntries ?? []),
      ...(row.collapsedTurnItems ?? []).flatMap((item) =>
        item.kind === "work" ? [item.entry] : [],
      ),
    ]
      .map((entry) => `${entry.id}:${entry.label}:${entry.detail ?? ""}:${entry.toolStatus ?? ""}`)
      .join("|");
    return `${row.message.text}:${row.message.streaming}:${row.collapsedWorkElapsed ?? ""}:${workVersion}`;
  }
  if (row.kind === "work") {
    return row.groupedEntries
      .map((entry) => `${entry.id}:${entry.label}:${entry.detail ?? ""}:${entry.toolStatus ?? ""}`)
      .join("|");
  }
  // The plan card and a message segment draw their text, so an update to it is a new version.
  if (row.kind === "proposed-plan") {
    return `${row.id}:${row.proposedPlan.updatedAt}:${row.proposedPlan.planMarkdown.length}`;
  }
  if (row.kind === "message-segment") {
    return `${row.id}:${row.message.textSegments?.[row.segmentIndex]?.text ?? row.message.text}`;
  }
  return row.id;
}
