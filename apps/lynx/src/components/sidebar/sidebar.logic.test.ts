import { describe, expect, it } from '@rstest/core';

import { deriveSidebarSections } from './sidebar.logic';
import { pruneProjectThreadListPagingForCollapsedProjects } from '@synara-web/components/SidebarProjectPaging.logic';
import { resolveSettingsBackTarget } from '@synara-web/components/SidebarSettingsBack.logic';
import { resolvePullRequestReviewBadge } from '@synara-web/components/SidebarActionBadges.logic';
import { resolveSidebarPrimarySurface } from '@synara-web/components/SidebarSurface.logic';

describe('deriveSidebarProjectGroups', () => {
  it('keeps project order and sorts rows newest first', () => {
    const { projectGroups: groups } = deriveSidebarSections({
      projects: [
        { id: 'p2', kind: 'project', title: 'Two', workspaceRoot: '/two' },
        { id: 'p1', kind: 'project', title: 'One', workspaceRoot: '/one' },
      ],
      threads: [
        {
          id: 'old',
          title: 'Old',
          projectId: 'p2',
          project: 'Two',
          messageCount: 1,
          updatedAt: '2026-01-01',
          live: false,
        },
        {
          id: 'new',
          title: 'New',
          projectId: 'p2',
          project: 'Two',
          messageCount: 2,
          updatedAt: '2026-02-01',
          live: false,
        },
      ],
    });

    expect(groups.map((group) => group.id)).toEqual(['p2', 'p1']);
    expect(groups[0].threads.map((thread) => thread.id)).toEqual(['new', 'old']);
  });

  it('keeps threads whose project snapshot has not arrived', () => {
    const { projectGroups: groups } = deriveSidebarSections({
      projects: [],
      threads: [
        {
          id: 'orphan',
          title: 'Orphan',
          projectId: 'missing',
          project: 'Unknown project',
          messageCount: 0,
          updatedAt: '2026-01-01',
          live: false,
        },
      ],
    });
    expect(groups).toHaveLength(1);
    expect(groups[0].title).toBe('Other');
  });

  it('keeps hidden chat and studio containers out of Projects', () => {
    const sections = deriveSidebarSections({
      projects: [
        { id: 'project', kind: 'project', title: 'Visible', workspaceRoot: '/work' },
        { id: 'chat', kind: 'chat', title: 'Home', workspaceRoot: '/home' },
        { id: 'studio', kind: 'studio', title: 'Studio', workspaceRoot: '/studio' },
      ],
      threads: [
        {
          id: 'chat-thread',
          title: 'Chat',
          projectId: 'chat',
          project: 'Home',
          messageCount: 1,
          updatedAt: '2026-03-01',
          live: false,
        },
        {
          id: 'studio-thread',
          title: 'Studio chat',
          projectId: 'studio',
          project: 'Studio',
          messageCount: 1,
          updatedAt: '2026-02-01',
          live: false,
        },
      ],
    });

    expect(sections.projectGroups.map((group) => group.id)).toEqual(['project']);
    expect(sections.chatThreads.map((thread) => thread.id)).toEqual(['chat-thread']);
    expect(sections.studioThreads.map((thread) => thread.id)).toEqual(['studio-thread']);
  });

  it('projects server-pinned threads once and removes standalone pins from ordinary lists', () => {
    const sections = deriveSidebarSections({
      projects: [
        { id: 'project', kind: 'project', title: 'Visible', workspaceRoot: '/work' },
      ],
      threads: [
        {
          id: 'pinned',
          title: 'Pinned',
          projectId: 'project',
          project: 'Visible',
          messageCount: 1,
          updatedAt: '2026-03-01',
          live: false,
          isPinned: true,
        },
        {
          id: 'ordinary',
          title: 'Ordinary',
          projectId: 'project',
          project: 'Visible',
          messageCount: 1,
          updatedAt: '2026-02-01',
          live: false,
        },
      ],
    });

    expect(sections.pinnedThreads.map((thread) => thread.id)).toEqual(['pinned']);
    expect(sections.projectGroups[0].threads.map((thread) => thread.id)).toEqual([
      'ordinary',
    ]);
  });

  it('merges client-persisted pins with the server snapshot', () => {
    const sections = deriveSidebarSections({
      projects: [
        { id: 'project', kind: 'project', title: 'Visible', workspaceRoot: '/work' },
      ],
      threads: [
        {
          id: 'persisted',
          title: 'Persisted pin',
          projectId: 'project',
          project: 'Visible',
          messageCount: 1,
          updatedAt: '2026-03-01',
          live: false,
        },
      ],
      persistedPinnedThreadIds: ['persisted'],
    });

    expect(sections.pinnedThreads.map((thread) => thread.id)).toEqual(['persisted']);
    expect(sections.projectGroups[0].threads).toEqual([]);
  });

  it('orders persisted pinned projects before the ordinary manual order', () => {
    const sections = deriveSidebarSections({
      projects: [
        { id: 'one', kind: 'project', title: 'One', workspaceRoot: '/one' },
        { id: 'two', kind: 'project', title: 'Two', workspaceRoot: '/two' },
      ],
      threads: [],
      persistedPinnedProjectIds: ['two'],
    });

    expect(sections.projectGroups.map((project) => project.id)).toEqual(['two', 'one']);
  });
});

describe('shared sidebar route/list state', () => {
  it('restores settings back navigation to the remembered available thread', () => {
    expect(
      resolveSettingsBackTarget({
        lastThreadRoute: { threadId: 'remembered' },
        availableThreadIds: new Set(['remembered', 'latest']),
        latestThreadId: 'latest',
      })
    ).toEqual({ kind: 'thread', threadId: 'remembered', splitViewId: undefined });
  });

  it('drops show-more pages for a collapsed project', () => {
    const next = pruneProjectThreadListPagingForCollapsedProjects({
      threadListExtraPagesByProjectCwd: new Map([
        ['/one', 2],
        ['/two', 1],
      ]),
      projects: [
        { cwd: '/one', expanded: false },
        { cwd: '/two', expanded: true },
      ],
      normalizeProjectCwd: (cwd) => cwd,
    });
    expect([...next]).toEqual([['/two', 1]]);
  });
});

describe('shared sidebar action badges', () => {
  it('presents an exact pull-request review count', () => {
    expect(
      resolvePullRequestReviewBadge({ count: 2, incomplete: false })
    ).toEqual({
      text: '2',
      accessibleLabel: '2 pull requests are waiting for your review',
    });
  });
});

describe('shared sidebar surface routing', () => {
  it('selects Studio primary actions on the Studio route', () => {
    expect(
      resolveSidebarPrimarySurface({
        isOnStudio: true,
        isOnWorkspace: false,
      })
    ).toBe('studio');
  });
});
