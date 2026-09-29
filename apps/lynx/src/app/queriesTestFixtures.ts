// Shared builders for tests that feed `ProjectSummary` / `ThreadSummary` into
// sidebar, routing, and settings projections. Keep defaults minimal and neutral
// so each test only spells out the fields it asserts on.

import type { ProjectSummary, ThreadSummary } from "./queries";

export function makeProjectSummary(
  overrides: Partial<ProjectSummary> & Pick<ProjectSummary, "id">,
): ProjectSummary {
  return {
    kind: "project",
    title: overrides.id,
    remoteName: overrides.id,
    folderName: overrides.id,
    localName: null,
    workspaceRoot: `/${overrides.id}`,
    defaultModelSelection: null,
    scripts: [],
    ...overrides,
  };
}

export function makeThreadSummary(
  overrides: Partial<ThreadSummary> & Pick<ThreadSummary, "id">,
): ThreadSummary {
  return {
    title: overrides.id,
    projectId: "project",
    project: "Project",
    messageCount: 0,
    createdAt: "2026-01-01T00:00:00.000Z",
    updatedAt: "2026-01-01T00:00:00.000Z",
    live: false,
    ...overrides,
  };
}
