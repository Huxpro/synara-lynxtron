// Copyright 2026 The Lynxtron Authors. All rights reserved.
// Licensed under the Apache License Version 2.0 that can be found in the
// LICENSE file in the root directory of this source tree.

import {
  app,
  LynxWindow,
  clipboard,
  dialog,
  devtool,
  Menu,
  screen,
} from '@lynx-js/lynxtron';
import { LYNX_BUNDLE_PATH } from './vendorPaths';
import {
  handleContextMenu,
  handleClipboard,
  handleAttachments,
  handleDialogs,
  handleShell,
  handleStorage,
  ensureWsEcho,
  registerAppSnapPickedImage,
} from './hostServices';
import { resolveSynaraWsUrl } from './runtimeEndpoint.logic';
import path from 'path';
import {
  appendShellLog,
  buildSearchNavigationMenuItems,
  INITIAL_SHELL_ROUTE_DELIVERY_STATE,
  dispatchRendererGlobalEvent,
  migrateLegacyShellFiles,
  parseSynaraDeepLink,
  parseSynaraDeepLinkInitData,
  parseViewportProbeSequence,
  readWindowState,
  reduceShellRouteDelivery,
  resolveRestoredBounds,
  resolveNativeRendererCommand,
  resolveShellPaths,
  resolveShellUserDataDir,
  resolveShellWindowPresentation,
  shouldAcquireShellSingleInstanceLock,
  type ShellRouteDeliveryState,
  type ShellWindowState,
  writeJsonAtomic,
} from './shellRuntime';
import fs from 'node:fs';
import type { KeybindingCommand } from '@synara/contracts';
import { handleUpdater } from './updateService';
import { resolveShellWindowChrome } from './shellWindowChrome';
import { NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG } from '../syntaxHighlightingContract.logic';
import {
  disposeNativeRpcHost,
  handleNativeRpc,
  subscribeNativeRpcTransportState,
} from './nativeRpcHost';
import {
  createNativeNotificationService,
  type NativeNotificationConstructor,
} from './nativeNotifications';
import { createRequire } from 'node:module';
import {
  DesktopAppSnapManager,
} from '../../../../desktop/src/appSnapManager';
import type {
  DesktopAppSnapErrorEvent,
  DesktopAppSnapState,
} from '@synara/contracts';
const isDev = process.env.NODE_ENV === 'development';
const isDevtoolEnabled =
  isDev || process.env.SYNARA_ENABLE_DEVTOOL === '1';
const isBackgroundLaunch =
  process.env.SYNARA_BACKGROUND_LAUNCH === '1';
const hostInputProbeReportPath =
  process.env.SYNARA_HOST_INPUT_PROBE_REPORT?.trim() || null;
const TERMINAL_EVENT = 'synara:terminal-event';
const APPSNAP_CAPTURE_EVENT = 'synara:appsnap-captured';
const APPSNAP_ERROR_EVENT = 'synara:appsnap-error';
const APPSNAP_STATE_EVENT = 'synara:appsnap-state';
const require = createRequire(import.meta.url);
const nativeLynxtron = require('lynxtron') as {
  readonly Notification?: NativeNotificationConstructor;
};

let mainWindow: LynxWindow | null = null;
let searchNavigationEnabled = false;
let routeDeliveryState: ShellRouteDeliveryState =
  INITIAL_SHELL_ROUTE_DELIVERY_STATE;
let rendererRoute: string | null = null;
let viewportProbeStarted = false;

function startViewportProbe(w: LynxWindow): void {
  if (viewportProbeStarted) return;
  const sequence = parseViewportProbeSequence(
    process.env.SYNARA_VIEWPORT_PROBE_SEQUENCE
  );
  if (!sequence.length) return;
  viewportProbeStarted = true;
  sequence.forEach((size, index) => {
    setTimeout(() => {
      if (w.isDestroyed()) return;
      w.setContentSize(size.width, size.height);
    }, 600 * (index + 1));
  });
}

