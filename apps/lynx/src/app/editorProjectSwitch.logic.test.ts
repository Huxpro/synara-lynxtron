import { describe, expect, it } from '@rstest/core';
import { SpaceId } from '@synara/contracts';

import type { ThreadSummary } from './queries';
import {
  groupEditorProjectSwitchOptions,
  resolveEditorProjectSwitchListHeight,
  resolveEditorProjectSwitchOptions,
  resolveEditorProjectSwitchTarget,
} from './editorProjectSwitch.logic';

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
  it('gives Native scroll views a content-derived height capped to Web max-height', () => {
    expect(resolveEditorProjectSwitchListHeight([])).toBe(76);
    expect(resolveEditorProjectSwitchListHeight([{ items: [{}] }])).toBe(72);
    expect(
      resolveEditorProjectSwitchListHeight([
        { items: Array.from({ length: 4 }) },
        { items: Array.from({ length: 4 }) },
      ])
    ).toBe(264);
  });

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
        spaceId: null,
      },
      {
        id: 'project-b',
        selected: false,
        threadId: null,
        title: 'Project B',
        spaceId: null,
      },
    ]);
  });

  it('opens an existing thread or a project-scoped draft without dead options', () => {
    expect(
      resolveEditorProjectSwitchTarget({
        id: 'project-a',
        selected: true,
        threadId: 'thread-a',
        title: 'Project A',
        spaceId: null,
      })
    ).toEqual({ kind: 'current' });
    expect(
      resolveEditorProjectSwitchTarget({
        id: 'project-b',
        selected: false,
        threadId: 'thread-b',
        title: 'Project B',
        spaceId: null,
      })
    ).toEqual({ kind: 'thread', threadId: 'thread-b' });
    expect(
      resolveEditorProjectSwitchTarget({
        id: 'project-c',
        selected: false,
        threadId: null,
        title: 'Project C',
        spaceId: null,
      })
    ).toEqual({ kind: 'draft', projectId: 'project-c' });
  });

  it('reuses the Web Space grouping and searches project or Space names', () => {
    const workSpaceId = SpaceId.makeUnsafe('space-work');
    const personalSpaceId = SpaceId.makeUnsafe('space-personal');
    const spaces = [
      {
        id: workSpaceId,
        name: 'Work',
        icon: 'bag' as const,
        sortOrder: 0,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
      {
        id: personalSpaceId,
        name: 'Personal',
        icon: 'home' as const,
        sortOrder: 1,
        createdAt: '2026-01-01T00:00:00.000Z',
        updatedAt: '2026-01-01T00:00:00.000Z',
      },
    ];
    const options = [
      {
        id: 'project-a',
        selected: true,
        threadId: 'thread-a',
        title: 'Alpha',
        spaceId: workSpaceId,
      },
      {
        id: 'project-b',
        selected: false,
        threadId: null,
        title: 'Beta',
        spaceId: personalSpaceId,
      },
    ];

    expect(
      groupEditorProjectSwitchOptions({
        activeSpaceId: personalSpaceId,
        options,
        query: '',
        spaces,
      }).map((group) => ({ label: group.label, projects: group.items.map((item) => item.title) }))
    ).toEqual([
      { label: 'Personal · Active', projects: ['Beta'] },
      { label: 'Work', projects: ['Alpha'] },
    ]);
    expect(
      groupEditorProjectSwitchOptions({
        activeSpaceId: personalSpaceId,
        options,
        query: 'work',
        spaces,
      }).flatMap((group) => group.items.map((item) => item.title))
    ).toEqual(['Alpha']);
  });
});
