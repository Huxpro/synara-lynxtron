import fs from "node:fs";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { KeybindingCommand } from "@synara/contracts";

export interface ShellRectangle {
  readonly x: number;
  readonly y: number;
  readonly width: number;
  readonly height: number;
}

export interface ShellWindowState {
  readonly version: 1;
  readonly bounds: ShellRectangle;
  readonly maximized: boolean;
  readonly fullscreen: boolean;
}

export interface ShellPaths {
  readonly stateDir: string;
  readonly windowState: string;
  readonly logFile: string;
  readonly kvFile: string;
}

export interface ViewportProbeSize {
  readonly width: number;
  readonly height: number;
}

// Keep the native shell's resizing contract aligned with Electron. A wider
// Lynx-only minimum prevents exact-size fidelity comparisons and hides the
// responsive states that the product supports in the source renderer.
export const SHELL_WINDOW_MIN_WIDTH = 840;
export const SHELL_WINDOW_MIN_HEIGHT = 620;

export function parseViewportProbeSequence(
  value: string | undefined,
): readonly ViewportProbeSize[] {
  if (!value) return [];
  return value
    .split(",")
    .map((entry) => {
      const match = entry.trim().match(/^(\d+)x(\d+)$/);
      if (!match) return null;
      return {
        width: Math.max(SHELL_WINDOW_MIN_WIDTH, Number(match[1])),
        height: Math.max(SHELL_WINDOW_MIN_HEIGHT, Number(match[2])),
      };
    })
    .filter((entry): entry is ViewportProbeSize => entry !== null);
}

export interface ShellRouteDeliveryState {
  readonly rendererReady: boolean;
  readonly pendingRoute: string | null;
}

export type ShellRouteDeliveryEvent =
  | { readonly type: "route-requested"; readonly route: string }
  | { readonly type: "renderer-ready" }
  | { readonly type: "renderer-reset" };

export interface ShellRouteDeliveryResult {
  readonly state: ShellRouteDeliveryState;
  readonly routeToDispatch: string | null;
}

export const INITIAL_SHELL_ROUTE_DELIVERY_STATE: ShellRouteDeliveryState = {
  rendererReady: false,
  pendingRoute: null,
};

export function reduceShellRouteDelivery(
  state: ShellRouteDeliveryState,
  event: ShellRouteDeliveryEvent,
): ShellRouteDeliveryResult {
  if (event.type === "renderer-reset") {
    return {
      state: { rendererReady: false, pendingRoute: state.pendingRoute },
      routeToDispatch: null,
    };
  }
  if (event.type === "renderer-ready") {
    return {
      state: { rendererReady: true, pendingRoute: null },
      routeToDispatch: state.pendingRoute,
    };
  }
  if (!state.rendererReady) {
    return {
      state: { rendererReady: false, pendingRoute: event.route },
      routeToDispatch: null,
    };
  }
  return {
    state,
    routeToDispatch: event.route,
  };
}

export const SHELL_CAPABILITIES = {
  windowState: "native",
  menu: "native",
  protocol: "native",
  logging: "node-file",
  migration: "node-file",
  globalShortcut: "menu-accelerator",
  autoUpdater: "external-download",
  sessionPermissions: "not-available",
} as const;

const NATIVE_RENDERER_COMMANDS = new Set<KeybindingCommand>([
  "chat.new",
  "sidebar.toggle",
  "sidebar.search",
  "browser.toggle",
  "chat.visible.previous",
  "chat.visible.next",
  "composer.focus.toggle",
  "view.recent.next",
  "view.recent.previous",
]);

export function resolveNativeRendererCommand(command: KeybindingCommand): KeybindingCommand | null {
  return NATIVE_RENDERER_COMMANDS.has(command) ? command : null;
}

export interface ShellGlobalEventTarget {
  sendGlobalEvent(event: string, ...args: unknown[]): unknown;
}

export interface SearchNavigationAccelerator {
  readonly accelerator: "Up" | "Down" | "Tab" | "Shift+Tab" | "Esc";
  readonly key: "ArrowUp" | "ArrowDown" | "Tab" | "Escape";
  readonly shiftKey?: boolean;
}

