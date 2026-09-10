// FILE: editorViewState.ts
// Purpose: Persists per-thread editor workspace view state (expanded explorer
//          directories, center mode) so re-entering the editor view restores it.
// Layer: Web UI state persistence

import type { ProjectId, ProviderKind, ThreadId } from "@synara/contracts";
import { isProviderKind } from "./providerOrdering";

import { webStorage } from "~/platform/storage";
import { isBrowser } from "~/platform/env";
const EDITOR_VIEW_STATE_STORAGE_KEY = "synara.editor.viewStateByThreadId";
const EDITOR_RAIL_CHAT_TABS_STORAGE_KEY = "synara.editor.railChatTabsByProjectId";
const EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY = "synara.editor.chatPaneVisible";
const EDITOR_SIDEBAR_VISIBLE_STORAGE_KEY = "synara.editor.sidebarVisible";
export const EDITOR_CHAT_PANE_STORAGE_KEY = "synara.editor.chatPaneWidth";
export const EDITOR_CHAT_PANE_DEFAULT_WIDTH = 384;
export const EDITOR_CHAT_PANE_MIN_WIDTH = 320;
export const EDITOR_CHAT_PANE_MAX_WIDTH = 600;
const MAX_PERSISTED_THREADS = 50;
const MAX_EDITOR_RAIL_CHAT_TABS = 8;

export interface EditorViewStateSnapshot {
  expandedDirectories: ReadonlyArray<string>;
  centerMode: "file" | "diff";
}

interface PersistedEditorViewState extends EditorViewStateSnapshot {
  updatedAt: number;
}

type PersistedEditorViewStateMap = Record<string, PersistedEditorViewState>;

export interface EditorRailChatTabSnapshot {
  id: ThreadId;
  title: string;
  provider: ProviderKind;
}

type PersistedEditorRailChatTabsMap = Record<string, ReadonlyArray<EditorRailChatTabSnapshot>>;

