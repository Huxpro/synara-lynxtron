export function threadErrorDismissKey(input: {
  readonly error: string | null | undefined;
  readonly revision: string | null | undefined;
}): string | null {
  const error = input.error?.trim();
  if (!error) return null;
  return `${input.revision ?? "unknown"}\u001f${error}`;
}

/**
 * The error the banner above the transcript shows. Callers pass either the
 * error and its revision, or the thread summary that carries both; with
 * `transcriptRows`, an error the transcript already shows as a failed turn's
 * card is left to that card.
 */
export function visibleThreadError(input: {
  readonly dismissedKey: string | null;
  readonly error?: string | null | undefined;
  readonly revision?: string | null | undefined;
  readonly thread?:
    | { readonly error?: string | null; readonly errorRevision?: string | null }
    | null
    | undefined;
  readonly transcriptRows?: ReadonlyArray<TranscriptRowWithWork> | null | undefined;
}): string | null {
  const error = input.error ?? input.thread?.error;
  const revision = input.revision ?? input.thread?.errorRevision;
  if (input.transcriptRows && threadErrorShownInTranscript(input.transcriptRows, error)) {
    return null;
  }
  const key = threadErrorDismissKey({ error, revision });
  return key && key !== input.dismissedKey ? error!.trim() : null;
}

interface WorkEntryWithFailure {
  readonly turnFailure?: { readonly cause: string } | undefined;
}

type TranscriptRowWithWork =
  | { readonly kind: "work"; readonly groupedEntries: ReadonlyArray<WorkEntryWithFailure> }
  | {
      readonly kind: "message";
      readonly leadingWorkEntries?: ReadonlyArray<WorkEntryWithFailure> | undefined;
      readonly inlineWorkEntries?: ReadonlyArray<WorkEntryWithFailure> | undefined;
      readonly collapsedTurnItems?:
        | ReadonlyArray<
            | { readonly kind: "work"; readonly entry: WorkEntryWithFailure }
            | { readonly kind: "narration" }
          >
        | undefined;
    }
  | { readonly kind: string };

/**
 * Upstream's `ChatTranscriptPane` rule: the banner above the transcript stays
 * away while the transcript itself shows that failure as a turn's error card.
 */
export function threadErrorShownInTranscript(
  rows: ReadonlyArray<TranscriptRowWithWork>,
  error: string | null | undefined,
): boolean {
  const cause = error?.trim();
  if (!cause) return false;
  const failed = (entry: WorkEntryWithFailure) => entry.turnFailure?.cause === cause;
  return rows.some((row) => {
    if (row.kind === "work" && "groupedEntries" in row) return row.groupedEntries.some(failed);
    if (row.kind === "message" && "collapsedTurnItems" in row) {
      return (
        (row.leadingWorkEntries ?? []).some(failed) ||
        (row.inlineWorkEntries ?? []).some(failed) ||
        (row.collapsedTurnItems ?? []).some((item) => item.kind === "work" && failed(item.entry))
      );
    }
    return false;
  });
}
