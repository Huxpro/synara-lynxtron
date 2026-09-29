import { beforeEach, describe, expect, it } from "@rstest/core";
import type { ThreadId } from "@synara/contracts";

import { dockTerminalThreadId } from "@synara-web/lib/dockTerminalScope";
import { selectThreadTerminalState, useTerminalStateStore } from "@synara-web/terminalStateStore";
import { flushStorage, webStorage } from "../platform/storage";

const HOST_THREAD_ID = "native-terminal-persistence-host" as ThreadId;
const SCOPE_ID = dockTerminalThreadId(HOST_THREAD_ID);

describe("Native dock terminal shared persistence", () => {
  beforeEach(async () => {
    Object.defineProperty(globalThis, "NativeModules", {
      configurable: true,
      value: {
        bridge: {
          call: (
            _method: string,
            _params: Record<string, unknown>,
            callback: (reply: string) => void,
          ) => callback(JSON.stringify({ ok: true })),
        },
      },
    });
    await flushStorage();
    useTerminalStateStore.setState({ terminalStateByThreadId: {} });
    webStorage.removeItem("synara:terminal-state:v1");
    await flushStorage();
  });

  it("uses the Electron synthetic scope and preserves layout mutations there", () => {
    const store = useTerminalStateStore.getState();
    store.openTerminalThreadPage(SCOPE_ID, { terminalOnly: true });
    store.splitTerminalRight(SCOPE_ID, "terminal-native-right");

    const split = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    const group = split.terminalGroups.find(
      (candidate) => candidate.id === split.activeTerminalGroupId,
    );
    expect(group?.layout.type).toBe("split");
    if (group?.layout.type !== "split") return;

    store.resizeTerminalSplit(SCOPE_ID, group.id, group.layout.id, [1.4, 0.6]);
    const resized = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    expect(resized.terminalGroups[0]?.layout).toMatchObject({
      type: "split",
      weights: [1.4, 0.6],
    });
    expect(
      useTerminalStateStore.getState().terminalStateByThreadId[HOST_THREAD_ID],
    ).toBeUndefined();
  });

  it("preserves multiple groups and selects a restored group by terminal", () => {
    const store = useTerminalStateStore.getState();
    store.openTerminalThreadPage(SCOPE_ID, { terminalOnly: true });
    store.newTerminal(SCOPE_ID, "terminal-native-group");

    let state = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    expect(state.terminalGroups).toHaveLength(2);

    store.setActiveTerminal(SCOPE_ID, "default");
    state = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    expect(state.activeTerminalId).toBe("default");
    expect(state.activeTerminalGroupId).toBe("group-default");
  });

  it("removes canonical and dock scopes without recreating defaults", () => {
    const store = useTerminalStateStore.getState();
    store.openTerminalThreadPage(HOST_THREAD_ID, { terminalOnly: true });
    store.openTerminalThreadPage(SCOPE_ID, { terminalOnly: true });

    store.removeTerminalState(HOST_THREAD_ID);
    store.removeTerminalState(SCOPE_ID);

    expect(useTerminalStateStore.getState().terminalStateByThreadId).toEqual({});
  });

  it("rehydrates active group and split weights from the canonical v1 envelope", async () => {
    const store = useTerminalStateStore.getState();
    store.openTerminalThreadPage(SCOPE_ID, { terminalOnly: true });
    store.splitTerminalRight(SCOPE_ID, "terminal-native-right");
    let state = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    const splitGroup = state.terminalGroups[0]!;
    if (splitGroup.layout.type !== "split") {
      throw new Error("expected split terminal group");
    }
    store.resizeTerminalSplit(SCOPE_ID, splitGroup.id, splitGroup.layout.id, [1.35, 0.65]);
    store.newTerminal(SCOPE_ID, "terminal-native-group");
    store.setActiveTerminal(SCOPE_ID, "terminal-native-right");

    const persistedState = useTerminalStateStore.getState().terminalStateByThreadId;
    webStorage.setItem(
      "synara:terminal-state:v1",
      JSON.stringify({ state: { terminalStateByThreadId: persistedState }, version: 1 }),
    );
    useTerminalStateStore.setState({ terminalStateByThreadId: {} });
    await useTerminalStateStore.persist.rehydrate();

    state = selectThreadTerminalState(
      useTerminalStateStore.getState().terminalStateByThreadId,
      SCOPE_ID,
    );
    expect(state.terminalGroups).toHaveLength(2);
    expect(state.activeTerminalId).toBe("terminal-native-right");
    expect(state.activeTerminalGroupId).toBe("group-default");
    expect(state.terminalGroups[0]?.layout).toMatchObject({
      type: "split",
      weights: [1.35, 0.65],
    });
  });
});