export const SEARCH_NAVIGATION_ACCELERATORS: readonly SearchNavigationAccelerator[] = [
  { accelerator: "Up", key: "ArrowUp" },
  { accelerator: "Down", key: "ArrowDown" },
  { accelerator: "Tab", key: "Tab" },
  { accelerator: "Shift+Tab", key: "Tab", shiftKey: true },
  { accelerator: "Esc", key: "Escape" },
];

export interface SearchNavigationMenuItem {
  readonly label: string;
  readonly accelerator: SearchNavigationAccelerator["accelerator"];
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}

export function buildRecentViewNavigationMenuItems(
  enabled: boolean,
  dispatch: (event: "commit" | "cancel") => void,
): readonly {
  readonly label: string;
  readonly accelerator: "Enter" | "Esc";
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}[] {
  if (!enabled) return [];
  const items: readonly {
    readonly label: string;
    readonly accelerator: "Enter" | "Esc";
    readonly event: "commit" | "cancel";
  }[] = [
    { label: "Open recent view", accelerator: "Enter", event: "commit" },
    { label: "Cancel recent views", accelerator: "Esc", event: "cancel" },
  ];
  return items.map(({ label, accelerator, event }) => ({
    label,
    accelerator,
    visible: false as const,
    acceleratorWorksWhenHidden: true as const,
    registerAccelerator: true as const,
    click: () => dispatch(event),
  }));
}

export function buildTerminalSearchMenuItems(
  enabled: boolean,
  dispatch: () => void,
): readonly {
  readonly label: "Find in Terminal";
  readonly accelerator: "CmdOrCtrl+F";
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}[] {
  if (!enabled) return [];
  return [
    {
      label: "Find in Terminal",
      accelerator: "CmdOrCtrl+F",
      visible: false,
      acceleratorWorksWhenHidden: true,
      registerAccelerator: true,
      click: dispatch,
    },
  ];
}

export function buildTerminalSearchNavigationMenuItems(
  enabled: boolean,
  dispatch: (event: { readonly key: "Enter" | "Escape"; readonly shiftKey?: true }) => void,
): readonly {
  readonly label: string;
  readonly accelerator: "Enter" | "Shift+Enter" | "Esc";
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}[] {
  if (!enabled) return [];
  const items: readonly {
    readonly label: string;
    readonly accelerator: "Enter" | "Shift+Enter" | "Esc";
    readonly key: "Enter" | "Escape";
    readonly shiftKey?: true;
  }[] = [
    { label: "Terminal search next", accelerator: "Enter", key: "Enter" },
    { label: "Terminal search previous", accelerator: "Shift+Enter", key: "Enter", shiftKey: true },
    { label: "Terminal search close", accelerator: "Esc", key: "Escape" },
  ];
  return items.map(({ label, accelerator, key, shiftKey }) => ({
    label,
    accelerator,
    visible: false,
    acceleratorWorksWhenHidden: true,
    registerAccelerator: true,
    click: () => dispatch({ key, ...(shiftKey ? { shiftKey: true } : {}) }),
  }));
}

export interface TerminalInputAccelerator {
  readonly accelerator:
    | "Enter"
    | "Up"
    | "Down"
    | "Left"
    | "Right"
    | "Tab"
    | "Esc"
    | "Ctrl+C"
    | "Ctrl+L";
  readonly data: string;
  readonly label: string;
}

export const TERMINAL_INPUT_ACCELERATORS: readonly TerminalInputAccelerator[] = [
  { label: "Terminal input Enter", accelerator: "Enter", data: "\r" },
  { label: "Terminal input up", accelerator: "Up", data: "\u001b[A" },
  { label: "Terminal input down", accelerator: "Down", data: "\u001b[B" },
  { label: "Terminal input right", accelerator: "Right", data: "\u001b[C" },
  { label: "Terminal input left", accelerator: "Left", data: "\u001b[D" },
  { label: "Terminal input tab", accelerator: "Tab", data: "\t" },
  { label: "Terminal input escape", accelerator: "Esc", data: "\u001b" },
];

const MAC_TERMINAL_CONTROL_ACCELERATORS: readonly TerminalInputAccelerator[] = [
  { label: "Terminal interrupt", accelerator: "Ctrl+C", data: "\u0003" },
  { label: "Terminal clear", accelerator: "Ctrl+L", data: "\u000c" },
];

