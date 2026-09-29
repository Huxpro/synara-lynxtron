export interface ProjectArchiveThread<ThreadId extends string = string> {
  readonly id: ThreadId;
  readonly archivedAt?: string | null;
  readonly sessionStatus?: string | null;
  readonly activeTurnId?: string | null;
}

export interface ProjectThreadArchivePlan<ThreadId extends string = string> {
  readonly archivableThreadIds: readonly ThreadId[];
  readonly runningCount: number;
  readonly totalCount: number;
}

export interface ProjectThreadDeletionResult<Id extends string = string> {
  readonly deletedThreadIds: readonly Id[];
  readonly failureCount: number;
  readonly totalCount: number;
}

export async function deleteProjectThreadsSequentially<
  Id extends string = string,
  Thread extends { readonly id: Id } = { readonly id: Id },
>(input: {
  readonly threads: readonly Thread[];
  readonly deleteThread: (thread: Thread) => Promise<void>;
  readonly onFailure?: (thread: Thread, cause: unknown) => void;
}): Promise<ProjectThreadDeletionResult<Id>> {
  const deletedThreadIds: Id[] = [];
  let failureCount = 0;
  for (const thread of input.threads) {
    try {
      await input.deleteThread(thread);
      deletedThreadIds.push(thread.id);
    } catch (cause) {
      failureCount += 1;
      input.onFailure?.(thread, cause);
    }
  }
  return {
    deletedThreadIds,
    failureCount,
    totalCount: input.threads.length,
  };
}

export function deriveProjectThreadArchivePlan<ThreadId extends string>(
  threads: readonly ProjectArchiveThread<ThreadId>[],
): ProjectThreadArchivePlan<ThreadId> {
  const current = threads.filter((thread) => thread.archivedAt == null);
  const archivableThreadIds = current
    .filter((thread) => !(thread.sessionStatus === "running" && thread.activeTurnId != null))
    .map((thread) => thread.id);
  return {
    archivableThreadIds,
    runningCount: current.length - archivableThreadIds.length,
    totalCount: current.length,
  };
}

function plural(count: number, singular: string, pluralValue = singular + "s"): string {
  return count === 1 ? singular : pluralValue;
}

export function projectThreadDeleteConfirmation(input: {
  readonly projectName: string;
  readonly threadCount: number;
}): string {
  return [
    `Delete ${input.threadCount} ${plural(input.threadCount, "thread")} in "${input.projectName}"?`,
    "This permanently clears conversation history for these threads.",
  ].join("\n");
}

export function projectRemoveConfirmation(input: {
  readonly projectName: string;
  readonly threadCount: number;
}): string {
  if (input.threadCount === 0) return `Remove project "${input.projectName}"?`;
  return [
    `Remove project "${input.projectName}"?`,
    `This will delete ${input.threadCount} ${plural(input.threadCount, "thread")} in this folder and remove the project.`,
  ].join("\n");
}

export function projectThreadArchiveConfirmation(input: {
  readonly projectName: string;
  readonly archivableCount: number;
  readonly runningCount: number;
}): string {
  const lines = [
    `Archive ${input.archivableCount} ${plural(input.archivableCount, "thread")} in "${input.projectName}"?`,
    "Archived threads are hidden from the sidebar but can be restored later.",
  ];
  if (input.runningCount > 0) {
    lines.push(
      "",
      `${input.runningCount} running ${plural(
        input.runningCount,
        "thread is",
        "threads are",
      )} currently active and will be skipped.`,
    );
  }
  return lines.join("\n");
}

export function projectThreadArchiveResultMessage(input: {
  readonly archivedCount: number;
  readonly failureCount: number;
  readonly projectName: string;
  readonly runningCount: number;
}): string | null {
  if (input.failureCount > 0 && input.archivedCount === 0) {
    return `Could not archive ${input.failureCount} ${plural(
      input.failureCount,
      "thread",
    )} in "${input.projectName}".`;
  }
  const failures =
    input.failureCount > 0
      ? `Failed to archive ${input.failureCount} ${plural(input.failureCount, "thread")}.`
      : "";
  const skipped =
    input.runningCount > 0
      ? `Skipped ${input.runningCount} running ${plural(input.runningCount, "thread")}.`
      : "";
  return [failures, skipped].filter(Boolean).join(" ") || null;
}
