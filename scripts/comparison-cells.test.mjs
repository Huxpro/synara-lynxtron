import { describe, expect, it } from "vitest";

import {
  compareControls,
  errorsBetweenProbes,
  parseDevtoolConsole,
  scrollbarGutterExemption,
} from "./comparison-cells.mjs";

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
