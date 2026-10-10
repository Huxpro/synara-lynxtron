import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { describe, expect, it } from "@rstest/core";

import {
  buildCommandAcceleratorMenuItems,
  buildModelPickerShortcutMenuItems,
  canonicalAccelerator,
  collectMenuAccelerators,
  parseCommandAccelerators,
  INITIAL_SHELL_ROUTE_DELIVERY_STATE,
  buildSynaraRelaunchArguments,
  buildSearchNavigationMenuItems,
  buildRecentViewNavigationMenuItems,
  buildTerminalInputMenuItems,
  buildTerminalSearchMenuItems,
  buildTerminalSearchNavigationMenuItems,
  dispatchRendererGlobalEvent,
  SEARCH_NAVIGATION_ACCELERATORS,
  TERMINAL_INPUT_ACCELERATORS,
  parseSynaraDeepLink,
  parseSynaraDeepLinkInitData,
  parseSynaraRelaunchRoute,
  parseViewportProbeSequence,
  parseWindowState,
  reduceShellRouteDelivery,
  resolveNativeRendererCommand,
  resolveRestoredBounds,
  resolveShellUserDataDir,
  resolveShellWindowPresentation,
  shouldAcquireShellSingleInstanceLock,
  writeJsonAtomic,
} from "./shellRuntime";

