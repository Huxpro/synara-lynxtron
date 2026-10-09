import { describe, expect, it } from "vitest";

import {
  DOCK_ADD_PANEL,
  DOCK_TOGGLE,
  NAVIGATION_TARGETS,
  openDockWithPane,
  openKanbanSurface,
  pick,
  showAppSidebar,
} from "./comparison-navigation.mjs";

/** A driver that records taps and finds whatever `visible` currently lists. */
function fakeDriver(kind, visible, onTap = () => undefined) {
  const taps = [];
  const key = (target) => JSON.stringify(target);
  return {
    kind,
    taps,
    find: async (target) => (visible.has(key(target)) ? { x: 0, y: 0 } : null),
    tap: async (target) => {
      taps.push(target);
      onTap(target, visible, key);
    },
  };
}

describe("comparison navigation", () => {
  it("resolves one target per renderer, shared ones for both", () => {
    expect(pick({ kind: "electron" }, NAVIGATION_TARGETS.pullRequests)).toEqual({
      label: "Code review",
    });
    expect(pick({ kind: "native" }, NAVIGATION_TARGETS.pullRequests)).toEqual({
      label: "Pull requests",
    });
    for (const kind of ["electron", "native"]) {
      expect(pick({ kind }, NAVIGATION_TARGETS.settings)).toEqual({ label: "Settings" });
    }
  });

  it("returns Electron to the app sidebar through Home, Native only out of Settings", async () => {
    const newThread = (kind) => JSON.stringify(pick({ kind }, NAVIGATION_TARGETS.newThread));
    const electron = fakeDriver("electron", new Set([newThread("electron")]));
    await showAppSidebar(electron);
    expect(electron.taps).toEqual([{ label: "Home" }]);

    const nativeInApp = fakeDriver("native", new Set([newThread("native")]));
    await showAppSidebar(nativeInApp);
    expect(nativeInApp.taps).toEqual([]);

    const nativeInSettings = fakeDriver(
      "native",
      new Set([JSON.stringify({ label: "Back to app" })]),
      (_target, visible) => visible.add(newThread("native")),
    );
    await showAppSidebar(nativeInSettings);
    expect(nativeInSettings.taps).toEqual([{ label: "Back to app" }]);
  });

  it("reaches Electron's Kanban through Tasks and Native's through its own row", async () => {
    const electron = fakeDriver(
      "electron",
      new Set([JSON.stringify(pick({ kind: "electron" }, NAVIGATION_TARGETS.newThread))]),
    );
    await openKanbanSurface(electron);
    expect(electron.taps).toEqual([
      { label: "Home" },
      { label: "Tasks" },
      { selector: "button", text: "Kanban" },
    ]);
    const native = fakeDriver("native", new Set());
    await openKanbanSurface(native);
    expect(native.taps).toEqual([{ label: "Kanban" }]);
  });

  it("opens a pane from the empty dock's launcher and leaves a populated dock alone", async () => {
    const launcher = { label: "Open Files" };
    const empty = fakeDriver("electron", new Set(), (target, visible, key) => {
      if (key(target) === key(DOCK_TOGGLE)) visible.add(key(launcher));
      if (key(target) === key(launcher)) visible.add(key(DOCK_ADD_PANEL));
    });
    await openDockWithPane(empty, "Open Files");
    expect(empty.taps).toEqual([DOCK_TOGGLE, launcher]);

    const populated = fakeDriver("native", new Set([JSON.stringify(DOCK_ADD_PANEL)]));
    await openDockWithPane(populated, "Open Files");
    expect(populated.taps).toEqual([]);
  });
});
