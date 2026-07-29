import { normalizeWorkspaceRootForComparison } from "@synara/shared/threadWorkspace";

export function normalizeSidebarProjectThreadListCwd(cwd: string): string {
  return normalizeWorkspaceRootForComparison(cwd);
}

// Drops remembered "show more" paging for projects that are currently collapsed.
export function pruneProjectThreadListPagingForCollapsedProjects<
  T extends { readonly cwd: string; readonly expanded: boolean },
>(input: {
  threadListExtraPagesByProjectCwd: ReadonlyMap<string, number>;
  projects: readonly T[];
  normalizeProjectCwd: (cwd: string) => string;
}): ReadonlyMap<string, number> {
  const { normalizeProjectCwd, projects, threadListExtraPagesByProjectCwd } = input;
  const collapsedProjectCwds = new Set(
    projects
      .filter((project) => !project.expanded)
      .map((project) => normalizeProjectCwd(project.cwd))
      .filter((cwd) => cwd.length > 0),
  );

  if (collapsedProjectCwds.size === 0) {
    return threadListExtraPagesByProjectCwd;
  }

  let changed = false;
  const nextThreadListExtraPagesByProjectCwd = new Map<string, number>();
  for (const [cwd, extraPages] of threadListExtraPagesByProjectCwd) {
    if (collapsedProjectCwds.has(cwd)) {
      changed = true;
      continue;
    }
    nextThreadListExtraPagesByProjectCwd.set(cwd, extraPages);
  }

  return changed ? nextThreadListExtraPagesByProjectCwd : threadListExtraPagesByProjectCwd;
}