export function buildTerminalInputMenuItems(
  enabled: boolean,
  includeControlAccelerators: boolean,
  dispatch: (data: string) => void,
): readonly {
  readonly label: string;
  readonly accelerator: TerminalInputAccelerator["accelerator"];
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}[] {
  if (!enabled) return [];
  const accelerators = includeControlAccelerators
    ? [...TERMINAL_INPUT_ACCELERATORS, ...MAC_TERMINAL_CONTROL_ACCELERATORS]
    : TERMINAL_INPUT_ACCELERATORS;
  return accelerators.map((input) => ({
    label: input.label,
    accelerator: input.accelerator,
    visible: false,
    acceleratorWorksWhenHidden: true,
    registerAccelerator: true,
    click: () => dispatch(input.data),
  }));
}

export function buildSearchNavigationMenuItems(
  enabled: boolean,
  dispatch: (event: {
    readonly key: SearchNavigationAccelerator["key"];
    readonly shiftKey?: true;
  }) => void,
): readonly SearchNavigationMenuItem[] {
  if (!enabled) return [];
  return SEARCH_NAVIGATION_ACCELERATORS.map((navigation) => ({
    label: `Search: ${navigation.key}${navigation.shiftKey ? " (reverse)" : ""}`,
    accelerator: navigation.accelerator,
    visible: false,
    acceleratorWorksWhenHidden: true,
    registerAccelerator: true,
    click: () =>
      dispatch({
        key: navigation.key,
        ...(navigation.shiftKey ? { shiftKey: true } : {}),
      }),
  }));
}

/**
 * Renderer commands must not change native window visibility or focus. The
 * caller decides separately whether a route/navigation request should activate
 * the app.
 */
export function dispatchRendererGlobalEvent(
  target: ShellGlobalEventTarget,
  event: string,
  ...args: unknown[]
): void {
  target.sendGlobalEvent(event, ...args);
}

export interface ShellWindowPresentation {
  readonly showOnCreate: boolean;
  readonly showAfterSetup: boolean;
  readonly showInactiveAfterSetup: boolean;
}

export function resolveShellWindowPresentation(backgroundLaunch: boolean): ShellWindowPresentation {
  return {
    showOnCreate: !backgroundLaunch,
    showAfterSetup: !backgroundLaunch,
    showInactiveAfterSetup: backgroundLaunch,
  };
}

export function shouldAcquireShellSingleInstanceLock(
  allowParallelInstance: string | undefined,
): boolean {
  return allowParallelInstance !== "1";
}

export function resolveShellPaths(userDataDir: string): ShellPaths {
  const stateDir = path.join(userDataDir, "synara-lynx-slice");
  return {
    stateDir,
    windowState: path.join(stateDir, "window-state.json"),
    logFile: path.join(stateDir, "logs", "desktop-main.log"),
    kvFile: path.join(stateDir, "kv.json"),
  };
}

/**
 * Lynxtron 0.0.7 forwards `--user-data-dir` in argv but does not apply it to
 * `app.getPath('userData')`. This explicit host override is the supported
 * state-isolation hook for owned verification instances.
 */
