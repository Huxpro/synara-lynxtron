export interface HostCommandKeyboardEvent {
  readonly key: "ArrowUp" | "ArrowDown" | "Tab" | "Escape";
  readonly shiftKey?: boolean;
}

export function parseHostCommandKeyboardEvent(value: unknown): HostCommandKeyboardEvent | null {
  if (!value || typeof value !== "object") return null;
  const candidate = value as { readonly key?: unknown; readonly shiftKey?: unknown };
  if (
    candidate.key !== "ArrowUp" &&
    candidate.key !== "ArrowDown" &&
    candidate.key !== "Tab" &&
    candidate.key !== "Escape"
  ) {
    return null;
  }
  if (candidate.shiftKey !== undefined && typeof candidate.shiftKey !== "boolean") {
    return null;
  }
  return {
    key: candidate.key,
    ...(candidate.shiftKey === true ? { shiftKey: true } : {}),
  };
}
