import { shouldShowWorkspaceExplorerEntry } from "@synara/shared/workspaceExplorer";

// Search results (ProjectEntry) carry no `name`; derive it from the path so hidden-directory
// filtering never reads an undefined name.
export function visibleExplorerEntries<
  T extends { readonly kind: string; readonly path: string; readonly name?: string },
>(entries: readonly T[]): readonly T[] {
  return entries.filter((entry) =>
    shouldShowWorkspaceExplorerEntry({
      kind: entry.kind,
      name: entry.name ?? entry.path.replace(/\\/g, "/").split("/").pop() ?? entry.path,
    }),
  );
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
