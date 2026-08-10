// Lynx facade for the main composer draft domain/actions.
//
// The Web facade wires the complete attachments/model/persistence store. A
// direct main-thread probe exceeded the dev resource ceiling and the clean
// production bundle failed template JSON parsing. Keep the portable prompt
// transition here while the heavier graph remains a background split.

import { create } from 'zustand';
import {
  PROVIDER_SEND_TURN_MAX_ATTACHMENTS,
  type ChatAssistantSelectionAttachment,
  type ModelSelection,
  type ProviderMentionReference,
  type ProviderSkillReference,
} from '@synara/contracts';

import { updateComposerDraftPrompt } from '@synara-web/composerDraftPrompt.logic';
import { normalizeAssistantSelectionAttachment } from '@synara-web/lib/assistantSelections';
import {
  filterPromptProviderMentionReferences,
  filterPromptSkillReferences,
  providerMentionReferencesEqual,
  providerSkillReferencesEqual,
} from '@synara-web/lib/composerMentions';
import type { PastedTextDraft } from '@synara-web/lib/composerPastedText';
import {
  normalizeFileCommentSelection,
  type FileCommentDraft,
} from '@synara-web/lib/fileComments';
import type { KanbanComposerDraftSnapshot } from '@synara-web/components/kanban/kanban.logic';
import type {
  NativeComposerFileAttachment,
  NativeComposerImageAttachment,
} from '../components/composer/composerAttachments.lynx';
import { webStorage } from '../platform/storage';

export const LYNX_COMPOSER_DRAFT_STORAGE_KEY =
  'synara.lynx.composer-drafts:v1';

interface LynxComposerDraft {
  readonly assistantSelections: ReadonlyArray<ChatAssistantSelectionAttachment>;
  readonly files: ReadonlyArray<NativeComposerFileAttachment>;
  readonly images: ReadonlyArray<NativeComposerImageAttachment>;
  readonly nonPersistedImageIds: ReadonlyArray<string>;
  readonly fileComments: ReadonlyArray<FileCommentDraft>;
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly modelSelection?: ModelSelection;
  readonly pastedTexts: ReadonlyArray<PastedTextDraft>;
  readonly prompt: string;
  readonly skills: ReadonlyArray<ProviderSkillReference>;
}

interface LynxComposerDraftStoreState {
  readonly draftsByThreadId: Record<string, LynxComposerDraft>;
  readonly addAssistantSelection: (
    threadId: string,
    selection: ChatAssistantSelectionAttachment
  ) => void;
  readonly addPastedText: (threadId: string, pastedText: PastedTextDraft) => void;
  readonly addFiles: (
    threadId: string,
    files: ReadonlyArray<NativeComposerFileAttachment>
  ) => void;
  readonly addImages: (
    threadId: string,
    images: ReadonlyArray<NativeComposerImageAttachment>
  ) => void;
  readonly addFileComment: (
    threadId: string,
    comment: FileCommentDraft
  ) => void;
  readonly clearDraft: (threadId: string) => void;
  readonly discardDraft: (threadId: string) => void;
  readonly removePastedText: (threadId: string, pastedTextId: string) => void;
  readonly removeFile: (threadId: string, fileId: string) => void;
  readonly removeImage: (threadId: string, imageId: string) => void;
  readonly removeFileComments: (threadId: string) => void;
  readonly removeAssistantSelections: (threadId: string) => void;
  readonly setModelSelection: (
    threadId: string,
    modelSelection: ModelSelection
  ) => void;
  readonly setMentions: (
    threadId: string,
    mentions: ReadonlyArray<ProviderMentionReference>
  ) => void;
  readonly setPrompt: (threadId: string, prompt: string) => void;
  readonly setSkills: (
    threadId: string,
    skills: ReadonlyArray<ProviderSkillReference>
  ) => void;
}

export function projectLynxKanbanComposerDrafts(
  draftsByThreadId: Readonly<Record<string, LynxComposerDraft>>
): Readonly<Record<string, KanbanComposerDraftSnapshot>> {
  return Object.fromEntries(
    Object.entries(draftsByThreadId).map(([threadId, draft]) => [
      threadId,
      {
        prompt: draft.prompt,
        hasAttachments:
          draft.files.length > 0 ||
          draft.images.length > 0 ||
          draft.assistantSelections.length > 0 ||
          draft.fileComments.length > 0 ||
          draft.pastedTexts.length > 0,
        provider: draft.modelSelection?.provider ?? null,
      },
    ])
  );
}

function isStringRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function parseAssistantSelections(
  value: unknown
): ChatAssistantSelectionAttachment[] {
  if (!Array.isArray(value)) return [];
  const selections: ChatAssistantSelectionAttachment[] = [];
  for (const candidate of value) {
    if (
      !isStringRecord(candidate) ||
      candidate.type !== 'assistant-selection' ||
      typeof candidate.id !== 'string' ||
      candidate.id.trim().length === 0 ||
      typeof candidate.assistantMessageId !== 'string' ||
      typeof candidate.text !== 'string'
    ) {
      continue;
    }
    const normalized = normalizeAssistantSelectionAttachment({
      assistantMessageId: candidate.assistantMessageId,
      text: candidate.text,
    });
    if (!normalized) continue;
    selections.push({
      type: 'assistant-selection',
      id: candidate.id,
      ...normalized,
    });
  }
  return selections;
}

