import { describe, expect, it } from '@rstest/core';

import {
  applyNativeComposerDisplayEdit,
  createNativeComposerDraftProjection,
  displayOffsetForCanonicalOffset,
  NATIVE_COMPOSER_TOKEN_ANCHOR,
} from './composerDraftProjection.logic';

const mention = {
  name: 'Release prep',
  path: 'thread://release',
};
const reviewSkill = {
  name: 'review',
  path: '/skills/review/SKILL.md',
};
const polishSkill = {
  name: 'polish',
  path: '/skills/polish/SKILL.md',
};
const terminalContext = {
  id: 'terminal-context-1',
  threadId: 'thread-1' as never,
  terminalId: 'terminal-1',
  terminalLabel: 'Terminal 1',
  lineStart: 4,
  lineEnd: 5,
  text: 'first\nsecond',
  createdAt: '2026-08-29T00:00:00.000Z',
};

function projection(
  canonicalText: string,
  options?: {
    mentions?: typeof mention[];
    skills?: Array<typeof reviewSkill>;
  }
) {
  return createNativeComposerDraftProjection({
    canonicalText,
    mentions: options?.mentions ?? [],
    skills: options?.skills ?? [],
  });
}

describe('native Composer draft projection', () => {
  it('replaces canonical skill and mention syntax with one display anchor each', () => {
    const result = projection('Use /review with @"Release prep" next', {
      mentions: [mention],
      skills: [reviewSkill],
    });

    expect(result.displayText).toBe(
      `Use ${NATIVE_COMPOSER_TOKEN_ANCHOR} with ${NATIVE_COMPOSER_TOKEN_ANCHOR} next`
    );
    expect(result.displayTokens).toEqual([
      {
        canonicalText: '/review',
        key: 'skill:/skills/review/SKILL.md',
        kind: 'skill',
        label: 'Review',
      },
      {
        canonicalText: '@"Release prep"',
        key: 'mention:thread://release',
        kind: 'mention',
        label: 'Release prep',
      },
    ]);
    expect(result.displayText).not.toContain('/review');
    expect(result.displayText).not.toContain('Release prep');
  });

  it('preserves multiple and duplicate tokens in canonical order', () => {
    const result = createNativeComposerDraftProjection({
      canonicalText: '/review then /review and /polish',
      mentions: [],
      skills: [reviewSkill, polishSkill],
    });

    expect(result.displayTokens.map((token) => token.label)).toEqual([
      'Review',
      'Review',
      'Polish',
    ]);
    expect(result.displayText).toBe(
      `${NATIVE_COMPOSER_TOKEN_ANCHOR} then ${NATIVE_COMPOSER_TOKEN_ANCHOR} and ${NATIVE_COMPOSER_TOKEN_ANCHOR}`
    );
  });

  it('maps normal display edits back to canonical text without changing tokens', () => {
    const current = projection('Use /review now', { skills: [reviewSkill] });
    const nextDisplay = `${current.displayText} please`;
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: nextDisplay.length,
      displaySelectionEnd: nextDisplay.length,
    });

    expect(edit.canonicalText).toBe('Use /review now please');
    expect(edit.skills).toEqual([reviewSkill]);
    expect(edit.canonicalSelectionStart).toBe(edit.canonicalText.length);
  });

  it('deletes a token atomically when Backspace removes its anchor', () => {
    const current = projection('Use /review now', { skills: [reviewSkill] });
    const nextDisplay = current.displayText.replace(
      NATIVE_COMPOSER_TOKEN_ANCHOR,
      ''
    );
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: 4,
      displaySelectionEnd: 4,
    });

    expect(edit.canonicalText).toBe('Use  now');
    expect(edit.skills).toEqual([]);
  });

  it('projects and atomically removes terminal context placeholders', () => {
    const current = createNativeComposerDraftProjection({
      canonicalText: '\uFFFC explain this output',
      mentions: [],
      skills: [],
      terminalContexts: [terminalContext],
    });

    expect(current.displayTokens[0]).toEqual({
      canonicalText: '\uFFFC',
      key: 'terminal-context:terminal-context-1',
      kind: 'terminal-context',
      label: 'Terminal 1 lines 4-5',
    });
    const nextDisplay = current.displayText.replace(
      NATIVE_COMPOSER_TOKEN_ANCHOR,
      ''
    );
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: 0,
      displaySelectionEnd: 0,
    });

    expect(edit.canonicalText).toBe(' explain this output');
    expect(edit.terminalContexts).toEqual([]);
  });

  it('deletes a selection spanning text and multiple tokens atomically', () => {
    const current = projection(
      'Before /review middle @"Release prep" after',
      {
        mentions: [mention],
        skills: [reviewSkill],
      }
    );
    const start = current.displayText.indexOf(NATIVE_COMPOSER_TOKEN_ANCHOR);
    const end =
      current.displayText.lastIndexOf(NATIVE_COMPOSER_TOKEN_ANCHOR) +
      NATIVE_COMPOSER_TOKEN_ANCHOR.length;
    const nextDisplay =
      current.displayText.slice(0, start) + current.displayText.slice(end);
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: start,
      displaySelectionEnd: start,
    });

    expect(edit.canonicalText).toBe('Before  after');
    expect(edit.skills).toEqual([]);
    expect(edit.mentions).toEqual([]);
  });

  it('retains the correct duplicate when one of two identical skill anchors is deleted', () => {
    const current = projection('/review then /review', {
      skills: [reviewSkill],
    });
    const firstAnchor = current.displayText.indexOf(
      NATIVE_COMPOSER_TOKEN_ANCHOR
    );
    const nextDisplay =
      current.displayText.slice(0, firstAnchor) +
      current.displayText.slice(firstAnchor + NATIVE_COMPOSER_TOKEN_ANCHOR.length);
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: 0,
      displaySelectionEnd: 0,
    });

    expect(edit.canonicalText).toBe(' then /review');
    expect(edit.skills).toEqual([reviewSkill]);
  });

  it('maps canonical selections through token anchors for restore and undo', () => {
    const current = projection('Use /review now', { skills: [reviewSkill] });
    expect(
      displayOffsetForCanonicalOffset({
        projection: current,
        canonicalOffset: 'Use /review'.length,
      })
    ).toBe(`Use ${NATIVE_COMPOSER_TOKEN_ANCHOR}`.length);
    expect(
      displayOffsetForCanonicalOffset({
        projection: current,
        canonicalOffset: current.canonicalText.length,
      })
    ).toBe(current.displayText.length);
  });

  it('keeps tokens while adjacent IME text changes and dispatches canonical text', () => {
    const current = projection('/review ', { skills: [reviewSkill] });
    const nextDisplay = `${current.displayText}中文`;
    const edit = applyNativeComposerDisplayEdit({
      projection: current,
      displayText: nextDisplay,
      displaySelectionStart: nextDisplay.length,
      displaySelectionEnd: nextDisplay.length,
    });

    expect(edit.displayText).toBe(`${NATIVE_COMPOSER_TOKEN_ANCHOR} 中文`);
    expect(edit.canonicalText).toBe('/review 中文');
    expect(edit.skills).toEqual([reviewSkill]);
  });
});
