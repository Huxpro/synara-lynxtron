// FILE: app/archiveWorktreeSetting.logic.ts
// Purpose: The "Delete worktree on archive" app setting (`archiveDeletesOrphanedWorktree`
//   in upstream's AppSettingsSchema, default off) read from and merged into the stored app
//   settings record. Upstream's `useAppSettings` re-encodes the whole record through its
//   schema, which drops keys this build does not know, so Native merges only this key.
// Layer: Lynx settings logic

export const ARCHIVE_DELETES_ORPHANED_WORKTREE_KEY = "archiveDeletesOrphanedWorktree";
/** `AppSettingsSchema.archiveDeletesOrphanedWorktree`'s default. */
export const DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE = false;

function parseRecord(raw: string | null): Record<string, unknown> {
  try {
    const parsed: unknown = JSON.parse(raw ?? "{}");
    return parsed !== null && typeof parsed === "object" && !Array.isArray(parsed)
      ? (parsed as Record<string, unknown>)
      : {};
  } catch {
    return {};
  }
}

export function readArchiveDeletesOrphanedWorktree(raw: string | null): boolean {
  const value = parseRecord(raw)[ARCHIVE_DELETES_ORPHANED_WORKTREE_KEY];
  return typeof value === "boolean" ? value : DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE;
}

/** The stored record with this one key replaced; every other key is written back untouched. */
export function writeArchiveDeletesOrphanedWorktree(raw: string | null, value: boolean): string {
  return JSON.stringify({ ...parseRecord(raw), [ARCHIVE_DELETES_ORPHANED_WORKTREE_KEY]: value });
}
