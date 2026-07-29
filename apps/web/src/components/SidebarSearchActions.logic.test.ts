import { describe, expect, it, vi } from "vitest";

import { buildSidebarSearchActions } from "./SidebarSearchActions.logic";

describe("buildSidebarSearchActions", () => {
  it("keeps the authoritative Web action order", () => {
    expect(
      buildSidebarSearchActions({
        spaces: [{ id: "space-1", name: "Focus" }],
      }).map((action) => action.id),
    ).toEqual([
      "new-chat",
      "new-thread",
      "add-project",
      "import-thread",
      "feedback",
      "settings",
      "usage-settings",
      "switch-space-void",
      "switch-space-space-1",
      "new-space",
    ]);
  });

  it("removes unavailable capabilities without changing shared copy", () => {
    expect(
      buildSidebarSearchActions({
        includeAddProject: false,
        includeImportThread: false,
        includeFeedback: false,
        includeUsageSettings: false,
        includeSpaces: false,
        includeNewSpace: false,
      }).map((action) => action.id),
    ).toEqual(["new-chat", "new-thread", "settings"]);
  });

  it("binds injected space callbacks", () => {
    const onSelectSpace = vi.fn();
    const action = buildSidebarSearchActions({
      spaces: [{ id: "space-1", name: "Focus" }],
      onSelectSpace,
    }).find((candidate) => candidate.id === "switch-space-space-1");

    action?.run?.();
    expect(onSelectSpace).toHaveBeenCalledWith("space-1");
  });
});
