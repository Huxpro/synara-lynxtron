// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import { app, LynxWindow, clipboard, dialog, devtool, Menu, screen } from "@lynx-js/lynxtron";
import { LYNX_BUNDLE_PATH } from "./vendorPaths";
import {
  handleContextMenu,
  handleClipboard,
  handleAttachments,
  handleDialogs,
  handleShell,
  handleStorage,
  ensureWsEcho,
  registerAppSnapPickedImage,
} from "./hostServices";
import { resolveSynaraWsUrl } from "./runtimeEndpoint.logic";
import { fetchEditorIconDataUrl } from "./editorIcon";
import path from "path";
import {
  appendShellLog,
  buildSynaraRelaunchArguments,
  buildModelPickerShortcutMenuItems,
  buildSearchNavigationMenuItems,
  buildRecentViewNavigationMenuItems,
  buildTerminalInputMenuItems,
  buildTerminalSearchMenuItems,
  buildTerminalSearchNavigationMenuItems,
  INITIAL_SHELL_ROUTE_DELIVERY_STATE,
  dispatchRendererGlobalEvent,
  migrateLegacyShellFiles,
  parseSynaraDeepLink,
  parseSynaraDeepLinkInitData,
  parseSynaraRelaunchRoute,
  parseViewportProbeSequence,
  readWindowState,
  reduceShellRouteDelivery,
  resolveRestoredBounds,
  resolveNativeRendererCommand,
  resolveShellPaths,
  resolveShellUserDataDir,
  resolveShellWindowPresentation,
  SHELL_WINDOW_MIN_HEIGHT,
  SHELL_WINDOW_MIN_WIDTH,
  shouldAcquireShellSingleInstanceLock,
  type ShellRouteDeliveryState,
  type ShellWindowState,
  writeJsonAtomic,
} from "./shellRuntime";
import { decodeBridgeRpcData } from "../bridgeRpcPayload";
import fs from "node:fs";
import type { KeybindingCommand } from "@synara/contracts";
import { handleUpdater } from "./updateService";
import { resolveShellWindowChrome } from "./shellWindowChrome";
import { NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG } from "../syntaxHighlightingContract.logic";
import {
  disposeNativeRpcHost,
  handleNativeRpc,
  subscribeNativeRpcTransportState,
} from "./nativeRpcHost";
import {
  createNativeNotificationService,
  type NativeNotificationConstructor,
} from "./nativeNotifications";
import { spawn } from "node:child_process";
import { createRequire } from "node:module";
import { DesktopAppSnapManager } from "../../../../desktop/src/appSnapManager";
import type { DesktopAppSnapErrorEvent, DesktopAppSnapState } from "@synara/contracts";
import { SYSTEM_APPEARANCE_EVENT } from "../systemAppearanceEvent.logic";
import { nativeEventStreamChannel } from "../nativeEventStreams.logic";
import {
  createSystemAppearanceWatcher,
  parseSystemAppearanceProbeSequence,
  readMacSystemDark,
} from "./systemAppearance";
import { createSearchKeyMonitor, terminalInputDataForSearchKeyEvent } from "./searchKeyMonitor";
import { createBrowserViewHost } from "./browserViewProbe";
import { createNativeVoiceRecorder } from "./voiceRecorder";
const isDev = process.env.NODE_ENV === "development";
const isDevtoolEnabled = isDev || process.env.SYNARA_ENABLE_DEVTOOL === "1";
const isBackgroundLaunch = process.env.SYNARA_BACKGROUND_LAUNCH === "1";
const ignoreRendererUiReadyForProbe = process.env.SYNARA_UI_READY_PROBE_IGNORE_ACK === "1";
const rendererUiReadyTimeoutMs = Math.max(
  1,
  Number(process.env.SYNARA_UI_READY_TIMEOUT_MS) || 15_000,
);
const hostInputProbeReportPath = process.env.SYNARA_HOST_INPUT_PROBE_REPORT?.trim() || null;
const APPSNAP_CAPTURE_EVENT = "synara:appsnap-captured";
const APPSNAP_ERROR_EVENT = "synara:appsnap-error";
const APPSNAP_STATE_EVENT = "synara:appsnap-state";
const require = createRequire(import.meta.url);
const nativeLynxtron = require("lynxtron") as {
  readonly Notification?: NativeNotificationConstructor;
};

let mainWindow: LynxWindow | null = null;
let searchNavigationEnabled = false;
let modelPickerShortcutsEnabled = false;
let recentViewNavigationEnabled = false;
let terminalInputOwner: string | null = null;
let terminalSelectionOwner: string | null = null;
let terminalSelectionText = "";
let composerInputOwner: string | null = null;
let terminalSearchEnabled = false;
let terminalSearchNavigationEnabled = false;
let suppressMenuDismissEscapeUntil = 0;
let routeDeliveryState: ShellRouteDeliveryState = INITIAL_SHELL_ROUTE_DELIVERY_STATE;
let rendererRoute: string | null = null;
let rendererRelaunchUrl: string | null = null;
let viewportProbeStarted = false;
let systemAppearanceProbeStarted = false;
let relaunchRequested = false;
let rendererUiReadyStartedAt = 0;
let rendererUiReadyTimer: ReturnType<typeof setTimeout> | null = null;
let systemAppearanceWatcher: ReturnType<typeof createSystemAppearanceWatcher> | null = null;
let searchKeyMonitor: ReturnType<typeof createSearchKeyMonitor> | null = null;
let browserViewHost: ReturnType<typeof createBrowserViewHost> | null = null;
let voiceRecorder: ReturnType<typeof createNativeVoiceRecorder> | null = null;
const systemAppearanceProbeSequence = parseSystemAppearanceProbeSequence(
  process.env.SYNARA_SYSTEM_APPEARANCE_PROBE_SEQUENCE,
);
const systemAppearanceProbeIntervalMs = Math.max(
  100,
  Number(process.env.SYNARA_SYSTEM_APPEARANCE_PROBE_INTERVAL_MS) || 30_000,
);
let systemAppearanceProbeIndex = 0;
const systemAppearanceProbeTimers: Array<ReturnType<typeof setTimeout>> = [];

