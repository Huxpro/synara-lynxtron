import { describe, expect, it } from "vitest";

import { SPACE_ICON_OPTIONS, validateSpaceName } from "./spacePresentation";

describe("Space presentation policy", () => {
  it("exposes every canonical icon once with a human label", () => {
    expect(SPACE_ICON_OPTIONS).toHaveLength(20);
    expect(new Set(SPACE_ICON_OPTIONS.map((option) => option.name)).size).toBe(20);
    expect(SPACE_ICON_OPTIONS).toContainEqual({ name: "tree", label: "Tree" });
  });

  it("validates names case-insensitively and reserves Void", () => {
    expect(validateSpaceName(" ", [])).toBe("Enter a space name.");
    expect(validateSpaceName(" VOID ", [])).toBe("Void is reserved for unassigned projects.");
    expect(validateSpaceName(" work ", ["Work"])).toBe("A space with this name already exists.");
    expect(validateSpaceName("Focus", ["Work"])).toBeNull();
  });
});
