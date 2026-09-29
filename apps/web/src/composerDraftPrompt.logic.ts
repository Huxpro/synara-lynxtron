// FILE: composerDraftPrompt.logic.ts
// Purpose: Portable prompt-only transition for composer draft maps.
// Exports: Shared immutable update used by the Web store and Lynx prompt slice.

export function updateComposerDraftPrompt<
  TThreadId extends string,
  TDraft extends { readonly prompt: string },
>(input: {
  readonly draftsByThreadId: Record<TThreadId, TDraft>;
  readonly threadId: TThreadId;
  readonly prompt: string;
  readonly createEmptyDraft: () => TDraft;
  readonly shouldRemoveDraft: (draft: TDraft) => boolean;
}): Record<TThreadId, TDraft> {
  if (input.threadId.length === 0) {
    return input.draftsByThreadId;
  }
  const existing = input.draftsByThreadId[input.threadId] ?? input.createEmptyDraft();
  const nextDraft = {
    ...existing,
    prompt: input.prompt,
  };
  const nextDraftsByThreadId = { ...input.draftsByThreadId };
  if (input.shouldRemoveDraft(nextDraft)) {
    delete nextDraftsByThreadId[input.threadId];
  } else {
    nextDraftsByThreadId[input.threadId] = nextDraft;
  }
  return nextDraftsByThreadId;
}
