import {
  buildTerminalAttentionCopy,
  buildTerminalCompletionCopy,
  buildInputNeededCopy,
  buildTaskCompletionCopy,
} from "@synara-web/notifications/taskCompletion.logic";
import type { TerminalEvent } from "@synara/contracts";
import { defaultTerminalTitleForCliKind } from "@synara/shared/terminalThreads";

import type { ThreadSummary } from "./queries";

export interface LynxTaskCompletionToast {
  readonly body: string;
  readonly kind: "terminal" | "thread-attention" | "thread-completion";
  readonly threadId: string;
  readonly title: string;
  readonly tone: "success" | "warning";
}

export interface LynxTerminalActivityState {
  readonly agentState: "running" | "attention" | "review" | null;
  readonly cliKind: "codex" | "claude" | "antigravity" | null;
  readonly hasRunningSubprocess: boolean;
}

export function applyLynxTerminalActivityEvent(input: {
  readonly activeThreadId: string | null;
  readonly current: ReadonlyMap<string, LynxTerminalActivityState>;
  readonly event: TerminalEvent;
  readonly includeActiveThread?: boolean;
}): {
  readonly next: ReadonlyMap<string, LynxTerminalActivityState>;
  readonly toast: LynxTaskCompletionToast | null;
} {
  if (input.event.type !== "activity") {
    return { next: input.current, toast: null };
  }
  const key = `${input.event.threadId}\u001f${input.event.terminalId}`;
  const previous = input.current.get(key) ?? null;
  const state: LynxTerminalActivityState = {
    agentState: input.event.agentState,
    cliKind: input.event.cliKind,
    hasRunningSubprocess: input.event.hasRunningSubprocess,
  };
  const next = new Map(input.current);
  next.set(key, state);
  if (input.includeActiveThread !== true && input.event.threadId === input.activeThreadId) {
    return { next, toast: null };
  }
  const title = input.event.cliKind
    ? defaultTerminalTitleForCliKind(input.event.cliKind)
    : "Terminal";
  if (input.event.agentState === "attention" && previous?.agentState !== "attention") {
    return {
      next,
      toast: {
        ...buildTerminalAttentionCopy({
          cliKind: input.event.cliKind,
          terminalId: input.event.terminalId,
          threadId: input.event.threadId as never,
          title,
        }),
        threadId: input.event.threadId,
        kind: "terminal",
        tone: "warning",
      },
    };
  }
  if (input.event.agentState === "review" && previous?.agentState !== "review") {
    return {
      next,
      toast: {
        ...buildTerminalCompletionCopy({
          cliKind: input.event.cliKind,
          terminalId: input.event.terminalId,
          threadId: input.event.threadId as never,
          title,
        }),
        threadId: input.event.threadId,
        kind: "terminal",
        tone: "success",
      },
    };
  }
  return { next, toast: null };
}

export function detectLynxTaskCompletionToasts(input: {
  readonly activeThreadId: string | null;
  readonly current: readonly ThreadSummary[];
  readonly previous: readonly ThreadSummary[];
  readonly includeActiveThread?: boolean;
  readonly runtimeStartedAtMs?: number;
}): LynxTaskCompletionToast[] {
  const previousById = new Map(input.previous.map((thread) => [thread.id, thread] as const));
  const toasts: LynxTaskCompletionToast[] = [];

  for (const thread of input.current) {
    if (input.includeActiveThread !== true && thread.id === input.activeThreadId) {
      continue;
    }
    const previous = previousById.get(thread.id);
    if (!previous) continue;

    const approvalStarted = !previous.hasPendingApprovals && thread.hasPendingApprovals;
    const inputStarted = !previous.hasPendingUserInput && thread.hasPendingUserInput;
    if (approvalStarted || inputStarted) {
      const updatedAtMs = Date.parse(thread.updatedAt);
      if (
        input.runtimeStartedAtMs !== undefined &&
        Number.isFinite(updatedAtMs) &&
        updatedAtMs <= input.runtimeStartedAtMs
      ) {
        continue;
      }
      const copy = buildInputNeededCopy({
        kind: approvalStarted ? "approval" : "user-input",
        threadId: thread.id as never,
        projectId: thread.projectId as never,
        title: thread.title,
        requestId: `summary:${thread.updatedAt}`,
        createdAt: thread.updatedAt,
      });
      toasts.push({
        ...copy,
        threadId: thread.id,
        kind: "thread-attention",
        tone: "warning",
      });
      continue;
    }
    if (
      previous.live &&
      !thread.live &&
      thread.latestTurnState === "completed" &&
      thread.latestTurnCompletedAt &&
      (input.runtimeStartedAtMs === undefined ||
        !Number.isFinite(Date.parse(thread.latestTurnCompletedAt)) ||
        Date.parse(thread.latestTurnCompletedAt) > input.runtimeStartedAtMs)
    ) {
      const copy = buildTaskCompletionCopy({
        threadId: thread.id as never,
        projectId: thread.projectId as never,
        title: thread.title,
        completedAt: thread.latestTurnCompletedAt,
        assistantSummary: null,
      });
      toasts.push({
        ...copy,
        threadId: thread.id,
        kind: "thread-completion",
        tone: "success",
      });
    }
  }

  return toasts;
}

export async function resolveLynxTaskCompletionSummaries(input: {
  readonly loadAssistantSummary: (threadId: string) => Promise<string | null>;
  readonly toasts: readonly LynxTaskCompletionToast[];
}): Promise<LynxTaskCompletionToast[]> {
  return Promise.all(
    input.toasts.map(async (toast) => {
      if (toast.kind !== "thread-completion") {
        return toast;
      }
      const assistantSummary = await input.loadAssistantSummary(toast.threadId).catch(() => null);
      return assistantSummary ? { ...toast, body: assistantSummary } : toast;
    }),
  );
}
