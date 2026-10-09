export const THREAD_SIDEBAR_DEFAULT_WIDTH = 16 * 16;
export const THREAD_SIDEBAR_MIN_WIDTH = 13 * 16;
export const THREAD_MAIN_CONTENT_MIN_WIDTH = 40 * 16;
export const THREAD_SIDEBAR_WIDTH_STORAGE_KEY = "chat_thread_sidebar_width";

export function clampSidebarWidth(
  width: number,
  input: {
    readonly minWidth: number;
    readonly maxWidth?: number | undefined;
    readonly viewportWidth?: number | undefined;
    readonly minimumContentWidth?: number | undefined;
  },
): number {
  const finiteWidth = Number.isFinite(width) ? width : input.minWidth;
  const viewportMaximum =
    input.viewportWidth === undefined || input.minimumContentWidth === undefined
      ? Number.POSITIVE_INFINITY
      : Math.max(input.minWidth, input.viewportWidth - input.minimumContentWidth);
  const maximum = Math.min(input.maxWidth ?? Number.POSITIVE_INFINITY, viewportMaximum);
  return Math.max(input.minWidth, Math.min(finiteWidth, maximum));
}

export function sidebarWidthFromPointer(input: {
  readonly currentX: number;
  readonly side: "left" | "right";
  readonly startWidth: number;
  readonly startX: number;
}): number {
  const delta =
    input.side === "right" ? input.startX - input.currentX : input.currentX - input.startX;
  return input.startWidth + delta;
}
