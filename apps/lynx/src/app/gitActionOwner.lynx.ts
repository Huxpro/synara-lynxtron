// FILE: app/gitActionOwner.lynx.ts
// Purpose: Owns the git action running in a workspace (commit / push / PR /
//   pull) outside the environment panel, which mounts and unmounts freely.
//   A recoverable action outlives a lost connection and the panel that started
//   it; this record is what a reopened panel attaches to, so it stays disabled
//   and shows the same progress instead of offering a second commit or push.
// Layer: L3 orchestration (Lynx). The server action is never cancelled or
//   re-run from here: closing the panel only stops observing it.

import type { GitActionProgressEvent } from "@synara/contracts";
import { create } from "zustand";
import { ensureNativeApi } from "~/nativeApi";

export interface OutstandingGitAction {
  readonly actionId: string;
  readonly kind: "stacked" | "pull";
  /** Last progress line, as the panel shows it. */
  readonly progressLabel: string | null;
}

interface GitActionOwnerState {
  readonly byWorkspace: Readonly<Record<string, OutstandingGitAction>>;
}

export const useGitActionOwnerStore = create<GitActionOwnerState>(() => ({ byWorkspace: {} }));

export function readOutstandingGitAction(workspaceRoot: string): OutstandingGitAction | null {
  return useGitActionOwnerStore.getState().byWorkspace[workspaceRoot] ?? null;
}

/** The action running in this workspace, if any; survives the panel. */
export function useOutstandingGitAction(workspaceRoot: string): OutstandingGitAction | null {
  return useGitActionOwnerStore((state) => state.byWorkspace[workspaceRoot] ?? null);
}

function setOutstanding(workspaceRoot: string, action: OutstandingGitAction | null): void {
  useGitActionOwnerStore.setState((state) => {
    const { [workspaceRoot]: _previous, ...rest } = state.byWorkspace;
    return { byWorkspace: action ? { ...rest, [workspaceRoot]: action } : rest };
  });
}

export function gitActionProgressLabel(event: GitActionProgressEvent): string | null {
  if (event.kind === "phase_started") return event.label;
  if (event.kind === "hook_started") return `Running ${event.hookName}…`;
  if (event.kind === "hook_output") return event.text;
  if (event.kind === "action_failed") return event.message;
  return null;
}

/** Thrown when the workspace already has an action running. */
export class GitActionAlreadyRunningError extends Error {
  constructor(readonly outstanding: OutstandingGitAction) {
    super("A git action is already running in this workspace.");
    this.name = "GitActionAlreadyRunningError";
  }
}

/**
 * Runs one git action for a workspace. Claiming the workspace is synchronous,
 * so two callers cannot both start (the panel re-checks after its awaited
 * confirmation dialog by calling this). The progress listener belongs to the
 * owner and is released when the request settles, whatever the panel does.
 */
export async function runOwnedGitAction<Result>(input: {
  readonly workspaceRoot: string;
  readonly actionId: string;
  readonly kind: OutstandingGitAction["kind"];
  readonly initialProgressLabel: string | null;
  readonly run: () => Promise<Result>;
}): Promise<Result> {
  "background only";
  const outstanding = readOutstandingGitAction(input.workspaceRoot);
  if (outstanding) throw new GitActionAlreadyRunningError(outstanding);
  setOutstanding(input.workspaceRoot, {
    actionId: input.actionId,
    kind: input.kind,
    progressLabel: input.initialProgressLabel,
  });
  const stopProgress =
    input.kind === "stacked"
      ? ensureNativeApi().git.onActionProgress((event) => {
          if (event.actionId !== input.actionId) return;
          const label = gitActionProgressLabel(event);
          const current = readOutstandingGitAction(input.workspaceRoot);
          if (label === null || current?.actionId !== input.actionId) return;
          setOutstanding(input.workspaceRoot, { ...current, progressLabel: label });
        })
      : null;
  try {
    return await input.run();
  } finally {
    stopProgress?.();
    if (readOutstandingGitAction(input.workspaceRoot)?.actionId === input.actionId) {
      setOutstanding(input.workspaceRoot, null);
    }
  }
}
