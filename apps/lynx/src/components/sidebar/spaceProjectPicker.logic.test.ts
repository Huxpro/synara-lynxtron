import { describe, expect, it } from "@rstest/core";
import {
  chunkSpaceProjectIds,
  deriveSpaceProjectPickerGroups,
  spaceProjectPickerFailureMessage,
  toggleSpaceProjectSelection,
} from "@synara/shared/spaceProjectPicker";

const spaces = [
  { id: "space-a", name: "Alpha", icon: "bag" as const },
  { id: "space-b", name: "Beta", icon: "rocket" as const },
];
const projects = [
  { id: "z", name: "Zulu", path: "/work/zulu", spaceId: null },
  { id: "a", name: "Able", path: "/work/able", spaceId: "space-a" },
  { id: "b", name: "Beta tool", path: "/work/beta", spaceId: "space-b" },
];

describe("shared Space project picker policy in Native", () => {
  it("filters the target and groups matching projects with the active Space first", () => {
    const result = deriveSpaceProjectPickerGroups({
      activeSpaceId: "space-b",
      projects,
      query: "",
      spaces,
      targetSpaceId: "space-a",
    });
    expect(result.candidates.map((project) => project.id)).toEqual(["b", "z"]);
    expect(result.groups.map((group) => group.label)).toEqual(["Beta · Active", "Void"]);
    expect(
      deriveSpaceProjectPickerGroups({
        activeSpaceId: null,
        projects,
        query: "alpha",
        spaces,
        targetSpaceId: "space-b",
      }).candidates.map((project) => project.id),
    ).toEqual(["a"]);
  });

  it("toggles immutable selection and chunks commands at 200 projects", () => {
    const original = new Set(["a"]);
    expect([...toggleSpaceProjectSelection(original, "b")]).toEqual(["a", "b"]);
    expect([...original]).toEqual(["a"]);
    expect(
      chunkSpaceProjectIds(Array.from({ length: 401 }, (_, index) => "project-" + index)).map(
        (chunk) => chunk.length,
      ),
    ).toEqual([200, 200, 1]);
  });

  it("matches the Web partial-failure copy", () => {
    expect(spaceProjectPickerFailureMessage(2, "Alpha")).toBe(
      "2 could not be moved. Projects processed before the failure remain in Alpha. Try again.",
    );
  });
});
