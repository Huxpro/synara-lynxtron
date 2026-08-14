import { describe, expect, it, rs } from '@rstest/core';

import { deleteWorkspaceWithTerminalCleanup } from './workspaceDeletion.logic';

describe('deleteWorkspaceWithTerminalCleanup', () => {
  it('closes and clears the synthetic workspace terminal before deletion', async () => {
    const calls: string[] = [];
    const closeTerminal = rs.fn(async () => {
      calls.push('close');
    });
    const deleteWorkspace = rs.fn(() => {
      calls.push('delete');
    });

    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: 'workspace-1',
      closeTerminal,
      deleteWorkspace,
    });

    expect(closeTerminal).toHaveBeenCalledWith({
      threadId: 'workspace:workspace-1',
      terminalId: 'default',
      deleteHistory: true,
    });
    expect(calls).toEqual(['close', 'delete']);
  });

  it('still deletes the page when terminal cleanup is already unavailable', async () => {
    const deleteWorkspace = rs.fn();

    await deleteWorkspaceWithTerminalCleanup({
      workspaceId: 'workspace-1',
      closeTerminal: async () => {
        throw new Error('terminal already exited');
      },
      deleteWorkspace,
    });

    expect(deleteWorkspace).toHaveBeenCalledWith('workspace-1');
  });
});
