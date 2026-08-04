import type { ProjectSummary, ThreadSummary } from './queries';

export interface ArchivedThreadGroup {
  readonly projectId: string | null;
  readonly title: string;
  readonly threads: readonly ThreadSummary[];
}

function archivedSortKey(thread: ThreadSummary): string {
  return thread.archivedAt ?? thread.updatedAt ?? thread.createdAt ?? '';
}

function compareDescending(left: string, right: string): number {
  if (left === right) return 0;
  return left < right ? 1 : -1;
}

export function compareArchivedThreads(
  left: ThreadSummary,
  right: ThreadSummary
): number {
  return (
    compareDescending(archivedSortKey(left), archivedSortKey(right)) ||
    compareDescending(left.id, right.id)
  );
}

function sortArchivedThreads(
  threads: readonly ThreadSummary[]
): readonly ThreadSummary[] {
  return [...threads].sort(compareArchivedThreads);
}

export function groupArchivedThreads(
  projects: readonly ProjectSummary[],
  threads: readonly ThreadSummary[]
): readonly ArchivedThreadGroup[] {
  const archivedThreads = threads.filter((thread) => thread.archivedAt != null);
  const knownProjectIds = new Set(projects.map((project) => project.id));
  const groups: ArchivedThreadGroup[] = projects.map((project) => ({
    projectId: project.id,
    title: project.title,
    threads: sortArchivedThreads(
      archivedThreads.filter((thread) => thread.projectId === project.id)
    ),
  }));
  const orphanedThreads = sortArchivedThreads(
    archivedThreads.filter((thread) => !knownProjectIds.has(thread.projectId))
  );
  if (orphanedThreads.length > 0) {
    groups.push({
      projectId: null,
      title: 'Unknown project',
      threads: orphanedThreads,
    });
  }
  return groups.filter((group) => group.threads.length > 0);
}

export function createUnarchiveCommand(input: {
  readonly threadId: string;
  readonly commandId: string;
}) {
  return {
    type: 'thread.unarchive' as const,
    commandId: input.commandId as never,
    threadId: input.threadId as never,
  };
}
