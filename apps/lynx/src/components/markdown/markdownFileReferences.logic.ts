import {
  isLocalAbsolutePath,
  isWorkspaceRelativePathSafe,
  workspaceRelativePathOf,
} from '@synara/shared/path';
import { resolveInlineCodeFilePath } from '@synara-web/lib/markdownFileReferences';
import { resolveMarkdownFileLinkTarget } from '@synara-web/markdown-links';

const POSITION_SUFFIX_PATTERN = /:\d+(?::\d+)?$/;

export function resolveLynxMarkdownFileReference(input: {
  readonly cwd: string | null;
  readonly rawPath: string;
}): string | null {
  if (!input.cwd) return null;
  const target = resolveMarkdownFileLinkTarget(input.rawPath, input.cwd);
  if (!target) return null;
  const withoutPosition = target.replace(POSITION_SUFFIX_PATTERN, '');
  if (
    withoutPosition
      .replace(/\\/g, '/')
      .split('/')
      .some((segment) => segment === '.' || segment === '..')
  ) {
    return null;
  }
  if (isWorkspaceRelativePathSafe(withoutPosition)) return withoutPosition;
  return (
    workspaceRelativePathOf(withoutPosition, input.cwd) ??
    (isLocalAbsolutePath(withoutPosition) ? withoutPosition : null)
  );
}

export function resolveLynxInlineCodeFileReference(input: {
  readonly cwd: string | null;
  readonly value: string;
}): string | null {
  const filePath = resolveInlineCodeFilePath(input.value);
  if (!filePath) return null;
  return resolveLynxMarkdownFileReference({
    cwd: input.cwd,
    rawPath: filePath,
  });
}
