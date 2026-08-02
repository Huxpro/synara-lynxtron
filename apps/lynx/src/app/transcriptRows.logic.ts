import type { ThreadTranscriptRow } from './queries';

export type MessageTranscriptRow = Extract<ThreadTranscriptRow, { kind: 'message' }>;
export type WorkLogEntry = Extract<ThreadTranscriptRow, { kind: 'work' }>['groupedEntries'][number];

const TRANSCRIPT_ESTIMATED_CHARS_PER_LINE = 72;
const TRANSCRIPT_ESTIMATED_LINE_HEIGHT_PX = 28;
const TRANSCRIPT_MARKDOWN_BLOCK_GAP_PX = 18;

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
