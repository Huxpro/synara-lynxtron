import { shouldShowWorkspaceExplorerEntry } from "@synara/shared/workspaceExplorer";

export function visibleExplorerEntries<T extends { readonly kind: string; readonly name: string }>(
  entries: readonly T[],
): readonly T[] {
  return entries.filter(shouldShowWorkspaceExplorerEntry);
}

export function toggleExpandedDirectory(
  current: ReadonlySet<string>,
  path: string,
): ReadonlySet<string> {
  const next = new Set(current);
  if (next.has(path)) next.delete(path);
  else next.add(path);
  return next;
}

export function projectExplorerDirectories<T>(
  results: readonly (readonly [string, readonly T[], boolean])[],
): {
  readonly entriesByPath: Readonly<Record<string, readonly T[]>>;
  readonly errorPaths: ReadonlySet<string>;
} {
  const entriesByPath: Record<string, readonly T[]> = {};
  const errorPaths = new Set<string>();
  for (const [path, entries, error] of results) {
    if (error) errorPaths.add(path);
    else entriesByPath[path] = entries;
  }
  return { entriesByPath, errorPaths };
}