describe("shellRuntime", () => {
  it("preserves Components Lab story and state identity", () => {
    expect(
      parseSynaraDeepLinkInitData(
        "synara://components-lab?story=typography%2Fdiff-code&state=default&variant=split",
      )?.initialRoute,
    ).toBe("/components-lab?story=typography%2Fdiff-code&state=default&variant=split");
  });

  it("parses only explicit viewport probe sizes and honors desktop minima", () => {
    expect(parseViewportProbeSequence(undefined)).toEqual([]);
    expect(parseViewportProbeSequence("840x620, invalid, 1024x700,640x480")).toEqual([
      { width: 840, height: 620 },
      { width: 1024, height: 700 },
      { width: 840, height: 620 },
    ]);
  });

  it("uses only an explicit absolute state-directory override", () => {
    expect(resolveShellUserDataDir("/default/user-data", undefined)).toBe("/default/user-data");
    expect(resolveShellUserDataDir("/default/user-data", "  /tmp/synara-owned  ")).toBe(
      "/tmp/synara-owned",
    );
    expect(() => resolveShellUserDataDir("/default/user-data", "./relative")).toThrow(
      "SYNARA_LYNX_USER_DATA_DIR must be an absolute path.",
    );
  });

  it("rejects malformed or undersized window state", () => {
    expect(parseWindowState("{}")).toBeNull();
    expect(
      parseWindowState(
        JSON.stringify({
          version: 1,
          bounds: { x: 0, y: 0, width: 200, height: 200 },
          maximized: false,
          fullscreen: false,
        }),
      ),
    ).toBeNull();
  });

  it("centers an off-screen window in the current work area", () => {
    expect(
      resolveRestoredBounds(
        { x: 9000, y: 9000, width: 1200, height: 800 },
        { x: 0, y: 0, width: 1600, height: 1000 },
      ),
    ).toEqual({ x: 200, y: 100, width: 1200, height: 800 });
  });

  it("preserves Electron-supported 864px window bounds", () => {
    expect(
      resolveRestoredBounds(
        { x: 864, y: 33, width: 864, height: 1084 },
        { x: 0, y: 0, width: 1728, height: 1117 },
      ),
    ).toEqual({ x: 864, y: 33, width: 864, height: 1084 });
  });

  it("keeps reentrant atomic writes isolated from each other", () => {
    const directory = fs.mkdtempSync(path.join(os.tmpdir(), "synara-atomic-write-"));
    const filePath = path.join(directory, "window-state.json");
    const originalRenameSync = fs.renameSync;
    let injectedWrite = false;

    fs.renameSync = ((from: fs.PathLike, to: fs.PathLike) => {
      if (!injectedWrite && to === filePath) {
        injectedWrite = true;
        writeJsonAtomic(filePath, { writer: "inner" });
      }
      originalRenameSync(from, to);
    }) as typeof fs.renameSync;

    try {
      writeJsonAtomic(filePath, { writer: "outer" });
      expect(JSON.parse(fs.readFileSync(filePath, "utf8"))).toEqual({
        writer: "outer",
      });
      expect(fs.readdirSync(directory)).toEqual(["window-state.json"]);
    } finally {
      fs.renameSync = originalRenameSync;
      fs.rmSync(directory, { recursive: true, force: true });
    }
  });

  it("maps supported deep links to memory-history routes", () => {
    expect(parseSynaraDeepLink("synara://threads")).toBe("/");
    expect(parseSynaraDeepLink("synara://settings")).toBe("/settings");
    expect(parseSynaraDeepLink("synara://settings/appearance")).toBe("/settings/appearance");
    expect(parseSynaraDeepLink("synara://studio")).toBe("/studio");
    expect(parseSynaraDeepLink("synara://update")).toBe("/update");
    expect(parseSynaraDeepLink("synara://pull-requests")).toBe("/pull-requests");
    expect(parseSynaraDeepLink("synara://plugins")).toBe("/plugins");
    expect(parseSynaraDeepLink("synara://automations")).toBe("/automations");
    expect(parseSynaraDeepLink("synara://automations/automation%3Aone")).toBe(
      "/automations/automation%3Aone",
    );
    expect(parseSynaraDeepLink("synara://kanban")).toBe("/kanban");
    expect(parseSynaraDeepLink("synara://kanban/project%20one")).toBe("/kanban/project%20one");
    // The Workspace view was removed upstream; stale links land on the home route.
    expect(parseSynaraDeepLink("synara://workspace")).toBe("/");
    expect(parseSynaraDeepLink("synara://new-thread/project%20one")).toBe(
      "/new-thread/project%20one",
    );
    expect(parseSynaraDeepLink("synara://new-thread")).toBeNull();
    expect(parseSynaraDeepLink("synara://thread/abc-123")).toBe("/thread/abc-123");
    expect(parseSynaraDeepLink("synara://fidelity-reference")).toBe("/");
    expect(parseSynaraDeepLink("https://example.com")).toBeNull();
  });

  it("preserves exactly one encoded route across a fresh app relaunch", () => {
    expect(
      buildSynaraRelaunchArguments(
        [
          "/Applications/Synara.app/Contents/MacOS/Synara",
          "dist/desktop",
          "synara://thread/old-thread?terminal=open&editor=open",
          "--synara-relaunch-route=%2Fold",
          "--flag",
        ],
        "/Applications/Synara.app/Contents/Resources/app",
        "/settings/appearance?target=setting-terminal-font",
      ),
    ).toEqual([
      "/Applications/Synara.app/Contents/Resources/app",
      "--flag",
      "--synara-relaunch-route=%2Fsettings%2Fappearance%3Ftarget%3Dsetting-terminal-font",
    ]);
    expect(
      buildSynaraRelaunchArguments(
        ["/path/to/lynxtron"],
        "/Users/tester/synara/apps/lynx/dist/desktop",
        "/thread/thread-one",
      ),
    ).toEqual([
      "/Users/tester/synara/apps/lynx/dist/desktop",
      "--synara-relaunch-route=%2Fthread%2Fthread-one",
    ]);
    expect(
      parseSynaraRelaunchRoute(
        "--synara-relaunch-route=%2Fsettings%2Fappearance%3Ftarget%3Dsetting-terminal-font",
      ),
    ).toBe("/settings/appearance?target=setting-terminal-font");
    expect(parseSynaraRelaunchRoute("--synara-relaunch-route=relative")).toBeNull();
    expect(parseSynaraRelaunchRoute("--synara-relaunch-route=%E0%A4%A")).toBeNull();
  });

  it("prefers a complete renderer surface snapshot across a fresh app relaunch", () => {
    const relaunchUrl =
      "synara://thread/thread-one?editor=open&editorMode=diff&editorChat=hidden&explorer=open&explorerMode=single-file&explorerPath=example.js";
    expect(
      buildSynaraRelaunchArguments(
        [
          "/path/to/lynxtron",
          "/old/dist/desktop",
          "synara://thread/old-thread?editor=open",
          "--synara-relaunch-route=%2Fold",
          "--flag",
        ],
        "/Users/tester/synara/apps/lynx/dist/desktop",
        "/thread/thread-one",
        relaunchUrl,
      ),
    ).toEqual(["/Users/tester/synara/apps/lynx/dist/desktop", "--flag", relaunchUrl]);
  });

  it("preserves supported startup surface state from desktop deep links", () => {
    expect(
      parseSynaraDeepLinkInitData(
        "synara://thread/abc-123?environment=open&diff=1&diffTurnId=turn-7&diffFilePath=src%2Fexample.ts&diffFileTree=open&editor=open&editorMode=diff&editorChat=hidden&editorHistory=open&editorNew=open&editorNewChat=open&editorSearch=open&editorProjectMenu=open&rename=open&terminal=open&explorer=open&explorerActionMenu=open&explorerPath=reports%2Fpreview.pdf&explorerQuery=report&explorerCommentLine=7&explorerExpanded=reports&explorerExpanded=reports%2F2026&explorerWidth=520&composerModelMenu=open&composerModelSubmenu=open&composerModelProvider=codex",
      ),
    ).toEqual({
      initialDiffOpen: true,
      initialDiffTurnId: "turn-7",
      initialDiffFilePath: "src/example.ts",
      initialDiffFileTreeOpen: true,
      initialComposerModelMenuOpen: true,
      initialComposerModelSubmenuOpen: true,
      initialComposerModelProvider: "codex",
      initialEnvironmentOpen: true,
      initialEditorOpen: true,
      initialEditorCenterMode: "diff",
      initialEditorChatOpen: false,
      initialEditorHistoryOpen: true,
      initialEditorNewOpen: true,
      initialEditorNewChatOpen: true,
      initialEditorSearchOpen: true,
      initialEditorProjectMenuOpen: true,
      initialRenameOpen: true,
      initialTerminalOpen: true,
      initialSettingsTarget: null,
      initialExplorerOpen: true,
      initialExplorerPresentationMode: "dock",
      initialExplorerActionMenuOpen: true,
      initialExplorerCommentLine: 7,
      initialExplorerExpandedDirectories: ["reports", "reports/2026"],
      initialExplorerPath: "reports/preview.pdf",
      initialExplorerQuery: "report",
      initialExplorerWidth: 520,
      initialRoute: "/thread/abc-123",
    });
    expect(
      parseSynaraDeepLinkInitData("synara://settings/general?target=environment-panel"),
    ).toMatchObject({
      initialRoute: "/settings/general?target=environment-panel",
      initialSettingsTarget: "environment-panel",
    });
    expect(
      parseSynaraDeepLinkInitData("synara://settings/appearance?target=setting-terminal-font"),
    ).toMatchObject({
      initialRoute: "/settings/appearance?target=setting-terminal-font",
      initialSettingsTarget: "setting-terminal-font",
    });
    expect(
      parseSynaraDeepLinkInitData(
        "synara://thread/abc-123?explorerMode=single-file&explorerCommentLine=0&explorerWidth=invalid",
      ),
    ).toMatchObject({
      initialEditorCenterMode: null,
      initialExplorerPresentationMode: "single-file",
      initialExplorerActionMenuOpen: false,
      initialEditorProjectMenuOpen: false,
      initialExplorerCommentLine: null,
      initialExplorerWidth: null,
    });
    expect(
      parseSynaraDeepLinkInitData("synara://thread/abc-123?editor=open&editorMode=file"),
    ).toMatchObject({
      initialEditorCenterMode: "file",
    });
  });

  it("queues the latest startup route until the renderer announces readiness", () => {
    const first = reduceShellRouteDelivery(INITIAL_SHELL_ROUTE_DELIVERY_STATE, {
      type: "route-requested",
      route: "/kanban",
    });
    expect(first.routeToDispatch).toBeNull();

    const latest = reduceShellRouteDelivery(first.state, {
      type: "route-requested",
      route: "/settings",
    });
    expect(latest.routeToDispatch).toBeNull();

    const ready = reduceShellRouteDelivery(latest.state, {
      type: "renderer-ready",
    });
    expect(ready.routeToDispatch).toBe("/settings");
    expect(ready.state).toEqual({ rendererReady: true, pendingRoute: null });

    const immediate = reduceShellRouteDelivery(ready.state, {
      type: "route-requested",
      route: "/pull-requests",
    });
    expect(immediate.routeToDispatch).toBe("/pull-requests");
  });

  it("retains a pending route when the renderer resets before it is ready", () => {
    const queued = reduceShellRouteDelivery(INITIAL_SHELL_ROUTE_DELIVERY_STATE, {
      type: "route-requested",
      route: "/settings",
    });
    const reset = reduceShellRouteDelivery(queued.state, {
      type: "renderer-reset",
    });
    expect(reset).toEqual({
      state: { rendererReady: false, pendingRoute: "/settings" },
      routeToDispatch: null,
    });
  });

  it("uses canonical keybinding command ids for every Native renderer shortcut", () => {
    expect(resolveNativeRendererCommand("chat.new")).toBe("chat.new");
    expect(resolveNativeRendererCommand("sidebar.toggle")).toBe("sidebar.toggle");
    expect(resolveNativeRendererCommand("sidebar.search")).toBe("sidebar.search");
    expect(resolveNativeRendererCommand("sidebar.activity")).toBe("sidebar.activity");
    expect(resolveNativeRendererCommand("browser.toggle")).toBe("browser.toggle");
    expect(resolveNativeRendererCommand("chat.visible.previous")).toBe("chat.visible.previous");
    expect(resolveNativeRendererCommand("chat.visible.next")).toBe("chat.visible.next");
    expect(resolveNativeRendererCommand("composer.focus.toggle")).toBe("composer.focus.toggle");
    expect(resolveNativeRendererCommand("view.recent.next")).toBe("view.recent.next");
    expect(resolveNativeRendererCommand("view.recent.previous")).toBe("view.recent.previous");
    expect(resolveNativeRendererCommand("terminal.toggle")).toBeNull();
  });

  it("owns the chords of the keybinding commands the renderer handles", () => {
    expect(canonicalAccelerator("CmdOrCtrl+Shift+B", true)).toBe("cmd+shift+b");
    expect(canonicalAccelerator("Shift+Cmd+B", true)).toBe("cmd+shift+b");
    expect(canonicalAccelerator("CmdOrCtrl+Shift+B", false)).toBe("ctrl+shift+b");
    const template = [
      { label: "View", submenu: [{ label: "Search…", accelerator: "CmdOrCtrl+K" }] },
      { label: "Window", submenu: [{ role: "minimize" }] },
    ];
    const taken = collectMenuAccelerators(template, true);
    expect(taken.has("cmd+k")).toBe(true);
    // Roles bind chords the template does not spell out.
    expect(taken.has("cmd+m")).toBe(true);
    const dispatched: string[] = [];
    const items = buildCommandAcceleratorMenuItems(
      [
        { command: "threadTab.next", accelerator: "Cmd+Ctrl+Right" },
        { command: "threadTab.previous", accelerator: "Cmd+Ctrl+Left" },
        // Already a visible menu item's chord, and a second command on one chord.
        { command: "sidebar.search", accelerator: "Cmd+K" },
        { command: "chat.split", accelerator: "Ctrl+Cmd+Right" },
      ],
      taken,
      true,
      (command) => dispatched.push(command),
    );
    expect(items.map((item) => [item.label, item.accelerator])).toEqual([
      ["Command: threadTab.next", "Cmd+Ctrl+Right"],
      ["Command: threadTab.previous", "Cmd+Ctrl+Left"],
    ]);
    expect(items.every((item) => item.visible === false && item.acceleratorWorksWhenHidden)).toBe(
      true,
    );
    items[1]?.click();
    expect(dispatched).toEqual(["threadTab.previous"]);
  });

  it("accepts only well-formed command accelerators with a modifier", () => {
    expect(
      parseCommandAccelerators([
        { command: "threadTab.next", accelerator: "Cmd+Ctrl+Right" },
        { command: "threadTab.next", accelerator: "Right" },
        { command: "threadTab.next", accelerator: "Cmd+Ctrl+Right; rm" },
        { command: "bad command", accelerator: "Cmd+K" },
        { command: 7, accelerator: "Cmd+K" },
        null,
      ]),
    ).toEqual([{ command: "threadTab.next", accelerator: "Cmd+Ctrl+Right" }]);
    expect(parseCommandAccelerators("Cmd+K")).toEqual([]);
  });

  it("registers commit and cancel accelerators only while recent views are open", () => {
    expect(buildRecentViewNavigationMenuItems(false, () => {})).toEqual([]);
    const events: string[] = [];
    const items = buildRecentViewNavigationMenuItems(true, (event) => events.push(event));
    expect(items.map((item) => item.accelerator)).toEqual(["Enter", "Esc"]);
    items[0]?.click();
    items[1]?.click();
    expect(events).toEqual(["commit", "cancel"]);
  });

  it("delivers renderer events without activating the native window", () => {
    const calls: unknown[][] = [];
    const target = {
      sendGlobalEvent: (...args: unknown[]) => calls.push(args),
      show: () => {
        throw new Error("renderer event delivery must not show the window");
      },
      focus: () => {
        throw new Error("renderer event delivery must not focus the window");
      },
    };

    dispatchRendererGlobalEvent(target, "shell:command", "sidebar.search");

    expect(calls).toEqual([["shell:command", "sidebar.search"]]);
  });

  it("keeps background verification windows inactive while making them capturable", () => {
    expect(resolveShellWindowPresentation(true)).toEqual({
      showOnCreate: false,
      showAfterSetup: false,
      showInactiveAfterSetup: true,
    });
    expect(resolveShellWindowPresentation(false)).toEqual({
      showOnCreate: true,
      showAfterSetup: true,
      showInactiveAfterSetup: false,
    });
  });

  it("only bypasses the application lock for the explicit validation override", () => {
    expect(shouldAcquireShellSingleInstanceLock(undefined)).toBe(true);
    expect(shouldAcquireShellSingleInstanceLock("0")).toBe(true);
    expect(shouldAcquireShellSingleInstanceLock("1")).toBe(false);
  });

  it("maps the complete Search navigation set to native menu accelerators", () => {
    expect(SEARCH_NAVIGATION_ACCELERATORS).toEqual([
      { accelerator: "Up", key: "ArrowUp" },
      { accelerator: "Down", key: "ArrowDown" },
      { accelerator: "Tab", key: "Tab" },
      { accelerator: "Shift+Tab", key: "Tab", shiftKey: true },
      { accelerator: "Esc", key: "Escape" },
    ]);
  });

  it("registers hidden Search accelerators only while the palette is open", () => {
    expect(buildSearchNavigationMenuItems(false, () => {})).toEqual([]);
    const events: unknown[] = [];
    const items = buildSearchNavigationMenuItems(true, (event) => events.push(event));

    expect(items.map(({ accelerator }) => accelerator)).toEqual([
      "Up",
      "Down",
      "Tab",
      "Shift+Tab",
      "Esc",
    ]);
    expect(
      items.every(
        (item) =>
          item.visible === false &&
          item.acceleratorWorksWhenHidden === true &&
          item.registerAccelerator === true,
      ),
    ).toBe(true);
    items[3]?.click();
    expect(events).toEqual([{ key: "Tab", shiftKey: true }]);
  });

  it("registers terminal find only while the active surface owns it", () => {
    expect(buildTerminalSearchMenuItems(false, () => {})).toEqual([]);
    let calls = 0;
    const items = buildTerminalSearchMenuItems(true, () => {
      calls += 1;
    });
    expect(items).toHaveLength(1);
    expect(items[0]).toMatchObject({
      label: "Find in Terminal",
      accelerator: "CmdOrCtrl+F",
      visible: false,
      acceleratorWorksWhenHidden: true,
      registerAccelerator: true,
    });
    items[0]?.click();
    expect(calls).toBe(1);
  });

  it("registers terminal search navigation only while its input is open", () => {
    expect(buildTerminalSearchNavigationMenuItems(false, () => {})).toEqual([]);
    const events: unknown[] = [];
    const items = buildTerminalSearchNavigationMenuItems(true, (event) => events.push(event));
    expect(items.map((item) => item.accelerator)).toEqual(["Enter", "Shift+Enter", "Esc"]);
    items[1]?.click();
    items[2]?.click();
    expect(events).toEqual([{ key: "Enter", shiftKey: true }, { key: "Escape" }]);
  });

  it("maps active Terminal input keys to xterm-compatible PTY bytes", () => {
    expect(TERMINAL_INPUT_ACCELERATORS).toEqual([
      { label: "Terminal input Enter", accelerator: "Enter", data: "\r" },
      { label: "Terminal input up", accelerator: "Up", data: "\u001b[A" },
      { label: "Terminal input down", accelerator: "Down", data: "\u001b[B" },
      { label: "Terminal input right", accelerator: "Right", data: "\u001b[C" },
      { label: "Terminal input left", accelerator: "Left", data: "\u001b[D" },
      { label: "Terminal input tab", accelerator: "Tab", data: "\t" },
      { label: "Terminal input escape", accelerator: "Esc", data: "\u001b" },
    ]);
    const writes: string[] = [];
    const items = buildTerminalInputMenuItems(true, true, (data) => writes.push(data));
    expect(items.map((item) => item.accelerator)).toEqual([
      "Enter",
      "Up",
      "Down",
      "Right",
      "Left",
      "Tab",
      "Esc",
      "Ctrl+C",
      "Ctrl+L",
    ]);
    expect(
      items.every(
        (item) =>
          item.visible === false &&
          item.acceleratorWorksWhenHidden === true &&
          item.registerAccelerator === true,
      ),
    ).toBe(true);
    items[0]?.click();
    items[7]?.click();
    items[8]?.click();
    expect(writes).toEqual(["\r", "\u0003", "\u000c"]);
    expect(buildTerminalInputMenuItems(false, true, () => {})).toEqual([]);
    expect(
      buildTerminalInputMenuItems(true, false, () => {}).map((item) => item.accelerator),
    ).not.toContain("Ctrl+C");
  });
});

describe("model picker row shortcuts", () => {
  it("registers nothing while the picker is closed", () => {
    expect(buildModelPickerShortcutMenuItems(false, new Set(), () => undefined)).toEqual([]);
  });

  it("adds hidden mod+digit accelerators for the digits no visible item binds", () => {
    const picked: number[] = [];
    const items = buildModelPickerShortcutMenuItems(true, new Set([1, 2, 3]), (rowIndex) =>
      picked.push(rowIndex),
    );
    expect(items.map((item) => item.accelerator)).toEqual([
      "CmdOrCtrl+4",
      "CmdOrCtrl+5",
      "CmdOrCtrl+6",
      "CmdOrCtrl+7",
      "CmdOrCtrl+8",
      "CmdOrCtrl+9",
    ]);
    expect(items.every((item) => item.visible === false && item.acceleratorWorksWhenHidden)).toBe(
      true,
    );
    items[0]!.click();
    items[5]!.click();
    expect(picked).toEqual([3, 8]);
  });
});
