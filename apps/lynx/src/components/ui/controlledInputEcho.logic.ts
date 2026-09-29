/**
 * A controlled native input emits values before its owner renders them back as
 * `value`. Given the values emitted but not yet echoed and the next `value`,
 * decide whether it is one of those echoes (skip: the field is already at or
 * past it) or an outside change the field must show.
 */
export function resolveControlledInputValue(
  pendingEchoes: readonly string[],
  next: string,
): { readonly apply: boolean; readonly pendingEchoes: readonly string[] } {
  const echo = pendingEchoes.indexOf(next);
  if (echo >= 0) return { apply: false, pendingEchoes: pendingEchoes.slice(echo + 1) };
  return { apply: true, pendingEchoes: [] };
}
