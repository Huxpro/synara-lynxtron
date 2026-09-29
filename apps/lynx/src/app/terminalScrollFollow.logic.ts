export interface TerminalScrollDetail {
  readonly deltaY?: number;
  readonly eventSource?: number;
  readonly isDragging?: boolean;
  readonly scrollHeight?: number;
  readonly scrollTop?: number;
}
export function resolveTerminalPinnedFromScroll(input: {
  readonly bottomEpsilon: number;
  readonly currentPinned: boolean;
  readonly detail: TerminalScrollDetail | undefined;
  readonly nativeUserEventSource: number;
  readonly viewportHeight: number | null;
}): boolean {
  const { detail } = input;
  if (!detail) return input.currentPinned;
  const userDriven =
    detail.isDragging === true || detail.eventSource === input.nativeUserEventSource;
  if (!userDriven) return input.currentPinned;
  if (
    typeof detail.scrollTop === "number" &&
    typeof detail.scrollHeight === "number" &&
    input.viewportHeight !== null
  ) {
    return detail.scrollTop + input.viewportHeight >= detail.scrollHeight - input.bottomEpsilon;
  }
  return typeof detail.deltaY === "number" && detail.deltaY < 0 ? false : input.currentPinned;
}