function dispatchRoute(route: string, activate = true): void {
  if (!mainWindow || mainWindow.isDestroyed()) {
    routeDeliveryState = reduceShellRouteDelivery(
      { ...routeDeliveryState, rendererReady: false },
      { type: 'route-requested', route }
    ).state;
    return;
  }
  if (activate) {
    mainWindow.show();
    mainWindow.focus();
  }
  const delivery = reduceShellRouteDelivery(routeDeliveryState, {
    type: 'route-requested',
    route,
  });
  routeDeliveryState = delivery.state;
  if (delivery.routeToDispatch) {
    mainWindow.sendGlobalEvent('shell:navigate', delivery.routeToDispatch);
  }
}

const nativeNotifications = createNativeNotificationService({
  Notification: nativeLynxtron.Notification,
  openThread: (threadId) => dispatchRoute(`/thread/${threadId}`),
});

let appSnapManager: DesktopAppSnapManager | null = null;

function appSnapHelperPath(): string {
  return path.join(__dirname, 'synara-appsnap-helper');
}

function appSnapCaptureDirectory(): string {
  return path.join(
    resolveShellUserDataDir(
      app.getPath('userData'),
      process.env.SYNARA_LYNX_USER_DATA_DIR
    ),
    'appsnap',
    'captures'
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
    excludedBundleId: 'com.lynxjs.Lynxtron',
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
            code: 'capture-registration-failed',
            message:
              error instanceof Error
                ? error.message
                : 'The captured AppSnap could not be attached.',
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

function dispatchShellCommand(command: KeybindingCommand): void {
  const resolved = resolveNativeRendererCommand(command);
  if (!resolved) return;
  dispatchShellEvent('shell:command', resolved);
}

function routeFromArguments(argv: readonly string[]): string | null {
  for (const argument of argv) {
    const route = parseSynaraDeepLink(argument);
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

function reloadLynxWindow(w: LynxWindow): void {
  const startupInitData = initDataFromArguments(process.argv);
  const route =
    rendererRoute ??
    routeDeliveryState.pendingRoute ??
    startupInitData?.initialRoute ??
    null;
  routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
    type: 'renderer-reset',
  }).state;
  if (route) {
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: 'route-requested',
      route,
    }).state;
  }
  const loadOptions = {
    data: {
      ...(startupInitData ?? {}),
      initialRoute: route,
    },
  };
  if (isDev) {
    w.loadURL('http://localhost:5971/main.lynx.bundle', loadOptions);
  } else {
    w.loadFile(LYNX_BUNDLE_PATH, loadOptions);
  }
  appendShellLog(
    resolveShellPaths(
      resolveShellUserDataDir(
        app.getPath('userData'),
        process.env.SYNARA_LYNX_USER_DATA_DIR
      )
    ).logFile,
    `renderer reload requested route=${route ?? '/'}`
  );
}

