import type { KanbanCard } from "./kanban.logic";
import { isKanbanDraftOnlyCard, resolveDraftDropAction } from "./kanban.logic";

export type KanbanMutationActionId = "start" | "rename" | "archive";

export interface KanbanMutationActionPolicy {
  readonly id: KanbanMutationActionId;
  readonly label: string;
  readonly destructive?: boolean;
}

export const KANBAN_MUTATION_COPY = {
  start: {
    pending: "Starting task…",
    success: "Task started",
    error: "Unable to start task",
  },
  rename: {
    pending: "Saving name…",
    success: "Task renamed",
    error: "Unable to rename task",
  },
  archive: {
    pending: "Archiving task…",
    success: "Task archived",
    error: "Unable to archive task",
  },
  retry: "Retry",
} as const;

/**
 * Kanban columns are a projection of real thread runtime state. The only user
 * initiated column transition is Start: a Draft begins a real turn and runtime
 * events then derive In Progress/Done. Rename and Archive mutate thread metadata
 * without inventing a board-only status.
 */
export function resolveKanbanMutationActions(
  card: KanbanCard,
  options: { readonly canSupplyStartPrompt: boolean },
): readonly KanbanMutationActionPolicy[] {
  const isDraftOnly = isKanbanDraftOnlyCard(card);
  const hasThreadActionSurface = card.thread !== null && !isDraftOnly;
  const canStart =
    card.column === "draft" &&
    (options.canSupplyStartPrompt || resolveDraftDropAction(card) === "dispatch");

  return [
    ...(canStart ? [{ id: "start", label: "Start task" } as const] : []),
    ...(hasThreadActionSurface
      ? [{ id: "rename", label: "Rename task" } as const]
      : []),
    ...(hasThreadActionSurface && card.column !== "inProgress"
      ? [{ id: "archive", label: "Archive task", destructive: true } as const]
      : []),
  ];
}

export interface KanbanMutationGate {
  readonly tryAcquire: (threadId: string) => boolean;
  readonly release: (threadId: string) => void;
}

/** Synchronous because framework mutation pending flags update after the event frame. */
export function createKanbanMutationGate(): KanbanMutationGate {
  const activeThreadIds = new Set<string>();
  return {
    tryAcquire(threadId) {
      if (activeThreadIds.has(threadId)) return false;
      activeThreadIds.add(threadId);
      return true;
    },
    release(threadId) {
      activeThreadIds.delete(threadId);
    },
  };
}
