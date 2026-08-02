import type { ThreadTranscriptRow } from './queries';

export type MessageTranscriptRow = Extract<ThreadTranscriptRow, { kind: 'message' }>;
export type WorkLogEntry = Extract<ThreadTranscriptRow, { kind: 'work' }>['groupedEntries'][number];

const TRANSCRIPT_ESTIMATED_CHARS_PER_LINE = 72;
const TRANSCRIPT_ESTIMATED_LINE_HEIGHT_PX = 28;
const TRANSCRIPT_MARKDOWN_BLOCK_GAP_PX = 18;
const TRANSCRIPT_END_CLAMP_OFFSET_PX = 1_000_000;

export interface TranscriptScrollToPositionParams {
  readonly position: number;
  readonly offset: number;
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
  if (
    input.previousScrollTop !== null &&
    input.scrollTop < input.previousScrollTop - 1
  ) {
    return false;
  }
  if (
    input.scrollTop + input.listHeight >=
    input.scrollHeight - input.bottomEpsilon
  ) {
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
    return typeof detail.deltaY === 'number' && detail.deltaY < 0
      ? false
      : input.currentPinned;
  }

  if (
    detail.eventSource !== input.nativeUserEventSource ||
    detail.scrollTop === undefined ||
    detail.scrollHeight === undefined ||
    detail.listHeight === undefined
  ) {
    return input.currentPinned;
  }
  return (
    detail.scrollTop + detail.listHeight >=
    detail.scrollHeight - input.bottomEpsilon
  );
}

export function buildTranscriptScrollToBottomParams(
  rowCount: number,
  trailingChromeRowCount = 0
): TranscriptScrollToPositionParams | null {
  const targetCount = rowCount + trailingChromeRowCount;
  if (targetCount <= 0) return null;
  return {
    position: targetCount - 1,
    // `position` aligns the final row's start. A large positive offset lets
    // the platform clamp to the list's true end even when that row is taller
    // than the viewport (for example, a long streaming assistant response).
    offset: TRANSCRIPT_END_CLAMP_OFFSET_PX,
    smooth: false,
  };
}

export function estimateTranscriptRowMainAxisSize(
  row: ThreadTranscriptRow
): number {
  if (row.kind !== 'message') return 96;

  const text = row.message.text ?? '';
  const physicalLines = text.split('\n');
  const wrappedLineCount = physicalLines.reduce(
    (count, line) =>
      count +
      Math.max(
        1,
        Math.ceil(line.length / TRANSCRIPT_ESTIMATED_CHARS_PER_LINE)
      ),
    0
  );
  const estimate =
    72 +
    wrappedLineCount * TRANSCRIPT_ESTIMATED_LINE_HEIGHT_PX +
    Math.max(0, physicalLines.length - 1) * TRANSCRIPT_MARKDOWN_BLOCK_GAP_PX;

  return Math.max(row.message.role === 'user' ? 92 : 96, estimate);
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
  if (!row) return '';
  if (row.kind === 'message') {
    const workVersion = [
      ...(row.leadingWorkEntries ?? []),
      ...(row.inlineWorkEntries ?? []),
      ...(row.collapsedTurnItems ?? []).flatMap((item) =>
        item.kind === 'work' ? [item.entry] : []
      ),
    ]
      .map((entry) => `${entry.id}:${entry.label}:${entry.detail ?? ''}:${entry.toolStatus ?? ''}`)
      .join('|');
    return `${row.message.text}:${row.message.streaming}:${row.collapsedWorkElapsed ?? ''}:${workVersion}`;
  }
  if (row.kind === 'work') {
    return row.groupedEntries
      .map((entry) => `${entry.id}:${entry.label}:${entry.detail ?? ''}:${entry.toolStatus ?? ''}`)
      .join('|');
  }
  return row.id;
}
