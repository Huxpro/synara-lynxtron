import { describe, expect, it } from "vitest";

import { compareControls, scrollbarGutterExemption } from "./comparison-cells.mjs";

describe("comparison cells", () => {
  it("names a pure horizontal shift inside a classic-scrollbar pane", () => {
    const electron = { x: 886, y: 165, width: 176, height: 32, gutter: 10 };
    expect(scrollbarGutterExemption(electron, { x: 5, y: 0, width: 0, height: 0 })).toBe(
      "scrollbar-gutter (10px)",
    );
    expect(scrollbarGutterExemption(electron, { x: 5, y: 3, width: 0, height: 0 })).toBeNull();
    expect(
      scrollbarGutterExemption({ ...electron, gutter: 0 }, { x: 5, y: 0, width: 0, height: 0 }),
    ).toBeNull();
  });

  it("pairs only labels that occur once on each side", () => {
    const box = { x: 0, y: 0, width: 10, height: 10 };
    const result = compareControls(
      new Map([
        ["Save", [box]],
        ["Row", [box, box]],
        ["Only E", [box]],
      ]),
      new Map([
        ["Save", [{ ...box, x: 3 }]],
        ["Row", [box]],
        ["Only N", [box]],
      ]),
    );
    expect(result.compared).toBe(1);
    expect(result.outside.map((entry) => entry.label)).toEqual(["Save"]);
    expect(result.electronOnly).toEqual(["Only E"]);
    expect(result.missing).toEqual(["Only E"]);
    expect(result.nativeOnly).toEqual(["Only N"]);
  });
});
