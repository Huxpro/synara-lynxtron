// Lynx facade for the main composer draft domain/actions.
//
// The Web facade wires the complete attachments/model/persistence store. A
// direct main-thread probe exceeded the dev resource ceiling and the clean
// production bundle failed template JSON parsing. Keep the portable prompt
// transition here while the heavier graph remains a background split.

import { create } from 'zustand';
import type {
  ModelSelection,
  ProviderMentionReference,
} from '@synara/contracts';

import { updateComposerDraftPrompt } from '@synara-web/composerDraftPrompt.logic';
import {
  filterPromptProviderMentionReferences,
  providerMentionReferencesEqual,
} from '@synara-web/lib/composerMentions';
import type { PastedTextDraft } from '@synara-web/lib/composerPastedText';
import type { NativeComposerFileAttachment } from '../components/composer/composerAttachments.lynx';

interface LynxComposerDraft {
  readonly files: ReadonlyArray<NativeComposerFileAttachment>;
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly modelSelection?: ModelSelection;
  readonly pastedTexts: ReadonlyArray<PastedTextDraft>;
  readonly prompt: string;
}

interface LynxComposerDraftStoreState {
  readonly draftsByThreadId: Record<string, LynxComposerDraft>;
  readonly addPastedText: (threadId: string, pastedText: PastedTextDraft) => void;
  readonly addFiles: (
    threadId: string,
    files: ReadonlyArray<NativeComposerFileAttachment>
  ) => void;
  readonly clearDraft: (threadId: string) => void;
  readonly removePastedText: (threadId: string, pastedTextId: string) => void;
  readonly removeFile: (threadId: string, fileId: string) => void;
  readonly setModelSelection: (
    threadId: string,
    modelSelection: ModelSelection
  ) => void;
  readonly setMentions: (
    threadId: string,
    mentions: ReadonlyArray<ProviderMentionReference>
  ) => void;
  readonly setPrompt: (threadId: string, prompt: string) => void;
}

function emptyDraft(): LynxComposerDraft {
  return { files: [], mentions: [], pastedTexts: [], prompt: '' };
}

function shouldRemoveDraft(draft: LynxComposerDraft): boolean {
  return (
    draft.prompt.length === 0 &&
    draft.files.length === 0 &&
    draft.mentions.length === 0 &&
    draft.pastedTexts.length === 0 &&
    draft.modelSelection === undefined
  );
}

function modelSelectionsEqual(
  left: ModelSelection | undefined,
  right: ModelSelection
): boolean {
  if (!left || left.provider !== right.provider || left.model !== right.model) {
    return false;
  }
  const leftOptions = left.options as Record<string, unknown> | undefined;
  const rightOptions = right.options as Record<string, unknown> | undefined;
  if (leftOptions === rightOptions) return true;
  if (!leftOptions || !rightOptions) return false;
  const keys = new Set([
    ...Object.keys(leftOptions),
    ...Object.keys(rightOptions),
  ]);
  for (const key of keys) {
    if (leftOptions[key] !== rightOptions[key]) return false;
  }
  return true;
}

export const useComposerDraftStore = create<LynxComposerDraftStoreState>()(
  (set) => ({
    draftsByThreadId: {},
    addFiles: (threadId, files) =>
      set((state) => {
        if (files.length === 0) return state;
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        const existingTokens = new Set(current.files.map((file) => file.token));
        const incoming: NativeComposerFileAttachment[] = [];
        for (const file of files) {
          if (existingTokens.has(file.token)) continue;
          existingTokens.add(file.token);
          incoming.push(file);
        }
        if (incoming.length === 0) return state;
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: { ...current, files: [...current.files, ...incoming] },
          },
        };
      }),
    addPastedText: (threadId, pastedText) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        if (current.pastedTexts.some((entry) => entry.id === pastedText.id)) {
          return state;
        }
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: {
              ...current,
              pastedTexts: [...current.pastedTexts, pastedText],
            },
          },
        };
      }),
    clearDraft: (threadId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current) return state;
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (current.modelSelection) {
          draftsByThreadId[threadId] = {
            files: [],
            mentions: [],
            modelSelection: current.modelSelection,
            pastedTexts: [],
            prompt: '',
          };
        } else {
          delete draftsByThreadId[threadId];
        }
        return { draftsByThreadId };
      }),
    removePastedText: (threadId, pastedTextId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current) return state;
        const pastedTexts = current.pastedTexts.filter(
          (entry) => entry.id !== pastedTextId
        );
        if (pastedTexts.length === current.pastedTexts.length) return state;
        const nextDraft = { ...current, pastedTexts };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
    removeFile: (threadId, fileId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current) return state;
        const files = current.files.filter((file) => file.id !== fileId);
        if (files.length === current.files.length) return state;
        const nextDraft = { ...current, files };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
    setModelSelection: (threadId, modelSelection) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        if (modelSelectionsEqual(current.modelSelection, modelSelection)) {
          return state;
        }
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: { ...current, modelSelection },
          },
        };
      }),
    setMentions: (threadId, mentions) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        if (providerMentionReferencesEqual(current.mentions, mentions)) {
          return state;
        }
        const nextDraft = { ...current, mentions: [...mentions] };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
    setPrompt: (threadId, prompt) =>
      set((state) => {
        const draftsByThreadId = updateComposerDraftPrompt({
          draftsByThreadId: state.draftsByThreadId,
          threadId,
          prompt,
          createEmptyDraft: emptyDraft,
          shouldRemoveDraft,
        });
        const nextDraft = draftsByThreadId[threadId];
        if (!nextDraft) return { draftsByThreadId };
        const mentions = filterPromptProviderMentionReferences(
          prompt,
          nextDraft.mentions
        );
        if (providerMentionReferencesEqual(nextDraft.mentions, mentions)) {
          return { draftsByThreadId };
        }
        return {
          draftsByThreadId: {
            ...draftsByThreadId,
            [threadId]: { ...nextDraft, mentions },
          },
        };
      }),
  })
);
