import fs from 'node:fs';
import path from 'node:path';
import type { KeybindingCommand } from '@synara/contracts';

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

export function parseViewportProbeSequence(
  value: string | undefined
): readonly ViewportProbeSize[] {
  if (!value) return [];
  return value
    .split(',')
    .map((entry) => {
      const match = entry.trim().match(/^(\d+)x(\d+)$/);
      if (!match) return null;
      return {
        width: Math.max(900, Number(match[1])),
        height: Math.max(650, Number(match[2])),
      };
    })
    .filter((entry): entry is ViewportProbeSize => entry !== null);
}

export interface ShellRouteDeliveryState {
  readonly rendererReady: boolean;
  readonly pendingRoute: string | null;
}

export type ShellRouteDeliveryEvent =
  | { readonly type: 'route-requested'; readonly route: string }
  | { readonly type: 'renderer-ready' }
  | { readonly type: 'renderer-reset' };

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
  event: ShellRouteDeliveryEvent
): ShellRouteDeliveryResult {
  if (event.type === 'renderer-reset') {
    return {
      state: { rendererReady: false, pendingRoute: state.pendingRoute },
      routeToDispatch: null,
    };
  }
  if (event.type === 'renderer-ready') {
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
  windowState: 'native',
  menu: 'native',
  protocol: 'native',
  logging: 'node-file',
  migration: 'node-file',
  globalShortcut: 'menu-accelerator',
  autoUpdater: 'external-download',
  sessionPermissions: 'not-available',
} as const;

const NATIVE_RENDERER_COMMANDS = new Set<KeybindingCommand>([
  'chat.new',
  'sidebar.toggle',
  'sidebar.search',
  'chat.visible.previous',
  'chat.visible.next',
  'composer.focus.toggle',
]);

export function resolveNativeRendererCommand(
  command: KeybindingCommand
): KeybindingCommand | null {
  return NATIVE_RENDERER_COMMANDS.has(command) ? command : null;
}

export interface ShellGlobalEventTarget {
  sendGlobalEvent(event: string, ...args: unknown[]): unknown;
}

export interface SearchNavigationAccelerator {
  readonly accelerator: 'Up' | 'Down' | 'Tab' | 'Shift+Tab' | 'Esc';
  readonly key: 'ArrowUp' | 'ArrowDown' | 'Tab' | 'Escape';
  readonly shiftKey?: boolean;
}

export const SEARCH_NAVIGATION_ACCELERATORS: readonly SearchNavigationAccelerator[] = [
  { accelerator: 'Up', key: 'ArrowUp' },
  { accelerator: 'Down', key: 'ArrowDown' },
  { accelerator: 'Tab', key: 'Tab' },
  { accelerator: 'Shift+Tab', key: 'Tab', shiftKey: true },
  { accelerator: 'Esc', key: 'Escape' },
];

export interface SearchNavigationMenuItem {
  readonly label: string;
  readonly accelerator: SearchNavigationAccelerator['accelerator'];
  readonly visible: false;
  readonly acceleratorWorksWhenHidden: true;
  readonly registerAccelerator: true;
  readonly click: () => void;
}

export function buildSearchNavigationMenuItems(
  enabled: boolean,
  dispatch: (event: {
    readonly key: SearchNavigationAccelerator['key'];
    readonly shiftKey?: true;
  }) => void
): readonly SearchNavigationMenuItem[] {
  if (!enabled) return [];
  return SEARCH_NAVIGATION_ACCELERATORS.map((navigation) => ({
    label: `Search: ${navigation.key}${navigation.shiftKey ? ' (reverse)' : ''}`,
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

export function resolveShellWindowPresentation(
  backgroundLaunch: boolean
): ShellWindowPresentation {
  return {
    showOnCreate: !backgroundLaunch,
    showAfterSetup: !backgroundLaunch,
    showInactiveAfterSetup: backgroundLaunch,
  };
}

export function shouldAcquireShellSingleInstanceLock(
  allowParallelInstance: string | undefined
): boolean {
  return allowParallelInstance !== '1';
}

export function resolveShellPaths(userDataDir: string): ShellPaths {
  const stateDir = path.join(userDataDir, 'synara-lynx-slice');
  return {
    stateDir,
    windowState: path.join(stateDir, 'window-state.json'),
    logFile: path.join(stateDir, 'logs', 'desktop-main.log'),
    kvFile: path.join(stateDir, 'kv.json'),
  };
}

/**
 * Lynxtron 0.0.7 forwards `--user-data-dir` in argv but does not apply it to
 * `app.getPath('userData')`. This explicit host override is the supported
 * state-isolation hook for owned verification instances.
 */
export function resolveShellUserDataDir(
  defaultUserDataDir: string,
  override: string | undefined
): string {
  const candidate = override?.trim();
  if (!candidate) return defaultUserDataDir;
  if (!path.isAbsolute(candidate)) {
    throw new Error('SYNARA_LYNX_USER_DATA_DIR must be an absolute path.');
  }
  return path.resolve(candidate);
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
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
      typeof value.maximized !== 'boolean' ||
      typeof value.fullscreen !== 'boolean'
    ) {
      return null;
    }
    return value as ShellWindowState;
  } catch {
    return null;
  }
}

export function resolveRestoredBounds(
  saved: ShellRectangle | null,
  workArea: ShellRectangle
): ShellRectangle {
  const width = Math.min(Math.max(saved?.width ?? 1280, 900), workArea.width);
  const height = Math.min(Math.max(saved?.height ?? 820, 650), workArea.height);
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
    return parseWindowState(fs.readFileSync(filePath, 'utf8'));
  } catch {
    return null;
  }
}

export function writeJsonAtomic(filePath: string, value: unknown): void {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  const temporary = `${filePath}.tmp`;
  fs.writeFileSync(temporary, JSON.stringify(value), 'utf8');
  fs.renameSync(temporary, filePath);
}

export function migrateLegacyShellFiles(userDataDir: string, paths: ShellPaths): string[] {
  const migrations = [
    { from: path.join(userDataDir, 'kv.json'), to: paths.kvFile },
    {
      from: path.join(userDataDir, 'desktop-window-state.json'),
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

export function appendShellLog(
  filePath: string,
  message: string,
  maxBytes = 1024 * 1024
): void {
  try {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    if (fs.existsSync(filePath) && fs.statSync(filePath).size >= maxBytes) {
      const previous = `${filePath}.1`;
      if (fs.existsSync(previous)) fs.unlinkSync(previous);
      fs.renameSync(filePath, previous);
    }
    fs.appendFileSync(filePath, `[${new Date().toISOString()}] ${message}\n`, 'utf8');
  } catch {
    // Logging must never prevent shell startup.
  }
}

export function parseSynaraDeepLink(raw: string): string | null {
  return parseSynaraDeepLinkInitData(raw)?.initialRoute ?? null;
}

export interface SynaraDeepLinkInitData {
  readonly initialEnvironmentOpen: boolean;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: 'file' | 'diff';
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorHistoryOpen: boolean;
  readonly initialEditorNewOpen: boolean;
  readonly initialEditorNewChatOpen: boolean;
  readonly initialEditorSearchOpen: boolean;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialWorkspaceSettingsOpen: boolean;
  readonly initialWorkspaceVisible: boolean;
  readonly initialExplorerOpen: boolean;
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
    if (url.protocol !== 'synara:') return null;
    let initialRoute = '/';
    if (url.hostname === 'threads') initialRoute = '/';
    if (url.hostname === 'settings') {
      const section = url.pathname.replace(/^\/+/, '').split('/')[0];
      initialRoute = section
        ? `/settings/${encodeURIComponent(decodeURIComponent(section))}`
        : '/settings';
    } else if (url.hostname === 'studio') initialRoute = '/studio';
    else if (url.hostname === 'update') initialRoute = '/update';
    else if (url.hostname === 'pull-requests') initialRoute = '/pull-requests';
    else if (url.hostname === 'plugins') initialRoute = '/plugins';
    else if (url.hostname === 'automations') {
      const automationId = url.pathname.replace(/^\/+/, '').split('/')[0];
      initialRoute = automationId
        ? `/automations/${encodeURIComponent(
            decodeURIComponent(automationId)
          )}`
        : '/automations';
    }
    else if (url.hostname === 'kanban') {
      const projectId = url.pathname.replace(/^\/+/, '').split('/')[0];
      initialRoute = projectId
        ? `/kanban/${encodeURIComponent(decodeURIComponent(projectId))}`
        : '/kanban';
    } else if (url.hostname === 'workspace') {
      const workspaceId = url.pathname.replace(/^\/+/, '').split('/')[0];
      initialRoute = workspaceId
        ? `/workspace/${encodeURIComponent(decodeURIComponent(workspaceId))}`
        : '/workspace';
    } else if (url.hostname === 'new-thread') {
      const projectId = url.pathname.replace(/^\/+/, '').split('/')[0];
      if (!projectId) return null;
      initialRoute = `/new-thread/${encodeURIComponent(
        decodeURIComponent(projectId)
      )}`;
    } else if (url.hostname === 'thread') {
      const id = url.pathname.replace(/^\/+/, '').split('/')[0];
      if (!id) return null;
      initialRoute = `/thread/${encodeURIComponent(decodeURIComponent(id))}`;
    }
    const explorerCommentLineValue = Number(url.searchParams.get('explorerCommentLine'));
    const explorerWidthValue = Number(url.searchParams.get('explorerWidth'));
    return {
      initialEnvironmentOpen: url.searchParams.get('environment') === 'open',
      initialEditorOpen: url.searchParams.get('editor') === 'open',
      initialEditorCenterMode:
        url.searchParams.get('editorMode') === 'diff' ? 'diff' : 'file',
      initialEditorChatOpen:
        url.searchParams.get('editorChat') === 'hidden'
          ? false
          : url.searchParams.get('editorChat') === 'open'
            ? true
            : null,
      initialEditorHistoryOpen:
        url.searchParams.get('editorHistory') === 'open',
      initialEditorNewOpen:
        url.searchParams.get('editorNew') === 'open',
      initialEditorNewChatOpen:
        url.searchParams.get('editorNewChat') === 'open',
      initialEditorSearchOpen:
        url.searchParams.get('editorSearch') === 'open',
      initialRenameOpen: url.searchParams.get('rename') === 'open',
      initialTerminalOpen: url.searchParams.get('terminal') === 'open',
      initialWorkspaceSettingsOpen:
        url.searchParams.get('workspaceSettings') === 'open',
      initialWorkspaceVisible:
        url.searchParams.get('workspaceVisible') === 'open',
      initialExplorerOpen: url.searchParams.get('explorer') === 'open',
      initialExplorerCommentLine:
        Number.isInteger(explorerCommentLineValue) && explorerCommentLineValue > 0
          ? explorerCommentLineValue
          : null,
      initialExplorerExpandedDirectories: url.searchParams.getAll('explorerExpanded'),
      initialExplorerPath: url.searchParams.get('explorerPath'),
      initialExplorerQuery: url.searchParams.get('explorerQuery') ?? '',
      initialExplorerWidth:
        Number.isFinite(explorerWidthValue) && explorerWidthValue > 0
          ? explorerWidthValue
          : null,
      initialRoute,
    };
  } catch {
    return null;
  }
}
