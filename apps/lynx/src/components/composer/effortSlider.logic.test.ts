import { describe, expect, it } from "@rstest/core";

import {
  resolveEffortSliderDragIndex,
  resolveEffortSliderStep,
  resolveEffortSliderThumbLeft,
} from "./effortSlider.logic";

describe("effort slider geometry", () => {
  it("spaces thumb centers half a thumb in from either end of the track", () => {
    // Electron's 274px track with five stops: centers at 14, 75.5, 137, 198.5, 260.
    const step = resolveEffortSliderStep(274, 5);
    expect(step).toBe(61.5);
    expect(resolveEffortSliderThumbLeft(0, step) + 14).toBe(14);
    expect(resolveEffortSliderThumbLeft(4, step) + 14).toBe(260);
  });

  it("has no travel for a single-stop ladder", () => {
    expect(resolveEffortSliderStep(274, 1)).toBe(0);
    expect(
      resolveEffortSliderDragIndex({ startIndex: 0, startX: 10, x: 300, step: 0, stopCount: 1 }),
    ).toBe(0);
  });

  it("walks whole steps from the pressed stop and clamps to the ladder", () => {
    const drag = { startIndex: 1, startX: 100, step: 61.5, stopCount: 5 };
    expect(resolveEffortSliderDragIndex({ ...drag, x: 100 + 29 })).toBe(1);
    expect(resolveEffortSliderDragIndex({ ...drag, x: 100 + 32 })).toBe(2);
    expect(resolveEffortSliderDragIndex({ ...drag, x: 100 + 400 })).toBe(4);
    expect(resolveEffortSliderDragIndex({ ...drag, x: 100 - 400 })).toBe(0);
  });
});
