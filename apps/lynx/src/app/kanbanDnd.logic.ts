import type { KanbanCard } from "@synara-web/components/kanban/kanban.logic";
import type {
  KanbanCrossColumnDropPolicy,
  KanbanDragPoint,
} from "@synara-web/components/kanban/kanbanDnd.logic";

export const KANBAN_DRAG_ACTIVATION_DISTANCE_PX = 6;
export const KANBAN_DRAG_MOVE_INTERVAL_MS = 16;

export interface NativeKanbanPointerEvent {
  readonly button?: number;
  readonly buttons?: number;
  readonly changedTouches?: readonly {
    readonly pageX?: number;
    readonly pageY?: number;
  }[];
  readonly clientX?: number;
  readonly clientY?: number;
  readonly detail?: {
    readonly buttons?: number;
    readonly clientX?: number;
    readonly clientY?: number;
    readonly pageX?: number;
    readonly pageY?: number;
    readonly x?: number;
    readonly y?: number;
  };
  readonly pageX?: number;
  readonly pageY?: number;
  readonly touches?: readonly {
    readonly pageX?: number;
    readonly pageY?: number;
  }[];
  readonly x?: number;
  readonly y?: number;
}

export interface NativeKanbanDragSession {
  readonly activated: boolean;
  readonly card: KanbanCard;
  readonly currentPoint: KanbanDragPoint;
  readonly lastMoveAt: number;
  readonly policy: KanbanCrossColumnDropPolicy | null;
  readonly startPoint: KanbanDragPoint;
}

export type NativeKanbanDragMoveResult =
  | { readonly kind: "ended-missed-mouseup" }
  | { readonly kind: "ignored" }
  | {
      readonly kind: "moved";
      readonly session: NativeKanbanDragSession;
    };

function finiteCoordinate(...values: readonly (number | undefined)[]): number | null {
  const value = values.find((candidate) => Number.isFinite(candidate));
  return value ?? null;
}

/** Normalizes Lynx touch and PC mouse coordinates into page space. */
export function readNativeKanbanPointer(event: NativeKanbanPointerEvent): KanbanDragPoint | null {
  const touch = event.touches?.[0] ?? event.changedTouches?.[0];
  const x = finiteCoordinate(
    touch?.pageX,
    event.detail?.clientX,
    event.clientX,
    event.detail?.x,
    event.x,
    event.detail?.pageX,
    event.pageX,
  );
  const y = finiteCoordinate(
    touch?.pageY,
    event.detail?.clientY,
    event.clientY,
    event.detail?.y,
    event.y,
    event.detail?.pageY,
    event.pageY,
  );
  return x === null || y === null ? null : { x, y };
}

export function readNativeKanbanButtons(event: NativeKanbanPointerEvent): number | null {
  const buttons = event.detail?.buttons ?? event.buttons;
  return typeof buttons === "number" ? buttons : null;
}

export function isNativeKanbanPrimaryPointer(event: NativeKanbanPointerEvent): boolean {
  return event.touches !== undefined || event.button === undefined || event.button === 0;
}

export function createNativeKanbanDragSession(
  card: KanbanCard,
  point: KanbanDragPoint,
  now: number,
): NativeKanbanDragSession {
  return {
    activated: false,
    card,
    currentPoint: point,
    lastMoveAt: now,
    policy: null,
    startPoint: point,
  };
}

export function moveNativeKanbanDragSession(input: {
  readonly event: NativeKanbanPointerEvent;
  readonly now: number;
  readonly policy: KanbanCrossColumnDropPolicy | null;
  readonly session: NativeKanbanDragSession;
}): NativeKanbanDragMoveResult {
  if (readNativeKanbanButtons(input.event) === 0) {
    return { kind: "ended-missed-mouseup" };
  }
  if (
    input.session.activated &&
    input.now - input.session.lastMoveAt < KANBAN_DRAG_MOVE_INTERVAL_MS
  ) {
    return { kind: "ignored" };
  }
  const point = readNativeKanbanPointer(input.event);
  if (!point) return { kind: "ignored" };
  const deltaX = point.x - input.session.startPoint.x;
  const deltaY = point.y - input.session.startPoint.y;
  const distance = Math.sqrt(deltaX * deltaX + deltaY * deltaY);
  return {
    kind: "moved",
    session: {
      ...input.session,
      activated: input.session.activated || distance >= KANBAN_DRAG_ACTIVATION_DISTANCE_PX,
      currentPoint: point,
      lastMoveAt: input.now,
      policy: input.policy,
    },
  };
}

export function shouldCancelNativeKanbanDragKey(key: string): boolean {
  return key === "Escape" || key === "Esc";
}
