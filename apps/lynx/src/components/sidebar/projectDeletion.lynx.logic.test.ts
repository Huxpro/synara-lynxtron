import { describe, expect, it, rs } from '@rstest/core';

import {
  buildNativeProjectDeleteCommand,
  deleteNativeProjectThreads,
  removeNativeProject,
} from './projectDeletion.lynx.logic';

describe('Native project deletion', () => {
  it('stops live sessions, cleans terminal history, and continues after a delete failure', async () => {
    const commands: any[] = [];
    const closeTerminalHistory = rs.fn(async () => undefined);
    const cleanupThreadState = rs.fn();
    const onFailure = rs.fn();
    const result = await deleteNativeProjectThreads({
      threads: [
        { id: 'a', sessionStatus: 'running' },
        { id: 'b', sessionStatus: 'closed' },
      ],
      dispatch: async (command) => {
        commands.push(command);
        if (command.type === 'thread.delete' && command.threadId === 'b') {
          throw new Error('failed');
        }
      },
      closeTerminalHistory,
      cleanupThreadState,
      onFailure,
    });

    expect(commands.map((command) => [command.type, command.threadId])).toEqual([
      ['thread.session.stop', 'a'],
      ['thread.delete', 'a'],
      ['thread.delete', 'b'],
    ]);
    expect(closeTerminalHistory).toHaveBeenCalledTimes(2);
    expect(cleanupThreadState).toHaveBeenCalledOnce();
    expect(cleanupThreadState).toHaveBeenCalledWith('a');
    expect(result.deletedThreadIds).toEqual(['a']);
    expect(result.failureCount).toBe(1);
    expect(onFailure).toHaveBeenCalledOnce();
  });

  it('builds the canonical project delete command', () => {
    expect(buildNativeProjectDeleteCommand('project-a' as never)).toMatchObject({
      type: 'project.delete',
      projectId: 'project-a',
    });
  });

  it('removes the project only after every thread is deleted', async () => {
    const commands: any[] = [];
    const result = await removeNativeProject({
      projectId: 'project-a' as never,
      threads: [{ id: 'a' }, { id: 'b' }],
      dispatch: async (command) => {
        commands.push(command);
      },
      closeTerminalHistory: async () => undefined,
      cleanupThreadState: async () => undefined,
    });
    expect(commands.map((command) => command.type)).toEqual([
      'thread.delete',
      'thread.delete',
      'project.delete',
    ]);
    expect(result.projectDeleted).toBe(true);
    expect(result.projectDeleteError).toBeNull();
  });

  it('keeps the project when any thread deletion fails', async () => {
    const commands: any[] = [];
    const result = await removeNativeProject({
      projectId: 'project-a' as never,
      threads: [{ id: 'a' }, { id: 'b' }],
      dispatch: async (command) => {
        commands.push(command);
        if (command.type === 'thread.delete' && command.threadId === 'b') {
          throw new Error('failed');
        }
      },
      closeTerminalHistory: async () => undefined,
      cleanupThreadState: async () => undefined,
    });
    expect(commands.map((command) => command.type)).toEqual([
      'thread.delete',
      'thread.delete',
    ]);
    expect(result.projectDeleted).toBe(false);
    expect(result.projectDeleteError).toBeNull();
  });

  it('reports a project-delete failure after preserving completed thread cleanup', async () => {
    const cleaned: string[] = [];
    const result = await removeNativeProject({
      projectId: 'project-a' as never,
      threads: [{ id: 'a' }],
      dispatch: async (command) => {
        if (command.type === 'project.delete') throw new Error('project failed');
      },
      closeTerminalHistory: async () => undefined,
      cleanupThreadState: async (threadId) => {
        cleaned.push(threadId);
      },
    });
    expect(cleaned).toEqual(['a']);
    expect(result.projectDeleted).toBe(false);
    expect(result.projectDeleteError).toBeInstanceOf(Error);
  });
});