function installApplicationMenu(w: LynxWindow): void {
  const menu = Menu.buildFromTemplate([
    {
      label: 'Synara',
      submenu: [
        { role: 'about' },
        { type: 'separator' },
        {
          label: 'New Chat',
          accelerator: 'CmdOrCtrl+N',
          click: () => dispatchShellCommand('chat.new'),
        },
        { type: 'separator' },
        {
          label: 'Settings…',
          accelerator: 'CmdOrCtrl+,',
          click: () => dispatchRoute('/settings'),
        },
        {
          label: 'Check for Updates…',
          click: () => dispatchRoute('/update'),
        },
        { type: 'separator' },
        { role: 'hide' },
        { role: 'hideOthers' },
        { role: 'unhide' },
        { type: 'separator' },
        { role: 'quit' },
      ],
    },
    {
      label: 'Edit',
      submenu: [
        {
          label: 'Undo',
          accelerator: 'CmdOrCtrl+Z',
          click: () => w.sendGlobalEvent('composer:undo'),
        },
        {
          label: 'Redo',
          accelerator: 'CmdOrCtrl+Shift+Z',
          click: () => w.sendGlobalEvent('composer:redo'),
        },
        { type: 'separator' },
        {
          label: 'Cut',
          accelerator: 'CmdOrCtrl+X',
          click: () => w.sendGlobalEvent('composer:cut'),
        },
        {
          label: 'Copy',
          accelerator: 'CmdOrCtrl+C',
          click: () => w.sendGlobalEvent('composer:copy'),
        },
        {
          label: 'Paste',
          accelerator: 'CmdOrCtrl+V',
          click: () => {
            const text = clipboard.readText();
            if (text) w.sendGlobalEvent('composer:paste-text', { text });
          },
        },
        {
          label: 'Select All',
          accelerator: 'CmdOrCtrl+A',
          click: () => w.sendGlobalEvent('composer:select-all'),
        },
      ],
    },
    {
      label: 'View',
      submenu: [
        {
          label: 'Search…',
          accelerator: 'CmdOrCtrl+K',
          click: () => dispatchShellCommand('sidebar.search'),
        },
        {
          label: 'Focus Composer',
          accelerator: 'CmdOrCtrl+L',
          click: () => dispatchShellCommand('composer.focus.toggle'),
        },
        {
          label: 'Toggle Sidebar',
          accelerator: 'CmdOrCtrl+B',
          click: () => dispatchShellCommand('sidebar.toggle'),
        },
        {
          label: 'Back',
          accelerator: 'CmdOrCtrl+[',
          click: () => dispatchShellEvent('shell:navigate-history', 'back'),
        },
        {
          label: 'Forward',
          accelerator: 'CmdOrCtrl+]',
          click: () => dispatchShellEvent('shell:navigate-history', 'forward'),
        },
        ...buildSearchNavigationMenuItems(searchNavigationEnabled, (event) =>
          dispatchShellEvent('shell:search-key', event)
        ),
        { type: 'separator' },
        {
          label: 'Threads',
          accelerator: 'CmdOrCtrl+1',
          click: () => dispatchRoute('/'),
        },
        {
          label: 'Projects',
          accelerator: 'CmdOrCtrl+2',
          click: () => dispatchRoute('/kanban'),
        },
        {
          label: 'Pull Requests',
          accelerator: 'CmdOrCtrl+3',
          click: () => dispatchRoute('/pull-requests'),
        },
        { type: 'separator' },
        {
          label: 'Previous Visible Thread',
          accelerator: 'CmdOrCtrl+Shift+[',
          click: () => dispatchShellCommand('chat.visible.previous'),
        },
        {
          label: 'Next Visible Thread',
          accelerator: 'CmdOrCtrl+Shift+]',
          click: () => dispatchShellCommand('chat.visible.next'),
        },
        { type: 'separator' },
        {
          id: 'reloadBundle',
          label: 'Reload',
          accelerator: 'CmdOrCtrl+R',
          registerAccelerator: true,
          click: () => reloadLynxWindow(w),
        },
        {
          id: 'forceReloadBundle',
          label: 'Force Reload',
          accelerator: 'CmdOrCtrl+Shift+R',
          registerAccelerator: true,
          click: () => reloadLynxWindow(w),
        },
        ...(isDev ? [{ role: 'toggleDevTools' }] : []),
      ],
    },
    {
      label: 'Window',
      submenu: [{ role: 'minimize' }, { role: 'zoom' }, { role: 'front' }],
    },
  ]);
  Menu.setApplicationMenu(menu);
  appendShellLog(
    resolveShellPaths(
      resolveShellUserDataDir(
        app.getPath('userData'),
        process.env.SYNARA_LYNX_USER_DATA_DIR
      )
    ).logFile,
    `application menu installed window=${w.id}`
  );
}

