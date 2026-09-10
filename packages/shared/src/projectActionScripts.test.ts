import { describe, expect, it } from 'vitest';
import type { ProjectScript } from '@synara/contracts';
import { addProjectAction, deleteProjectAction, updateProjectAction } from './projectActionScripts';

const setup: ProjectScript = { id: 'setup', name: 'Setup', command: 'bun install', icon: 'configure', runOnWorktreeCreate: true };
const test: ProjectScript = { id: 'test', name: 'Test', command: 'bun test', icon: 'test', runOnWorktreeCreate: false };

describe('project action scripts', () => {
  it('keeps at most one worktree setup action while adding and updating', () => {
    expect(addProjectAction([setup], 'build', { name: 'Build', command: 'bun build', icon: 'build', runOnWorktreeCreate: true })).toEqual([
      { ...setup, runOnWorktreeCreate: false },
      { id: 'build', name: 'Build', command: 'bun build', icon: 'build', runOnWorktreeCreate: true },
    ]);
    expect(updateProjectAction([setup, test], 'test', { name: 'Test all', command: 'bun run test', icon: 'test', runOnWorktreeCreate: true })).toEqual([
      { ...setup, runOnWorktreeCreate: false },
      { id: 'test', name: 'Test all', command: 'bun run test', icon: 'test', runOnWorktreeCreate: true },
    ]);
  });

  it('deletes only the requested action', () => {
    expect(deleteProjectAction([setup, test], 'setup')).toEqual([test]);
  });
});
