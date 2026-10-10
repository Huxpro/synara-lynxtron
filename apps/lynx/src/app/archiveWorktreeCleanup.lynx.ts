// FILE: app/archiveWorktreeCleanup.lynx.ts
// Purpose: After a thread was archived, release its worktree when "Delete worktree on
//   archive" is on, as upstream's `useSidebarThreadActions.archiveThread` does: wait out
//   the Undo period, then ask the server to remove the worktree for this exact archive
//   event, never forced.
// Why not upstream's `releaseOrphanedWorktreeAfterArchive` itself
//   (lib/archiveThreadWorktreeCleanup.ts): it imports the DOM toast module by relative
//   path, which Lynx's typecheck cannot follow. The steps, the request and the toast copy
//   are the same; `archiveWorktreeCleanup.lynx.test.ts` fails when upstream's change.
// Layer: Lynx orchestration helper

import type { GitRemoveWorktreeInput, ThreadId } from "@synara/contracts";
import { APP_SETTINGS_STORAGE_KEY } from "@synara-web/appSettingsStorageProjection.logic";
import { useStore } from "@synara-web/store";
import { getThreadFromState } from "@synara-web/threadDerivation";
import { formatWorktreePathForDisplay } from "@synara-web/worktreeCleanup";

import { toastManager } from "../components/ui/toast.lynx";
import { webStorage } from "../platform/storage";
import { readArchiveDeletesOrphanedWorktree } from "./archiveWorktreeSetting.logic";

/** Upstream's ARCHIVE_UNDO_TOAST_DURATION_MS (hooks/useSidebarThreadActions.ts, not exported). */
export const ARCHIVE_WORKTREE_CLEANUP_DELAY_MS = 8000;

export type ArchiveWorktreeCleanupOutcome = "removed" | "kept" | "skipped";

/**
 * Upstream's `releaseOrphanedWorktreeAfterArchive`. The removal is never forced, so a
 * worktree with uncommitted changes survives, and nothing here throws: the archive
 * already succeeded and must not be reported as failed.
 */
export async function releaseOrphanedWorktreeAfterArchive(input: {
  readonly threadId: ThreadId;
  readonly archiveSequence: number;
  readonly removeWorktree: (input: GitRemoveWorktreeInput) => Promise<unknown>;
}): Promise<ArchiveWorktreeCleanupOutcome> {
  "background only";
  const state = useStore.getState();
  const thread = getThreadFromState(state, input.threadId);
  if (!thread || thread.archivedAt == null) return "skipped";
  const project = state.projects.find((candidate) => candidate.id === thread.projectId) ?? null;
  if (!project) return "skipped";
  const worktreePath = thread.worktreePath ?? thread.associatedWorktreePath;
  if (!worktreePath) return "skipped";
  const displayName = formatWorktreePathForDisplay(worktreePath);
  try {
    // The server checks this exact archive event, session stop, and every
    // canonical worktree association under the Git mutation lock.
    await input.removeWorktree({
      cwd: project.cwd,
      path: worktreePath,
      force: false,
      reclaimTemporaryBranch: false,
      archiveCleanup: { threadId: input.threadId, archiveSequence: input.archiveSequence },
    });
  } catch {
    toastManager.add({
      type: "info",
      title: "Worktree kept",
      description: `${displayName} could not be removed safely. Check its task, Git status, or connection.`,
    });
    return "kept";
  }
  toastManager.add({
    type: "success",
    title: "Worktree removed",
    description: `${displayName} was deleted. Its branch remains available for recovery.`,
  });
  return "removed";
}

/**
 * Call with the receipt of an accepted `thread.archive` command. Does nothing while the
 * setting is off.
 */
export function scheduleArchiveWorktreeCleanup(input: {
  readonly threadId: string;
  readonly archiveSequence: number;
}): boolean {
  "background only";
  if (!readArchiveDeletesOrphanedWorktree(webStorage.getItem(APP_SETTINGS_STORAGE_KEY))) {
    return false;
  }
  setTimeout(() => {
    void (async () => {
      const { ensureNativeApi } = await import(/* webpackMode: "eager" */ "~/nativeApi");
      await releaseOrphanedWorktreeAfterArchive({
        threadId: input.threadId as ThreadId,
        archiveSequence: input.archiveSequence,
        removeWorktree: (worktree) => ensureNativeApi().git.removeWorktree(worktree),
      });
    })().catch((error: unknown) => {
      console.error("Failed to release worktree after archiving thread", {
        threadId: input.threadId,
        error,
      });
    });
  }, ARCHIVE_WORKTREE_CLEANUP_DELAY_MS);
  return true;
}
