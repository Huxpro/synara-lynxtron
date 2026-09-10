import { describe, expect, it } from 'vitest';

import {
  buildArchivedThreadContextMenuItems,
  buildContentContextMenuItems,
  buildProjectContextMenuCoreItems,
  buildProjectContextMenuItems,
  buildProjectContextMenuExecutableItems,
  buildSelectedThreadsContextMenuItems,
  buildSpaceContextMenuItems,
  buildTerminalSelectionContextMenuItems,
  buildNativeContextMenuTemplate,
  normalizeContextMenuItems,
} from './contextMenu';

describe('context menu policy', () => {
  it('keeps archived thread recovery before destructive deletion', () => {
    expect(buildArchivedThreadContextMenuItems()).toEqual([
      { id: 'restore', label: 'Restore' },
      { id: 'delete', label: 'Delete', destructive: true },
    ]);
  });

  it('labels selected-thread actions and rejects an empty selection', () => {
    expect(buildSelectedThreadsContextMenuItems(3)).toEqual([
      { id: 'mark-unread', label: 'Mark unread (3)' },
      { id: 'archive', label: 'Archive (3)' },
      { id: 'delete', label: 'Delete (3)', destructive: true },
    ]);
    expect(buildSelectedThreadsContextMenuItems(0)).toEqual([]);
    expect(buildSelectedThreadsContextMenuItems(Number.NaN)).toEqual([]);
  });

  it('keeps terminal selection focused on adding context to chat', () => {
    expect(buildTerminalSelectionContextMenuItems()).toEqual([
      { id: 'add-to-chat', label: 'Add to chat' },
    ]);
  });

  it('models spellcheck, image, and editing fallback groups', () => {
    expect(
      buildNativeContextMenuTemplate(
        normalizeContextMenuItems(
          buildContentContextMenuItems({
            dictionarySuggestions: ['first', 'second', 'ignored-3', 'ignored-4', 'ignored-5', 'ignored-6'],
            misspelledWord: true,
            image: true,
            canCut: false,
            canCopy: true,
            canPaste: false,
            canSelectAll: true,
          })
        )
      ).map((item) => item.type === 'separator' ? 'separator' : item.id)
    ).toEqual([
      'spellcheck:0',
      'spellcheck:1',
      'spellcheck:2',
      'spellcheck:3',
      'spellcheck:4',
      'separator',
      'copy-image',
      'separator',
      'cut',
      'copy',
      'paste',
      'select-all',
    ]);
    expect(
      buildContentContextMenuItems({
        dictionarySuggestions: [],
        misspelledWord: true,
        image: false,
        canCut: false,
        canCopy: false,
        canPaste: false,
        canSelectAll: false,
      })[0]
    ).toEqual({
      id: 'no-spelling-suggestions',
      label: 'No suggestions',
      enabled: false,
    });
  });

  it('keeps Space editing before neutral deletion', () => {
    expect(buildSpaceContextMenuItems()).toEqual([
      { id: 'edit', label: 'Edit space…' },
      { id: 'delete', label: 'Delete space' },
    ]);
  });

  it('keeps the executable project core actions ordered and stateful', () => {
    expect(buildProjectContextMenuCoreItems({ isPinned: false })).toEqual([
      { id: 'open-in-finder', label: 'Open in Finder' },
      { id: 'open-in-kanban', label: 'Open in Kanban' },
      { id: 'copy-path', label: 'Copy Path' },
      { id: 'toggle-pin', label: 'Pin project', separatorBefore: true },
    ]);
    expect(
      buildProjectContextMenuCoreItems({ isPinned: true }).at(-1)?.label
    ).toBe('Unpin project');
  });

  it('optionally exposes New space in the executable move submenu', () => {
    const move = buildProjectContextMenuExecutableItems({
      currentSpaceId: null,
      hasArchivableThreads: true,
      includeNewSpace: true,
      isPinned: false,
      spaces: [{ id: 'space-a', label: 'Alpha' }],
    }).find((item) => item.id === 'move-to-space');
    expect(move?.submenu?.at(-1)).toEqual({
      id: 'new-space',
      label: 'New space…',
      separatorBefore: true,
    });
    expect(buildProjectContextMenuExecutableItems({
      currentSpaceId: null,
      hasArchivableThreads: true,
      includeRename: true,
      isPinned: false,
      spaces: [],
    }).slice(-3)).toEqual([
      { id: 'rename', label: 'Edit name', separatorBefore: true },
      { id: 'toggle-pin', label: 'Pin project', separatorBefore: false },
      { id: 'archive-threads', label: 'Archive threads', separatorBefore: true },
    ]);
  });

  it('models the complete project menu, including conditional groups and spaces', () => {
    const items = buildProjectContextMenuItems({
      isPinned: false,
      isRunning: false,
      hasOpenServer: false,
      hasArchivableThreads: true,
      hasAnyThreads: true,
      currentSpaceId: 'space-b',
      spaces: [
        { id: 'space-a', label: 'Alpha' },
        { id: 'space-b', label: 'Beta' },
      ],
    });

    expect(items.map((item) => item.id)).toEqual([
      'open-in-finder',
      'open-in-kanban',
      'copy-path',
      'start-dev',
      'move-to-space',
      'rename',
      'toggle-pin',
      'archive-threads',
      'delete-threads',
      'delete',
    ]);
    expect(items.filter((item) => item.separatorBefore).map((item) => item.id)).toEqual([
      'start-dev',
      'rename',
      'archive-threads',
      'delete',
    ]);
    expect(items.find((item) => item.id === 'move-to-space')?.submenu).toEqual([
      { id: 'move-to-void', label: 'Void', type: 'radio', checked: false },
      { id: 'move-to-space:space-a', label: 'Alpha', type: 'radio', checked: false },
      { id: 'move-to-space:space-b', label: 'Beta', type: 'radio', checked: true },
      { id: 'new-space', label: 'New space…', separatorBefore: true },
    ]);
  });

  it('switches run and pin state while omitting unavailable thread actions', () => {
    const items = buildProjectContextMenuItems({
      isPinned: true,
      isRunning: true,
      hasOpenServer: true,
      hasArchivableThreads: false,
      hasAnyThreads: false,
      currentSpaceId: null,
      spaces: [],
    });

    expect(items.map((item) => item.id)).toEqual([
      'open-in-finder',
      'open-in-kanban',
      'copy-path',
      'stop-dev',
      'open-dev-server',
      'move-to-space',
      'rename',
      'toggle-pin',
      'delete',
    ]);
    expect(items.find((item) => item.id === 'toggle-pin')?.label).toBe('Unpin project');
    expect(items.find((item) => item.id === 'move-to-space')?.submenu?.[0]).toMatchObject({
      id: 'move-to-void',
      checked: true,
    });
  });

  it('builds the Native-executable project subset with a checked Move submenu', () => {
    expect(buildProjectContextMenuExecutableItems({
      currentSpaceId: 'space-a',
      isPinned: false,
      spaces: [{ id: 'space-a', label: 'Alpha' }],
    })).toEqual([
      { id: 'open-in-finder', label: 'Open in Finder' },
      { id: 'open-in-kanban', label: 'Open in Kanban' },
      { id: 'copy-path', label: 'Copy Path' },
      {
        id: 'move-to-space',
        label: 'Move to space',
        separatorBefore: true,
        submenu: [
          { id: 'move-to-void', label: 'Void', type: 'radio', checked: false },
          { id: 'move-to-space:space-a', label: 'Alpha', type: 'radio', checked: true },
        ],
      },
      { id: 'toggle-pin', label: 'Pin project', separatorBefore: false },
    ]);
  });

  it('normalizes nested state without mutating renderer-owned input', () => {
    const items = [
      {
        id: 'move',
        label: 'Move to',
        submenu: [
          { id: 'space-a', label: 'Space A', type: 'radio' as const, checked: true },
          { id: 'space-b', label: 'Space B', enabled: false },
        ],
      },
    ] as const;

    expect(normalizeContextMenuItems(items)).toEqual([
      {
        id: 'move',
        label: 'Move to',
        type: 'normal',
        enabled: true,
        visible: true,
        checked: false,
        destructive: false,
        separatorBefore: false,
        submenu: [
          {
            id: 'space-a',
            label: 'Space A',
            type: 'radio',
            enabled: true,
            visible: true,
            checked: true,
            destructive: false,
            separatorBefore: false,
          },
          {
            id: 'space-b',
            label: 'Space B',
            type: 'normal',
            enabled: false,
            visible: true,
            checked: false,
            destructive: false,
            separatorBefore: false,
          },
        ],
      },
    ]);
  });

  it('inserts one implicit destructive separator and honors explicit groups', () => {
    const normalized = normalizeContextMenuItems([
      { id: 'rename', label: 'Rename' },
      { id: 'archive', label: 'Archive', separatorBefore: true },
      { id: 'delete', label: 'Delete', destructive: true },
      { id: 'forget', label: 'Forget', destructive: true },
    ]);

    expect(buildNativeContextMenuTemplate(normalized).map((item) =>
      item.type === 'separator' ? 'separator' : item.id
    )).toEqual(['rename', 'separator', 'archive', 'separator', 'delete', 'forget']);
  });

  it('drops malformed bridge input and recursively limits empty submenus', () => {
    expect(
      normalizeContextMenuItems([
        null,
        { id: '', label: 'Missing id' },
        { id: 'missing-label' },
        { id: 'safe', label: 'Safe', submenu: [undefined] },
      ])
    ).toEqual([
      {
        id: 'safe',
        label: 'Safe',
        type: 'normal',
        enabled: true,
        visible: true,
        checked: false,
        destructive: false,
        separatorBefore: false,
      },
    ]);
  });
});
