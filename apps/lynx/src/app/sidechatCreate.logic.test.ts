import { describe, expect, it } from '@rstest/core';
import type { ThreadHeaderSummary } from './queries';

import {
  buildLynxSidechatCreateCommand,
  canCreateLynxSidechat,
} from './sidechatCreate.logic';

const source = {
  id: 'thread-main',
  title: 'Investigate issue',
  projectId: 'project-1',
  branch: 'main',
  envMode: 'local',
  modelSelection: { provider: 'codex', model: 'gpt-5.6-sol' },
  runtimeMode: 'full-access',
  interactionMode: 'plan',
  worktreePath: null,
  associatedWorktreePath: null,
  associatedWorktreeBranch: null,
  associatedWorktreeRef: null,
  createBranchFlowCompleted: false,
  sidechatSourceThreadId: null,
  messages: [],
} as unknown as ThreadHeaderSummary;

describe('Native Side-chat creation', () => {
  it('matches the Web thread.fork.create policy', () => {
    const command = buildLynxSidechatCreateCommand({
      commandId: 'command-1',
      createdAt: '2026-08-26T00:00:00.000Z',
      source,
      threadId: 'thread-side-1',
    });
    expect(command).toMatchObject({
      type: 'thread.fork.create',
      threadId: 'thread-side-1',
      sourceThreadId: 'thread-main',
      sidechatSourceThreadId: 'thread-main',
      projectId: 'project-1',
      title: 'Sidechat: Investigate issue',
      modelSelection: source.modelSelection,
      runtimeMode: 'approval-required',
      interactionMode: 'default',
      envMode: 'local',
      branch: 'main',
    });
  });

  it('does not offer nested Side creation from a Side thread', () => {
    expect(canCreateLynxSidechat(source)).toBe(true);
    expect(
      canCreateLynxSidechat({ ...source, sidechatSourceThreadId: 'thread-main' })
    ).toBe(false);
    expect(canCreateLynxSidechat(undefined)).toBe(false);
  });
});
