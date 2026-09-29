import { describe, expect, it } from "@rstest/core";

import type { WorktreeThreadSummary } from "./queries";
import {
  createDeleteThreadCommand,
  groupManagedWorktrees,
  isThreadAssociatedWithWorktree,
  linkedThreadsForWorktree,
  linkedWorktreeCounts,
} from "./settingsWorktrees.logic";

function thread(id: string, input: Partial<WorktreeThreadSummary> = {}): WorktreeThreadSummary {
  return {
    id,
    title: `Thread ${id}`,
    archivedAt: null,
    worktreePath: null,
    associatedWorktreePath: null,
    ...input,
  };
}

describe("Settings Worktrees projection", () => {
  it("associates both direct and durable worktree paths", () => {
    expect(
      isThreadAssociatedWithWorktree(
        thread("direct", { worktreePath: "/tmp/worktree-a" }),
        "/tmp/worktree-a",
      ),
    ).toBe(true);
    expect(
      isThreadAssociatedWithWorktree(
        thread("associated", {
          associatedWorktreePath: "/tmp/worktree-a",
        }),
        "/tmp/worktree-a",
      ),
    ).toBe(true);
    expect(
      isThreadAssociatedWithWorktree(
        thread("other", { worktreePath: "/tmp/worktree-b" }),
        "/tmp/worktree-a",
      ),
    ).toBe(false);
  });

  it("groups in server order and attaches matching conversations", () => {
    const groups = groupManagedWorktrees(
      [
        { workspaceRoot: "/repo-a", path: "/tmp/a-1" },
        { workspaceRoot: "/repo-b", path: "/tmp/b-1" },
        { workspaceRoot: "/repo-a", path: "/tmp/a-2" },
      ],
      [
        thread("a-1", { worktreePath: "/tmp/a-1" }),
        thread("a-2", { associatedWorktreePath: "/tmp/a-2" }),
        thread("none"),
      ],
    );

    expect(groups.map((group) => group.workspaceRoot)).toEqual(["/repo-a", "/repo-b"]);
    expect(groups[0]?.worktrees.map((worktree) => worktree.path)).toEqual(["/tmp/a-1", "/tmp/a-2"]);
    expect(groups[0]?.worktrees[0]?.linkedThreads.map((item) => item.id)).toEqual(["a-1"]);
    expect(groups[0]?.worktrees[1]?.linkedThreads.map((item) => item.id)).toEqual(["a-2"]);
  });

  it("resolves the current linked conversations from a fresh snapshot", () => {
    expect(
      linkedThreadsForWorktree(
        [
          thread("stale-rendered-thread"),
          thread("new-active", { worktreePath: "/tmp/worktree-a" }),
          thread("new-archived", {
            archivedAt: "2026-08-19T00:00:00.000Z",
            associatedWorktreePath: "/tmp/worktree-a",
          }),
        ],
        "/tmp/worktree-a",
      ).map((item) => item.id),
    ).toEqual(["new-active", "new-archived"]);
  });

  it("counts active and archived linked conversations", () => {
    expect(
      linkedWorktreeCounts([
        thread("active"),
        thread("archived", { archivedAt: "2026-08-05T00:00:00.000Z" }),
      ]),
    ).toEqual({ active: 1, archived: 1 });
  });

  it("builds the canonical archived-thread delete command", () => {
    expect(
      createDeleteThreadCommand({
        commandId: "command-1",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.delete",
      commandId: "command-1",
      threadId: "thread-1",
    });
  });
});