export function resolveShellUserDataDir(
  defaultUserDataDir: string,
  override: string | undefined,
): string {
  const candidate = override?.trim();
  if (!candidate) return defaultUserDataDir;
  if (!path.isAbsolute(candidate)) {
    throw new Error("SYNARA_LYNX_USER_DATA_DIR must be an absolute path.");
  }
  return path.resolve(candidate);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parseWindowState(raw: string): ShellWindowState | null {
  try {
    const value = JSON.parse(raw) as Partial<ShellWindowState>;
    const bounds = value.bounds;
    if (
      value.version !== 1 ||
      !bounds ||
      !isFiniteNumber(bounds.x) ||
      !isFiniteNumber(bounds.y) ||
      !isFiniteNumber(bounds.width) ||
      !isFiniteNumber(bounds.height) ||
      bounds.width < 640 ||
      bounds.height < 480 ||
      typeof value.maximized !== "boolean" ||
      typeof value.fullscreen !== "boolean"
    ) {
      return null;
    }
    return value as ShellWindowState;
  } catch {
    return null;
  }
}

/**
 * Headless runtimes (Lynxtron on Linux renders windowless) expose no display
 * list, so `screen` throws. Fall back to a virtual work area large enough for
 * the default window instead of aborting startup.
 */
export const SHELL_FALLBACK_WORK_AREA: ShellRectangle = { x: 0, y: 0, width: 1440, height: 900 };

export function resolveShellWorkArea(readWorkArea: () => ShellRectangle): ShellRectangle {
  try {
    return readWorkArea();
  } catch {
    return SHELL_FALLBACK_WORK_AREA;
  }
}

export function resolveRestoredBounds(
  saved: ShellRectangle | null,
  workArea: ShellRectangle,
): ShellRectangle {
  const width = Math.min(Math.max(saved?.width ?? 1280, SHELL_WINDOW_MIN_WIDTH), workArea.width);
  const height = Math.min(Math.max(saved?.height ?? 820, SHELL_WINDOW_MIN_HEIGHT), workArea.height);
  const fallbackX = workArea.x + Math.round((workArea.width - width) / 2);
  const fallbackY = workArea.y + Math.round((workArea.height - height) / 2);
  if (!saved) {
    return { x: fallbackX, y: fallbackY, width, height };
  }
  const intersects =
    saved.x < workArea.x + workArea.width - 80 &&
    saved.x + saved.width > workArea.x + 80 &&
    saved.y < workArea.y + workArea.height - 50 &&
    saved.y + saved.height > workArea.y + 50;
  if (!intersects) {
    return { x: fallbackX, y: fallbackY, width, height };
  }
  return {
    x: Math.min(Math.max(saved.x, workArea.x), workArea.x + workArea.width - width),
    y: Math.min(Math.max(saved.y, workArea.y), workArea.y + workArea.height - height),
    width,
    height,
  };
}

export function readWindowState(filePath: string): ShellWindowState | null {
  try {
    return parseWindowState(fs.readFileSync(filePath, "utf8"));
  } catch {
    return null;
  }
}

export function writeJsonAtomic(filePath: string, value: unknown): void {
  const directory = path.dirname(filePath);
  fs.mkdirSync(directory, { recursive: true });
  // A fixed `.tmp` path lets overlapping writers rename each other's file.
  // Keep the temporary beside the destination so the final rename remains
  // atomic, but give every attempt its own collision-safe path.
  const temporary = path.join(
    directory,
    `.${path.basename(filePath)}.${process.pid}.${randomUUID()}.tmp`,
  );
  try {
    fs.writeFileSync(temporary, JSON.stringify(value), "utf8");
    fs.renameSync(temporary, filePath);
  } finally {
    // The rename removes the temporary on success; force cleanup covers a
    // failed write or rename without masking the original error.
    fs.rmSync(temporary, { force: true });
  }
}

export function migrateLegacyShellFiles(userDataDir: string, paths: ShellPaths): string[] {
  const migrations = [
    { from: path.join(userDataDir, "kv.json"), to: paths.kvFile },
    {
      from: path.join(userDataDir, "desktop-window-state.json"),
      to: paths.windowState,
    },
  ];
  const moved: string[] = [];
  for (const migration of migrations) {
    if (!fs.existsSync(migration.from) || fs.existsSync(migration.to)) continue;
    fs.mkdirSync(path.dirname(migration.to), { recursive: true });
    fs.renameSync(migration.from, migration.to);
    moved.push(path.basename(migration.from));
  }
  return moved;
}

export function appendShellLog(filePath: string, message: string, maxBytes = 1024 * 1024): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size >= maxBytes) {
      const previous = `${filePath}.1`;
      if (fs.existsSync(previous)) fs.unlinkSync(previous);
      fs.renameSync(filePath, previous);
    }
    fs.appendFileSync(filePath, `[${new Date().toISOString()}] ${message}\n`, "utf8");
  } catch {
    // Logging must never prevent shell startup.
  }
}

export function parseSynaraDeepLink(raw: string): string | null {
  return parseSynaraDeepLinkInitData(raw)?.initialRoute ?? null;
}

const SYNARA_RELAUNCH_ROUTE_PREFIX = "--synara-relaunch-route=";

