import {
  buildInputNeededCopy,
  buildTaskCompletionCopy,
} from '@synara-web/notifications/taskCompletion.logic';

import type { ThreadSummary } from './queries';

export interface LynxTaskCompletionToast {
  readonly body: string;
  readonly threadId: string;
  readonly title: string;
  readonly tone: 'success' | 'warning';
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
