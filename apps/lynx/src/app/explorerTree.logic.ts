export function toggleExpandedDirectory(
  current: ReadonlySet<string>,
  path: string
): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  return next;
}
