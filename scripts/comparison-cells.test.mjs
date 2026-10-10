import { describe, expect, it } from "vitest";

import {
  comparableLabel,
  compareControls,
  errorsBetweenProbes,
  modelTriggerSettled,
  namedOffsetExemption,
  parseDevtoolConsole,
  scrollbarGutterExemption,
} from "./comparison-cells.mjs";

describe("comparison cells", () => {
  it("pairs the rail's usage buttons by provider, not by their live quota text", () => {
    const box = { x: 7.5, y: 640, width: 36, height: 36, gutter: 0 };
    const electron = new Map([["Claude usage: Unavailable. Open usage settings", [box]]]);
    const native = new Map([
      [
        "Claude usage: 5h 81% remaining, Weekly 9% remaining. Open usage settings",
        [{ ...box, x: 8 }],
      ],
    ]);
    const result = compareControls(electron, native);
    expect(result.compared).toBe(1);
    expect(result.matched).toBe(1);
    expect(result.missing).toEqual([]);
    // Geometry is still compared.
    const moved = compareControls(
      electron,
      new Map([[[...native.keys()][0], [{ ...box, x: 20 }]]]),
    );
    expect(moved.outside).toHaveLength(1);
    expect(comparableLabel("Codex usage: Weekly 41% remaining. Open usage settings")).toBe(
      "Codex usage. Open usage settings",
    );
    expect(comparableLabel("Open usage settings")).toBe("Open usage settings");
  });

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

describe("landing readiness on Electron", () => {
  it("waits for the effort label, or for a width that stopped changing", () => {
    const seen = new WeakMap();
    const driver = {};
    expect(modelTriggerSettled(seen, driver, null, 0)).toBe(false);
    // Catalog still loading: narrow trigger, no effort label.
    expect(modelTriggerSettled(seen, driver, { width: 137.5, hasEffortLabel: false }, 0)).toBe(
      false,
    );
    expect(modelTriggerSettled(seen, driver, { width: 137.5, hasEffortLabel: false }, 5_000)).toBe(
      false,
    );
    expect(modelTriggerSettled(seen, driver, { width: 188.7, hasEffortLabel: true }, 5_100)).toBe(
      true,
    );
    // A model without an effort ladder settles once its width has been quiet long enough.
    const other = {};
    expect(modelTriggerSettled(seen, other, { width: 120, hasEffortLabel: false }, 0)).toBe(false);
    expect(modelTriggerSettled(seen, other, { width: 130, hasEffortLabel: false }, 5_000)).toBe(
      false,
    );
    expect(modelTriggerSettled(seen, other, { width: 130, hasEffortLabel: false }, 11_000)).toBe(
      true,
    );
  });
});

describe("named offsets", () => {
  const electron = { x: 910, y: 444, width: 176, height: 32, gutter: 10 };

  it("explains a control only at the stated offset and at its Electron size", () => {
    expect(
      namedOffsetExemption("Default provider", electron, { x: 5, y: -222, width: 0, height: 0 }, 2),
    ).toMatch(/Synara Beta card/);
    // 8px away from where the offset puts it: still a failure.
    expect(
      namedOffsetExemption("Default provider", electron, { x: 0, y: -214, width: 0, height: 0 }, 2),
    ).toBeNull();
    // Right place, wrong size.
    expect(
      namedOffsetExemption(
        "Default provider",
        electron,
        { x: 0, y: -222, width: 12, height: 0 },
        2,
      ),
    ).toBeNull();
  });

  it("does not apply to other controls", () => {
    expect(
      namedOffsetExemption("Search settings", electron, { x: 0, y: -222, width: 0, height: 0 }, 2),
    ).toBeNull();
  });
});

describe("DevTool console output", () => {
  it("reads an empty console as no messages", () => {
    expect(parseDevtoolConsole("")).toEqual([]);
    expect(parseDevtoolConsole("\n")).toEqual([]);
  });

  it("keeps multi-line messages together", () => {
    const output = [
      "- [error/main-thread]: QuickContext::Execute() exception!!!",
      "main-thread.js exception: TypeError: not a function backtrace:",
      "    at <anonymous> (file:///main-thread.js:12092:29319)",
      "",
      "- [error/background]: Error: snapshotPatchApply failed",
      "",
    ].join("\n");
    expect(parseDevtoolConsole(output)).toEqual([
      {
        level: "error",
        thread: "main-thread",
        text: [
          "QuickContext::Execute() exception!!!",
          "main-thread.js exception: TypeError: not a function backtrace:",
          "    at <anonymous> (file:///main-thread.js:12092:29319)",
        ].join("\n"),
      },
      { level: "error", thread: "background", text: "Error: snapshotPatchApply failed" },
    ]);
  });

  it("rejects output it does not understand instead of reporting a clean console", () => {
    expect(() => parseDevtoolConsole("No Lynx DevTool clients were found.")).toThrow();
  });
});

describe("Native console errors for one run", () => {
  const entry = (text) => ({ level: "error", thread: "background", text });

  it("returns only what was logged between the probes", () => {
    expect(
      errorsBetweenProbes(
        [entry("earlier"), entry("p:start"), entry("boom"), entry("p:end"), entry("later")],
        "p",
      ),
    ).toEqual([entry("boom")]);
    expect(errorsBetweenProbes([entry("p:start"), entry("p:end")], "p")).toEqual([]);
  });

  it("reports an unreadable or probe-less console as unavailable", () => {
    expect(errorsBetweenProbes(null, "p")).toMatch(/^unavailable/);
    expect(errorsBetweenProbes([], "p")).toMatch(/^unavailable/);
    expect(errorsBetweenProbes([entry("p:start")], "p")).toMatch(/^unavailable/);
  });
});