function readPersistedMap(): PersistedEditorViewStateMap {
  if (!isBrowser()) {
    return {};
  }
  try {
    const raw = webStorage.getItem(EDITOR_VIEW_STATE_STORAGE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    return parsed as PersistedEditorViewStateMap;
  } catch {
    return {};
  }
}

export function readEditorViewState(threadId: string): EditorViewStateSnapshot | null {
  const entry = readPersistedMap()[threadId];
  if (!entry) {
    return null;
  }
  return {
    expandedDirectories: Array.isArray(entry.expandedDirectories)
      ? entry.expandedDirectories.filter((path): path is string => typeof path === "string")
      : [],
    centerMode: entry.centerMode === "file" ? "file" : "diff",
  };
}

export function storeEditorViewState(threadId: string, snapshot: EditorViewStateSnapshot): void {
  if (!isBrowser()) {
    return;
  }
  try {
    const map = readPersistedMap();
    map[threadId] = { ...snapshot, updatedAt: Date.now() };
    const entries = Object.entries(map);
    if (entries.length > MAX_PERSISTED_THREADS) {
      entries
        .toSorted((left, right) => (left[1]?.updatedAt ?? 0) - (right[1]?.updatedAt ?? 0))
        .slice(0, entries.length - MAX_PERSISTED_THREADS)
        .forEach(([staleThreadId]) => {
          delete map[staleThreadId];
        });
    }
    webStorage.setItem(EDITOR_VIEW_STATE_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Best-effort preference persistence only.
  }
}

export function readEditorChatPaneVisible(): boolean {
  if (!isBrowser()) {
    return true;
  }
  try {
    return webStorage.getItem(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function storeEditorChatPaneVisible(visible: boolean): void {
  if (!isBrowser()) {
    return;
  }
  try {
    webStorage.setItem(EDITOR_CHAT_PANE_VISIBLE_STORAGE_KEY, String(visible));
  } catch {
    // Best-effort preference persistence only.
  }
}

export function readEditorSidebarVisible(): boolean {
  if (!isBrowser()) return true;
  try {
    return webStorage.getItem(EDITOR_SIDEBAR_VISIBLE_STORAGE_KEY) !== "false";
  } catch {
    return true;
  }
}

export function storeEditorSidebarVisible(visible: boolean): void {
  if (!isBrowser()) return;
  try {
    webStorage.setItem(EDITOR_SIDEBAR_VISIBLE_STORAGE_KEY, String(visible));
  } catch {
    // Best-effort preference persistence only.
  }
}

export function clampEditorChatPaneWidth(width: number): number {
  return Math.min(
    EDITOR_CHAT_PANE_MAX_WIDTH,
    Math.max(EDITOR_CHAT_PANE_MIN_WIDTH, Math.round(width)),
  );
}

export function readEditorChatPaneWidth(): number {
  if (!isBrowser()) {
    return EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  }
  try {
    const rawValue = webStorage.getItem(EDITOR_CHAT_PANE_STORAGE_KEY);
    const parsed = rawValue === null ? Number.NaN : Number.parseFloat(rawValue);
    return Number.isFinite(parsed)
      ? clampEditorChatPaneWidth(parsed)
      : EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  } catch {
    return EDITOR_CHAT_PANE_DEFAULT_WIDTH;
  }
}

export function storeEditorChatPaneWidth(width: number): void {
  if (!isBrowser()) {
    return;
  }
  try {
    webStorage.setItem(
      EDITOR_CHAT_PANE_STORAGE_KEY,
      String(clampEditorChatPaneWidth(width)),
    );
  } catch {
    // Best-effort preference persistence only.
  }
}

function normalizeEditorRailChatTabs(
  tabs: ReadonlyArray<EditorRailChatTabSnapshot>,
): ReadonlyArray<EditorRailChatTabSnapshot> {
  const seen = new Set<ThreadId>();
  const normalized: EditorRailChatTabSnapshot[] = [];
  for (const tab of tabs) {
    if (seen.has(tab.id)) {
      continue;
    }
    seen.add(tab.id);
    normalized.push({
      id: tab.id,
      title: tab.title.trim() || "New thread",
      provider: tab.provider,
    });
    if (normalized.length >= MAX_EDITOR_RAIL_CHAT_TABS) {
      break;
    }
  }
  return normalized;
}

function readEditorRailChatTabsMap(): PersistedEditorRailChatTabsMap {
  if (!isBrowser()) {
    return {};
  }
  try {
    const raw = webStorage.getItem(EDITOR_RAIL_CHAT_TABS_STORAGE_KEY);
    const parsed: unknown = raw === null ? null : JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
      return {};
    }
    const map: PersistedEditorRailChatTabsMap = {};
    for (const [projectId, rawTabs] of Object.entries(parsed)) {
      if (!Array.isArray(rawTabs)) {
        continue;
      }
      map[projectId] = normalizeEditorRailChatTabs(
        rawTabs.flatMap((rawTab): EditorRailChatTabSnapshot[] => {
          if (typeof rawTab !== "object" || rawTab === null || Array.isArray(rawTab)) {
            return [];
          }
          const candidate = rawTab as Record<string, unknown>;
          if (
            typeof candidate.id !== "string" ||
            typeof candidate.title !== "string" ||
            typeof candidate.provider !== "string" ||
            !isProviderKind(candidate.provider)
          ) {
            return [];
          }
          return [
            {
              id: candidate.id as ThreadId,
              title: candidate.title,
              provider: candidate.provider,
            },
          ];
        }),
      );
    }
    return map;
  } catch {
    return {};
  }
}

export function readEditorRailChatTabs(
  projectId: ProjectId,
): ReadonlyArray<EditorRailChatTabSnapshot> {
  return readEditorRailChatTabsMap()[projectId] ?? [];
}

export function storeEditorRailChatTabs(
  projectId: ProjectId,
  tabs: ReadonlyArray<EditorRailChatTabSnapshot>,
): void {
  if (!isBrowser()) {
    return;
  }
  try {
    const map = readEditorRailChatTabsMap();
    const normalizedTabs = normalizeEditorRailChatTabs(tabs);
    if (normalizedTabs.length === 0) {
      delete map[projectId];
    } else {
      map[projectId] = normalizedTabs;
    }
    webStorage.setItem(EDITOR_RAIL_CHAT_TABS_STORAGE_KEY, JSON.stringify(map));
  } catch {
    // Best-effort preference persistence only.
  }
}
