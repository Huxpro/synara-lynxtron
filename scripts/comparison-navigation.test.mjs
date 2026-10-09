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
    find: async (target) => (visible.has(key(target)) ? { x: 100, y: 10, width: 40 } : null),
    tap: async (target) => {
      taps.push(target);
      onTap(target, visible, key);
    },
  };
}

describe("comparison navigation", () => {
  it("resolves one target per renderer, shared ones for both", () => {
    for (const kind of ["electron", "native"]) {
      expect(pick({ kind }, NAVIGATION_TARGETS.pullRequests)).toEqual({ label: "Code review" });
      expect(pick({ kind }, NAVIGATION_TARGETS.settings)).toEqual({ label: "Settings" });
      expect(pick({ kind }, NAVIGATION_TARGETS.appSidebar)).toEqual({ label: "Home" });
    }
    expect(pick({ kind: "electron" }, NAVIGATION_TARGETS.settingsShown)).toEqual({
      selector: "button",
      text: "Keybindings",
    });
    expect(pick({ kind: "native" }, NAVIGATION_TARGETS.settingsShown)).toEqual({
      label: "Keybindings",
    });
  });

  it("returns both renderers to the app sidebar through the rail's Home", async () => {
    const newThread = (kind) => JSON.stringify(pick({ kind }, NAVIGATION_TARGETS.newThread));
    for (const kind of ["electron", "native"]) {
      const inApp = fakeDriver(kind, new Set([newThread(kind)]));
      await showAppSidebar(inApp);
      expect(inApp.taps).toEqual([{ label: "Home" }]);

      const inSettings = fakeDriver(kind, new Set(), (_target, visible) =>
        visible.add(newThread(kind)),
      );
      await showAppSidebar(inSettings);
      expect(inSettings.taps).toEqual([{ label: "Home" }]);
    }
  });

  it("reaches the Kanban board through Tasks; Electron also picks the Kanban view", async () => {
    const newThread = (kind) => JSON.stringify(pick({ kind }, NAVIGATION_TARGETS.newThread));
    const electron = fakeDriver("electron", new Set([newThread("electron")]));
    await openKanbanSurface(electron);
    expect(electron.taps).toEqual([
      { label: "Home" },
      { label: "Tasks" },
      { selector: "button", text: "Kanban" },
    ]);
    const native = fakeDriver("native", new Set([newThread("native")]));
    await openKanbanSurface(native);
    expect(native.taps).toEqual([{ label: "Home" }, { label: "Tasks" }]);
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
