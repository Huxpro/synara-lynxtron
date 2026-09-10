import { describe, expect, it, rs } from '@rstest/core';

import {
  consumeOpenThreadPathInTerminal,
  executeOpenThreadPathInTerminal,
  requestOpenThreadPathInTerminal,
  resolveOpenThreadPathTerminalTarget,
  subscribeOpenThreadPathInTerminal,
} from './threadTerminalIntent.lynx';

describe('thread Terminal intents', () => {
  it('opens and writes through a new terminal transaction', async () => {
    const calls: string[] = [];
    await executeOpenThreadPathInTerminal({
      activateTerminal: (id) => calls.push('activate:' + id),
      addTerminal: (id) => calls.push('add:' + id),
      closeHostTerminal: async (id) => void calls.push('host-close:' + id),
      closeTerminal: (id) => calls.push('close:' + id),
      flush: () => calls.push('flush'),
      openDock: () => calls.push('dock-open'),
      openHostTerminal: async (id) => void calls.push('host-open:' + id),
      restoreDock: () => calls.push('dock-restore'),
      restoreTerminalState: () => calls.push('state-restore'),
      target: { shouldCreateNewTerminal: true, terminalId: 'terminal-new' },
      writePath: async (id) => void calls.push('write:' + id),
    });
    expect(calls).toEqual([
      'dock-open',
      'add:terminal-new',
      'flush',
      'host-open:terminal-new',
      'write:terminal-new',
    ]);
  });

  it('fully rolls back a new terminal when open or write fails', async () => {
    for (const failure of ['open', 'write'] as const) {
      const calls: string[] = [];
      await expect(
        executeOpenThreadPathInTerminal({
          activateTerminal: (id) => calls.push('activate:' + id),
          addTerminal: (id) => calls.push('add:' + id),
          closeHostTerminal: async (id) => void calls.push('host-close:' + id),
          closeTerminal: (id) => calls.push('close:' + id),
          flush: () => calls.push('flush'),
          openDock: () => calls.push('dock-open'),
          openHostTerminal: async (id) => {
            calls.push('host-open:' + id);
            if (failure === 'open') throw new Error('open failed');
          },
          restoreDock: () => calls.push('dock-restore'),
          restoreTerminalState: () => calls.push('state-restore'),
          target: { shouldCreateNewTerminal: true, terminalId: 'terminal-new' },
          writePath: async (id) => {
            calls.push('write:' + id);
            if (failure === 'write') throw new Error('write failed');
          },
        })
      ).rejects.toThrow(failure + ' failed');
      expect(calls.slice(-5)).toEqual([
        'host-close:terminal-new',
        'close:terminal-new',
        'state-restore',
        'dock-restore',
        'flush',
      ]);
    }
  });

  it('does not close an existing idle terminal when its write fails', async () => {
    const calls: string[] = [];
    await expect(
      executeOpenThreadPathInTerminal({
        activateTerminal: (id) => calls.push('activate:' + id),
        addTerminal: (id) => calls.push('add:' + id),
        closeHostTerminal: async (id) => void calls.push('host-close:' + id),
        closeTerminal: (id) => calls.push('close:' + id),
        flush: () => calls.push('flush'),
        openDock: () => calls.push('dock-open'),
        openHostTerminal: async (id) => void calls.push('host-open:' + id),
        restoreDock: () => calls.push('dock-restore'),
        restoreTerminalState: () => calls.push('state-restore'),
        target: { shouldCreateNewTerminal: false, terminalId: 'terminal-1' },
        writePath: async (id) => {
          calls.push('write:' + id);
          throw new Error('write failed');
        },
      })
    ).rejects.toThrow('write failed');
    expect(calls).not.toContain('host-close:terminal-1');
    expect(calls).not.toContain('close:terminal-1');
    expect(calls.slice(-3)).toEqual(['state-restore', 'dock-restore', 'flush']);
  });

  it('reuses only an open idle terminal', () => {
    const createTerminalId = rs.fn(() => 'terminal-new');
    expect(
      resolveOpenThreadPathTerminalTarget({
        activeTerminalId: 'terminal-1',
        createTerminalId,
        runningTerminalIds: [],
        terminalIds: ['terminal-1'],
        terminalOpen: true,
      })
    ).toEqual({ shouldCreateNewTerminal: false, terminalId: 'terminal-1' });
    expect(createTerminalId).not.toHaveBeenCalled();
  });

  it('creates a terminal when the active terminal is closed, stale, or busy', () => {
    for (const input of [
      { terminalOpen: false, terminalIds: ['terminal-1'], runningTerminalIds: [] },
      { terminalOpen: true, terminalIds: ['terminal-2'], runningTerminalIds: [] },
      { terminalOpen: true, terminalIds: ['terminal-1'], runningTerminalIds: ['terminal-1'] },
    ]) {
      expect(
        resolveOpenThreadPathTerminalTarget({
          activeTerminalId: 'terminal-1',
          createTerminalId: () => 'terminal-new',
          ...input,
        })
      ).toEqual({ shouldCreateNewTerminal: true, terminalId: 'terminal-new' });
    }
  });

  it('retains an intent until its target thread consumes it', () => {
    requestOpenThreadPathInTerminal({ threadId: 'thread-1', cwd: '/work/repo' });
    expect(consumeOpenThreadPathInTerminal('thread-2')).toBeNull();
    expect(consumeOpenThreadPathInTerminal('thread-1')).toEqual({
      threadId: 'thread-1',
      cwd: '/work/repo',
    });
    expect(consumeOpenThreadPathInTerminal('thread-1')).toBeNull();
  });

  it('notifies a mounted target immediately', () => {
    const listener = rs.fn();
    const dispose = subscribeOpenThreadPathInTerminal(listener);
    requestOpenThreadPathInTerminal({ threadId: 'thread-3', cwd: '/work/next' });
    expect(listener).toHaveBeenCalledWith({ threadId: 'thread-3', cwd: '/work/next' });
    expect(consumeOpenThreadPathInTerminal('thread-3')).not.toBeNull();
    dispose();
  });
});
