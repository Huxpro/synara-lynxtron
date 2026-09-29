import { describe, expect, it } from "@rstest/core";

import type { ProjectSummary, ThreadSummary } from "./queries";
import {
  compareArchivedThreads,
  createUnarchiveCommand,
  groupArchivedThreads,
} from "./settingsArchived.logic";

function thread(
  id: string,
  projectId: string,
  timestamps: {
    readonly archivedAt?: string | null;
    readonly updatedAt?: string;
    readonly createdAt?: string;
  } = {},
): ThreadSummary {
  return {
    id,
    projectId,
    project: projectId,
    title: `Thread ${id}`,
    messageCount: 0,
    createdAt: timestamps.createdAt ?? "2026-01-01T00:00:00.000Z",
    updatedAt: timestamps.updatedAt ?? "2026-01-02T00:00:00.000Z",
    archivedAt: timestamps.archivedAt,
    live: false,
  };
}

const projects: readonly ProjectSummary[] = [
  {
    id: "project-a",
    kind: "project",
    title: "Project A",
    workspaceRoot: "/project-a",
  },
  {
    id: "project-b",
    kind: "project",
    title: "Project B",
    workspaceRoot: "/project-b",
  },
];

describe("Settings Archived projection", () => {
  it("groups archived threads in project order and appends unknown projects", () => {
    const groups = groupArchivedThreads(projects, [
      thread("active", "project-a", { archivedAt: null }),
      thread("old", "project-a", {
        archivedAt: "2026-01-03T00:00:00.000Z",
      }),
      thread("new", "project-a", {
        archivedAt: "2026-01-05T00:00:00.000Z",
      }),
      thread("orphan", "missing-project", {
        archivedAt: "2026-01-04T00:00:00.000Z",
      }),
    ]);

    expect(groups.map((group) => group.title)).toEqual(["Project A", "Unknown project"]);
    expect(groups[0]?.threads.map((item) => item.id)).toEqual(["new", "old"]);
    expect(groups[1]?.threads.map((item) => item.id)).toEqual(["orphan"]);
  });

  it("falls back from archivedAt to updatedAt and createdAt deterministically", () => {
    const items = [
      thread("created", "project-a", {
        archivedAt: undefined,
        updatedAt: "",
        createdAt: "2026-01-03T00:00:00.000Z",
      }),
      thread("updated", "project-a", {
        archivedAt: undefined,
        updatedAt: "2026-01-04T00:00:00.000Z",
      }),
      thread("archived", "project-a", {
        archivedAt: "2026-01-05T00:00:00.000Z",
      }),
    ];

    expect([...items].sort(compareArchivedThreads).map((item) => item.id)).toEqual([
      "archived",
      "updated",
      "created",
    ]);
  });

  it("returns no groups for an empty archived projection", () => {
    expect(
      groupArchivedThreads(projects, [thread("active", "project-a", { archivedAt: null })]),
    ).toEqual([]);
  });

  it("builds the canonical unarchive command", () => {
    expect(
      createUnarchiveCommand({
        commandId: "command-1",
        threadId: "thread-1",
      }),
    ).toEqual({
      type: "thread.unarchive",
      commandId: "command-1",
      threadId: "thread-1",
    });
  });
});