function readCurrentSystemDark(): boolean {
  return systemAppearanceProbeSequence[systemAppearanceProbeIndex] ?? readMacSystemDark();
}

function startSystemAppearanceProbe(w: LynxWindow, logFile: string): void {
  if (systemAppearanceProbeStarted || systemAppearanceProbeSequence.length < 2) return;
  systemAppearanceProbeStarted = true;
  systemAppearanceProbeSequence.slice(1).forEach((dark, index) => {
    const timer = setTimeout(
      () => {
        if (w.isDestroyed()) return;
        systemAppearanceProbeIndex = index + 1;
        dispatchShellEvent(SYSTEM_APPEARANCE_EVENT, dark);
        appendShellLog(logFile, `system appearance probe step=${index + 1} dark=${dark}`);
      },
      systemAppearanceProbeIntervalMs * (index + 1),
    );
    systemAppearanceProbeTimers.push(timer);
  });
}

function startViewportProbe(w: LynxWindow): void {
  if (viewportProbeStarted) return;
  const sequence = parseViewportProbeSequence(process.env.SYNARA_VIEWPORT_PROBE_SEQUENCE);
  if (!sequence.length) return;
  viewportProbeStarted = true;
  sequence.forEach((size, index) => {
    setTimeout(
      () => {
        if (w.isDestroyed()) return;
        w.setContentSize(size.width, size.height);
      },
      600 * (index + 1),
    );
  });
}

function dispatchRoute(route: string, activate = true): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    routeDeliveryState = reduceShellRouteDelivery(
      { ...routeDeliveryState, rendererReady: false },
      { type: "route-requested", route },
    ).state;
    return;
  }
  if (activate) {
    mainWindow.show();
    mainWindow.focus();
  }
  const delivery = reduceShellRouteDelivery(routeDeliveryState, {
    type: "route-requested",
    route,
  });
  routeDeliveryState = delivery.state;
  if (delivery.routeToDispatch) {
    mainWindow.sendGlobalEvent("shell:navigate", delivery.routeToDispatch);
  }
}

const nativeNotifications = createNativeNotificationService({
  Notification: nativeLynxtron.Notification,
  openThread: (threadId) => dispatchRoute(`/thread/${threadId}`),
});

let appSnapManager: DesktopAppSnapManager | null = null;

function appSnapHelperPath(): string {
  return path.join(__dirname, "synara-appsnap-helper");
}

function appSnapCaptureDirectory(): string {
  return path.join(
    resolveShellUserDataDir(app.getPath("userData"), process.env.SYNARA_LYNX_USER_DATA_DIR),
    "appsnap",
    "captures",
  );
}

function sendAppSnapEvent(event: string, payload: unknown): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  mainWindow.sendGlobalEvent(event, payload);
}

function initializeAppSnapManager(): DesktopAppSnapManager {
  appSnapManager ??= new DesktopAppSnapManager({
    platform: process.platform,
    helperPath: appSnapHelperPath(),
    captureDirectory: appSnapCaptureDirectory(),
    excludedBundleId: "com.lynxjs.Lynxtron",
    onState: (state) => sendAppSnapEvent(APPSNAP_STATE_EVENT, state),
    onCaptured: (capture) => {
      void registerAppSnapPickedImage({
        bytes: capture.bytes,
        captureId: capture.id,
        name: capture.name,
      })
        .then((file) => {
          mainWindow?.show();
          mainWindow?.focus();
          sendAppSnapEvent(APPSNAP_CAPTURE_EVENT, {
            captureId: capture.id,
            capturedAt: capture.capturedAt,
            sourceAppName: capture.sourceAppName,
            sourceBundleIdentifier: capture.sourceBundleIdentifier,
            sourceWindowTitle: capture.sourceWindowTitle,
            file,
          });
        })
        .catch((error) => {
          sendAppSnapEvent(APPSNAP_ERROR_EVENT, {
            code: "capture-registration-failed",
            message:
              error instanceof Error
                ? error.message
                : "The captured AppSnap could not be attached.",
            capturedAt: capture.capturedAt,
          });
        });
    },
    onError: (error, focusApp) => {
      if (focusApp) {
        mainWindow?.show();
        mainWindow?.focus();
      }
      sendAppSnapEvent(APPSNAP_ERROR_EVENT, error);
    },
  });
  return appSnapManager;
}

function dispatchShellEvent(event: string, ...args: unknown[]): void {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  dispatchRendererGlobalEvent(mainWindow, event, ...args);
}

// View-menu digits the open model picker borrows to pick its rows.
const MODEL_PICKER_BOUND_DIGITS: ReadonlySet<number> = new Set([1, 2, 3]);

function dispatchModelPickerRow(rowIndex: number): void {
  dispatchShellEvent("shell:model-picker-key", { rowIndex });
}

function routeOrModelPickerRow(digit: number, route: string): () => void {
  return () =>
    modelPickerShortcutsEnabled ? dispatchModelPickerRow(digit - 1) : dispatchRoute(route);
}

function dispatchShellCommand(command: KeybindingCommand): void {
  const resolved = resolveNativeRendererCommand(command);
  if (!resolved) return;
  dispatchShellEvent("shell:command", resolved);
}

function routeFromArguments(argv: readonly string[]): string | null {
  for (const argument of argv) {
    const route = parseSynaraRelaunchRoute(argument) ?? parseSynaraDeepLink(argument);
    if (route) return route;
  }
  return null;
}

function initDataFromArguments(argv: readonly string[]) {
  for (const argument of argv) {
    const initData = parseSynaraDeepLinkInitData(argument);
    if (initData) return initData;
  }
  return null;
}

