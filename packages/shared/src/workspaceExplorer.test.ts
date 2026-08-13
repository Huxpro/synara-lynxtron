import { describe, expect, it } from "vitest";

import { shouldShowWorkspaceExplorerEntry } from "./workspaceExplorer";

describe("workspace Explorer visibility", () => {
  it.each([".synara", ".synara-fidelity", ".turbo", "node_modules", "dist"])(
    "hides generated directory %s",
    (name) => {
      expect(shouldShowWorkspaceExplorerEntry({ kind: "directory", name })).toBe(false);
    },
  );

  it.each([".github", "apps", "packages"])("keeps project directory %s", (name) => {
    expect(shouldShowWorkspaceExplorerEntry({ kind: "directory", name })).toBe(true);
  });

  it("does not hide a file solely because its name matches a generated directory", () => {
    expect(shouldShowWorkspaceExplorerEntry({ kind: "file", name: "dist" })).toBe(true);
  });
});
