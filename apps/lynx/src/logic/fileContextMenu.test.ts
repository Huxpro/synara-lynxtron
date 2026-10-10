import { describe, expect, it } from "@rstest/core";
import { buildFileContextMenuItems } from "./fileContextMenu";

describe("file context menu policy", () => {
  it("keeps renderer menus in the same order and omits unavailable chat actions", () => {
    expect(
      buildFileContextMenuItems({
        referenceAvailable: true,
        askWhyAvailable: false,
        referenceLabel: "Reference lines 2-4 in chat",
      }),
    ).toEqual([
      { id: "reference-in-chat", label: "Reference lines 2-4 in chat" },
      { id: "copy-path", label: "Copy path" },
    ]);
  });
});