function parseFileComments(value: unknown): FileCommentDraft[] {
  if (!Array.isArray(value)) return [];
  const comments: FileCommentDraft[] = [];
  for (const candidate of value) {
    if (
      !isStringRecord(candidate) ||
      typeof candidate.id !== 'string' ||
      candidate.id.trim().length === 0 ||
      typeof candidate.path !== 'string' ||
      typeof candidate.startLine !== 'number' ||
      typeof candidate.endLine !== 'number' ||
      typeof candidate.text !== 'string'
    ) {
      continue;
    }
    const normalized = normalizeFileCommentSelection({
      path: candidate.path,
      startLine: candidate.startLine,
      endLine: candidate.endLine,
      text: candidate.text,
    });
    if (normalized) comments.push({ id: candidate.id, ...normalized });
  }
  return comments;
}

function parseNativeComposerFiles(
  value: unknown
): NativeComposerFileAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (candidate): candidate is NativeComposerFileAttachment =>
      isStringRecord(candidate) &&
      candidate.type === 'file' &&
      typeof candidate.id === 'string' &&
      typeof candidate.token === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.mimeType === 'string' &&
      Number.isSafeInteger(candidate.sizeBytes) &&
      Number(candidate.sizeBytes) >= 0
  );
}

function parseNativeComposerImages(
  value: unknown
): NativeComposerImageAttachment[] {
  if (!Array.isArray(value)) return [];
  return value.filter(
    (candidate): candidate is NativeComposerImageAttachment =>
      isStringRecord(candidate) &&
      candidate.type === 'image' &&
      typeof candidate.id === 'string' &&
      typeof candidate.token === 'string' &&
      typeof candidate.name === 'string' &&
      typeof candidate.mimeType === 'string' &&
      candidate.mimeType.toLowerCase().startsWith('image/') &&
      typeof candidate.previewUrl === 'string' &&
      candidate.previewUrl.startsWith('data:image/') &&
      Number.isSafeInteger(candidate.sizeBytes) &&
      Number(candidate.sizeBytes) >= 0
  );
}

export function parsePersistedLynxComposerDrafts(
  raw: string | null
): Record<string, LynxComposerDraft> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!isStringRecord(parsed)) return {};
    const drafts: Record<string, LynxComposerDraft> = {};
    for (const [threadId, candidate] of Object.entries(parsed)) {
      if (!isStringRecord(candidate) || typeof candidate.prompt !== 'string') {
        continue;
      }
      drafts[threadId] = {
        assistantSelections: parseAssistantSelections(
          candidate.assistantSelections
        ),
        files: parseNativeComposerFiles(candidate.files),
        images: parseNativeComposerImages(candidate.images),
        nonPersistedImageIds: Array.isArray(candidate.nonPersistedImageIds)
          ? candidate.nonPersistedImageIds.filter(
              (id): id is string => typeof id === 'string'
            )
          : [],
        fileComments: parseFileComments(candidate.fileComments),
        mentions: Array.isArray(candidate.mentions)
          ? (candidate.mentions as ProviderMentionReference[])
          : [],
        ...(isStringRecord(candidate.modelSelection) &&
        typeof candidate.modelSelection.provider === 'string' &&
        typeof candidate.modelSelection.model === 'string'
          ? { modelSelection: candidate.modelSelection as ModelSelection }
          : {}),
        pastedTexts: Array.isArray(candidate.pastedTexts)
          ? (candidate.pastedTexts as PastedTextDraft[])
          : [],
        prompt: candidate.prompt,
        skills: Array.isArray(candidate.skills)
          ? (candidate.skills as ProviderSkillReference[])
          : [],
      };
    }
    return drafts;
  } catch {
    return {};
  }
}

function emptyDraft(): LynxComposerDraft {
  return {
    assistantSelections: [],
    files: [],
    images: [],
    nonPersistedImageIds: [],
    fileComments: [],
    mentions: [],
    pastedTexts: [],
    prompt: '',
    skills: [],
  };
}

