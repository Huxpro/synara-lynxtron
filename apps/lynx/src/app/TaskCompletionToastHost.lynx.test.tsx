import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';

import type { ThreadSummary } from './queries';
import { TaskCompletionToastHost } from './TaskCompletionToastHost.lynx';

function summary(
  overrides: Partial<ThreadSummary> = {}
): ThreadSummary {
  return {
    id: 'thread-1',
    projectId: 'project-1',
    project: 'Synara',
    title: 'Background task',
    messageCount: 0,
    updatedAt: new Date(Date.now() + 1_000).toISOString(),
    live: false,
    hasPendingApprovals: false,
    hasPendingUserInput: false,
    ...overrides,
  };
}

describe('Lynx task completion toast host', () => {
  it('suppresses hydration and renders an off-screen completion transition', async () => {
    const onOpenThread = rs.fn();
    const { rerender } = render(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary({ live: true })]}
        onOpenThread={onOpenThread}
      />
    );
    expect(elementTree.root?.querySelector('.TaskCompletionToast')).toBeNull();

    rerender(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[
          summary({
            latestTurnCompletedAt: new Date(Date.now() + 1_000).toISOString(),
            latestTurnState: 'completed',
          }),
        ]}
        onOpenThread={onOpenThread}
      />
    );

    await waitFor(() => {
      expect(
        elementTree.root?.querySelector('.TaskCompletionToastTitle')
          ?.textContent
      ).toBe('Background task');
    });
    expect(
      elementTree.root?.querySelector('.TaskCompletionToastBody')?.textContent
    ).toBe('Finished working.');
    const buttons = elementTree.root?.querySelectorAll('.LxButton') ?? [];
    fireEvent.tap(buttons[0]!);
    expect(onOpenThread).toHaveBeenCalledWith('thread-1');
  });

  it('allows the notification to be dismissed', async () => {
    const { rerender } = render(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary()]}
        onOpenThread={() => {}}
      />
    );
    rerender(
      <TaskCompletionToastHost
        activeThreadId={null}
        threads={[summary({ hasPendingUserInput: true })]}
        onOpenThread={() => {}}
      />
    );
    await waitFor(() => {
      expect(
        elementTree.root?.querySelector('.TaskCompletionToast--warning')
      ).not.toBeNull();
    });
    const dismiss = elementTree.root?.querySelector(
      '[accessibility-label="Dismiss activity notification"]'
    );
    if (!dismiss) throw new Error('expected dismiss action');
    fireEvent.tap(dismiss);
    await waitFor(() => {
      expect(elementTree.root?.querySelector('.TaskCompletionToast')).toBeNull();
    });
  });
});
