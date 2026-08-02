import { describe, expect, it } from '@rstest/core';

import {
  buildLynxSlashCommandItems,
  resolveLynxSlashCommandSelection,
  resolveLynxThreadMentionSelection,
} from './composerCommandMenu.logic';

const TRIGGER = {
  kind: 'slash-command',
  query: 'pl',
  rangeStart: 6,
  rangeEnd: 9,
} as const;

describe('Lynx composer command menu bridge', () => {
  it('offers only commands backed by real Lynx actions', () => {
    expect(buildLynxSlashCommandItems('').map((item) => item.id)).toEqual([
      'slash:plan',
      'slash:default',
      'slash:subagents',
    ]);
    expect(buildLynxSlashCommandItems('pl').map((item) => item.id)).toEqual([
      'slash:plan',
    ]);
  });

  it('clears the active trigger and requests the real interaction mode', () => {
    const [plan] = buildLynxSlashCommandItems('plan');
    expect(
      resolveLynxSlashCommandSelection({
        item: plan!,
        prompt: 'hello /pl world',
        trigger: TRIGGER,
      })
    ).toEqual({
      prompt: 'hello  world',
      interactionMode: 'plan',
      selectionStart: 6,
      selectionEnd: 6,
    });
  });

  it('uses the canonical subagent prompt instead of a fake menu-only token', () => {
    const [subagents] = buildLynxSlashCommandItems('sub');
    const transition = resolveLynxSlashCommandSelection({
      item: subagents!,
      prompt: '/sub',
      trigger: {
        kind: 'slash-command',
        query: 'sub',
        rangeStart: 0,
        rangeEnd: 4,
      },
    });
    expect(transition?.interactionMode).toBeNull();
    expect(transition?.prompt).toContain(
      'Run subagents for different tasks.'
    );
    expect(transition?.selectionStart).toBe(transition?.prompt.length);
    expect(transition?.selectionEnd).toBe(transition?.prompt.length);
  });

  it('atomically replaces a thread trigger and returns its structured reference', () => {
    expect(
      resolveLynxThreadMentionSelection({
        item: {
          id: 'thread:thread-2',
          type: 'thread',
          threadId: 'thread-2',
          provider: 'codex',
          mention: {
            name: 'Release prep',
            path: 'thread://thread-2',
          },
          label: 'Release prep',
          description: 'Synara',
        },
        prompt: 'Compare @rel next',
        trigger: {
          kind: 'mention',
          query: 'rel',
          rangeStart: 8,
          rangeEnd: 12,
        },
      })
    ).toEqual({
      mention: {
        name: 'Release prep',
        path: 'thread://thread-2',
      },
      prompt: 'Compare @\"Release prep\" next',
      selectionStart: 24,
      selectionEnd: 24,
    });
  });
});