function shouldRemoveDraft(draft: LynxComposerDraft): boolean {
  return (
    draft.prompt.length === 0 &&
    draft.assistantSelections.length === 0 &&
    draft.files.length === 0 &&
    draft.images.length === 0 &&
    draft.fileComments.length === 0 &&
    draft.mentions.length === 0 &&
    draft.pastedTexts.length === 0 &&
    draft.skills.length === 0 &&
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
    addAssistantSelection: (threadId, selection) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        const normalized = normalizeAssistantSelectionAttachment(selection);
        if (
          !normalized ||
          current.files.length +
              current.images.length +
              current.assistantSelections.length >=
            PROVIDER_SEND_TURN_MAX_ATTACHMENTS
        ) {
          return state;
        }
        if (
          current.assistantSelections.some(
            (entry) =>
              entry.assistantMessageId === normalized.assistantMessageId &&
              entry.text === normalized.text
          )
        ) {
          return state;
        }
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: {
              ...current,
              assistantSelections: [
                ...current.assistantSelections,
                {
                  type: 'assistant-selection',
                  id: selection.id,
                  ...normalized,
                },
              ],
            },
          },
        };
      }),
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
    addImages: (threadId, images) =>
      set((state) => {
        if (images.length === 0) return state;
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        const existingTokens = new Set(
          current.images.map((image) => image.token)
        );
        const incoming: NativeComposerImageAttachment[] = [];
        for (const image of images) {
          if (existingTokens.has(image.token)) continue;
          existingTokens.add(image.token);
          incoming.push(image);
        }
        if (incoming.length === 0) return state;
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: {
              ...current,
              images: [...current.images, ...incoming],
              nonPersistedImageIds: [
                ...new Set([
                  ...current.nonPersistedImageIds,
                  ...incoming.map((image) => image.id),
                ]),
              ],
            },
          },
        };
      }),
    addFileComment: (threadId, comment) =>
      set((state) => {
        const normalized = normalizeFileCommentSelection(comment);
        if (!normalized) return state;
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        if (
          current.fileComments.some(
            (entry) =>
              entry.path === normalized.path &&
              entry.startLine === normalized.startLine &&
              entry.endLine === normalized.endLine &&
              entry.text === normalized.text
          )
        ) {
          return state;
        }
        return {
          draftsByThreadId: {
            ...state.draftsByThreadId,
            [threadId]: {
              ...current,
              fileComments: [
                ...current.fileComments,
                { id: comment.id, ...normalized },
              ],
            },
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
            assistantSelections: [],
            files: [],
            images: [],
            nonPersistedImageIds: [],
            fileComments: [],
            mentions: [],
            modelSelection: current.modelSelection,
            pastedTexts: [],
            prompt: '',
            skills: [],
          };
        } else {
          delete draftsByThreadId[threadId];
        }
        return { draftsByThreadId };
      }),
    discardDraft: (threadId) =>
      set((state) => {
        if (!state.draftsByThreadId[threadId]) return state;
        const draftsByThreadId = { ...state.draftsByThreadId };
        delete draftsByThreadId[threadId];
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
    removeImage: (threadId, imageId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current) return state;
        const images = current.images.filter((image) => image.id !== imageId);
        if (images.length === current.images.length) return state;
        const nextDraft = {
          ...current,
          images,
          nonPersistedImageIds: current.nonPersistedImageIds.filter(
            (id) => id !== imageId
          ),
        };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
    removeFileComments: (threadId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current || current.fileComments.length === 0) return state;
        const nextDraft = { ...current, fileComments: [] };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
    removeAssistantSelections: (threadId) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId];
        if (!current || current.assistantSelections.length === 0) return state;
        const nextDraft = { ...current, assistantSelections: [] };
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
        const skills = filterPromptSkillReferences(
          prompt,
          nextDraft.skills,
          nextDraft.modelSelection?.provider ?? 'codex'
        );
        if (
          providerMentionReferencesEqual(nextDraft.mentions, mentions) &&
          providerSkillReferencesEqual(nextDraft.skills, skills)
        ) {
          return { draftsByThreadId };
        }
        return {
          draftsByThreadId: {
            ...draftsByThreadId,
            [threadId]: { ...nextDraft, mentions, skills },
          },
        };
      }),
    setSkills: (threadId, skills) =>
      set((state) => {
        const current = state.draftsByThreadId[threadId] ?? emptyDraft();
        if (providerSkillReferencesEqual(current.skills, skills)) return state;
        const nextDraft = { ...current, skills: [...skills] };
        const draftsByThreadId = { ...state.draftsByThreadId };
        if (shouldRemoveDraft(nextDraft)) {
          delete draftsByThreadId[threadId];
        } else {
          draftsByThreadId[threadId] = nextDraft;
        }
        return { draftsByThreadId };
      }),
  })
);

let draftStoreHydrated = false;

export async function hydrateLynxComposerDraftStore(): Promise<void> {
  if (draftStoreHydrated) return;
  const { hydrateStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await hydrateStorage();
  const draftsByThreadId = parsePersistedLynxComposerDrafts(
    webStorage.getItem(LYNX_COMPOSER_DRAFT_STORAGE_KEY)
  );
  useComposerDraftStore.setState({ draftsByThreadId });
  draftStoreHydrated = true;
}

useComposerDraftStore.subscribe((state, previousState) => {
  if (state.draftsByThreadId === previousState.draftsByThreadId) return;
  webStorage.setItem(
    LYNX_COMPOSER_DRAFT_STORAGE_KEY,
    JSON.stringify(state.draftsByThreadId)
  );
});
