import { describe, expect, it } from "@rstest/core";
import {
  deriveProjectThreadArchivePlan,
  projectThreadArchiveConfirmation,
  projectThreadArchiveResultMessage,
} from "../../logic/projectThreadArchive";

describe("shared project thread archive policy in Native", () => {
  it("excludes archived rows and only skips sessions with a live running turn", () => {
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

  it("matches Electron confirmation and result copy", () => {
    expect(
      projectThreadArchiveConfirmation({
        projectName: "Synara",
        archivableCount: 2,
        runningCount: 1,
      }),
    ).toBe(
      [
        'Archive 2 threads in "Synara"?',
        "Archived threads are hidden from the sidebar but can be restored later.",
        "",
        "1 running thread is currently active and will be skipped.",
      ].join("\n"),
    );
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
