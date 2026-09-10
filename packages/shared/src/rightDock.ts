/** Minimum readable width shared by Web and Lynx right-dock surfaces. */
export const RIGHT_DOCK_MIN_WIDTH_PX = 26 * 16;
export const RIGHT_DOCK_STORAGE_KEY = 'synara:right-dock-state:v1';

import type { ProjectId, ThreadId, TurnId } from '@synara/contracts';

export const RIGHT_DOCK_PANE_KINDS = [
  'browser',
  'diff',
  'explorer',
  'file',
  'terminal',
  'sidechat',
  'git',
  'pullRequest',
] as const;

export type RightDockPaneKind = (typeof RIGHT_DOCK_PANE_KINDS)[number];
export type PullRequestInitialTab = 'summary' | 'timeline' | 'code';

export interface RightDockPane {
  id: string;
  kind: RightDockPaneKind;
  threadId: ThreadId | null;
  diffTurnId: TurnId | null;
  diffFilePath: string | null;
  filePath: string | null;
  pullRequestProjectId: ProjectId | null;
  pullRequestRepository: string | null;
  pullRequestNumber: number | null;
  pullRequestInitialTab: PullRequestInitialTab | null;
}

export interface RightDockThreadState {
  open: boolean;
  panes: RightDockPane[];
  activePaneId: string | null;
}

export interface OpenPaneInput {
  paneId: string;
  kind: RightDockPaneKind;
  threadId?: ThreadId | null;
  diffTurnId?: TurnId | null;
  diffFilePath?: string | null;
  filePath?: string | null;
  pullRequestProjectId?: ProjectId | null;
  pullRequestRepository?: string | null;
  pullRequestNumber?: number | null;
  pullRequestInitialTab?: PullRequestInitialTab | null;
}

const RIGHT_DOCK_PANE_KIND_SET: ReadonlySet<string> = new Set(
  RIGHT_DOCK_PANE_KINDS
);
const MULTI_INSTANCE_PANE_KINDS: ReadonlySet<RightDockPaneKind> = new Set([
  'sidechat',
  'file',
]);
export const SINGLETON_PANE_KINDS: ReadonlySet<RightDockPaneKind> = new Set(
  RIGHT_DOCK_PANE_KINDS.filter(
    (kind) => !MULTI_INSTANCE_PANE_KINDS.has(kind)
  )
);

export function isSingletonPaneKind(kind: RightDockPaneKind): boolean {
  return SINGLETON_PANE_KINDS.has(kind);
}

export function createDefaultRightDockState(): RightDockThreadState {
  return { open: false, panes: [], activePaneId: null };
}

