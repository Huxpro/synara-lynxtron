import { describe, expect, it } from "@rstest/core";
import { renameProjectLocally } from "@synara-web/store";

function state() {
  return {
    spaces: [],
    projects: [
      {
        id: "project-a",
        kind: "project" as const,
        name: "Remote title",
        remoteName: "Remote title",
        folderName: "repo-folder",
        localName: null,
        cwd: "/work/repo-folder",
        defaultModelSelection: null,
        expanded: true,
        isPinned: false,
        spaceId: null,
        scripts: [],
      },
    ],
    sidebarThreadSummaryById: {},
    threadsHydrated: true,
  };
}

describe("shared project local-name policy in Native", () => {
  it("sets a trimmed local alias without changing remote or folder identity", () => {
    const next = renameProjectLocally(state() as never, "project-a" as never, "  Focus  ");
    expect(next.projects[0]).toMatchObject({
      name: "Focus",
      localName: "Focus",
      remoteName: "Remote title",
      folderName: "repo-folder",
    });
  });

  it("clears the alias back to the authoritative remote title", () => {
    const aliased = renameProjectLocally(state() as never, "project-a" as never, "Focus");
    const next = renameProjectLocally(aliased, "project-a" as never, null);
    expect(next.projects[0]).toMatchObject({
      name: "Remote title",
      localName: null,
      remoteName: "Remote title",
    });
  });
});
