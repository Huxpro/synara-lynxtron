import { describe, expect, it, rs } from "@rstest/core";
import {
  deleteProjectThreadsSequentially,
  deriveProjectThreadArchivePlan,
  projectRemoveConfirmation,
  projectThreadArchiveConfirmation,
  projectThreadArchiveResultMessage,
  projectThreadDeleteConfirmation,
} from "./projectThreadArchive";

describe("project thread archive policy", () => {
  it("excludes archived rows and only skips a session with a live running turn", () => {
    expect(
      deriveProjectThreadArchivePlan([
        { id: "ready", archivedAt: null, sessionStatus: "idle", activeTurnId: null },
        { id: "running", archivedAt: null, sessionStatus: "running", activeTurnId: "turn-a" },
        { id: "settling", archivedAt: null, sessionStatus: "running", activeTurnId: null },
        { id: "old", archivedAt: "2026-01-01", sessionStatus: "closed", activeTurnId: null },
      ]),
    ).toEqual({
      archivableThreadIds: ["ready", "settling"],
      runningCount: 1,
      totalCount: 3,
    });
  });

  it("matches confirmation and partial-result copy", () => {
    expect(
      projectThreadArchiveConfirmation({
        projectName: "Synara",
        archivableCount: 2,
        runningCount: 1,
      }),
    ).toContain("1 running thread is currently active and will be skipped.");
    expect(
      projectThreadArchiveResultMessage({
        archivedCount: 1,
        failureCount: 1,
        projectName: "Synara",
        runningCount: 1,
      }),
    ).toBe("Failed to archive 1 thread. Skipped 1 running thread.");
  });
});

describe("project deletion policy", () => {
  it("deletes sequentially, continues after failures, and reports successful ids", async () => {
    const calls: string[] = [];
    const onFailure = rs.fn();
    const result = await deleteProjectThreadsSequentially({
      threads: [{ id: "a" }, { id: "b" }, { id: "c" }],
      deleteThread: async ({ id }) => {
        calls.push(id);
        if (id === "b") throw new Error("failed");
      },
      onFailure,
    });
    expect(calls).toEqual(["a", "b", "c"]);
    expect(result).toEqual({ deletedThreadIds: ["a", "c"], failureCount: 1, totalCount: 3 });
    expect(onFailure).toHaveBeenCalledOnce();
  });

  it("matches Electron deletion confirmation copy", () => {
    expect(projectThreadDeleteConfirmation({ projectName: "Demo", threadCount: 2 })).toBe(
      'Delete 2 threads in "Demo"?\nThis permanently clears conversation history for these threads.',
    );
    expect(projectRemoveConfirmation({ projectName: "Demo", threadCount: 1 })).toBe(
      'Remove project "Demo"?\nThis will delete 1 thread in this folder and remove the project.',
    );
    expect(projectRemoveConfirmation({ projectName: "Demo", threadCount: 0 })).toBe(
      'Remove project "Demo"?',
    );
  });
});
