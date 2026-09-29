import { describe, expect, it } from "vitest";

import { buildComposerProjectPickerModel } from "./ComposerProjectPicker.logic";

const projects = [
  {
    id: "project-void" as never,
    kind: "project",
    projectId: "project-void" as never,
    workspaceRoot: "/tmp/void-project",
    primaryLabel: "void-project",
    spaceId: null,
  },
  {
    id: "project-studio" as never,
    kind: "project",
    projectId: "project-studio" as never,
    workspaceRoot: "/tmp/studio-project",
    primaryLabel: "Studio",
    secondaryLabel: "studio-project",
    spaceId: "space-studio" as never,
    spaceName: "Work",
    spaceIcon: "backpack",
    spaceSortOrder: 1,
  },
  {
    id: "folder-local" as never,
    kind: "folder",
    projectId: null,
    workspaceRoot: "/tmp/local-folder",
    primaryLabel: "local-folder",
    spaceId: "__local__" as never,
    spaceName: "Folders on this Mac",
    spaceIcon: "home",
    spaceSortOrder: Number.MAX_SAFE_INTEGER,
  },
] as const;

describe("buildComposerProjectPickerModel", () => {
  it("groups Void and named spaces while preserving selection", () => {
    const model = buildComposerProjectPickerModel({
      projects,
      selectedOptionId: "project-studio",
      query: "",
    });

    expect(model.groups.map((group) => group.label)).toEqual([
      "Work",
      "Void",
      "Folders on this Mac",
    ]);
    expect(model.groups.find((group) => group.label === "Void")?.icon).toBe("black-hole");
    expect(model.groups[0]?.options[0]).toMatchObject({
      primaryLabel: "Studio",
      secondaryLabel: "studio-project",
      selected: true,
    });
    expect(model.selectedLabel).toBe("Studio");
    expect(model.selectedSecondaryLabel).toBe("studio-project");
  });

  it("preserves project and folder selection intents in the shared option model", () => {
    const model = buildComposerProjectPickerModel({
      projects,
      selectedOptionId: "folder-local",
      query: "",
    });

    expect(model.groups.at(-1)?.options).toEqual([
      {
        id: "folder-local",
        kind: "folder",
        projectId: null,
        workspaceRoot: "/tmp/local-folder",
        primaryLabel: "local-folder",
        secondaryLabel: null,
        selected: true,
      },
    ]);
    expect(model.selectedLabel).toBe("local-folder");
    expect(model.selectedSecondaryLabel).toBeNull();
  });

  it("filters by project, secondary, space, and workspace text", () => {
    expect(
      buildComposerProjectPickerModel({
        projects,
        selectedOptionId: null,
        query: "studio-project",
      }).groups.flatMap((group) => group.options.map((option) => option.id)),
    ).toEqual(["project-studio"]);
    expect(
      buildComposerProjectPickerModel({
        projects,
        selectedOptionId: null,
        query: "work",
      }).groups.flatMap((group) => group.options.map((option) => option.id)),
    ).toEqual(["project-studio"]);
    expect(
      buildComposerProjectPickerModel({
        projects,
        selectedOptionId: null,
        query: "local-folder",
      }).groups.flatMap((group) => group.options.map((option) => option.id)),
    ).toEqual(["folder-local"]);
  });

  it("owns empty and no-match copy", () => {
    expect(
      buildComposerProjectPickerModel({
        projects: [],
        selectedOptionId: null,
        query: "",
      }).emptyText,
    ).toBe("No projects yet");
    expect(
      buildComposerProjectPickerModel({
        projects,
        selectedOptionId: null,
        query: "missing",
      }).emptyText,
    ).toBe("No matching projects");
  });

  it("uses the caller's empty trigger label without inventing a selection", () => {
    const model = buildComposerProjectPickerModel({
      projects,
      selectedOptionId: null,
      query: "",
      emptyTriggerLabel: "Choose a workspace",
    });

    expect(model.selectedLabel).toBe("Choose a workspace");
    expect(model.selectedSecondaryLabel).toBeNull();
    expect(model.groups.flatMap((group) => group.options)).not.toContainEqual(
      expect.objectContaining({ selected: true }),
    );
  });
});
