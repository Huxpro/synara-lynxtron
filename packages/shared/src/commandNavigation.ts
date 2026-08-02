export type CommandNavigationIntent =
  | { readonly type: "activate"; readonly value: string }
  | { readonly type: "dismiss" }
  | { readonly type: "move"; readonly value: string }
  | { readonly type: "none" };

function normalizedKey(key: string): string {
  const normalized = key.trim().toLowerCase();
  return normalized === "esc" ? "escape" : normalized;
}

function adjacentValue(input: {
  readonly activeValue: string | null;
  readonly direction: "first" | "last" | "next" | "previous";
  readonly enabledValues: readonly string[];
}): string | null {
  const { activeValue, direction, enabledValues } = input;
  if (enabledValues.length === 0) return null;
  if (direction === "first") return enabledValues[0] ?? null;
  if (direction === "last") return enabledValues[enabledValues.length - 1] ?? null;

  const activeIndex = activeValue === null ? -1 : enabledValues.indexOf(activeValue);
  if (direction === "next") {
    return enabledValues[(activeIndex + 1 + enabledValues.length) % enabledValues.length] ?? null;
  }
  const previousIndex = activeIndex < 0 ? enabledValues.length - 1 : activeIndex - 1;
  return enabledValues[(previousIndex + enabledValues.length) % enabledValues.length] ?? null;
}

export function resolveCommandNavigation(input: {
  readonly activeValue: string | null;
  readonly enabledValues: readonly string[];
  readonly key: string;
  readonly shiftKey?: boolean;
}): CommandNavigationIntent {
  const key = normalizedKey(input.key);
  if (key === "escape") return { type: "dismiss" };

  if (key === "enter") {
    return input.activeValue !== null && input.enabledValues.includes(input.activeValue)
      ? { type: "activate", value: input.activeValue }
      : { type: "none" };
  }

  const direction =
    key === "home"
      ? "first"
      : key === "end"
        ? "last"
        : key === "arrowdown" || (key === "tab" && !input.shiftKey)
          ? "next"
          : key === "arrowup" || (key === "tab" && input.shiftKey)
            ? "previous"
            : null;
  if (direction === null) return { type: "none" };

  const value = adjacentValue({
    activeValue: input.activeValue,
    direction,
    enabledValues: input.enabledValues,
  });
  return value === null ? { type: "none" } : { type: "move", value };
}
