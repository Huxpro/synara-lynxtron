import { describe, expect, it } from '@rstest/core';

import type { ThreadSummary } from './queries';
import { resolveEditorProjectSwitchOptions } from './editorProjectSwitch.logic';

function thread(
  id: string,
  projectId: string,
  updatedAt: string,
  archivedAt: string | null = null
): ThreadSummary {
  return {
    id,
    title: id,
    projectId,
    project: projectId,
    messageCount: 0,
    updatedAt,
    archivedAt,
    live: false,
  };
}

describe('Editor project switch options', () => {
  it('keeps project containers and selects the latest active thread', () => {
    expect(
      resolveEditorProjectSwitchOptions({
        currentProjectId: 'project-a',
        projects: [
          { id: 'home', kind: 'chat', title: 'Home' },
          { id: 'project-a', kind: 'project', title: 'Project A' },
          { id: 'project-b', kind: 'project', title: 'Project B' },
          { id: 'studio', kind: 'studio', title: 'Studio' },
        ],
        sortOrder: 'updated',
        threads: [
          thread('a-old', 'project-a', '2026-01-01T00:00:00.000Z'),
          thread('a-new', 'project-a', '2026-01-02T00:00:00.000Z'),
          thread(
            'a-archived',
            'project-a',
            '2026-01-03T00:00:00.000Z',
            '2026-01-03T01:00:00.000Z'
          ),
        ],
      })
    ).toEqual([
      {
        id: 'project-a',
        selected: true,
        threadId: 'a-new',
        title: 'Project A',
      },
      {
        id: 'project-b',
        selected: false,
        threadId: null,
        title: 'Project B',
      },
    ]);
  });
});
