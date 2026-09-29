import { describe, expect, it } from "@rstest/core";

import type { ProjectSummary, ThreadSummary } from "./queries";
import { makeProjectSummary, makeThreadSummary } from "./queriesTestFixtures";
import { resolveStudioRestoreRoute } from "./studioRoute.logic";

const projects: readonly ProjectSummary[] = [
  makeProjectSummary({
    id: "project-chat",
    kind: "chat",
    title: "Home",
    workspaceRoot: "/home",
  }),
  makeProjectSummary({
    id: "project-studio",
    kind: "studio",
    title: "Studio",
    workspaceRoot: "/studio",
  }),
];

function thread(input: {
  readonly id: string;
  readonly projectId: string;
  readonly archivedAt?: string | null;
  readonly updatedAt: string;
}): ThreadSummary {
  return makeThreadSummary({
    id: input.id,
    title: input.id,
    projectId: input.projectId,
    project: input.projectId,
    messageCount: 0,
    updatedAt: input.updatedAt,
    archivedAt: input.archivedAt ?? null,
    live: false,
  });
}

describe("resolveStudioRestoreRoute", () => {
  it("restores a remembered route only when it belongs to Studio", () => {
    const threads = [
      thread({
        id: "studio-latest",
        projectId: "project-studio",
        updatedAt: "2026-08-14T12:00:00.000Z",
      }),
      thread({
        id: "studio-remembered",
        projectId: "project-studio",
        updatedAt: "2026-08-13T12:00:00.000Z",
      }),
      thread({
        id: "chat-remembered",
        projectId: "project-chat",
        updatedAt: "2026-08-14T13:00:00.000Z",
      }),
    ];

    expect(
      resolveStudioRestoreRoute({
        lastThreadRoute: { threadId: "studio-remembered" },
        projects,
        sortOrder: "updated_at",
        threads,
      }),
    ).toEqual({ threadId: "studio-remembered" });
    expect(
      resolveStudioRestoreRoute({
        lastThreadRoute: { threadId: "chat-remembered" },
        projects,
        sortOrder: "updated_at",
        threads,
      }),
    ).toEqual({ threadId: "studio-latest" });
  });

  it("falls back to the latest active Studio thread", () => {
    const threads = [
      thread({
        id: "studio-latest",
        projectId: "project-studio",
        updatedAt: "2026-08-14T12:00:00.000Z",
      }),
      thread({
        id: "studio-archived",
        projectId: "project-studio",
        archivedAt: "2026-08-14T13:00:00.000Z",
        updatedAt: "2026-08-14T13:00:00.000Z",
      }),
    ];

    expect(
      resolveStudioRestoreRoute({
        lastThreadRoute: null,
        projects,
        sortOrder: "updated_at",
        threads,
      }),
    ).toEqual({ threadId: "studio-latest" });
  });

  it("returns null when Studio needs a new composer", () => {
    expect(
      resolveStudioRestoreRoute({
        lastThreadRoute: null,
        projects,
        sortOrder: "updated_at",
        threads: [
          thread({
            id: "chat-only",
            projectId: "project-chat",
            updatedAt: "2026-08-14T12:00:00.000Z",
          }),
        ],
      }),
    ).toBeNull();
  });
});
