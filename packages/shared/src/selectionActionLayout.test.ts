import { describe, expect, it } from "vitest";

import { resolveSelectionActionLayout } from "./selectionActionLayout";

describe("resolveSelectionActionLayout", () => {
  it("centers above a selection when there is room", () => {
    expect(
      resolveSelectionActionLayout({
        selectionRect: { left: 400, top: 300, width: 100, height: 20 },
        pointer: { x: 450, y: 320 },
        viewport: { width: 1280, height: 820 },
      }),
    ).toEqual({ left: 290, top: 262, placement: "top", width: 320 });
  });

  it("flips below and clamps to the viewport edges", () => {
    expect(
      resolveSelectionActionLayout({
        selectionRect: { left: 0, top: 4, width: 20, height: 16 },
        pointer: { x: 10, y: 20 },
        viewport: { width: 320, height: 180 },
      }),
    ).toEqual({ left: 8, top: 28, placement: "bottom", width: 304 });
    expect(
      resolveSelectionActionLayout({
        selectionRect: { left: 310, top: 170, width: 10, height: 10 },
        pointer: { x: 315, y: 180 },
        viewport: { width: 320, height: 180 },
      }),
    ).toEqual({ left: 8, top: 132, placement: "top", width: 304 });
  });

  it("shrinks and clamps inside an offset narrow pane", () => {
    expect(
      resolveSelectionActionLayout({
        selectionRect: { left: 300, top: 260, width: 80, height: 20 },
        pointer: { x: 340, y: 280 },
        viewport: { left: 256, top: 46, width: 192, height: 574 },
      }),
    ).toEqual({ left: 264, top: 222, placement: "top", width: 176 });
  });
});
