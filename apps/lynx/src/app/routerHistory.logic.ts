export interface MemoryNavigationState {
  readonly canGoBack: boolean;
  readonly canGoForward: boolean;
  readonly index: number;
  readonly length: number;
}

export function resolveMemoryNavigationState(input: {
  readonly length: number;
  readonly state: unknown;
}): MemoryNavigationState {
  const record =
    input.state && typeof input.state === 'object'
      ? (input.state as Record<string, unknown>)
      : null;
  const rawIndex = record?.__TSR_index;
  const index =
    typeof rawIndex === 'number' && Number.isInteger(rawIndex)
      ? Math.min(Math.max(rawIndex, 0), Math.max(input.length - 1, 0))
      : 0;
  const length = Math.max(input.length, 1);
  return {
    canGoBack: index > 0,
    canGoForward: index < length - 1,
    index,
    length,
  };
}
