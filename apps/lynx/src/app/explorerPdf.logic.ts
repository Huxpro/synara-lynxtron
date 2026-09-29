import { isWorkspaceRelativePathSafe, joinWorkspaceRelativePath } from "@synara/shared/path";

export function resolveExplorerPdfOpenTarget(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): string | null {
  if (!isWorkspaceRelativePathSafe(input.relativePath)) return null;
  return joinWorkspaceRelativePath(input.workspaceRoot, input.relativePath);
}