function installWindowStatePersistence(
  w: LynxWindow,
  filePath: string
): () => void {
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
    'move',
    'resize',
    'maximize',
    'unmaximize',
    'enter-full-screen',
    'leave-full-screen',
  ] as const) {
    w.on(event, schedule);
  }
  return () => {
    if (timer) clearTimeout(timer);
    persist();
  };
}

function emitWindowState(w: LynxWindow): void {
  w.sendGlobalEvent('window:state', {
    isMaximized: w.isMaximized(),
    isFullscreen: w.isFullScreen(),
  });
}

const acquireSingleInstanceLock = shouldAcquireShellSingleInstanceLock(
  process.env.SYNARA_ALLOW_PARALLEL_INSTANCE
);
const hasSingleInstanceLock =
  !acquireSingleInstanceLock || app.requestSingleInstanceLock();
if (!hasSingleInstanceLock) {
  app.quit();
} else {
  app.on('second-instance', (_event, argv) => {
    dispatchRoute(routeFromArguments(argv) ?? '/');
  });
  app.on('open-url', (event, url) => {
    event.preventDefault();
    const route = parseSynaraDeepLink(url);
    if (route) dispatchRoute(route);
  });
}

app.whenReady().then(() => {
  if (!hasSingleInstanceLock) return;
  devtool.setDevToolEnabled(isDevtoolEnabled);
  const userDataDir = resolveShellUserDataDir(
    app.getPath('userData'),
    process.env.SYNARA_LYNX_USER_DATA_DIR
  );
  const shellPaths = resolveShellPaths(userDataDir);
  const migrated = migrateLegacyShellFiles(userDataDir, shellPaths);
  appendShellLog(
    shellPaths.logFile,
    `startup version=${app.getVersion()} migrated=${migrated.join(',') || 'none'}`
  );
  if (!isDev && acquireSingleInstanceLock) {
    app.setAsDefaultProtocolClient('synara');
  }
  const savedState = readWindowState(shellPaths.windowState);
  const display = savedState
    ? screen.getDisplayMatching(savedState.bounds)
    : screen.getPrimaryDisplay();
  const bounds = resolveRestoredBounds(savedState?.bounds ?? null, display.workArea);
  const windowPresentation = resolveShellWindowPresentation(isBackgroundLaunch);
  const w = new LynxWindow({
    ...bounds,
    minWidth: 900,
    minHeight: 650,
    center: false,
    show: windowPresentation.showOnCreate,
    title: 'Synara',
    ...resolveShellWindowChrome(process.platform),
    lynxPreference: {
      preload: path.join(__dirname, 'preload.js'),
    },
  });
  mainWindow = w;
  routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
    type: 'renderer-reset',
  }).state;
  const flushWindowState = installWindowStatePersistence(w, shellPaths.windowState);
  for (const event of [
    'maximize',
    'unmaximize',
    'enter-full-screen',
    'leave-full-screen',
  ] as const) {
    w.on(event, () => emitWindowState(w));
  }
  w.on('resize', () => {
    const bounds = w.getContentBounds();
    w.sendGlobalEvent('viewport:resize', bounds.width, bounds.height);
  });
  installApplicationMenu(w);
  if (hostInputProbeReportPath) {
    w.on('focus', () => {
      w.sendGlobalEvent('host-input-probe:window-focus');
    });
    w.on('blur', () => {
      w.sendGlobalEvent('host-input-probe:window-blur');
    });
  }

  // Handle bridge calls from Lynx UI
  // @ts-ignore
  w.on(
    '-lynx-invoke',
    async (callback: EventCallback, name: string, data: any) => {
      // In our architecture, UI calls NativeModules.bridge.request({ method, params })
      if (name !== 'timerSleep') {
        console.log(
          `[PC_Host] NativeModule Call: bridge.${name}`,
          data,
          callback,
          name
        );
      }

      try {
        if (
          name === 'synaraRpc' ||
          name === 'synaraRpcStream' ||
          name === 'terminalOpen' ||
          name === 'terminalWrite' ||
          name === 'terminalClose'
        ) {
          const rpcName =
            name === 'terminalOpen'
              ? 'terminal.open'
              : name === 'terminalWrite'
                ? 'terminal.write'
                : name === 'terminalClose'
                  ? 'terminal.close'
                  : data.tag;
          const rpcData =
            name === 'synaraRpc' || name === 'synaraRpcStream'
              ? data
              : { tag: rpcName, payload: data };
          const result =
            name === 'synaraRpc' &&
            data.tag === NATIVE_SYNTAX_HIGHLIGHT_RPC_TAG
              ? await import('../syntaxHighlightingHost').then(
                  ({ highlightCodeThemesForNativePreview }) =>
                    highlightCodeThemesForNativePreview({
                      code:
                        typeof data.payload?.code === 'string'
                          ? data.payload.code
                          : '',
                      path:
                        typeof data.payload?.path === 'string'
                          ? data.payload.path
                          : '',
                    })
                )
              : await handleNativeRpc(
                  name === 'synaraRpcStream' ? 'synaraRpcStream' : 'synaraRpc',
                  rpcData,
                  (event) => {
                    w.sendGlobalEvent(
                      rpcData.tag === 'terminal.subscribeEvents'
                        ? TERMINAL_EVENT
                        : 'synara:git-action-progress',
                      event
                    );
                  }
                );
          callback.sendReply(
            JSON.stringify({
              _tag: 'NativeRpcResult',
              value: result ?? null,
            })
          );
        } else if (name === 'showDialog') {
          const { message } = data;
          dialog.showMessageBox({ message });
          callback.sendReply('');
        } else if (name == 'getAppVersion') {
          callback.sendReply(app.getVersion());
        } else if (name === 'runtimeGetSynaraWsUrl') {
          callback.sendReply(
            JSON.stringify({
              wsUrl: resolveSynaraWsUrl(process.env.SYNARA_WS_URL),
            })
          );
        } else if (name === 'notificationsIsSupported') {
          callback.sendReply(
            JSON.stringify({
              supported: nativeNotifications.isSupported(),
            })
          );
        } else if (name === 'notificationsShow') {
          callback.sendReply(
            JSON.stringify({
              shown: await nativeNotifications.show({
                title: typeof data?.title === 'string' ? data.title : '',
                body: typeof data?.body === 'string' ? data.body : '',
                threadId:
                  typeof data?.threadId === 'string' ? data.threadId : null,
              }),
            })
          );
        } else if (name === 'appSnapGetState') {
          callback.sendReply(
            JSON.stringify(await initializeAppSnapManager().refreshState())
          );
        } else if (name === 'appSnapSetEnabled') {
          const manager = initializeAppSnapManager();
          await manager.setShortcut({ kind: 'both-option-keys' });
          callback.sendReply(
            JSON.stringify(await manager.setEnabled(data?.enabled === true))
          );
        } else if (name === 'appSnapRequestPermissions') {
          callback.sendReply(
            JSON.stringify(
              await initializeAppSnapManager().requestPermissions()
            )
          );
        } else if (name === 'appSnapListPendingCaptures') {
          const captures =
            await initializeAppSnapManager().listPendingCaptures();
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
            }))
          );
          callback.sendReply(JSON.stringify({ captures: registered }));
        } else if (name === 'appSnapAcknowledgeCapture') {
          await initializeAppSnapManager().acknowledgeCapture(
            String(data?.captureId ?? '')
          );
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name.startsWith('storage')) {
          callback.sendReply(handleStorage(name, data));
        } else if (name.startsWith('clipboard')) {
          callback.sendReply(await handleClipboard(name, data));
        } else if (name === 'profileShareExport') {
          callback.sendReply(await handleClipboard(name, data));
        } else if (name.startsWith('attachments')) {
          callback.sendReply(await handleAttachments(name, data));
        } else if (name.startsWith('dialogs')) {
          callback.sendReply(await handleDialogs(w, name, data));
        } else if (name.startsWith('contextMenu')) {
          callback.sendReply(await handleContextMenu(w, name, data));
        } else if (name === 'shellRendererReady') {
          if (searchNavigationEnabled) {
            searchNavigationEnabled = false;
            installApplicationMenu(w);
          }
          const delivery = reduceShellRouteDelivery(routeDeliveryState, {
            type: 'renderer-ready',
          });
          routeDeliveryState = delivery.state;
          startViewportProbe(w);
          callback.sendReply(
            JSON.stringify({ ok: true, route: delivery.routeToDispatch })
          );
        } else if (name === 'shellRouteChanged') {
          const route =
            typeof data?.route === 'string' && data.route.startsWith('/')
              ? data.route
              : null;
          if (route) rendererRoute = route;
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name === 'shellReload') {
          reloadLynxWindow(w);
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name === 'shellSetSearchNavigationEnabled') {
          const enabled = data?.enabled === true;
          if (searchNavigationEnabled !== enabled) {
            searchNavigationEnabled = enabled;
            installApplicationMenu(w);
          }
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name === 'shellSearchNavigationHandled') {
          appendShellLog(
            shellPaths.logFile,
            `search navigation handled key=${String(data?.key)} shift=${data?.shiftKey === true} handled=${data?.handled === true}`
          );
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (
          name === 'hostInputProbePublish' &&
          hostInputProbeReportPath
        ) {
          fs.mkdirSync(path.dirname(hostInputProbeReportPath), {
            recursive: true,
          });
          writeJsonAtomic(hostInputProbeReportPath, data?.matrix ?? null);
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name.startsWith('window') || name.startsWith('shell')) {
          callback.sendReply(await handleShell(w, name, data));
        } else if (name.startsWith('updater')) {
          callback.sendReply(await handleUpdater(name));
        } else if (name === 'timerSleep') {
          const milliseconds = Math.min(
            60_000,
            Math.max(0, Number(data?.milliseconds) || 0)
          );
          await new Promise((resolve) => setTimeout(resolve, milliseconds));
          callback.sendReply(JSON.stringify({ ok: true }));
        } else if (name === 'wsEchoPort') {
          callback.sendReply(JSON.stringify({ port: await ensureWsEcho() }));
        } else {
          callback.sendReply(JSON.stringify({ error: `unknown bridge method ${name}` }));
        }
      } catch (error) {
        callback.sendReply(
          JSON.stringify({
            error: error instanceof Error ? error.message : String(error),
            ...(
              error &&
              typeof error === 'object' &&
              'errorKind' in error
                ? { errorKind: error.errorKind }
                : {}
            ),
          })
        );
      }
    }
  );

  const unsubscribeTransportState = subscribeNativeRpcTransportState(
    (state) => {
      w.sendGlobalEvent('synara:transport-state', state);
    }
  );

  if (windowPresentation.showInactiveAfterSetup) {
    w.showInactive();
  } else if (windowPresentation.showAfterSetup) {
    w.show();
  }
  if (savedState?.maximized) w.maximize();
  if (savedState?.fullscreen) w.setFullScreen(true);
  flushWindowState();
  const startupInitData = initDataFromArguments(process.argv);
  const startupRoute =
    routeDeliveryState.pendingRoute ?? startupInitData?.initialRoute ?? null;
  if (startupRoute) {
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: 'route-requested',
      route: startupRoute,
    }).state;
  }
  rendererRoute = startupRoute;
  reloadLynxWindow(w);
  w.on('close', () => {
    unsubscribeTransportState();
    disposeNativeRpcHost();
    appSnapManager?.dispose();
    appSnapManager = null;
    flushWindowState();
    appendShellLog(shellPaths.logFile, 'window closed');
    mainWindow = null;
    routeDeliveryState = reduceShellRouteDelivery(routeDeliveryState, {
      type: 'renderer-reset',
    }).state;
  });
});
