import { describe, expect, it } from '@rstest/core';
import type { OrchestrationShellSnapshot } from '@synara/contracts';

import { projectActiveThreadSummaries } from './threadSummaryProjection.logic';

describe('Lynx thread summary projection', () => {
  it('keeps active shell rows even when they have no messages', () => {
    const snapshot = {
      snapshotSequence: 3,
      spaces: [],
      projects: [
        {
          id: 'project-a',
          kind: 'project',
          title: 'Project A',
          workspaceRoot: '/tmp/project-a',
          defaultModelSelection: null,
          scripts: [],
          isPinned: false,
          spaceId: null,
          createdAt: '2026-08-14T00:00:00.000Z',
          updatedAt: '2026-08-14T00:00:00.000Z',
          deletedAt: null,
        },
      ],
      threads: [
        {
          id: 'active',
          projectId: 'project-a',
          title: 'Active chat',
          modelSelection: { provider: 'codex', model: 'gpt-5.6-sol' },
          runtimeMode: 'approval-required',
          interactionMode: 'default',
          envMode: 'local',
          branch: 'main',
          worktreePath: null,
          isPinned: false,
          parentThreadId: null,
          sidechatSourceThreadId: null,
          latestTurn: null,
          createdAt: '2026-08-14T00:00:00.000Z',
          updatedAt: '2026-08-15T00:00:00.000Z',
          archivedAt: null,
          handoff: null,
          session: null,
        },
        {
          id: 'archived',
          projectId: 'project-a',
          title: 'Archived chat',
          modelSelection: { provider: 'codex', model: 'gpt-5.6-sol' },
          runtimeMode: 'approval-required',
          interactionMode: 'default',
          envMode: 'local',
          branch: 'main',
          worktreePath: null,
          isPinned: false,
          parentThreadId: null,
          sidechatSourceThreadId: null,
          latestTurn: null,
          createdAt: '2026-08-13T00:00:00.000Z',
          updatedAt: '2026-08-13T00:00:00.000Z',
          archivedAt: '2026-08-14T00:00:00.000Z',
          handoff: null,
          session: null,
        },
      ],
      updatedAt: '2026-08-15T00:00:00.000Z',
    } as unknown as OrchestrationShellSnapshot;

    expect(projectActiveThreadSummaries(snapshot)).toEqual([
      expect.objectContaining({
        id: 'active',
        project: 'Project A',
        messageCount: 0,
        provider: 'codex',
        updatedAt: '2026-08-15T00:00:00.000Z',
      }),
    ]);
  });
});