export function parseSynaraRelaunchRoute(raw: string): string | null {
  if (!raw.startsWith(SYNARA_RELAUNCH_ROUTE_PREFIX)) return null;
  try {
    const route = decodeURIComponent(raw.slice(SYNARA_RELAUNCH_ROUTE_PREFIX.length));
    return route.startsWith("/") ? route : null;
  } catch {
    return null;
  }
}

export function buildSynaraRelaunchArguments(
  argv: readonly string[],
  applicationPath: string,
  route: string | null,
  relaunchUrl?: string | null,
): string[] {
  const processArguments = argv.slice(1);
  const args = processArguments
    .slice(
      processArguments[0] &&
        !processArguments[0].startsWith("-") &&
        parseSynaraDeepLinkInitData(processArguments[0]) === null
        ? 1
        : 0,
    )
    .filter(
      (argument) =>
        !argument.startsWith(SYNARA_RELAUNCH_ROUTE_PREFIX) &&
        parseSynaraDeepLinkInitData(argument) === null,
    );
  args.unshift(applicationPath);
  if (relaunchUrl && parseSynaraDeepLinkInitData(relaunchUrl)) {
    args.push(relaunchUrl);
  } else if (route) {
    args.push(`${SYNARA_RELAUNCH_ROUTE_PREFIX}${encodeURIComponent(route)}`);
  }
  return args;
}

export interface SynaraDeepLinkInitData {
  readonly initialDiffOpen: boolean;
  readonly initialDiffTurnId: string | null;
  readonly initialDiffFilePath: string | null;
  readonly initialDiffFileTreeOpen: boolean;
  readonly initialComposerModelMenuOpen: boolean;
  readonly initialComposerModelSubmenuOpen: boolean;
  readonly initialComposerModelProvider: string | null;
  readonly initialEnvironmentOpen: boolean;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: "file" | "diff" | null;
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorHistoryOpen: boolean;
  readonly initialEditorNewOpen: boolean;
  readonly initialEditorNewChatOpen: boolean;
  readonly initialEditorSearchOpen: boolean;
  readonly initialEditorProjectMenuOpen: boolean;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialSettingsTarget: string | null;
  readonly initialWorkspaceSettingsOpen: boolean;
  readonly initialWorkspaceVisible: boolean;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerPresentationMode: "dock" | "single-file";
  readonly initialExplorerActionMenuOpen: boolean;
  readonly initialExplorerCommentLine: number | null;
  readonly initialExplorerExpandedDirectories: readonly string[];
  readonly initialExplorerPath: string | null;
  readonly initialExplorerQuery: string;
  readonly initialExplorerWidth: number | null;
  readonly initialRoute: string;
}

