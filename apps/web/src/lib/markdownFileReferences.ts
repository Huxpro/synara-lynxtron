import { pathLooksLikeKnownFile } from "../file-icons";

const INLINE_CODE_FILE_PATH_MAX_LENGTH = 120;

export function resolveInlineCodeFilePath(raw: string): string | null {
  const value = raw.trim().replace(/^['"`]+|['"`]+$/g, "");
  if (
    value.length === 0 ||
    value.length > INLINE_CODE_FILE_PATH_MAX_LENGTH ||
    /\s/.test(value) ||
    value.includes("://")
  ) {
    return null;
  }
  return pathLooksLikeKnownFile(value) ? value : null;
}
