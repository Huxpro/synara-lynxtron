export interface SelectionActionRect {
  readonly left: number;
  readonly top: number;
  readonly width: number;
  readonly height: number;
}

export interface SelectionActionLayout {
  readonly left: number;
  readonly top: number;
  readonly placement: "top" | "bottom";
  readonly width: number;
}

export const TRANSCRIPT_SELECTION_ACTION_WIDTH_PX = 292;
export const TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX = 32;
export const TRANSCRIPT_SELECTION_ACTION_GAP_PX = 8;

export function resolveSelectionActionLayout(input: {
  readonly selectionRect: SelectionActionRect | null;
  readonly pointer: { readonly x: number; readonly y: number };
  readonly viewport: {
    readonly left?: number;
    readonly top?: number;
    readonly width: number;
    readonly height: number;
  };
}): SelectionActionLayout {
  const viewportLeft = input.viewport.left ?? 0;
  const viewportTop = input.viewport.top ?? 0;
  const actionWidth = Math.min(
    TRANSCRIPT_SELECTION_ACTION_WIDTH_PX,
    Math.max(input.viewport.width - 16, 0),
  );
  const anchorCenterX = input.selectionRect
    ? input.selectionRect.left + input.selectionRect.width / 2
    : input.pointer.x;
  const selectionTop = input.selectionRect?.top ?? input.pointer.y;
  const selectionBottom = input.selectionRect
    ? input.selectionRect.top + input.selectionRect.height
    : input.pointer.y;
  const availableAbove = selectionTop - viewportTop;
  const availableBelow = viewportTop + input.viewport.height - selectionBottom;
  const placement =
    availableAbove >= TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX + TRANSCRIPT_SELECTION_ACTION_GAP_PX ||
    availableAbove >= availableBelow
      ? "top"
      : "bottom";
  const unclampedTop =
    placement === "top"
      ? selectionTop - TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX - TRANSCRIPT_SELECTION_ACTION_GAP_PX
      : selectionBottom + TRANSCRIPT_SELECTION_ACTION_GAP_PX;

  return {
    left: Math.max(
      viewportLeft + 8,
      Math.min(
        Math.round(anchorCenterX - actionWidth / 2),
        Math.max(viewportLeft + input.viewport.width - actionWidth - 8, viewportLeft + 8),
      ),
    ),
    top: Math.max(
      viewportTop + 8,
      Math.min(
        Math.round(unclampedTop),
        Math.max(
          viewportTop + input.viewport.height - TRANSCRIPT_SELECTION_ACTION_HEIGHT_PX - 8,
          viewportTop + 8,
        ),
      ),
    ),
    placement,
    width: actionWidth,
  };
}
