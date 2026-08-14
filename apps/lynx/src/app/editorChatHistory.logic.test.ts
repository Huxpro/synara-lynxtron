import { describe, expect, it } from '@rstest/core';

import {
  EDITOR_CHAT_HISTORY_LIMIT,
  resolveEditorChatHistoryThreads,
} from './editorChatHistory.logic';
import type { ThreadSummary } from './queries';

function thread(
  id: string,
  projectId: string,
  createdAt: string,
  updatedAt = createdAt
): ThreadSummary {
  return {
    id,
    projectId,
    project: projectId,
    title: id,
    messageCount: 0,
    createdAt,
    updatedAt,
    live: false,
  };
}

describe('Editor chat history projection', () => {
  it('keeps only the active project and follows the sidebar sort order', () => {
    const threads = [
      thread('older', 'project-a', '2026-08-12T00:00:00.000Z'),
      thread('other-project', 'project-b', '2026-08-15T00:00:00.000Z'),
      thread('newer', 'project-a', '2026-08-14T00:00:00.000Z'),
    ];

    expect(
      resolveEditorChatHistoryThreads({
        projectId: 'project-a',
        sortOrder: 'updated_at',
        threads,
      }).map((entry) => entry.id)
    ).toEqual(['newer', 'older']);
    expect(
      resolveEditorChatHistoryThreads({
        projectId: 'project-a',
        sortOrder: 'created_at',
        threads,
      }).map((entry) => entry.id)
    ).toEqual(['newer', 'older']);
  });

  it('uses latest user activity for updated ordering and caps the dialog', () => {
    const threads = Array.from(
      { length: EDITOR_CHAT_HISTORY_LIMIT + 2 },
      (_, index) =>
        ({
          ...thread(
            `thread-${String(index).padStart(2, '0')}`,
            'project-a',
            new Date(Date.UTC(2026, 6, index + 1)).toISOString()
          ),
          latestUserMessageAt:
            index === 0 ? '2026-08-15T00:00:00.000Z' : null,
        }) satisfies ThreadSummary
    );

    const result = resolveEditorChatHistoryThreads({
      projectId: 'project-a',
      sortOrder: 'updated_at',
      threads,
    });

    expect(result).toHaveLength(EDITOR_CHAT_HISTORY_LIMIT);
    expect(result[0]?.id).toBe('thread-00');
    expect(result.some((entry) => entry.id === 'thread-01')).toBe(false);
  });
});
