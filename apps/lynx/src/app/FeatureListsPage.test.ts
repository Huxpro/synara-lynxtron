import { describe, expect, it } from '@rstest/core';

import {
  buildCanonicalSliceKanbanBoard,
  buildCanonicalSlicePullRequestList,
  createPullRequestActionGate,
  EMPTY_KANBAN_BOARD,
  EMPTY_PULL_REQUEST_LIST,
  selectKanbanProjectBoard,
} from './FeatureListsPage.logic';
import type {
  KanbanBoard,
  KanbanProjectBoard,
} from '@synara-web/components/kanban/kanban.logic';
import type { PullRequestListEntry } from '@synara/contracts';
import type { SidebarSnapshot } from './queries';

describe('buildCanonicalSliceKanbanBoard', () => {
  it('folds home chat containers into the trailing canonical Chats board', () => {
    const snapshot = {
      kanbanProjects: [
        { id: 'chat-a', kind: 'chat', name: 'Home thread title' },
        { id: 'project-a', kind: 'project', name: 'Project A' },
        { id: 'studio-a', kind: 'studio', name: 'Studio' },
      ],
      kanbanThreads: [
        {
          id: 'thread-a',
          projectId: 'chat-a',
          title: 'READY-LYNX-COMPOSER',
          createdAt: '2026-07-30T08:00:00.000Z',
          updatedAt: '2026-07-30T09:00:00.000Z',
          latestUserMessageAt: '2026-07-30T09:00:00.000Z',
          latestTurn: null,
          session: null,
          modelSelection: { provider: 'codex', model: null, options: {} },
          hasPendingApprovals: false,
          hasPendingUserInput: false,
          hasLiveTailWork: false,
          branch: null,
          envMode: null,
          worktreePath: null,
        },
      ],
    } as unknown as SidebarSnapshot;

    const board = buildCanonicalSliceKanbanBoard(snapshot);

    expect(board.projects.map((project) => project.projectName)).toEqual([
      'Project A',
      'Chats',
    ]);
    expect(board.projects[1]?.draft[0]?.title).toBe('READY-LYNX-COMPOSER');
  });
});

describe('selectKanbanProjectBoard', () => {
  it('returns the exact canonical project board without re-projecting cards', () => {
    const project = {
      projectId: 'project-a',
      projectName: 'Project A',
      projectKind: 'project',
      draft: [],
      inProgress: [],
      done: [],
      totalCount: 0,
    } as KanbanProjectBoard;
    const board: KanbanBoard = { projects: [project], totalCount: 0 };

    expect(selectKanbanProjectBoard(board, 'project-a')).toBe(project);
    expect(selectKanbanProjectBoard(board, 'missing')).toBeUndefined();
  });

  it('provides a stable empty fallback before the real query resolves', () => {
    expect(EMPTY_KANBAN_BOARD).toEqual({
      projects: [],
      totalCount: 0,
    });
  });
});

describe('buildCanonicalSlicePullRequestList', () => {
  it('uses the canonical pinned-first grouping without rebuilding entries', () => {
    const regular = makePullRequest('regular', false, true);
    const pinned = makePullRequest('pinned', true, false);
    const list = buildCanonicalSlicePullRequestList({
      viewer: 'viewer',
      entries: [regular, pinned],
    });

    expect(list.entries).toEqual([pinned, regular]);
    expect(list.entries[0]?.mergeability).toBe('unknown');
    expect(list.grouped.map((group) => group.label)).toEqual([
      'Pinned',
      'Review requested',
    ]);
  });

  it('provides a stable empty fallback before the query resolves', () => {
    expect(buildCanonicalSlicePullRequestList(undefined)).toBe(
      EMPTY_PULL_REQUEST_LIST
    );
  });

  it('uses the canonical involvement filter and ungroups a scoped tab', () => {
    const requested = makePullRequest('requested', false, true);
    const authored = {
      ...makePullRequest('authored', false, false),
      author: { login: 'viewer', name: 'Viewer', avatarUrl: null },
    };

    const list = buildCanonicalSlicePullRequestList(
      { viewer: 'viewer', entries: [requested, authored] },
      'authored'
    );

    expect(list.entries).toEqual([authored]);
    expect(list.grouped).toBeNull();
  });
});

describe('createPullRequestActionGate', () => {
  it('rejects a same-frame duplicate and opens again after settlement', () => {
    const gate = createPullRequestActionGate();
    expect(gate.tryAcquire()).toBe(true);
    expect(gate.tryAcquire()).toBe(false);
    gate.release();
    expect(gate.tryAcquire()).toBe(true);
  });
});

function makePullRequest(
  title: string,
  isPinned: boolean,
  viewerReviewRequested: boolean
): PullRequestListEntry {
  return {
    projectId: 'project-a' as PullRequestListEntry['projectId'],
    projectTitle: 'Project A',
    repository: `acme/${title}`,
    number: isPinned ? 1 : 2,
    title,
    url: `https://github.com/acme/${title}/pull/1`,
    author: null,
    headBranch: title,
    baseBranch: 'main',
    state: 'open',
    isDraft: false,
    additions: 1,
    deletions: 0,
    createdAt: '2026-07-30T08:00:00.000Z',
    updatedAt: '2026-07-30T09:00:00.000Z',
    reviewDecision: null,
    viewerReviewRequested,
    isPinned,
    projectContexts: [
      {
        projectId: 'project-a' as PullRequestListEntry['projectId'],
        projectTitle: 'Project A',
        isPinned,
      },
    ],
    mergeability: 'unknown',
    labels: [],
  };
}
