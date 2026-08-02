import {
  resolveDraftDropAction,
  type KanbanCard,
  type KanbanColumnKey,
} from "./kanban.logic";

export interface KanbanDragPoint {
  readonly x: number;
  readonly y: number;
}

export interface KanbanDragRect {
  readonly bottom: number;
  readonly column: KanbanColumnKey;
  readonly left: number;
  readonly right: number;
  readonly top: number;
}

export type KanbanCrossColumnDropPolicy =
  | {
      readonly kind: "dispatch";
      readonly label: "Release to start task";
    }
  | {
      readonly kind: "prompt-required";
      readonly label: "Release to add a prompt";
    }
  | {
      readonly kind: "noop";
      readonly label: "Card is already in this column";
    }
  | {
      readonly kind: "invalid";
      readonly label: string;
      readonly reason:
        | "derived-source"
        | "done-derived"
        | "outside-board"
        | "prompt-unavailable";
    };

export const KANBAN_DND_COPY = {
  dragging: "Drag to In Progress to start this task",
  cancelled: "Task move cancelled",
  missedMouseUp: "Task move ended safely",
} as const;

/** Column hit testing is based on measured page-relative layout rectangles. */
export function resolveKanbanDragColumn(
  point: KanbanDragPoint,
  rects: readonly KanbanDragRect[],
): KanbanColumnKey | null {
  const target = rects.find(
    (rect) =>
      point.x >= rect.left &&
      point.x <= rect.right &&
      point.y >= rect.top &&
      point.y <= rect.bottom,
  );
  return target?.column ?? null;
}

/**
 * Kanban columns are projections of server/runtime state. DnD may only enter
 * the canonical Start mutation; every other cross-column move is explanatory.
 */
export function resolveKanbanCrossColumnDropPolicy(
  card: Pick<
    KanbanCard,
    | "column"
    | "draftHasAttachments"
    | "draftPrompt"
    | "envMode"
    | "thread"
    | "worktreePath"
  >,
  targetColumn: KanbanColumnKey | null,
  options: { readonly canSupplyStartPrompt: boolean },
): KanbanCrossColumnDropPolicy {
  if (targetColumn === null) {
    return {
      kind: "invalid",
      reason: "outside-board",
      label: "Drop inside a Kanban column",
    };
  }
  if (targetColumn === card.column) {
    return { kind: "noop", label: "Card is already in this column" };
  }
  if (card.column !== "draft") {
    return {
      kind: "invalid",
      reason: "derived-source",
      label: "Active and completed cards move from runtime state",
    };
  }
  if (targetColumn === "done") {
    return {
      kind: "invalid",
      reason: "done-derived",
      label: "Done is derived when the run completes",
    };
  }
  if (targetColumn !== "inProgress") {
    return {
      kind: "invalid",
      reason: "outside-board",
      label: "Drop on In Progress to start this task",
    };
  }
  if (resolveDraftDropAction(card as KanbanCard) === "dispatch") {
    return { kind: "dispatch", label: "Release to start task" };
  }
  if (options.canSupplyStartPrompt && card.thread !== null) {
    return { kind: "prompt-required", label: "Release to add a prompt" };
  }
  return {
    kind: "invalid",
    reason: "prompt-unavailable",
    label: "Open the task to prepare a sendable prompt",
  };
}
