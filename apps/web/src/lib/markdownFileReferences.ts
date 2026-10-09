import { pathLooksLikeKnownFile } from "../file-icons";
import { resolveMarkdownFileLinkTarget } from "../markdown-links";

const INLINE_CODE_FILE_PATH_MAX_LENGTH = 120;
/** A trailing `:line` or `:line:column` position on a file reference. */
export const MARKDOWN_LINK_POSITION_SUFFIX_PATTERN = /:\d+(?::\d+)?$/;

// Decides whether an inline code span names a file/path that should render as a
// mention chip (icon + medium label), matching how a file reads in the composer.
// Conservative on purpose: requires a recognized filename/extension and rejects
// whitespace and URLs so ordinary prose tokens stay plain inline code.
export function resolveInlineCodeFilePath(raw: string): string | null {
  // Strip a pair of surrounding quotes/backticks the author may have wrapped the
  // path in (e.g. `'src/data/social-metrics.ts'`).
  const value = raw.trim().replace(/^['"`]+|['"`]+$/g, "");
  if (value.length === 0 || /\s/.test(value) || value.includes("://")) {
    return null;
  }
  const withoutPosition = value.replace(MARKDOWN_LINK_POSITION_SUFFIX_PATTERN, "");
  // Absolute local files and directories (`/Users/…/annotate-pr`) are chips
  // even without a known filename extension. Relative names still need a
  // recognizable file so ordinary tokens stay code.
  if (resolveMarkdownFileLinkTarget(withoutPosition)) {
    return value;
  }
  if (withoutPosition.length > INLINE_CODE_FILE_PATH_MAX_LENGTH) {
    return null;
  }
  return pathLooksLikeKnownFile(withoutPosition) ? value : null;
}
