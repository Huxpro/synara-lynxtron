import { describe, expect, it } from "@rstest/core";
import { projectActionKeybindingFromEvent } from "./projectActionEditor.logic";

describe("project action keybinding capture", () => {
  it("uses mod for the platform primary modifier and allows clearing", () => {
    expect(projectActionKeybindingFromEvent({ key: "K", metaKey: true, shiftKey: true })).toBe(
      "mod+shift+k",
    );
    expect(projectActionKeybindingFromEvent({ key: "K", ctrlKey: true }, false)).toBe("mod+k");
    expect(projectActionKeybindingFromEvent({ key: "Backspace" })).toBe("");
    expect(projectActionKeybindingFromEvent({ key: "Meta", metaKey: true })).toBeNull();
  });
});
