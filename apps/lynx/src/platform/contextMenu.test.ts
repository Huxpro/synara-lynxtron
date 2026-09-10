import { afterEach, beforeEach, describe, expect, it, rs } from '@rstest/core';
import { contextMenuBridgePayload, showContextMenu } from './contextMenu';
import { buildProjectContextMenuExecutableItems } from '@synara/shared/contextMenu';

describe('contextMenuBridgePayload', () => {
  beforeEach(() => {
    rs.stubGlobal('NativeModules', {
      bridge: {
        call: rs.fn((_name, _params, reply) => reply(JSON.stringify({ id: null }))),
      },
    });
  });

  afterEach(() => {
    rs.useRealTimers();
  });

  it('preserves the executable New space project transaction entry', () => {
    const items = buildProjectContextMenuExecutableItems({
      currentSpaceId: null,
      includeNewSpace: true,
      isPinned: false,
      spaces: [{ id: 'space-a', label: 'Alpha' }],
    });
    expect(items.find((item) => item.id === 'move-to-space')?.submenu?.at(-1)).toEqual({
      id: 'new-space',
      label: 'New space…',
      separatorBefore: true,
    });
  });

  it('exposes only authoritative running dev actions', () => {
    expect(buildProjectContextMenuExecutableItems({
      currentSpaceId: null,
      devServerRunning: true,
      hasOpenDevServer: true,
      isPinned: false,
      spaces: [],
    }).map((item) => item.id)).toEqual([
      'open-in-finder',
      'open-in-kanban',
      'copy-path',
      'stop-dev',
      'open-dev-server',
      'move-to-space',
      'toggle-pin',
    ]);
    expect(buildProjectContextMenuExecutableItems({
      currentSpaceId: null,
      devServerRunning: false,
      hasOpenDevServer: true,
      isPinned: false,
      spaces: [],
    }).some((item) => item.id === 'open-dev-server')).toBe(false);
  });

  it('publishes rounded cursor coordinates and preserves action metadata', () => {
    expect(
      contextMenuBridgePayload(
        [
          { id: 'copy-thread-id', label: 'Copy Thread ID' },
          {
            id: 'move',
            label: 'Move to',
            submenu: [
              {
                id: 'space-a',
                label: 'Space A',
                type: 'radio',
                checked: true,
                accelerator: 'CommandOrControl+1',
              },
              { id: 'space-b', label: 'Space B', enabled: false },
            ],
          },
          {
            id: 'archive',
            label: 'Archive',
            separatorBefore: true,
            destructive: true,
          },
        ],
        { x: 42.6, y: 19.2 }
      )
    ).toEqual({
      items: [
        { id: 'copy-thread-id', label: 'Copy Thread ID' },
        {
          id: 'move',
          label: 'Move to',
          submenu: [
            {
              id: 'space-a',
              label: 'Space A',
              type: 'radio',
              checked: true,
              accelerator: 'CommandOrControl+1',
            },
            { id: 'space-b', label: 'Space B', enabled: false },
          ],
        },
        {
          id: 'archive',
          label: 'Archive',
          separatorBefore: true,
          destructive: true,
        },
      ],
      position: { x: 43, y: 19 },
    });
  });

  it('restores the exact invoking element after selection or dismissal', async () => {
    rs.useFakeTimers();
    const restoreFocus = rs.fn();

    await expect(
      showContextMenu([{ id: 'copy', label: 'Copy' }], { x: 10, y: 20 }, {
        restoreFocus,
      })
    ).resolves.toBeNull();
    expect(restoreFocus).not.toHaveBeenCalled();
    await rs.advanceTimersByTimeAsync(249);
    expect(restoreFocus).not.toHaveBeenCalled();
    await rs.runAllTimersAsync();
    expect(restoreFocus).toHaveBeenCalledTimes(1);
  });

  it('restores focus even when the native bridge rejects', async () => {
    rs.useFakeTimers();
    const restoreFocus = rs.fn();
    rs.stubGlobal('NativeModules', {
      bridge: { call: rs.fn(() => { throw new Error('bridge unavailable'); }) },
    });

    await expect(
      showContextMenu([{ id: 'copy', label: 'Copy' }], { x: 10, y: 20 }, {
        restoreFocus,
      })
    ).rejects.toThrow('bridge unavailable');
    expect(restoreFocus).not.toHaveBeenCalled();
    await rs.runAllTimersAsync();
    expect(restoreFocus).toHaveBeenCalledTimes(1);
  });
});