function loadLynxBundle(w: LynxWindow): void {
  if (
    searchNavigationEnabled ||
    recentViewNavigationEnabled ||
    terminalInputOwner !== null ||
    terminalSelectionOwner !== null ||
    composerInputOwner !== null ||
    terminalSearchEnabled ||
    terminalSearchNavigationEnabled
  ) {
    searchKeyMonitor?.setMode("disabled");
    searchNavigationEnabled = false;
    recentViewNavigationEnabled = false;
    terminalInputOwner = null;
    terminalSelectionOwner = null;
    terminalSelectionText = "";
    composerInputOwner = null;
    terminalSearchEnabled = false;
    terminalSearchNavigationEnabled = false;
    installApplicationMenu(w);
  }
  const startupInitData = initDataFromArguments(process.argv);
  const route =
    rendererRoute ?? routeDeliveryState.pendingRoute ?? startupInitData?.initialRoute ?? null;
  routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
    type: "renderer-reset",
  }).state;
  if (route) {
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: "route-requested",
      route,
    }).state;
  }
  const loadOptions = {
    data: {
      ...(startupInitData ?? {}),
      initialRoute: route,
      initialSystemDark: readCurrentSystemDark(),
      // The live backend for this window. The renderer bundle carries no
      // endpoint of its own (see lynx.config.ts), so every reload rebinds to
      // exactly the server this host process is connected to.
      runtimeWsUrl: resolveSynaraWsUrl(process.env.SYNARA_WS_URL),
    },
  };
  if (rendererUiReadyTimer) clearTimeout(rendererUiReadyTimer);
  rendererUiReadyStartedAt = Date.now();
  const shellLogFile = resolveShellPaths(
    resolveShellUserDataDir(app.getPath("userData"), process.env.SYNARA_LYNX_USER_DATA_DIR),
  ).logFile;
  rendererUiReadyTimer = setTimeout(() => {
    rendererUiReadyTimer = null;
    appendShellLog(
      shellLogFile,
      "renderer ui ready timeout route=" +
        (route ?? "/") +
        " elapsedMs=" +
        String(Date.now() - rendererUiReadyStartedAt),
    );
    if (isBackgroundLaunch || w.isDestroyed()) return;
    void dialog
      .showMessageBox(w, {
        type: "error",
        title: "Synara could not finish starting",
        message: "The interface did not become ready.",
        detail:
          "Reload Synara to try again. If this keeps happening, check the desktop log for the renderer ui ready timeout entry.",
        buttons: ["Reload", "Quit"],
        defaultId: 0,
        cancelId: 1,
      })
      .then(({ response }) => {
        if (response === 0) relaunchApp();
        else app.quit();
      })
      .catch((error) =>
        appendShellLog(
          shellLogFile,
          "renderer ui ready dialog failed error=" +
            (error instanceof Error ? error.message : String(error)),
        ),
      );
  }, rendererUiReadyTimeoutMs);
  if (isDev) {
    w.loadURL("http://localhost:5971/main.lynx.bundle", loadOptions);
  } else {
    w.loadFile(LYNX_BUNDLE_PATH, loadOptions);
  }
  appendShellLog(shellLogFile, "renderer reload requested route=" + (route ?? "/"));
}

function relaunchApp(): void {
  if (relaunchRequested) return;
  relaunchRequested = true;
  const route =
    rendererRoute ?? routeDeliveryState.pendingRoute ?? routeFromArguments(process.argv) ?? null;
  appendShellLog(
    resolveShellPaths(
      resolveShellUserDataDir(app.getPath("userData"), process.env.SYNARA_LYNX_USER_DATA_DIR),
    ).logFile,
    `fresh app relaunch requested route=${route ?? "/"}`,
  );
  const logFile = resolveShellPaths(
    resolveShellUserDataDir(app.getPath("userData"), process.env.SYNARA_LYNX_USER_DATA_DIR),
  ).logFile;
  const args = buildSynaraRelaunchArguments(process.argv, __dirname, route, rendererRelaunchUrl);
  if (acquireSingleInstanceLock) {
    app.releaseSingleInstanceLock();
  }
  let replacement: ReturnType<typeof spawn>;
  try {
    replacement = spawn(process.execPath, args, {
      detached: process.env.SYNARA_MANAGED_RELAUNCH !== "1",
      env: process.env,
      stdio: "ignore",
    });
  } catch (error) {
    relaunchRequested = false;
    if (acquireSingleInstanceLock) {
      app.requestSingleInstanceLock();
    }
    appendShellLog(
      logFile,
      `fresh app relaunch failed error=${error instanceof Error ? error.message : String(error)}`,
    );
    return;
  }
  replacement.once("error", (error) => {
    relaunchRequested = false;
    if (acquireSingleInstanceLock) {
      app.requestSingleInstanceLock();
    }
    appendShellLog(
      logFile,
      `fresh app relaunch failed error=${error instanceof Error ? error.message : String(error)}`,
    );
  });
  replacement.once("spawn", () => {
    replacement.unref();
    appendShellLog(logFile, `fresh app replacement spawned pid=${replacement.pid ?? "unknown"}`);
    app.quit();
  });
}