export function isRightDockPaneKind(
  value: unknown
): value is RightDockPaneKind {
  return typeof value === 'string' && RIGHT_DOCK_PANE_KIND_SET.has(value);
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function sanitizePane(value: unknown): RightDockPane | null {
  if (!isRecord(value) || typeof value.id !== 'string' || !isRightDockPaneKind(value.kind)) {
    return null;
  }
  return {
    id: value.id,
    kind: value.kind,
    threadId: typeof value.threadId === 'string' ? (value.threadId as ThreadId) : null,
    diffTurnId: typeof value.diffTurnId === 'string' ? (value.diffTurnId as TurnId) : null,
    diffFilePath: typeof value.diffFilePath === 'string' ? value.diffFilePath : null,
    filePath: typeof value.filePath === 'string' ? value.filePath : null,
    pullRequestProjectId:
      typeof value.pullRequestProjectId === 'string'
        ? (value.pullRequestProjectId as ProjectId)
        : null,
    pullRequestRepository:
      typeof value.pullRequestRepository === 'string'
        ? value.pullRequestRepository
        : null,
    pullRequestNumber:
      typeof value.pullRequestNumber === 'number' &&
      Number.isInteger(value.pullRequestNumber) &&
      value.pullRequestNumber > 0
        ? value.pullRequestNumber
        : null,
    pullRequestInitialTab:
      value.pullRequestInitialTab === 'summary' ||
      value.pullRequestInitialTab === 'timeline' ||
      value.pullRequestInitialTab === 'code'
        ? value.pullRequestInitialTab
        : null,
  };
}

export function sanitizeRightDockThreadState(
  value: unknown
): RightDockThreadState {
  if (!isRecord(value)) return createDefaultRightDockState();
  const panes = Array.isArray(value.panes)
    ? value.panes.map(sanitizePane).filter((pane): pane is RightDockPane => pane !== null)
    : [];
  const activePaneId =
    typeof value.activePaneId === 'string' &&
    panes.some((pane) => pane.id === value.activePaneId)
      ? value.activePaneId
      : (panes[0]?.id ?? null);
  return { open: panes.length > 0 && value.open === true, panes, activePaneId };
}

export function sanitizeRightDockStateByThreadId(
  value: unknown
): Record<string, RightDockThreadState> {
  if (!isRecord(value)) return {};
  const result: Record<string, RightDockThreadState> = {};
  for (const [key, entry] of Object.entries(value)) {
    if (key === '__proto__' || key === 'constructor' || key === 'prototype' || entry === undefined) continue;
    result[key] = sanitizeRightDockThreadState(entry);
  }
  return result;
}

function createPane(input: OpenPaneInput): RightDockPane {
  return {
    id: input.paneId,
    kind: input.kind,
    threadId: input.threadId ?? null,
    diffTurnId: input.diffTurnId ?? null,
    diffFilePath: input.diffFilePath ?? null,
    filePath: input.filePath ?? null,
    pullRequestProjectId: input.pullRequestProjectId ?? null,
    pullRequestRepository: input.pullRequestRepository ?? null,
    pullRequestNumber: input.pullRequestNumber ?? null,
    pullRequestInitialTab: input.pullRequestInitialTab ?? null,
  };
}

function findExistingPane(
  state: RightDockThreadState,
  input: OpenPaneInput
): RightDockPane | undefined {
  if (isSingletonPaneKind(input.kind)) {
    return state.panes.find((pane) => pane.kind === input.kind);
  }
  if (input.kind === 'sidechat' && input.threadId) {
    return state.panes.find(
      (pane) => pane.kind === 'sidechat' && pane.threadId === input.threadId
    );
  }
  if (input.kind === 'file') {
    const filePath = input.filePath ?? null;
    return state.panes.find(
      (pane) => pane.kind === 'file' && pane.filePath === filePath
    );
  }
  return undefined;
}

function reopenPatch(input: OpenPaneInput): Partial<RightDockPane> | null {
  if (input.kind === 'diff' && (input.diffTurnId !== undefined || input.diffFilePath !== undefined)) {
    return { diffTurnId: input.diffTurnId ?? null, diffFilePath: input.diffFilePath ?? null };
  }
  if (
    input.kind === 'pullRequest' &&
    (input.pullRequestProjectId !== undefined ||
      input.pullRequestRepository !== undefined ||
      input.pullRequestNumber !== undefined ||
      input.pullRequestInitialTab !== undefined)
  ) {
    return {
      pullRequestProjectId: input.pullRequestProjectId ?? null,
      pullRequestRepository: input.pullRequestRepository ?? null,
      pullRequestNumber: input.pullRequestNumber ?? null,
      pullRequestInitialTab: input.pullRequestInitialTab ?? null,
    };
  }
  return null;
}

export function openPaneInState(
  state: RightDockThreadState,
  input: OpenPaneInput
): RightDockThreadState {
  const existing = findExistingPane(state, input);
  if (existing) {
    const patch = reopenPatch(input);
    return {
      open: true,
      panes: patch
        ? state.panes.map((pane) =>
            pane.id === existing.id ? { ...pane, ...patch } : pane
          )
        : state.panes,
      activePaneId: existing.id,
    };
  }
  const pane = createPane(input);
  return { open: true, panes: [...state.panes, pane], activePaneId: pane.id };
}

export function closePaneInState(
  state: RightDockThreadState,
  paneId: string
): RightDockThreadState {
  const index = state.panes.findIndex((pane) => pane.id === paneId);
  if (index < 0) return state;
  const panes = state.panes.filter((pane) => pane.id !== paneId);
  const activePaneId =
    state.activePaneId === paneId
      ? (panes[Math.min(index, panes.length - 1)]?.id ?? null)
      : state.activePaneId;
  return { open: panes.length > 0 && state.open, panes, activePaneId };
}

export function setActivePaneInState(
  state: RightDockThreadState,
  paneId: string
): RightDockThreadState {
  return state.panes.some((pane) => pane.id === paneId)
    ? { ...state, open: true, activePaneId: paneId }
    : state;
}

export function setDockOpenInState(
  state: RightDockThreadState,
  open: boolean
): RightDockThreadState {
  if ((open && state.panes.length === 0) || state.open === open) return state;
  return { ...state, open };
}

export function updatePaneInState(
  state: RightDockThreadState,
  paneId: string,
  patch: Partial<Omit<RightDockPane, 'id' | 'kind'>>
): RightDockThreadState {
  let changed = false;
  const panes = state.panes.map((pane) => {
    if (pane.id !== paneId) return pane;
    const next = { ...pane, ...patch };
    if (
      next.diffTurnId !== pane.diffTurnId ||
      next.diffFilePath !== pane.diffFilePath ||
      next.filePath !== pane.filePath ||
      next.threadId !== pane.threadId ||
      next.pullRequestProjectId !== pane.pullRequestProjectId ||
      next.pullRequestRepository !== pane.pullRequestRepository ||
      next.pullRequestNumber !== pane.pullRequestNumber ||
      next.pullRequestInitialTab !== pane.pullRequestInitialTab
    ) {
      changed = true;
      return next;
    }
    return pane;
  });
  return changed ? { ...state, panes } : state;
}

export function toggleSingletonPaneInState(
  state: RightDockThreadState,
  input: OpenPaneInput
): RightDockThreadState {
  const existing = state.panes.find((pane) => pane.kind === input.kind);
  return existing && state.open && state.activePaneId === existing.id
    ? { ...state, open: false }
    : openPaneInState(state, input);
}

export function resolveActivePane(
  state: RightDockThreadState
): RightDockPane | null {
  if (!state.open || state.activePaneId === null) return null;
  return state.panes.find((pane) => pane.id === state.activePaneId) ?? null;
}
