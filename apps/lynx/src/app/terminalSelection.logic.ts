export const TERMINAL_SELECTION_SETTLE_DELAY_MS = 260;

export function resolveTerminalSelectionLineRange(input: {
  readonly end: number;
  readonly start: number;
  readonly text: string;
}): { readonly lineStart: number; readonly lineEnd: number } {
  const anchor = Math.max(0, Math.min(input.text.length, Math.floor(input.start)));
  const focus = Math.max(0, Math.min(input.text.length, Math.floor(input.end)));
  const start = Math.min(anchor, focus);
  const end = Math.max(anchor, focus);
  const lineStart = input.text.slice(0, start).split("\n").length;
  const inclusiveEnd = Math.max(start, end - 1);
  const lineEnd = input.text.slice(0, inclusiveEnd).split("\n").length;
  return { lineStart, lineEnd: Math.max(lineStart, lineEnd) };
}