function installApplicationMenu(w: LynxWindow): void {
  const menu = Menu.buildFromTemplate([
    {
      label: "Synara",
      submenu: [
        { role: "about" },
        { type: "separator" },
        {
          label: "New Chat",
          accelerator: "CmdOrCtrl+N",
          click: () => dispatchShellCommand("chat.new"),
        },
        { type: "separator" },
        {
          label: "Settings…",
          accelerator: "CmdOrCtrl+,",
          click: () => dispatchRoute("/settings"),
        },
        {
          label: "Check for Updates…",
          click: () => dispatchRoute("/update"),
        },
        { type: "separator" },
        { role: "hide" },
        { role: "hideOthers" },
        { role: "unhide" },
        { type: "separator" },
        { role: "quit" },
      ],
    },
    {
      label: "Edit",
      submenu: [
        composerInputOwner !== null
          ? {
              label: "Undo",
              accelerator: "CmdOrCtrl+Z",
              click: () => w.sendGlobalEvent("composer:undo"),
            }
          : { role: "undo" },
        composerInputOwner !== null
          ? {
              label: "Redo",
              accelerator: "CmdOrCtrl+Shift+Z",
              click: () => w.sendGlobalEvent("composer:redo"),
            }
          : { role: "redo" },
        { type: "separator" },
        composerInputOwner !== null
          ? {
              label: "Cut",
              accelerator: "CmdOrCtrl+X",
              click: () => w.sendGlobalEvent("composer:cut"),
            }
          : { role: "cut" },
        terminalSelectionOwner !== null
          ? {
              label: "Copy",
              accelerator: "CmdOrCtrl+C",
              click: () => {
                if (terminalSelectionText) clipboard.writeText(terminalSelectionText);
                else dispatchShellEvent("terminal:copy-selection");
              },
            }
          : composerInputOwner !== null
            ? {
                label: "Copy",
                accelerator: "CmdOrCtrl+C",
                click: () => dispatchShellEvent("composer:copy"),
              }
            : { role: "copy" },
        terminalInputOwner !== null
          ? {
              label: "Paste",
              accelerator: "CmdOrCtrl+V",
              click: () => {
                const text = clipboard.readText();
                if (text) dispatchShellEvent("terminal:input-key", { data: text });
              },
            }
          : composerInputOwner !== null
            ? {
                label: "Paste",
                accelerator: "CmdOrCtrl+V",
                click: () => {
                  const text = clipboard.readText();
                  if (text) w.sendGlobalEvent("composer:paste-text", { text });
                },
              }
            : { role: "paste" },
        { role: "selectAll" },
        ...buildTerminalSearchMenuItems(terminalSearchEnabled, () =>
          dispatchShellEvent("terminal:search"),
        ),
        ...buildTerminalSearchNavigationMenuItems(
          terminalSearchNavigationEnabled && !searchNavigationEnabled,
          (event) => dispatchShellEvent("terminal:search-key", event),
        ),
        ...buildTerminalInputMenuItems(
          terminalInputOwner !== null &&
            !searchNavigationEnabled &&
            !terminalSearchNavigationEnabled,
          process.platform === "darwin",
          (data) => dispatchShellEvent("terminal:input-key", { data }),
        ),
      ],
    },
    {
      label: "View",
      submenu: [
        {
          label: "Search…",
          accelerator: "CmdOrCtrl+K",
          click: () => dispatchShellCommand("sidebar.search"),
        },
        {
          label: "Focus Composer",
          accelerator: "CmdOrCtrl+L",
          click: () => dispatchShellCommand("composer.focus.toggle"),
        },
        {
          label: "Toggle Sidebar",
          accelerator: "CmdOrCtrl+B",
          click: () => dispatchShellCommand("sidebar.toggle"),
        },
        {
          label: "Activity View",
          accelerator: "CmdOrCtrl+Alt+U",
          click: () => dispatchShellCommand("sidebar.activity"),
        },
        {
          label: "Toggle Browser",
          accelerator: "CmdOrCtrl+Shift+B",
          click: () => dispatchShellCommand("browser.toggle"),
        },
        {
          label: "Back",
          accelerator: "CmdOrCtrl+[",
          click: () => dispatchShellEvent("shell:navigate-history", "back"),
        },
        {
          label: "Forward",
          accelerator: "CmdOrCtrl+]",
          click: () => dispatchShellEvent("shell:navigate-history", "forward"),
        },
        {
          label: "Next Recent View",
          accelerator: "Ctrl+Tab",
          registerAccelerator: true,
          click: () => dispatchShellCommand("view.recent.next"),
        },
        {
          label: "Previous Recent View",
          accelerator: "Ctrl+Shift+Tab",
          registerAccelerator: true,
          click: () => dispatchShellCommand("view.recent.previous"),
        },
        ...buildRecentViewNavigationMenuItems(recentViewNavigationEnabled, (event) =>
          dispatchShellEvent("shell:recent-view-key", event),
        ),
        ...buildSearchNavigationMenuItems(searchNavigationEnabled, (event) =>
          dispatchShellEvent("shell:search-key", event),
        ),
        ...buildModelPickerShortcutMenuItems(
          modelPickerShortcutsEnabled,
          MODEL_PICKER_BOUND_DIGITS,
          dispatchModelPickerRow,
        ),
        { type: "separator" },
        {
          label: "Threads",
          accelerator: "CmdOrCtrl+1",
          click: routeOrModelPickerRow(1, "/"),
        },
        {
          label: "Projects",
          accelerator: "CmdOrCtrl+2",
          click: routeOrModelPickerRow(2, "/kanban"),
        },
        {
          label: "Pull Requests",
          accelerator: "CmdOrCtrl+3",
          click: routeOrModelPickerRow(3, "/pull-requests"),
        },
        { type: "separator" },
        {
          label: "Components Lab…",
          click: () => dispatchRoute("/components-lab"),
        },
        { type: "separator" },
        {
          label: "Previous Visible Thread",
          accelerator: "CmdOrCtrl+Shift+[",
          click: () => dispatchShellCommand("chat.visible.previous"),
        },
        {
          label: "Next Visible Thread",
          accelerator: "CmdOrCtrl+Shift+]",
          click: () => dispatchShellCommand("chat.visible.next"),
        },
        { type: "separator" },
        {
          id: "reloadBundle",
          label: "Reload",
          accelerator: "CmdOrCtrl+R",
          registerAccelerator: true,
          click: () => relaunchApp(),
        },
        {
          id: "forceReloadBundle",
          label: "Force Reload",
          accelerator: "CmdOrCtrl+Shift+R",
          registerAccelerator: true,
          click: () => relaunchApp(),
        },
        ...(isDev ? [{ role: "toggleDevTools" }] : []),
      ],
    },
    {
      label: "Window",
      submenu: [{ role: "minimize" }, { role: "zoom" }, { role: "front" }],
    },
  ]);
  Menu.setApplicationMenu(menu);
  appendShellLog(
    resolveShellPaths(
      resolveShellUserDataDir(app.getPath("userData"), process.env.SYNARA_LYNX_USER_DATA_DIR),
    ).logFile,
    `application menu installed window=${w.id}`,
  );
}

