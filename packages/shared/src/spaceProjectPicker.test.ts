import { describe, expect, test } from 'vitest';

import {
  chunkSpaceProjectIds,
  deriveSpaceProjectPickerGroups,
  spaceProjectPickerFailureMessage,
  toggleSpaceProjectSelection,
} from './spaceProjectPicker';

const spaces = [
  { id: 'space-a', name: 'Alpha', icon: 'bag' as const },
  { id: 'space-b', name: 'Beta', icon: 'rocket' as const },
];
const projects = [
  { id: 'z', name: 'Zulu', path: '/work/zulu', spaceId: null },
  { id: 'a', name: 'Able', path: '/work/able', spaceId: 'space-a' },
  { id: 'b', name: 'Beta tool', path: '/work/beta', spaceId: 'space-b' },
];

describe('space project picker policy', () => {
  test('excludes the target, searches name/path/space, sorts, and groups active space first', () => {
    const all = deriveSpaceProjectPickerGroups({
      activeSpaceId: 'space-b',
      projects,
      query: '',
      spaces,
      targetSpaceId: 'space-a',
    });
    expect(all.movableProjects.map((project) => project.id)).toEqual(['z', 'b']);
    expect(all.candidates.map((project) => project.id)).toEqual(['b', 'z']);
    expect(all.groups.map((group) => [group.label, group.items.map((item) => item.id)])).toEqual([
      ['Beta · Active', ['b']],
      ['Void', ['z']],
    ]);
    expect(
      deriveSpaceProjectPickerGroups({
        activeSpaceId: null,
        projects,
        query: 'alpha',
        spaces,
        targetSpaceId: 'space-b',
      }).candidates.map((project) => project.id)
    ).toEqual(['a']);
  });

  test('toggles selection without mutating the previous set', () => {
    const original = new Set(['a']);
    const added = toggleSpaceProjectSelection(original, 'b');
    expect([...original]).toEqual(['a']);
    expect([...added]).toEqual(['a', 'b']);
    expect([...toggleSpaceProjectSelection(added, 'a')]).toEqual(['b']);
  });

  test('chunks at the server command cap and preserves order', () => {
    const ids = Array.from({ length: 401 }, (_, index) => `project-${index}`);
    expect(chunkSpaceProjectIds(ids).map((chunk) => chunk.length)).toEqual([200, 200, 1]);
    expect(chunkSpaceProjectIds(ids).flat()).toEqual(ids);
  });

  test('uses the canonical partial-failure copy', () => {
    expect(spaceProjectPickerFailureMessage(2, 'Alpha')).toBe(
      '2 could not be moved. Projects processed before the failure remain in Alpha. Try again.'
    );
  });
});
