// FILE: chatReferences.ts
// Purpose: Build file/line references and canned prompts, and append them to a
//          thread's composer draft so panels outside ChatView can talk to the chatbox.
// Layer: Web UI utility

import type { ThreadId } from "@synara/contracts";

import { useComposerDraftStore } from "../composerDraftStore";
import { requestComposerFocus } from "../composerFocusRequestStore";
import { createFileCommentDraft, type FileCommentSelection } from "./fileComments";
import {
  buildDiffSelectionReference,
  buildWhyChangedPrompt,
  buildWhyLinesPrompt,
  fenceCodeSnippet,
  formatChatFileReference,
  formatLineRangeLabel,
  formatSelectionLabel,
  type ChatFileReference,
} from "./chatReferenceFormatting";

import { createDocumentRange, getWindowSelection } from "~/components/chat/chatSelectionDom";
export {
  buildDiffSelectionReference,
  buildWhyChangedPrompt,
  buildWhyLinesPrompt,
  fenceCodeSnippet,
  formatChatFileReference,
  formatLineRangeLabel,
  formatSelectionLabel,
  type ChatFileReference,
} from "./chatReferenceFormatting";

// DataTransfer type used when dragging a file row toward the composer. The
// payload is the already-formatted reference text (mention token).
export const CHAT_FILE_REFERENCE_DRAG_TYPE = "application/x-synara-file-reference";

// Editor-style location label for a reference: `line 21`, `line 21:5-12`,
// `lines 3-9`, or `lines 21:5-23:8`. Columns are appended only when both ends
// are known, so a single highlighted word reads as `line 21:5-12` instead of
// referencing the whole line. Returns null when there is no line info.
// `@path` mention token plus a parenthetical location suffix (e.g.
// `@file (line 21:5-12)`). The range/columns live outside the mention token
// itself so provider-side file resolution keeps working. References without
// line info but with a snippet quote the selected text as a fenced block
// instead — the snippet is the precise reference there.
// "Why" prompt for an arbitrary file or line range. Providers run in the
// workspace, so the prompt steers them toward git blame/history for evidence.
// Mention token plus the highlighted diff snippet as a fenced block. Diff rows
// have no stable file line numbers (split/unified views renumber), so the
// quoted code itself is the precise reference.
export function appendComposerPromptText(threadId: ThreadId, text: string): void {
  const store = useComposerDraftStore.getState();
  const existingPrompt = store.draftsByThreadId[threadId]?.prompt ?? "";
  const needsSeparator = existingPrompt.length > 0 && !/\s$/.test(existingPrompt);
  store.setPrompt(threadId, `${existingPrompt}${needsSeparator ? " " : ""}${text} `);
  // Pull the user's attention to the composer so the insert is visible.
  requestComposerFocus(threadId);
}

export function appendChatFileReference(threadId: ThreadId, reference: ChatFileReference): void {
  appendComposerPromptText(threadId, formatChatFileReference(reference));
}

// Attach an inline "Local comment" (file + line range + request text) to the
// thread's composer draft so it surfaces as a chip and is serialized into the
// prompt on send. Returns false when the comment is empty/invalid. Focus is
// pulled to the composer whenever a valid comment is submitted (even if it
// dedupes against an existing one) so the resulting chip is visible.
export function addChatFileComment(threadId: ThreadId, comment: FileCommentSelection): boolean {
  const draft = createFileCommentDraft(comment);
  if (!draft) {
    return false;
  }
  useComposerDraftStore.getState().addFileComment(threadId, draft);
  requestComposerFocus(threadId);
  return true;
}

function countNewlines(text: string): number {
  let count = 0;
  for (let index = 0; index < text.length; index += 1) {
    if (text.charCodeAt(index) === 10) {
      count += 1;
    }
  }
  return count;
}

// Number of characters on the current line of `text` (everything after the last
// newline), i.e. the 0-based column count at the end of `text`.
function columnsOnLastLine(text: string): number {
  return text.length - (text.lastIndexOf("\n") + 1);
}

// Pure line-range math, separated from the DOM selection plumbing for testability.
export function computeSelectionLineRange(
  prefixText: string,
  selectedText: string,
): { startLine: number; endLine: number } {
  const startLine = countNewlines(prefixText) + 1;
  const endLine = startLine + countNewlines(selectedText.replace(/\n+$/, ""));
  return { startLine, endLine };
}

// Pure 1-based column math. `startColumn` is the column of the first selected
// character; `endColumn` is the column of the last selected character (trailing
// newlines are ignored so a line-spanning selection ends on real content).
export function computeSelectionColumns(
  prefixText: string,
  selectedText: string,
): { startColumn: number; endColumn: number } {
  const startColumn = columnsOnLastLine(prefixText) + 1;
  const trimmedSelection = selectedText.replace(/\n+$/, "");
  const endColumn = columnsOnLastLine(prefixText + trimmedSelection);
  return { startColumn, endColumn };
}

export interface SelectionWithin {
  startLine: number;
  endLine: number;
  startColumn: number;
  endColumn: number;
}

// The current window selection scoped to `container`: null when collapsed,
// reaching outside the container, or whitespace-only.
function getSelectionRangeWithin(
  container: HTMLElement,
): { range: Range; selectedText: string } | null {
  const selection = getWindowSelection();
  if (!selection || selection.rangeCount === 0 || selection.isCollapsed) {
    return null;
  }
  const range = selection.getRangeAt(0);
  if (!container.contains(range.startContainer) || !container.contains(range.endContainer)) {
    return null;
  }
  const selectedText = range.toString();
  if (selectedText.trim().length === 0) {
    return null;
  }
  return { range, selectedText };
}

// Resolve the 1-based line+column span of the current selection inside
// `container`. Works for both plain <pre> contents and Shiki-highlighted markup
// because both keep one "\n" of text content per rendered line. Returns null
// when there is no actionable selection.
export function getSelectionWithin(container: HTMLElement): SelectionWithin | null {
  const scoped = getSelectionRangeWithin(container);
  if (!scoped) {
    return null;
  }
  const prefixRange = createDocumentRange();
  if (!prefixRange) {
    return null;
  }
  prefixRange.selectNodeContents(container);
  prefixRange.setEnd(scoped.range.startContainer, scoped.range.startOffset);
  const prefixText = prefixRange.toString();
  return {
    ...computeSelectionLineRange(prefixText, scoped.selectedText),
    ...computeSelectionColumns(prefixText, scoped.selectedText),
  };
}
