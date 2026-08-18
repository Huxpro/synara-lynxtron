import { describe, expect, it } from '@rstest/core';

import { normalizeLynxRpcPayload } from './rpcPayload.logic';

describe('normalizeLynxRpcPayload', () => {
  it('restores nullable thread creation fields stripped by the Lynx bridge', () => {
    expect(
      normalizeLynxRpcPayload('orchestration.dispatchCommand', {
        type: 'thread.create',
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.create',
      threadId: 'thread-1',
      branch: null,
      worktreePath: null,
    });
  });

  it('preserves explicit thread context and unrelated payloads', () => {
    const command = {
      type: 'thread.create',
      branch: 'main',
      worktreePath: '/tmp/worktree',
    };
    expect(
      normalizeLynxRpcPayload('orchestration.dispatchCommand', command)
    ).toEqual(command);
    expect(normalizeLynxRpcPayload('server.getConfig', {})).toEqual({});
  });
});
