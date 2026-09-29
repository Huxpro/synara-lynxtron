import { isWorkspaceRelativePathSafe, joinWorkspaceRelativePath } from "./path";

export interface FilePreviewBreadcrumbSegment {
  readonly key: string;
  readonly name: string;
}

export interface FilePreviewBreadcrumb {
  readonly fileIsOutsideWorkspace: boolean;
  readonly fileSegment: string;
  readonly openTarget: string;
  readonly prefixSegments: readonly FilePreviewBreadcrumbSegment[];
}

function basename(value: string): string | null {
  const segments = value.replace(/\\/g, "/").split("/").filter(Boolean);
  return segments.at(-1) ?? null;
}

export function deriveFilePreviewBreadcrumb(input: {
  readonly filePath: string;
  readonly workspaceRoot: string | null;
}): FilePreviewBreadcrumb {
  const fileIsOutsideWorkspace = !isWorkspaceRelativePathSafe(input.filePath);
  const projectName =
    fileIsOutsideWorkspace || !input.workspaceRoot ? null : basename(input.workspaceRoot);
  const relativeSegments = input.filePath.replace(/\\/g, "/").split("/").filter(Boolean);
  const segments = projectName ? [projectName, ...relativeSegments] : relativeSegments;
  return {
    fileIsOutsideWorkspace,
    fileSegment: segments.at(-1) ?? input.filePath,
    openTarget:
      fileIsOutsideWorkspace || !input.workspaceRoot
        ? input.filePath
        : joinWorkspaceRelativePath(input.workspaceRoot, input.filePath),
    prefixSegments: segments.slice(0, -1).map((name, index) => ({
      name,
      key: segments.slice(0, index + 1).join("/"),
    })),
  };
}
