import type { ProviderMentionReference } from "@synara/contracts";
import {
  buildWhyLinesPrompt,
  formatChatFileReference,
} from "@synara-web/lib/chatReferenceFormatting";
import { createFileCommentDraft, type FileCommentSelection } from "@synara-web/lib/fileComments";
import type { FileCommentDraft } from "@synara-web/lib/fileComments";

interface ExplorerComposerDraft {
  readonly mentions: ReadonlyArray<ProviderMentionReference>;
  readonly prompt: string;
}

interface ExplorerComposerDraftStore {
  readonly draftsByThreadId: Readonly<Record<string, ExplorerComposerDraft>>;
  readonly setMentions: (
    threadId: string,
    mentions: ReadonlyArray<ProviderMentionReference>,
  ) => void;
  readonly setPrompt: (threadId: string, prompt: string) => void;
}

export function applyExplorerFileComment(input: {
  readonly comment: FileCommentSelection;
  readonly store: {
    readonly addFileComment: (threadId: string, comment: FileCommentDraft) => void;
  };
  readonly threadId: string;
}): boolean {
  const draft = createFileCommentDraft(input.comment);
  if (!draft) return false;
  input.store.addFileComment(input.threadId, draft);
  return true;
}

export type ExplorerChatAction = "ask-why" | "reference";

function appendPromptText(existingPrompt: string, text: string): string {
  const needsSeparator = existingPrompt.length > 0 && !/\s$/.test(existingPrompt);
  return `${existingPrompt}${needsSeparator ? " " : ""}${text} `;
}

export function applyExplorerChatAction(input: {
  readonly action: ExplorerChatAction;
  readonly path: string;
  readonly store: ExplorerComposerDraftStore;
  readonly threadId: string;
}): void {
  const current = input.store.draftsByThreadId[input.threadId];
  const text =
    input.action === "reference"
      ? formatChatFileReference({ path: input.path })
      : buildWhyLinesPrompt({ path: input.path });
  const mention: ProviderMentionReference = {
    name: input.path.replace(/\\/g, "/").split("/").pop() || input.path,
    path: input.path,
  };
  const mentions = current?.mentions.some((entry) => entry.path === mention.path)
    ? current.mentions
    : [...(current?.mentions ?? []), mention];

  input.store.setMentions(input.threadId, mentions);
  input.store.setPrompt(input.threadId, appendPromptText(current?.prompt ?? "", text));
}
