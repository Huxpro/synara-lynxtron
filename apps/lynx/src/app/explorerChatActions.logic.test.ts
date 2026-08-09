import { describe, expect, it } from '@rstest/core';

import {
  applyExplorerChatAction,
  type ExplorerChatAction,
} from './explorerChatActions.logic';

function runAction(input: {
  readonly action: ExplorerChatAction;
  readonly existingMentions?: ReadonlyArray<{ name: string; path: string }>;
  readonly existingPrompt?: string;
  readonly path?: string;
}) {
  let mentions = input.existingMentions ?? [];
  let prompt = input.existingPrompt ?? '';
  const store = {
    draftsByThreadId: {
      thread: {
        mentions,
        prompt,
      },
    },
    setMentions: (
      _threadId: string,
      nextMentions: ReadonlyArray<{ name: string; path: string }>
    ) => {
      mentions = nextMentions;
    },
    setPrompt: (_threadId: string, nextPrompt: string) => {
      prompt = nextPrompt;
    },
  };
  applyExplorerChatAction({
    action: input.action,
    path: input.path ?? 'src/app/router.tsx',
    store,
    threadId: 'thread',
  });
  return { mentions, prompt };
}

describe('Explorer chat actions', () => {
  it('adds a whole-file reference and structured mention metadata', () => {
    expect(runAction({ action: 'reference' })).toEqual({
      mentions: [{ name: 'router.tsx', path: 'src/app/router.tsx' }],
      prompt: '@src/app/router.tsx ',
    });
  });

  it('uses the shared ask-why prompt and appends to an existing draft', () => {
    const result = runAction({
      action: 'ask-why',
      existingPrompt: 'Please inspect',
    });
    expect(result.prompt).toBe(
      'Please inspect Why did we implement @src/app/router.tsx this way? Check the git history if needed and explain the reasoning. '
    );
    expect(result.mentions).toEqual([
      { name: 'router.tsx', path: 'src/app/router.tsx' },
    ]);
  });

  it('does not duplicate an existing file mention', () => {
    expect(
      runAction({
        action: 'reference',
        existingMentions: [
          { name: 'router.tsx', path: 'src/app/router.tsx' },
        ],
      }).mentions
    ).toEqual([{ name: 'router.tsx', path: 'src/app/router.tsx' }]);
  });

});
