import type {
  WorktreeThreadSummary,
} from './queries';

export interface ManagedWorktree {
  readonly path: string;
  readonly workspaceRoot: string;
}

export interface WorktreeGroup {
  readonly workspaceRoot: string;
  readonly worktrees: readonly {
    readonly path: string;
    readonly linkedThreads: readonly WorktreeThreadSummary[];
  }[];
}

export function isThreadAssociatedWithWorktree(
  thread: WorktreeThreadSummary,
  worktreePath: string
): boolean {
  return [thread.worktreePath, thread.associatedWorktreePath].some(
    (candidate) => candidate?.trim() === worktreePath
  );
}

export function linkedThreadsForWorktree(
  threads: readonly WorktreeThreadSummary[],
  worktreePath: string
): readonly WorktreeThreadSummary[] {
  return threads.filter((thread) =>
    isThreadAssociatedWithWorktree(thread, worktreePath)
  );
}

export function groupManagedWorktrees(
  worktrees: readonly ManagedWorktree[],
  threads: readonly WorktreeThreadSummary[]
): readonly WorktreeGroup[] {
  const groups: WorktreeGroup[] = [];
  const groupIndexByRoot = new Map<string, number>();
  for (const worktree of worktrees) {
    const entry = {
      path: worktree.path,
      linkedThreads: linkedThreadsForWorktree(threads, worktree.path),
    };
    const existingIndex = groupIndexByRoot.get(worktree.workspaceRoot);
    if (existingIndex !== undefined) {
      const existing = groups[existingIndex]!;
      groups[existingIndex] = {
        ...existing,
        worktrees: [...existing.worktrees, entry],
      };
      continue;
    }
    groupIndexByRoot.set(worktree.workspaceRoot, groups.length);
    groups.push({
      workspaceRoot: worktree.workspaceRoot,
      worktrees: [entry],
    });
  }
  return groups;
}

export function linkedWorktreeCounts(
  threads: readonly WorktreeThreadSummary[]
): {
  readonly active: number;
  readonly archived: number;
} {
  const archived = threads.filter((thread) => thread.archivedAt != null).length;
  return {
    active: threads.length - archived,
    archived,
  };
}

export function createDeleteThreadCommand(input: {
  readonly commandId: string;
  readonly threadId: string;
}) {
  return {
    type: 'thread.delete' as const,
    commandId: input.commandId as never,
    threadId: input.threadId as never,
  };
}