export function parseSynaraDeepLinkInitData(raw: string): SynaraDeepLinkInitData | null {
  try {
    const url = new URL(raw);
    if (url.protocol !== "synara:") return null;
    let initialRoute = "/";
    if (url.hostname === "threads") initialRoute = "/";
    if (url.hostname === "settings") {
      const section = url.pathname.replace(/^\/+/, "").split("/")[0];
      const target = url.searchParams.get("target")?.trim();
      const search = target ? `?target=${encodeURIComponent(target)}` : "";
      initialRoute = section
        ? `/settings/${encodeURIComponent(decodeURIComponent(section))}${search}`
        : "/settings";
    } else if (url.hostname === "studio") initialRoute = "/studio";
    else if (url.hostname === "components-lab") {
      const story = url.searchParams.get("story")?.trim();
      const state = url.searchParams.get("state")?.trim();
      const variant = url.searchParams.get("variant")?.trim();
      const search = new URLSearchParams();
      if (story) search.set("story", story);
      if (state) search.set("state", state);
      if (variant) search.set("variant", variant);
      initialRoute = `/components-lab${search.size > 0 ? `?${search.toString()}` : ""}`;
    } else if (url.hostname === "update") initialRoute = "/update";
    else if (url.hostname === "pull-requests") initialRoute = "/pull-requests";
    else if (url.hostname === "plugins") initialRoute = "/plugins";
    else if (url.hostname === "automations") {
      const automationId = url.pathname.replace(/^\/+/, "").split("/")[0];
      initialRoute = automationId
        ? `/automations/${encodeURIComponent(decodeURIComponent(automationId))}`
        : "/automations";
    } else if (url.hostname === "kanban") {
      const projectId = url.pathname.replace(/^\/+/, "").split("/")[0];
      initialRoute = projectId
        ? `/kanban/${encodeURIComponent(decodeURIComponent(projectId))}`
        : "/kanban";
    } else if (url.hostname === "workspace") {
      const workspaceId = url.pathname.replace(/^\/+/, "").split("/")[0];
      initialRoute = workspaceId
        ? `/workspace/${encodeURIComponent(decodeURIComponent(workspaceId))}`
        : "/workspace";
    } else if (url.hostname === "new-thread") {
      const projectId = url.pathname.replace(/^\/+/, "").split("/")[0];
      if (!projectId) return null;
      initialRoute = `/new-thread/${encodeURIComponent(decodeURIComponent(projectId))}`;
    } else if (url.hostname === "thread") {
      const id = url.pathname.replace(/^\/+/, "").split("/")[0];
      if (!id) return null;
      initialRoute = `/thread/${encodeURIComponent(decodeURIComponent(id))}`;
    }
    const explorerCommentLineValue = Number(url.searchParams.get("explorerCommentLine"));
    const explorerWidthValue = Number(url.searchParams.get("explorerWidth"));
    return {
      initialDiffOpen:
        url.searchParams.get("diff") === "open" || url.searchParams.get("diff") === "1",
      initialDiffTurnId: url.searchParams.get("diffTurnId")?.trim() || null,
      initialDiffFilePath: url.searchParams.get("diffFilePath")?.trim() || null,
      initialDiffFileTreeOpen: url.searchParams.get("diffFileTree") === "open",
      initialComposerModelMenuOpen: url.searchParams.get("composerModelMenu") === "open",
      initialComposerModelSubmenuOpen: url.searchParams.get("composerModelSubmenu") === "open",
      initialComposerModelProvider: url.searchParams.get("composerModelProvider")?.trim() || null,
      initialEnvironmentOpen: url.searchParams.get("environment") === "open",
      initialEditorOpen: url.searchParams.get("editor") === "open",
      initialEditorCenterMode:
        url.searchParams.get("editorMode") === "diff"
          ? "diff"
          : url.searchParams.get("editorMode") === "file"
            ? "file"
            : null,
      initialEditorChatOpen:
        url.searchParams.get("editorChat") === "hidden"
          ? false
          : url.searchParams.get("editorChat") === "open"
            ? true
            : null,
      initialEditorHistoryOpen: url.searchParams.get("editorHistory") === "open",
      initialEditorNewOpen: url.searchParams.get("editorNew") === "open",
      initialEditorNewChatOpen: url.searchParams.get("editorNewChat") === "open",
      initialEditorSearchOpen: url.searchParams.get("editorSearch") === "open",
      initialEditorProjectMenuOpen: url.searchParams.get("editorProjectMenu") === "open",
      initialRenameOpen: url.searchParams.get("rename") === "open",
      initialTerminalOpen: url.searchParams.get("terminal") === "open",
      initialSettingsTarget: url.searchParams.get("target")?.trim() || null,
      initialWorkspaceSettingsOpen: url.searchParams.get("workspaceSettings") === "open",
      initialWorkspaceVisible: url.searchParams.get("workspaceVisible") === "open",
      initialExplorerOpen: url.searchParams.get("explorer") === "open",
      initialExplorerPresentationMode:
        url.searchParams.get("explorerMode") === "single-file" ? "single-file" : "dock",
      initialExplorerActionMenuOpen: url.searchParams.get("explorerActionMenu") === "open",
      initialExplorerCommentLine:
        Number.isInteger(explorerCommentLineValue) && explorerCommentLineValue > 0
          ? explorerCommentLineValue
          : null,
      initialExplorerExpandedDirectories: url.searchParams.getAll("explorerExpanded"),
      initialExplorerPath: url.searchParams.get("explorerPath"),
      initialExplorerQuery: url.searchParams.get("explorerQuery") ?? "",
      initialExplorerWidth:
        Number.isFinite(explorerWidthValue) && explorerWidthValue > 0 ? explorerWidthValue : null,
      initialRoute,
    };
  } catch {
    return null;
  }
}
