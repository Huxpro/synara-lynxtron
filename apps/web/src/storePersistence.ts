// FILE: storePersistence.ts
// Purpose: Persists project-only renderer preferences without depending on the Zustand facade.
// Exports: Persistence I/O plus read-only remembered project UI state.

import { normalizeWorkspaceRootForComparison } from "@synara/shared/threadWorkspace";

import type { AppState } from "./storeState";
import type { Project } from "./types";

import { webStorage } from "~/platform/storage";
import { isBrowser } from "~/platform/env";
const PERSISTED_STATE_KEY = "synara:renderer-state:v8";
const persistedExpandedProjectCwds = new Set<string>();
const persistedProjectOrderCwds: string[] = [];
const persistedProjectOrderByCwd = new Map<string, number>();
const persistedProjectNamesByCwd = new Map<string, string>();

export interface RememberedProjectUiState {
  expandedProjectCount: number;
  isProjectExpanded: (cwdKey: string) => boolean;
  projectOrderCount: number;
  projectOrderIndexForCwd: (cwdKey: string) => number | undefined;
  projectNameForCwd: (cwdKey: string) => string | undefined;
}

interface PersistedProjectUiStateDocument {
  expandedProjectCwds?: unknown;
  projectOrderCwds?: unknown;
  projectNamesByCwd?: unknown;
  [key: string]: unknown;
}

export interface PersistedProjectExpansionState {
  readonly expandedProjectCwds: readonly string[];
}

const rememberedProjectUiState: RememberedProjectUiState = {
  get expandedProjectCount() {
    return persistedExpandedProjectCwds.size;
  },
  isProjectExpanded: (cwdKey) => persistedExpandedProjectCwds.has(cwdKey),
  get projectOrderCount() {
    return persistedProjectOrderCwds.length;
  },
  projectOrderIndexForCwd: (cwdKey) => persistedProjectOrderByCwd.get(cwdKey),
  projectNameForCwd: (cwdKey) => persistedProjectNamesByCwd.get(cwdKey),
};

export function projectCwdKey(cwd: string): string {
  return normalizeWorkspaceRootForComparison(cwd);
}

export function getRememberedProjectUiState(): RememberedProjectUiState {
  return rememberedProjectUiState;
}

function readPersistedProjectUiStateDocument(): PersistedProjectUiStateDocument | null {
  if (!isBrowser()) return null;
  const raw = webStorage.getItem(PERSISTED_STATE_KEY);
  if (!raw) return null;
  const parsed = JSON.parse(raw) as unknown;
  return parsed !== null && typeof parsed === "object"
    ? (parsed as PersistedProjectUiStateDocument)
    : null;
}

/**
 * The renderer owns project disclosure by normalized workspace root rather
 * than by the server project id. Kept here so alternate renderers can consume
 * the exact same persisted authority without importing the Zustand facade.
 */
export function readPersistedProjectExpansionState(): PersistedProjectExpansionState {
  try {
    const parsed = readPersistedProjectUiStateDocument();
    const expandedProjectCwds = Array.isArray(parsed?.expandedProjectCwds)
      ? parsed.expandedProjectCwds
          .filter((cwd): cwd is string => typeof cwd === "string" && cwd.length > 0)
          .map(projectCwdKey)
      : [];
    return { expandedProjectCwds };
  } catch {
    return { expandedProjectCwds: [] };
  }
}

