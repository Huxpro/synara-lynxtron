export function threadErrorDismissKey(input: {
  readonly error: string | null | undefined;
  readonly revision: string | null | undefined;
}): string | null {
  const error = input.error?.trim();
  if (!error) return null;
  return `${input.revision ?? "unknown"}\u001f${error}`;
}

export function visibleThreadError(input: {
  readonly dismissedKey: string | null;
  readonly error: string | null | undefined;
  readonly revision: string | null | undefined;
}): string | null {
  const key = threadErrorDismissKey(input);
  return key && key !== input.dismissedKey ? input.error!.trim() : null;
}
