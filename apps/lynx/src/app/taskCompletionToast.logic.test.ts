import { describe, expect, it } from '@rstest/core';

import type { ThreadSummary } from './queries';
import { detectLynxTaskCompletionToasts } from './taskCompletionToast.logic';

function summary(
  overrides: Partial<ThreadSummary> = {}
): ThreadSummary {
  return {
    id: 'thread-1',
    projectId: 'project-1',
    project: 'Synara',
    title: 'Background task',
    messageCount: 0,
    updatedAt: '2026-08-18T00:00:00.000Z',
    live: false,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    ...overrides,
  };
}

describe('Lynx task completion toast detection', () => {
  it('notifies when an off-screen live thread settles', () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: '2026-08-18T00:00:00.000Z',
            latestTurnState: 'completed',
          }),
        ],
      })
    ).toEqual([
      {
        title: 'Background task',
        body: 'Finished working.',
        threadId: 'thread-1',
        tone: 'success',
      },
    ]);
  });

  it('notifies when an off-screen thread starts needing input', () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary()],
        current: [summary({ hasPendingUserInput: true })],
      })
    ).toEqual([
      {
        title: 'Input needed',
        body: 'Background task: User input requested.',
        threadId: 'thread-1',
        tone: 'warning',
      },
    ]);
  });

  it('does not misclassify input-needed transitions as completion', () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [
          summary({
            hasPendingApprovals: true,
            latestTurnState: 'running',
          }),
        ],
      })
    ).toEqual([
      {
        title: 'Input needed',
        body: 'Background task: Command approval requested.',
        threadId: 'thread-1',
        tone: 'warning',
      },
    ]);
  });

  it('does not notify when live work stops without a completed turn', () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [summary({ live: true })],
        current: [summary({ latestTurnState: 'error' })],
      })
    ).toEqual([]);
  });

  it('suppresses visible threads and initial hydration', () => {
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: 'thread-1',
        previous: [summary({ live: true })],
        current: [
          summary({
            latestTurnCompletedAt: '2026-08-18T00:00:00.000Z',
            latestTurnState: 'completed',
          }),
        ],
      })
    ).toEqual([]);
    expect(
      detectLynxTaskCompletionToasts({
        activeThreadId: null,
        previous: [],
        current: [summary()],
      })
    ).toEqual([]);
  });
});
