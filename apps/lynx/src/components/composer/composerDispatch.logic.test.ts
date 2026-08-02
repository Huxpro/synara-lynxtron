import { describe, expect, it } from '@rstest/core';

import {
  buildComposerInteractionModeSetCommand,
  buildComposerRuntimeModeSetCommand,
  buildComposerTurnInterruptCommand,
  buildComposerTurnStartCommand,
  isConnectingComposerSession,
  isRunningComposerSession,
} from './composerDispatch.logic';

describe('composer dispatch logic', () => {
  it('matches Web connecting versus interruptible session states', () => {
    expect(isConnectingComposerSession('starting')).toBe(true);
    expect(isConnectingComposerSession('running')).toBe(false);
    expect(isRunningComposerSession('starting')).toBe(false);
    expect(isRunningComposerSession('running')).toBe(true);
    expect(isRunningComposerSession('ready')).toBe(false);
    expect(isRunningComposerSession(null)).toBe(false);
  });

  it('builds the real thread interaction-mode command', () => {
    expect(
      buildComposerInteractionModeSetCommand({
        commandId: 'command-plan',
        createdAt: '2026-07-29T08:00:00.000Z',
        interactionMode: 'plan',
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.interaction-mode.set',
      commandId: 'command-plan',
      threadId: 'thread-1',
      interactionMode: 'plan',
      createdAt: '2026-07-29T08:00:00.000Z',
    });
  });

  it('builds the real thread runtime-mode command', () => {
    expect(
      buildComposerRuntimeModeSetCommand({
        commandId: 'command-access',
        createdAt: '2026-07-29T08:01:00.000Z',
        runtimeMode: 'approval-required',
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.runtime-mode.set',
      commandId: 'command-access',
      threadId: 'thread-1',
      runtimeMode: 'approval-required',
      createdAt: '2026-07-29T08:01:00.000Z',
    });
  });

  it('builds the same orchestration turn-start shape used by Web', () => {
    expect(
      buildComposerTurnStartCommand({
        commandId: 'command-1',
        createdAt: '2026-07-29T12:00:00.000Z',
        interactionMode: 'default',
        messageId: 'message-1',
        modelSelection: { provider: 'opencode', model: 'deepseek-v4-flash-free' },
        mentions: [
          {
            name: 'Release prep',
            path: 'thread://thread-2',
          },
        ],
        runtimeMode: 'full-access',
        text: 'Ship it',
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.turn.start',
      commandId: 'command-1',
      threadId: 'thread-1',
      message: {
        messageId: 'message-1',
        role: 'user',
        text: 'Ship it',
        attachments: [],
        mentions: [
          {
            name: 'Release prep',
            path: 'thread://thread-2',
          },
        ],
      },
      modelSelection: { provider: 'opencode', model: 'deepseek-v4-flash-free' },
      runtimeMode: 'full-access',
      interactionMode: 'default',
      createdAt: '2026-07-29T12:00:00.000Z',
    });
  });

  it('preserves runtime trait options in the turn model selection', () => {
    const command = buildComposerTurnStartCommand({
      commandId: 'command-1',
      createdAt: '2026-07-29T12:00:00.000Z',
      interactionMode: 'default',
      messageId: 'message-1',
      modelSelection: {
        provider: 'codex',
        model: 'gpt-5.6-sol',
        options: { reasoningEffort: 'high', fastMode: true },
      },
      runtimeMode: 'full-access',
      text: 'Reply with only TRAIT-OK.',
      threadId: 'thread-1',
    });

    expect(command).toMatchObject({
      type: 'thread.turn.start',
      modelSelection: {
        provider: 'codex',
        model: 'gpt-5.6-sol',
        options: { reasoningEffort: 'high', fastMode: true },
      },
    });
  });

  it('carries server-staged file attachments into the real turn command', () => {
    const command = buildComposerTurnStartCommand({
      attachments: [
        {
          type: 'file',
          id: 'attachment-1',
          name: 'notes.txt',
          mimeType: 'text/plain',
          sizeBytes: 12,
        },
      ],
      commandId: 'command-attachment',
      createdAt: '2026-07-29T12:00:00.000Z',
      interactionMode: 'default',
      messageId: 'message-attachment',
      modelSelection: { provider: 'opencode', model: 'deepseek-v4-flash-free' },
      runtimeMode: 'full-access',
      text: 'Read this file',
      threadId: 'thread-1',
    });

    expect(command).toMatchObject({
      type: 'thread.turn.start',
      message: {
        attachments: [
          {
            type: 'file',
            id: 'attachment-1',
            name: 'notes.txt',
            mimeType: 'text/plain',
            sizeBytes: 12,
          },
        ],
      },
    });
  });

  it('includes the active turn id only when the server exposes one', () => {
    const base = {
      commandId: 'command-1',
      createdAt: '2026-07-29T12:00:00.000Z',
      threadId: 'thread-1',
    };
    expect(
      buildComposerTurnInterruptCommand({ ...base, activeTurnId: 'turn-1' })
    ).toMatchObject({ type: 'thread.turn.interrupt', turnId: 'turn-1' });
    expect(
      buildComposerTurnInterruptCommand({ ...base, activeTurnId: null })
    ).not.toHaveProperty('turnId');
  });
});
