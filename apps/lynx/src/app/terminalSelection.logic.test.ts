import { describe, expect, it } from "@rstest/core";

import {
  resolveTerminalSelectionLineRange,
  TERMINAL_SELECTION_SETTLE_DELAY_MS,
} from "./terminalSelection.logic";

describe("terminal selection line range", () => {
  it("uses Electron xterm multi-click settling time", () => {
    expect(TERMINAL_SELECTION_SETTLE_DELAY_MS).toBe(260);
  });

  it("maps a single-line selection to its projected terminal line", () => {
    expect(
      resolveTerminalSelectionLineRange({
        text: "first\nsecond\nthird",
        start: 7,
        end: 10,
      }),
    ).toEqual({ lineStart: 2, lineEnd: 2 });
  });

  it("treats the selection end as exclusive across lines", () => {
    expect(
      resolveTerminalSelectionLineRange({
        text: "first\nsecond\nthird",
        start: 3,
        end: 12,
      }),
    ).toEqual({ lineStart: 1, lineEnd: 2 });
  });

  it("normalizes reverse selections before resolving their line range", () => {
    expect(
      resolveTerminalSelectionLineRange({
        text: "first\nsecond\nthird",
        start: 12,
        end: 3,
      }),
    ).toEqual({ lineStart: 1, lineEnd: 2 });
  });

  it("does not count an exclusive trailing newline as another selected line", () => {
    expect(
      resolveTerminalSelectionLineRange({
        text: "first\nsecond\nthird",
        start: 6,
        end: 13,
      }),
    ).toEqual({ lineStart: 2, lineEnd: 2 });
  });
});
