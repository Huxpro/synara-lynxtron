import { describe, expect, it } from "vitest";

import {
  projectSidebarSearchProject,
  projectSidebarSearchThreads,
} from "./SidebarSearchProjection.logic";

describe("Sidebar search projection", () => {
  it("normalizes project display fallbacks from one source", () => {
    expect(
      projectSidebarSearchProject({
        id: "project-1",
        name: "Synara",
        cwd: "/work/synara",
        spaceName: "Focus",
      }),
    ).toMatchObject({
      remoteName: "Synara",
      folderName: "synara",
      localName: null,
    });
  });

  it("preserves visible thread order and skips missing full records", () => {
    const project = projectSidebarSearchProject({
      id: "project-1",
      name: "Synara",
      cwd: "/work/synara",
      spaceName: "Focus",
    });
    const projected = projectSidebarSearchThreads({
      projects: [project],
      visibleThreadIds: ["thread-2", "missing", "thread-1"],
      threads: [
        {
          id: "thread-1",
          title: "One",
          projectId: project.id,
          provider: "codex",
          createdAt: "2026-01-01",
        },
        {
          id: "thread-2",
          title: "Two",
          projectId: project.id,
          provider: "codex",
          createdAt: "2026-01-02",
        },
      ],
    });

    expect(projected.map((thread) => thread.id)).toEqual(["thread-2", "thread-1"]);
    expect(projected[0]).toMatchObject({
      projectName: "Synara",
      projectRemoteName: "Synara",
      spaceName: "Focus",
      messages: [],
    });
  });
});