function installWindowStatePersistence(w: LynxWindow, filePath: string): () => void {
  let timer: ReturnType<typeof setTimeout> | null = null;
  const persist = () => {
    const state: ShellWindowState = {
      version: 1,
      bounds: w.getNormalBounds(),
      maximized: w.isMaximized(),
      fullscreen: w.isFullScreen(),
    };
    writeJsonAtomic(filePath, state);
  };
  const schedule = () => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(persist, 150);
  };
  for (const event of [
    "move",
    "resize",
    "maximize",
    "unmaximize",
    "enter-full-screen",
    "leave-full-screen",
  ] as const) {
    w.on(event, schedule);
  }
  return () => {
    if (timer) clearTimeout(timer);
    persist();
  };
}

function emitWindowState(w: LynxWindow): void {
  w.sendGlobalEvent("window:state", {
    isMaximized: w.isMaximized(),
    isFullscreen: w.isFullScreen(),
  });
}

const acquireSingleInstanceLock = shouldAcquireShellSingleInstanceLock(
  process.env.SYNARA_ALLOW_PARALLEL_INSTANCE,
);
const hasSingleInstanceLock = !acquireSingleInstanceLock || app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on("second-instance", (_event, argv) => {
    dispatchRoute(routeFromArguments(argv) ?? "/");
  });
  app.on("open-url", (event, url) => {
    event.preventDefault();
    const route = parseSynaraDeepLink(url);
    if (route) dispatchRoute(route);
  });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  devtool.setDevToolEnabled(isDevtoolEnabled);
  const userDataDir = resolveShellUserDataDir(
    app.getPath("userData"),
    process.env.SYNARA_LYNX_USER_DATA_DIR,
  );
  const shellPaths = resolveShellPaths(userDataDir);
  const migrated = migrateLegacyShellFiles(userDataDir, shellPaths);
  appendShellLog(
    shellPaths.logFile,
    `startup version=${app.getVersion()} migrated=${migrated.join(",") || "none"}`,
  );
  if (!isDev && acquireSingleInstanceLock) {
    app.setAsDefaultProtocolClient("synara");
  }
  const savedState = readWindowState(shellPaths.windowState);
  const display = savedState
    ? screen.getDisplayMatching(savedState.bounds)
    : screen.getPrimaryDisplay();
  const bounds = resolveRestoredBounds(savedState?.bounds ?? null, display.workArea);
  const windowPresentation = resolveShellWindowPresentation(isBackgroundLaunch);
  const w = new LynxWindow({
    ...bounds,
    minWidth: SHELL_WINDOW_MIN_WIDTH,
    minHeight: SHELL_WINDOW_MIN_HEIGHT,
    center: false,
    show: windowPresentation.showOnCreate,
    title: "Synara",
    ...resolveShellWindowChrome(process.platform),
    lynxPreference: {
      preload: path.join(__dirname, "preload.js"),
    },
  });
  mainWindow = w;
  searchKeyMonitor?.dispose();
  searchKeyMonitor = createSearchKeyMonitor({
    nativeViewHandle: w.getNativeWindowHandle(),
    onKey: (event) => {
      if (suppressMenuDismissEscapeUntil > 0) {
        const suppressDismissEscape =
          event.key === "Escape" && Date.now() < suppressMenuDismissEscapeUntil;
        suppressMenuDismissEscapeUntil = 0;
        if (suppressDismissEscape) return;
      }
      if (searchNavigationEnabled) {
        dispatchShellEvent("shell:search-key", event);
      } else if (event.key === "Reload" || event.key === "ForceReload") {
        relaunchApp();
      } else if (terminalSearchNavigationEnabled) {
        if (event.key === "Enter" || event.key === "Escape") {
          dispatchShellEvent("terminal:search-key", event);
        }
      } else if (terminalInputOwner !== null) {
        if (event.key === "FocusComposer") {
          dispatchShellCommand("composer.focus.toggle");
        } else if (event.key === "Find") {
          dispatchShellEvent("terminal:search");
        } else {
          dispatchShellEvent("terminal:input-key", {
            data: terminalInputDataForSearchKeyEvent(event),
          });
        }
      }
    },
  });
  browserViewHost?.dispose();
  browserViewHost = createBrowserViewHost({
    nativeViewHandle: w.getNativeWindowHandle(),
    onStateChange: (state) => dispatchShellEvent("browser:view-state", state),
    onCopyLink: () => dispatchShellEvent("browser:copy-link"),
    onOpenWindow: (request) => dispatchShellEvent("browser:open-window", request),
  });
  voiceRecorder?.dispose();
  voiceRecorder = createNativeVoiceRecorder();
  const initialSystemDark = readCurrentSystemDark();
  systemAppearanceWatcher?.dispose();
  systemAppearanceWatcher = createSystemAppearanceWatcher({
    initialDark: initialSystemDark,
    readDark: readCurrentSystemDark,
    onChange: (dark) => dispatchShellEvent(SYSTEM_APPEARANCE_EVENT, dark),
  });
  routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
    type: "renderer-reset",
  }).state;
  const flushWindowState = installWindowStatePersistence(w, shellPaths.windowState);
  for (const event of [
    "maximize",
    "unmaximize",
    "enter-full-screen",
    "leave-full-screen",
  ] as const) {
    w.on(event, () => emitWindowState(w));
  }
  w.on("resize", () => {
    const bounds = w.getContentBounds();
    w.sendGlobalEvent("viewport:resize", bounds.width, bounds.height);
  });
  w.on("focus", () => systemAppearanceWatcher?.refresh());
  installApplicationMenu(w);
  if (hostInputProbeReportPath) {
    w.on("focus", () => {
      w.sendGlobalEvent("host-input-probe:window-focus");
    });
    w.on("blur", () => {
      w.sendGlobalEvent("host-input-probe:window-blur");
    });
  }

  // Handle bridge calls from Lynx UI
  // @ts-ignore
  w.on("-lynx-invoke", async (callback: EventCallback, name: string, data: any) => {
    // In our architecture, UI calls NativeModules.bridge.request({ method, params })
    if (name !== "timerSleep") {
      console.log(`[PC_Host] NativeModule Call: bridge.${name}`, data, callback, name);
    }

    try {
      if (
        name === "synaraRpc" ||
        name === "synaraRpcStream" ||
        name === "terminalOpen" ||
        name === "terminalWrite" ||
        name === "terminalResize" ||
        name === "terminalAckOutput" ||
        name === "terminalClose"
      ) {
        const rpcName =
          name === "terminalOpen"
            ? "terminal.open"
            : name === "terminalWrite"
              ? "terminal.write"
              : name === "terminalResize"
                ? "terminal.resize"
                : name === "terminalAckOutput"
                  ? "terminal.ackOutput"
                  : name === "terminalClose"
                    ? "terminal.close"
                    : data.tag;
        const rpcData =
          name === "synaraRpc" || name === "synaraRpcStream"
            ? decodeBridgeRpcData(data)
            : { tag: rpcName, payload: data };
        const result =
          name === "synaraRpc" && data.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG
            ? await import("../syntaxHighlightingHost").then(
                ({ highlightCodeThemesForNativePreview }) =>
                  highlightCodeThemesForNativePreview({
                    code: typeof rpcData.payload?.code === "string" ? rpcData.payload.code : "",
                    path: typeof rpcData.payload?.path === "string" ? rpcData.payload.path : "",
                  }),
              )
            : await handleNativeRpc(
                name === "synaraRpcStream" ? "synaraRpcStream" : "synaraRpc",
                rpcData,
                (event) => {
                  const channel =
                    nativeEventStreamChannel(String(rpcData.tag ?? "")) ??
                    "synara:git-action-progress";
                  w.sendGlobalEvent(channel, event);
                },
              );
        callback.sendReply(
          JSON.stringify({
            _tag: "NativeRpcResult",
            value: result ?? null,
          }),
        );
      } else if (name === "showDialog") {
        const { message } = data;
        dialog.showMessageBox({ message });
        callback.sendReply("");
      } else if (name == "getAppVersion") {
        callback.sendReply(app.getVersion());
      } else if (name === "runtimeGetSynaraWsUrl") {
        callback.sendReply(
          JSON.stringify({
            wsUrl: resolveSynaraWsUrl(process.env.SYNARA_WS_URL),
          }),
        );
      } else if (name === "runtimeGetSystemAppearance") {
        callback.sendReply(
          JSON.stringify({
            dark: readCurrentSystemDark(),
          }),
        );
      } else if (name === "runtimeGetEditorIcon") {
        callback.sendReply(
          JSON.stringify({
            dataUrl: await fetchEditorIconDataUrl({
              editorId: typeof data?.editorId === "string" ? data.editorId : "",
              wsUrl: process.env.SYNARA_WS_URL,
            }),
          }),
        );
      } else if (name === "notificationsIsSupported") {
        callback.sendReply(
          JSON.stringify({
            supported: nativeNotifications.isSupported(),
          }),
        );
      } else if (name === "notificationsShow") {
        callback.sendReply(
          JSON.stringify({
            shown: await nativeNotifications.show({
              title: typeof data?.title === "string" ? data.title : "",
              body: typeof data?.body === "string" ? data.body : "",
              threadId: typeof data?.threadId === "string" ? data.threadId : null,
            }),
          }),
        );
      } else if (name === "appSnapGetState") {
        callback.sendReply(JSON.stringify(await initializeAppSnapManager().refreshState()));
      } else if (name === "appSnapSetEnabled") {
        const manager = initializeAppSnapManager();
        await manager.setShortcut({ kind: "both-option-keys" });
        callback.sendReply(JSON.stringify(await manager.setEnabled(data?.enabled === true)));
      } else if (name === "appSnapRequestPermissions") {
        callback.sendReply(JSON.stringify(await initializeAppSnapManager().requestPermissions()));
      } else if (name === "appSnapSetPlaySound") {
        callback.sendReply(
          JSON.stringify(
            await initializeAppSnapManager().setPlayCaptureSound(data?.enabled === true),
          ),
        );
      } else if (name === "appSnapPreviewSound") {
        callback.sendReply(
          JSON.stringify({
            played: await initializeAppSnapManager().previewCaptureSound(),
          }),
        );
      } else if (name === "appSnapListPendingCaptures") {
        const captures = await initializeAppSnapManager().listPendingCaptures();
        const registered = await Promise.all(
          captures.map(async (capture) => ({
            captureId: capture.id,
            capturedAt: capture.capturedAt,
            sourceAppName: capture.sourceAppName,
            sourceBundleIdentifier: capture.sourceBundleIdentifier,
            sourceWindowTitle: capture.sourceWindowTitle,
            file: await registerAppSnapPickedImage({
              bytes: capture.bytes,
              captureId: capture.id,
              name: capture.name,
            }),
          })),
        );
        callback.sendReply(JSON.stringify({ captures: registered }));
      } else if (name === "appSnapAcknowledgeCapture") {
        await initializeAppSnapManager().acknowledgeCapture(String(data?.captureId ?? ""));
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name.startsWith("storage")) {
        callback.sendReply(handleStorage(name, data));
      } else if (name.startsWith("clipboard")) {
        callback.sendReply(await handleClipboard(name, data));
      } else if (name === "profileShareExport") {
        callback.sendReply(await handleClipboard(name, data));
      } else if (name.startsWith("attachments")) {
        callback.sendReply(await handleAttachments(name, data));
      } else if (name.startsWith("dialogs")) {
        callback.sendReply(await handleDialogs(w, name, data));
      } else if (name.startsWith("contextMenu")) {
        suppressMenuDismissEscapeUntil = Date.now() + 1_000;
        callback.sendReply(await handleContextMenu(w, name, data));
        suppressMenuDismissEscapeUntil = Date.now() + 1_000;
      } else if (name === "shellRendererReady") {
        const delivery = reduceShellRouteDelivery(routeDeliveryState, {
          type: "renderer-ready",
        });
        routeDeliveryState = delivery.state;
        startViewportProbe(w);
        startSystemAppearanceProbe(w, shellPaths.logFile);
        callback.sendReply(JSON.stringify({ ok: true, route: delivery.routeToDispatch }));
      } else if (name === "shellUiReady") {
        if (ignoreRendererUiReadyForProbe) {
          appendShellLog(
            shellPaths.logFile,
            "renderer ui ready acknowledgement ignored by explicit probe",
          );
          callback.sendReply(JSON.stringify({ ok: true, ignored: true }));
          return;
        }
        if (rendererUiReadyTimer) clearTimeout(rendererUiReadyTimer);
        rendererUiReadyTimer = null;
        appendShellLog(
          shellPaths.logFile,
          "renderer ui ready route=" +
            (typeof data?.route === "string" ? data.route : (rendererRoute ?? "/")) +
            " elapsedMs=" +
            String(Math.max(0, Date.now() - rendererUiReadyStartedAt)),
        );
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellRouteChanged") {
        const route =
          typeof data?.route === "string" && data.route.startsWith("/") ? data.route : null;
        if (route) rendererRoute = route;
        const relaunchUrl =
          typeof data?.relaunchUrl === "string" && parseSynaraDeepLinkInitData(data.relaunchUrl)
            ? data.relaunchUrl
            : null;
        if (relaunchUrl) {
          rendererRelaunchUrl = relaunchUrl;
        } else if (data?.clearRelaunchUrl === true) {
          rendererRelaunchUrl = null;
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellReload") {
        callback.sendReply(JSON.stringify({ ok: true }));
        setTimeout(relaunchApp, 0);
      } else if (name === "shellSetSearchNavigationEnabled") {
        const enabled = data?.enabled === true;
        if (searchNavigationEnabled !== enabled) {
          searchNavigationEnabled = enabled;
          searchKeyMonitor?.setMode(
            enabled
              ? "search"
              : terminalSearchNavigationEnabled || terminalInputOwner
                ? "terminal"
                : "disabled",
          );
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetModelPickerShortcutsEnabled") {
        const enabled = data?.enabled === true;
        if (modelPickerShortcutsEnabled !== enabled) {
          modelPickerShortcutsEnabled = enabled;
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetRecentViewNavigationEnabled") {
        const enabled = data?.enabled === true;
        if (recentViewNavigationEnabled !== enabled) {
          recentViewNavigationEnabled = enabled;
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetTerminalSearchEnabled") {
        const enabled = data?.enabled === true;
        if (terminalSearchEnabled !== enabled) {
          terminalSearchEnabled = enabled;
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetTerminalInputEnabled") {
        const enabled = data?.enabled === true;
        const owner = typeof data?.owner === "string" ? data.owner : "";
        const nextOwner = enabled
          ? owner || null
          : terminalInputOwner === owner
            ? null
            : terminalInputOwner;
        if (terminalInputOwner !== nextOwner) {
          terminalInputOwner = nextOwner;
          if (nextOwner !== null) composerInputOwner = null;
          searchKeyMonitor?.setMode(
            searchNavigationEnabled
              ? "search"
              : terminalSearchNavigationEnabled || nextOwner
                ? "terminal"
                : "disabled",
          );
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellReleaseTerminalInputFocus") {
        terminalInputOwner = null;
        searchKeyMonitor?.setMode(
          searchNavigationEnabled
            ? "search"
            : terminalSearchNavigationEnabled
              ? "terminal"
              : "disabled",
        );
        installApplicationMenu(w);
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetComposerInputBounds") {
        searchKeyMonitor?.setComposerBounds({
          x: Number(data?.x ?? 0),
          y: Number(data?.y ?? 0),
          width: Number(data?.width ?? 0),
          height: Number(data?.height ?? 0),
        });
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellClaimComposerInputFocus") {
        const owner = typeof data?.owner === "string" ? data.owner : "";
        terminalInputOwner = null;
        terminalSelectionOwner = null;
        terminalSelectionText = "";
        composerInputOwner = owner || null;
        searchKeyMonitor?.setMode(
          searchNavigationEnabled
            ? "search"
            : terminalSearchNavigationEnabled
              ? "terminal"
              : "disabled",
        );
        installApplicationMenu(w);
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetComposerInputFocused") {
        const enabled = data?.enabled === true;
        const owner = typeof data?.owner === "string" ? data.owner : "";
        const nextOwner = enabled
          ? owner || null
          : composerInputOwner === owner
            ? null
            : composerInputOwner;
        if (composerInputOwner !== nextOwner) {
          composerInputOwner = nextOwner;
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetTerminalSelectionEnabled") {
        const enabled = data?.enabled === true;
        const owner = typeof data?.owner === "string" ? data.owner : "";
        const text = typeof data?.text === "string" ? data.text.slice(0, 1_000_000) : "";
        const nextOwner = enabled
          ? owner || null
          : terminalSelectionOwner === owner
            ? null
            : terminalSelectionOwner;
        if (terminalSelectionOwner !== nextOwner) {
          terminalSelectionOwner = nextOwner;
          installApplicationMenu(w);
        }
        terminalSelectionText = nextOwner ? text : "";
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSetTerminalSearchNavigationEnabled") {
        const enabled = data?.enabled === true;
        if (terminalSearchNavigationEnabled !== enabled) {
          terminalSearchNavigationEnabled = enabled;
          searchKeyMonitor?.setMode(
            searchNavigationEnabled
              ? "search"
              : enabled || terminalInputOwner
                ? "terminal"
                : "disabled",
          );
          installApplicationMenu(w);
        }
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "browserViewAttach") {
        callback.sendReply(
          JSON.stringify({
            ok:
              browserViewHost?.attach(
                data.bounds,
                String(data.tabId ?? "browser-tab-1"),
                String(data.url ?? "about:blank"),
              ) === true,
          }),
        );
      } else if (name === "browserViewSetBounds") {
        callback.sendReply(
          JSON.stringify({ ok: browserViewHost?.setBounds(data.bounds) === true }),
        );
      } else if (name === "browserViewSetVisible") {
        callback.sendReply(
          JSON.stringify({ ok: browserViewHost?.setVisible(data.visible === true) === true }),
        );
      } else if (name === "browserViewNavigate") {
        callback.sendReply(
          JSON.stringify({ ok: browserViewHost?.navigate(String(data.url ?? "")) === true }),
        );
      } else if (name === "browserViewGoBack") {
        callback.sendReply(JSON.stringify({ ok: browserViewHost?.goBack() === true }));
      } else if (name === "browserViewGoForward") {
        callback.sendReply(JSON.stringify({ ok: browserViewHost?.goForward() === true }));
      } else if (name === "browserViewReload") {
        callback.sendReply(JSON.stringify({ ok: browserViewHost?.reload() === true }));
      } else if (name === "browserViewNewTab") {
        callback.sendReply(
          JSON.stringify({
            ok:
              browserViewHost?.newTab(
                String(data.tabId ?? ""),
                String(data.url ?? "about:blank"),
              ) === true,
          }),
        );
      } else if (name === "browserViewSelectTab") {
        callback.sendReply(
          JSON.stringify({ ok: browserViewHost?.selectTab(String(data.tabId ?? "")) === true }),
        );
      } else if (name === "browserViewCloseTab") {
        callback.sendReply(
          JSON.stringify({ ok: browserViewHost?.closeTab(String(data.tabId ?? "")) === true }),
        );
      } else if (name === "browserViewCopyScreenshot") {
        callback.sendReply(
          JSON.stringify({
            ok: (await browserViewHost?.copyScreenshotToClipboard()) === true,
          }),
        );
      } else if (name === "browserViewGetState") {
        callback.sendReply(JSON.stringify(browserViewHost?.getState() ?? null));
      } else if (name === "browserViewDestroy") {
        browserViewHost?.dispose();
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "voiceGetState") {
        callback.sendReply(JSON.stringify(voiceRecorder?.getState() ?? null));
      } else if (name === "voiceStartRecording") {
        callback.sendReply(JSON.stringify((await voiceRecorder?.start()) ?? null));
      } else if (name === "voiceStopRecording") {
        callback.sendReply(JSON.stringify(voiceRecorder?.stop() ?? null));
      } else if (name === "voiceCancelRecording") {
        voiceRecorder?.cancel();
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "shellSearchNavigationHandled") {
        appendShellLog(
          shellPaths.logFile,
          `search navigation handled key=${String(data?.key)} shift=${data?.shiftKey === true} handled=${data?.handled === true}`,
        );
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "hostInputProbePublish" && hostInputProbeReportPath) {
        fs.mkdirSync(path.dirname(hostInputProbeReportPath), {
          recursive: true,
        });
        writeJsonAtomic(hostInputProbeReportPath, data?.matrix ?? null);
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (
        name === "feedbackSubmit" ||
        name.startsWith("window") ||
        name.startsWith("shell")
      ) {
        callback.sendReply(await handleShell(w, name, data));
      } else if (name.startsWith("updater")) {
        callback.sendReply(await handleUpdater(name));
      } else if (name === "timerSleep") {
        const milliseconds = Math.min(60_000, Math.max(0, Number(data?.milliseconds) || 0));
        await new Promise((resolve) => setTimeout(resolve, milliseconds));
        callback.sendReply(JSON.stringify({ ok: true }));
      } else if (name === "wsEchoPort") {
        callback.sendReply(JSON.stringify({ port: await ensureWsEcho() }));
      } else {
        callback.sendReply(JSON.stringify({ error: `unknown bridge method ${name}` }));
      }
    } catch (error) {
      if (
        name === "synaraRpc" ||
        name === "synaraRpcStream" ||
        name === "terminalOpen" ||
        name === "terminalWrite" ||
        name === "terminalResize" ||
        name === "terminalAckOutput" ||
        name === "terminalClose"
      ) {
        appendShellLog(
          shellPaths.logFile,
          `rpc failed method=${name} tag=${String(data?.tag ?? name)} kind=${
            error && typeof error === "object" && "errorKind" in error
              ? String(error.errorKind)
              : "unknown"
          } message=${error instanceof Error ? error.message : String(error)}`,
        );
      }
      callback.sendReply(
        JSON.stringify({
          error: error instanceof Error ? error.message : String(error),
          ...(error && typeof error === "object" && "errorKind" in error
            ? { errorKind: error.errorKind }
            : {}),
        }),
      );
    }
  });

  const unsubscribeTransportState = subscribeNativeRpcTransportState((state) => {
    w.sendGlobalEvent("synara:transport-state", state);
  });

  if (windowPresentation.showInactiveAfterSetup) {
    w.showInactive();
  } else if (windowPresentation.showAfterSetup) {
    w.show();
  }
  if (process.env.SYNARA_BROWSER_VIEW_PROBE_URL?.trim()) {
    setTimeout(() => {
      const attached =
        browserViewHost?.attach(
          { x: 448, y: 92, width: 416, height: 960 },
          process.env.SYNARA_BROWSER_VIEW_PROBE_URL!.trim(),
        ) === true;
      appendShellLog(shellPaths.logFile, `browser view probe attached=${attached}`);
    }, 250);
  }
  if (savedState?.maximized) w.maximize();
  if (savedState?.fullscreen) w.setFullScreen(true);
  flushWindowState();
  const startupInitData = initDataFromArguments(process.argv);
  const startupRoute =
    routeDeliveryState.pendingRoute ??
    routeFromArguments(process.argv) ??
    startupInitData?.initialRoute ??
    null;
  if (startupRoute) {
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: "route-requested",
      route: startupRoute,
    }).state;
  }
  rendererRoute = startupRoute;
  loadLynxBundle(w);
  w.on("close", () => {
    unsubscribeTransportState();
    disposeNativeRpcHost();
    appSnapManager?.dispose();
    appSnapManager = null;
    systemAppearanceWatcher?.dispose();
    systemAppearanceWatcher = null;
    searchKeyMonitor?.dispose();
    searchKeyMonitor = null;
    browserViewHost?.dispose();
    browserViewHost = null;
    voiceRecorder?.dispose();
    voiceRecorder = null;
    for (const timer of systemAppearanceProbeTimers.splice(0)) {
      clearTimeout(timer);
    }
    if (rendererUiReadyTimer) clearTimeout(rendererUiReadyTimer);
    rendererUiReadyTimer = null;
    flushWindowState();
    appendShellLog(shellPaths.logFile, "window closed");
    mainWindow = null;
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: "renderer-reset",
    }).state;
  });
});
