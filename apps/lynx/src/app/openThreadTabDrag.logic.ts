// FILE: openThreadTabDrag.logic.ts
// Purpose: Drag-to-reorder for the open-thread tabs: when a press becomes a drag, and which
//   tab's slot the pointer is over.
// Layer: Lynx logic. The reorder itself is upstream's `moveThreadTab` (openThreadTabsStore),
//   which drops the dragged tab onto another tab's slot.
// Upstream drives this with dnd-kit's sortable preset (SurfaceContentTabs.tsx): a pointer
// sensor with a 6px activation distance, horizontal axis only, closest tab centre. Every
// tab of the strip has one width, so "closest centre" is a division by the slot pitch.

/** Upstream `activationConstraint: { distance: 6 }`. */
export const OPEN_THREAD_TAB_DRAG_ACTIVATION_PX = 6;

export interface OpenThreadTabStripGeometry {
  /** Left edge of the tab row in window coordinates (moves with the strip's scroll). */
  readonly listLeft: number;
  /** The row's laid-out width. */
  readonly listWidth: number;
}

export interface OpenThreadTabMetrics {
  /** The tabs' flex basis and maximum (`.EditorSurfaceTab--content` width). */
  readonly basisPx: number;
  /** Their shrink floor (`min-width`). */
  readonly floorPx: number;
  /** The row's gap. */
  readonly gapPx: number;
}

/** The one width every tab of the row has: the basis, shrunk evenly down to the floor. */
export function resolveOpenThreadTabWidth(
  listWidth: number,
  tabCount: number,
  metrics: OpenThreadTabMetrics,
): number {
  if (tabCount <= 0) return metrics.basisPx;
  const shared = (listWidth - (tabCount - 1) * metrics.gapPx) / tabCount;
  return Math.min(metrics.basisPx, Math.max(metrics.floorPx, shared));
}

/**
 * Index of the slot under `pointerX`: the tab whose centre is closest, with the boundary
 * in the middle of the gap. Clamped, so a drag past either end holds the first or last slot.
 */
export function resolveOpenThreadTabSlot(input: {
  readonly pointerX: number;
  readonly tabCount: number;
  readonly geometry: OpenThreadTabStripGeometry;
  readonly metrics: OpenThreadTabMetrics;
}): number | null {
  const { pointerX, tabCount, geometry, metrics } = input;
  if (tabCount <= 0 || !Number.isFinite(pointerX)) return null;
  const pitch = resolveOpenThreadTabWidth(geometry.listWidth, tabCount, metrics) + metrics.gapPx;
  const slot = Math.floor((pointerX - geometry.listLeft + metrics.gapPx / 2) / pitch);
  return Math.min(tabCount - 1, Math.max(0, slot));
}

export interface OpenThreadTabDragSession<Key extends string = string> {
  readonly key: Key;
  readonly startX: number;
  readonly startY: number;
  /** False while the press may still be a click on the tab or its close button. */
  readonly activated: boolean;
}

export function createOpenThreadTabDragSession<Key extends string>(
  key: Key,
  point: { readonly x: number; readonly y: number },
): OpenThreadTabDragSession<Key> {
  return { key, startX: point.x, startY: point.y, activated: false };
}

export type OpenThreadTabDragMove<Key extends string> =
  /** The button was released where no element reported it: the drag is over. */
  | { readonly kind: "ended" }
  | { readonly kind: "pending" }
  /** `overKey` is the tab to hand to `moveThreadTab`, or null to leave the order alone. */
  | {
      readonly kind: "dragging";
      readonly session: OpenThreadTabDragSession<Key>;
      readonly overKey: Key | null;
    };

/**
 * One pointer move of a drag. `geometry` is null until the row has been measured; the
 * drag is then active but moves nothing yet.
 */
export function moveOpenThreadTabDrag<Key extends string>(input: {
  readonly session: OpenThreadTabDragSession<Key>;
  readonly point: { readonly x: number; readonly y: number } | null;
  /** The W3C `buttons` bitfield when the host reports it. */
  readonly buttons: number | null;
  readonly keys: readonly Key[];
  readonly geometry: OpenThreadTabStripGeometry | null;
  readonly metrics: OpenThreadTabMetrics;
}): OpenThreadTabDragMove<Key> {
  const { session, point } = input;
  if (input.buttons === 0) return { kind: "ended" };
  if (!point)
    return session.activated ? { kind: "dragging", session, overKey: null } : { kind: "pending" };
  const activated =
    session.activated ||
    Math.hypot(point.x - session.startX, point.y - session.startY) >=
      OPEN_THREAD_TAB_DRAG_ACTIVATION_PX;
  if (!activated) return { kind: "pending" };
  const next = session.activated ? session : { ...session, activated: true };
  if (!input.geometry || !input.keys.includes(session.key)) {
    return { kind: "dragging", session: next, overKey: null };
  }
  const slot = resolveOpenThreadTabSlot({
    pointerX: point.x,
    tabCount: input.keys.length,
    geometry: input.geometry,
    metrics: input.metrics,
  });
  const overKey = slot === null ? null : (input.keys[slot] ?? null);
  return { kind: "dragging", session: next, overKey: overKey === session.key ? null : overKey };
}
