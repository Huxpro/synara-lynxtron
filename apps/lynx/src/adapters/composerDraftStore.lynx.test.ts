import { beforeEach, describe, expect, it } from '@rstest/core';

import { createPastedTextDraft } from '@synara-web/lib/composerPastedText';
import { useComposerDraftStore } from './composerDraftStore.lynx';

describe('Lynx composer draft attachment subset', () => {
  beforeEach(() => {
    useComposerDraftStore.setState({ draftsByThreadId: {} });
  });

  it('keeps pasted text when the editable prompt is empty and removes an empty draft', () => {
    const pastedText = createPastedTextDraft({
      id: 'paste-1',
      createdAt: '2026-07-29T00:00:00.000Z',
      text: 'large paste',
    });
    const store = useComposerDraftStore.getState();

    store.addPastedText('thread-1', pastedText);
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
    ).toEqual({
      files: [],
      mentions: [],
      prompt: '',
      pastedTexts: [pastedText],
      skills: [],
    });

    useComposerDraftStore.getState().removePastedText('thread-1', 'paste-1');
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
    ).toBeUndefined();
  });

  it('clears prompt and attachment state together after a successful send', () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt('thread-1', 'ship it');
    useComposerDraftStore.getState().addPastedText(
      'thread-1',
      createPastedTextDraft({
        id: 'paste-1',
        createdAt: '2026-07-29T00:00:00.000Z',
        text: 'context',
      })
    );

    useComposerDraftStore.getState().clearDraft('thread-1');
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
    ).toBeUndefined();
  });

  it('keeps the selected model while clearing sent prompt content', () => {
    const store = useComposerDraftStore.getState();
    store.setPrompt('thread-1', 'ship it');
    store.setModelSelection('thread-1', {
      provider: 'codex',
      model: 'gpt-5.6-sol',
    });

    useComposerDraftStore.getState().clearDraft('thread-1');
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
    ).toEqual({
      files: [],
      mentions: [],
      prompt: '',
      pastedTexts: [],
      skills: [],
      modelSelection: {
        provider: 'codex',
        model: 'gpt-5.6-sol',
      },
    });
  });

  it('keeps picked-file capabilities until removal or successful clear', () => {
    const file = {
      type: 'file' as const,
      id: 'lynx-file-1',
      token: '11111111-1111-4111-8111-111111111111',
      name: 'notes.txt',
      mimeType: 'text/plain',
      sizeBytes: 12,
    };
    const store = useComposerDraftStore.getState();
    store.addFiles('thread-1', [file, file]);
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']?.files
    ).toEqual([file]);

    useComposerDraftStore.getState().removeFile('thread-1', file.id);
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
    ).toBeUndefined();
  });

  it('updates and preserves options when a trait changes on the same model', () => {
    const store = useComposerDraftStore.getState();
    store.setModelSelection('thread-1', {
      provider: 'codex',
      model: 'gpt-5.6-sol',
      options: { reasoningEffort: 'medium' },
    });
    useComposerDraftStore.getState().setModelSelection('thread-1', {
      provider: 'codex',
      model: 'gpt-5.6-sol',
      options: { reasoningEffort: 'high' },
    });

    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']
        ?.modelSelection
    ).toEqual({
      provider: 'codex',
      model: 'gpt-5.6-sol',
      options: { reasoningEffort: 'high' },
    });
  });

  it('keeps only structured mentions whose token remains in the prompt', () => {
    const mention = {
      name: 'Release prep',
      path: 'thread://thread-2',
    };
    const store = useComposerDraftStore.getState();
    store.setPrompt('thread-1', '@"Release prep" ');
    store.setMentions('thread-1', [mention]);
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']?.mentions
    ).toEqual([mention]);

    useComposerDraftStore.getState().setPrompt('thread-1', 'No reference');
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']?.mentions
    ).toEqual([]);
  });

  it('keeps only structured skills whose canonical token remains in the prompt', () => {
    const skill = { name: 'polish', path: '/skills/polish' };
    const store = useComposerDraftStore.getState();
    store.setPrompt('thread-1', '/polish ');
    store.setSkills('thread-1', [skill]);
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']?.skills
    ).toEqual([skill]);

    useComposerDraftStore.getState().setPrompt('thread-1', 'No skill');
    expect(
      useComposerDraftStore.getState().draftsByThreadId['thread-1']?.skills
    ).toEqual([]);
  });
});
