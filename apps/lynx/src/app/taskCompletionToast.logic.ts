import {
  buildTerminalAttentionCopy,
  buildTerminalCompletionCopy,
  buildInputNeededCopy,
  buildTaskCompletionCopy,
} from '@synara-web/notifications/taskCompletion.logic';
import type { TerminalEvent } from '@synara/contracts';
import { defaultTerminalTitleForCliKind } from '@synara/shared/terminalThreads';

import type { ThreadSummary } from './queries';

export interface LynxTaskCompletionToast {
  readonly body: string;
  readonly threadId: string;
  readonly title: string;
  readonly tone: 'success' | 'warning';
}

export interface LynxTerminalActivityState {
  readonly agentState: 'running' | 'attention' | 'review' | null;
  readonly cliKind: 'codex' | 'claude' | 'antigravity' | null;
  readonly hasRunningSubprocess: boolean;
}

export function applyLynxTerminalActivityEvent(input: {
  readonly activeThreadId: string | null;
  readonly current: ReadonlyMap<string, LynxTerminalActivityState>;
  readonly event: TerminalEvent;
}): {
  readonly next: ReadonlyMap<string, LynxTerminalActivityState>;
  readonly toast: LynxTaskCompletionToast | null;
} {
  if (input.event.type !== 'activity') {
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
  if (input.event.threadId === input.activeThreadId) {
    return { next, toast: null };
  }
  const title = input.event.cliKind
    ? defaultTerminalTitleForCliKind(input.event.cliKind)
    : 'Terminal';
  if (
    input.event.agentState === 'attention' &&
    previous?.agentState !== 'attention'
  ) {
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
        tone: 'warning',
      },
    };
  }
  if (
    input.event.agentState === 'review' &&
    previous?.agentState !== 'review'
  ) {
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
        tone: 'success',
      },
    };
  }
  return { next, toast: null };
}

export function detectLynxTaskCompletionToasts(input: {
  readonly activeThreadId: string | null;
  readonly current: readonly ThreadSummary[];
  readonly previous: readonly ThreadSummary[];
}): LynxTaskCompletionToast[] {
  const previousById = new Map(
    input.previous.map((thread) => [thread.id, thread] as const)
  );
  const toasts: LynxTaskCompletionToast[] = [];

  for (const thread of input.current) {
    if (thread.id === input.activeThreadId) continue;
    const previous = previousById.get(thread.id);
    if (!previous) continue;

    const approvalStarted =
      !previous.hasPendingApprovals && thread.hasPendingApprovals;
    const inputStarted =
      !previous.hasPendingUserInput && thread.hasPendingUserInput;
    if (approvalStarted || inputStarted) {
      const copy = buildInputNeededCopy({
        kind: approvalStarted ? 'approval' : 'user-input',
        threadId: thread.id as never,
        projectId: thread.projectId as never,
        title: thread.title,
        requestId: `summary:${thread.updatedAt}`,
        createdAt: thread.updatedAt,
      });
      toasts.push({
        ...copy,
        threadId: thread.id,
        tone: 'warning',
      });
      continue;
    }
    if (
      previous.live &&
      !thread.live &&
      thread.latestTurnState === 'completed' &&
      thread.latestTurnCompletedAt
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
        tone: 'success',
      });
    }
  }

  return toasts;
}