export function persistProjectExpansionState(
  projects: ReadonlyArray<{ readonly cwd: string; readonly expanded: boolean }>,
  additionalState: {
    readonly projectOrderCwds?: readonly string[];
    readonly projectNamesByCwd?: Readonly<Record<string, string>>;
  } = {},
): void {
  if (!isBrowser()) return;
  try {
    const current = readPersistedProjectUiStateDocument() ?? {};
    webStorage.setItem(
      PERSISTED_STATE_KEY,
      JSON.stringify({
        ...current,
        expandedProjectCwds: projects
          .filter((project) => project.expanded)
          .map((project) => project.cwd),
        ...(additionalState.projectOrderCwds
          ? { projectOrderCwds: additionalState.projectOrderCwds }
          : {}),
        ...(additionalState.projectNamesByCwd
          ? { projectNamesByCwd: additionalState.projectNamesByCwd }
          : {}),
      }),
    );
  } catch {
    // Ignore malformed/quota/storage errors to avoid breaking navigation.
  }
}

export function rememberProjectUiState(
  projects: ReadonlyArray<Pick<Project, "cwd" | "expanded">>,
): void {
  for (const project of projects) {
    const cwdKey = projectCwdKey(project.cwd);
    if (project.expanded) {
      persistedExpandedProjectCwds.add(cwdKey);
    } else {
      persistedExpandedProjectCwds.delete(cwdKey);
    }
    if (!persistedProjectOrderByCwd.has(cwdKey)) {
      persistedProjectOrderByCwd.set(cwdKey, persistedProjectOrderCwds.length);
      persistedProjectOrderCwds.push(cwdKey);
    }
  }
}

export function rememberProjectLocalNames(
  projects: ReadonlyArray<Pick<Project, "cwd" | "localName">>,
): void {
  for (const project of projects) {
    const cwdKey = projectCwdKey(project.cwd);
    const localName = project.localName?.trim() ?? "";
    if (localName.length > 0) {
      persistedProjectNamesByCwd.set(cwdKey, localName);
    } else {
      persistedProjectNamesByCwd.delete(cwdKey);
    }
  }
}

export function readPersistedState(initialState: AppState): AppState {
  if (!isBrowser()) return initialState;
  try {
    const parsed = readPersistedProjectUiStateDocument();
    if (!parsed) return initialState;
    persistedExpandedProjectCwds.clear();
    persistedProjectOrderCwds.length = 0;
    persistedProjectOrderByCwd.clear();
    persistedProjectNamesByCwd.clear();
    for (const cwd of Array.isArray(parsed.expandedProjectCwds)
      ? parsed.expandedProjectCwds
      : []) {
      if (typeof cwd === "string" && cwd.length > 0) {
        persistedExpandedProjectCwds.add(projectCwdKey(cwd));
      }
    }
    for (const cwd of Array.isArray(parsed.projectOrderCwds) ? parsed.projectOrderCwds : []) {
      const cwdKey = typeof cwd === "string" ? projectCwdKey(cwd) : "";
      if (cwdKey.length > 0 && !persistedProjectOrderByCwd.has(cwdKey)) {
        persistedProjectOrderByCwd.set(cwdKey, persistedProjectOrderCwds.length);
        persistedProjectOrderCwds.push(cwdKey);
      }
    }
    const projectNamesByCwd =
      parsed.projectNamesByCwd !== null && typeof parsed.projectNamesByCwd === "object"
        ? parsed.projectNamesByCwd
        : {};
    for (const [cwd, name] of Object.entries(projectNamesByCwd)) {
      if (typeof cwd !== "string" || cwd.length === 0 || typeof name !== "string") continue;
      const trimmedName = name.trim();
      if (trimmedName.length === 0) continue;
      persistedProjectNamesByCwd.set(projectCwdKey(cwd), trimmedName);
    }
    return { ...initialState };
  } catch {
    return initialState;
  }
}

export function persistState(state: AppState): void {
  if (!isBrowser()) return;
  try {
    rememberProjectUiState(state.projects);
    rememberProjectLocalNames(state.projects);
    persistProjectExpansionState(state.projects, {
      projectOrderCwds: state.projects.map((project) => project.cwd),
      projectNamesByCwd: Object.fromEntries(persistedProjectNamesByCwd),
    });
  } catch {
    // Ignore quota/storage errors to avoid breaking chat UX.
  }
}
