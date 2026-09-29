import { beforeEach, describe, expect, it, rs } from "@rstest/core";
import { RIGHT_DOCK_STORAGE_KEY, openPaneInState } from "@synara/shared/rightDock";

import { webStorage } from "../platform/storage";
import {
  readRightDockThreadState,
  removeRightDockThreadState,
  storeRightDockThreadState,
} from "./rightDockState.lynx";

describe("Lynx right dock persistence", () => {
  beforeEach(() => {
    rs.stubGlobal("NativeModules", {
      bridge: {
        call: (_name: string, _params: Record<string, unknown>, reply: (value: string) => void) =>
          reply("{}"),
      },
    });
    webStorage.removeItem(RIGHT_DOCK_STORAGE_KEY);
  });

  it("uses the Web storage schema and shared sanitizer", () => {
    const state = openPaneInState(readRightDockThreadState("thread-1"), {
      paneId: "diff",
      kind: "diff",
    });
    storeRightDockThreadState("thread-1", state);
    expect(readRightDockThreadState("thread-1")).toEqual(state);
    expect(JSON.parse(webStorage.getItem(RIGHT_DOCK_STORAGE_KEY) ?? "{}")).toEqual({
      state: { dockStateByThreadId: { "thread-1": state } },
      version: 0,
    });
  });

  it("reads the canonical Zustand envelope written by Electron/Web", () => {
    webStorage.setItem(
      RIGHT_DOCK_STORAGE_KEY,
      JSON.stringify({
        state: {
          dockStateByThreadId: {
            "thread-2": {
              open: true,
              activePaneId: "explorer",
              panes: [{ id: "explorer", kind: "explorer" }],
            },
          },
        },
        version: 0,
      }),
    );
    expect(readRightDockThreadState("thread-2").activePaneId).toBe("explorer");
  });

  it("removes only the deleted thread state", () => {
    const first = openPaneInState(readRightDockThreadState("thread-1"), {
      paneId: "diff",
      kind: "diff",
    });
    const second = openPaneInState(readRightDockThreadState("thread-2"), {
      paneId: "explorer",
      kind: "explorer",
    });
    storeRightDockThreadState("thread-1", first);
    storeRightDockThreadState("thread-2", second);

    removeRightDockThreadState("thread-1");

    expect(readRightDockThreadState("thread-1")).not.toEqual(first);
    expect(readRightDockThreadState("thread-2")).toEqual(second);
  });
});
