import { describe, expect, it } from "@rstest/core";

import {
  moveLynxTerminalSplitResize,
  readLynxTerminalSplitCoordinate,
  registerLynxTerminalSplitTap,
} from "./terminalSplitResize.lynx.logic";

describe("Native terminal split resize", () => {
  it("reads mouse and touch coordinates on the split axis", () => {
    expect(readLynxTerminalSplitCoordinate({ detail: { clientX: 420 } }, "horizontal")).toBe(420);
    expect(readLynxTerminalSplitCoordinate({ touches: [{ pageY: 360 }] }, "vertical")).toBe(360);
  });

  it("resizes only the adjacent pair and preserves its total weight", () => {
    expect(
      moveLynxTerminalSplitResize({
        event: { buttons: 1, clientX: 600 },
        session: {
          direction: "horizontal",
          groupId: "group",
          handleIndex: 1,
          splitId: "split",
          startCoordinate: 500,
          totalSize: 1000,
          weights: [1, 1, 1],
        },
      }),
    ).toEqual({ kind: "moved", weights: [1, 1.3, 0.7] });
  });

  it("enforces the shared 180px minimum and ends on a missed mouseup", () => {
    const session = {
      direction: "horizontal" as const,
      groupId: "group",
      handleIndex: 0,
      splitId: "split",
      startCoordinate: 500,
      totalSize: 600,
      weights: [1, 1],
    };
    expect(
      moveLynxTerminalSplitResize({
        event: { buttons: 1, clientX: 0 },
        session,
      }),
    ).toEqual({ kind: "moved", weights: [0.6, 1.4] });
    expect(
      moveLynxTerminalSplitResize({
        event: { buttons: 0, clientX: 510 },
        session,
      }),
    ).toEqual({ kind: "ended-missed-mouseup" });
  });

  it("recognizes a second tap on the same handle within the desktop threshold", () => {
    const first = registerLynxTerminalSplitTap({
      handleKey: "split-a:0",
      now: 1_000,
      previous: null,
    });
    expect(first.doubleTap).toBe(false);
    expect(
      registerLynxTerminalSplitTap({
        handleKey: "split-a:0",
        now: 1_250,
        previous: first.next,
      }),
    ).toEqual({ doubleTap: true, next: null });
  });

  it("does not combine taps across handles or outside the threshold", () => {
    const previous = { at: 1_000, handleKey: "split-a:0" };
    expect(
      registerLynxTerminalSplitTap({
        handleKey: "split-b:0",
        now: 1_100,
        previous,
      }).doubleTap,
    ).toBe(false);
    expect(
      registerLynxTerminalSplitTap({
        handleKey: "split-a:0",
        now: 1_301,
        previous,
      }).doubleTap,
    ).toBe(false);
  });
});
