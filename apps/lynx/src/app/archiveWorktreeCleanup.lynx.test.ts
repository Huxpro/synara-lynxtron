import { readFileSync } from "node:fs";

import { beforeEach, describe, expect, it, rs } from "@rstest/core";

const toasts: { type: string; title: string; description?: string }[] = [];
rs.mock("../components/ui/toast.lynx", () => ({
  toastManager: { add: (toast: (typeof toasts)[number]) => toasts.push(toast) },
}));
let storeState: unknown = {};
rs.mock("@synara-web/store", () => ({ useStore: { getState: () => storeState } }));
let thread: Record<string, unknown> | undefined;
rs.mock("@synara-web/threadDerivation", () => ({ getThreadFromState: () => thread }));
let storedSettings: string | null = null;
rs.mock("../platform/storage", () => ({ webStorage: { getItem: () => storedSettings } }));

const { ARCHIVE_WORKTREE_CLEANUP_DELAY_MS, releaseOrphanedWorktreeAfterArchive } =
  await import("./archiveWorktreeCleanup.lynx");

const upstream = (path: string) =>
  readFileSync(new URL(`../../../web/src/${path}`, import.meta.url), "utf8");

describe("archive worktree cleanup", () => {
  beforeEach(() => {
    toasts.length = 0;
    storedSettings = null;
    storeState = { projects: [{ id: "project-1", cwd: "/repo" }] };
    thread = {
      projectId: "project-1",
      archivedAt: "2026-10-10T00:00:00.000Z",
      worktreePath: "/repo/.worktrees/task-1",
    };
  });

  it("asks the server to remove the archived thread's worktree for that archive event", async () => {
    const requests: unknown[] = [];
    const outcome = await releaseOrphanedWorktreeAfterArchive({
      threadId: "thread-1" as never,
      archiveSequence: 42,
      removeWorktree: async (request) => {
        requests.push(request);
      },
    });
    expect(outcome).toBe("removed");
    expect(requests).toEqual([
      {
        cwd: "/repo",
        path: "/repo/.worktrees/task-1",
        force: false,
        reclaimTemporaryBranch: false,
        archiveCleanup: { threadId: "thread-1", archiveSequence: 42 },
      },
    ]);
    expect(toasts.map((toast) => toast.title)).toEqual(["Worktree removed"]);
  });

  it("keeps the worktree, without failing, when the server refuses", async () => {
    const outcome = await releaseOrphanedWorktreeAfterArchive({
      threadId: "thread-1" as never,
      archiveSequence: 42,
      removeWorktree: async () => {
        throw new Error("worktree has uncommitted changes");
      },
    });
    expect(outcome).toBe("kept");
    expect(toasts.map((toast) => toast.title)).toEqual(["Worktree kept"]);
  });

  it("does nothing for a thread that is not archived or has no worktree", async () => {
    const removeWorktree = async () => {
      throw new Error("must not be called");
    };
    thread = { ...thread, archivedAt: null };
    expect(
      await releaseOrphanedWorktreeAfterArchive({
        threadId: "thread-1" as never,
        archiveSequence: 1,
        removeWorktree,
      }),
    ).toBe("skipped");
    thread = { projectId: "project-1", archivedAt: "2026-10-10T00:00:00.000Z" };
    expect(
      await releaseOrphanedWorktreeAfterArchive({
        threadId: "thread-1" as never,
        archiveSequence: 1,
        removeWorktree,
      }),
    ).toBe("skipped");
    expect(toasts).toEqual([]);
  });

  it("stays the same request, copy and delay as upstream's helper", () => {
    const helper = upstream("lib/archiveThreadWorktreeCleanup.ts");
    const own = readFileSync(new URL("./archiveWorktreeCleanup.lynx.ts", import.meta.url), "utf8");
    for (const line of [
      'if (!thread || thread.archivedAt == null) return "skipped";',
      "const worktreePath = thread.worktreePath ?? thread.associatedWorktreePath;",
      "force: false,",
      "reclaimTemporaryBranch: false,",
      "archiveCleanup: { threadId: input.threadId, archiveSequence: input.archiveSequence },",
      'title: "Worktree kept",',
      "description: `${displayName} could not be removed safely. Check its task, Git status, or connection.`,",
      'title: "Worktree removed",',
      "description: `${displayName} was deleted. Its branch remains available for recovery.`,",
    ]) {
      expect(helper).toContain(line);
      expect(own).toContain(line);
    }
    expect(upstream("hooks/useSidebarThreadActions.ts")).toContain(
      `const ARCHIVE_UNDO_TOAST_DURATION_MS = ${ARCHIVE_WORKTREE_CLEANUP_DELAY_MS};`,
    );
  });

  it("is scheduled from both archive entry points, and only for an accepted archive", () => {
    const read = (path: string) => readFileSync(new URL(path, import.meta.url), "utf8");
    for (const source of [
      read("../components/sidebar/Sidebar.lynx.tsx"),
      read("./useNativeKanbanCardActions.lynx.tsx"),
    ]) {
      expect(source).toMatch(
        /const receipt = await ensureNativeApi\(\)\.orchestration\.dispatchCommand\(command\);\s*if \(command\.type === "thread\.archive"\) \{\s*scheduleArchiveWorktreeCleanup\(/,
      );
    }
  });
});
