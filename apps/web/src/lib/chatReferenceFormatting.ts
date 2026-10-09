import { CHAT_ASSISTANT_SELECTION_TEXT_MAX_CHARS } from "@synara/contracts";

import { formatComposerMentionToken } from "./composerMentions";

export interface ChatFileReference {
  path: string;
  startLine?: number | undefined;
  endLine?: number | undefined;
  startColumn?: number | undefined;
  endColumn?: number | undefined;
  snippet?: string | undefined;
}

export function formatLineRangeLabel(startLine: number, endLine: number): string {
  return endLine !== startLine ? `lines ${startLine}-${endLine}` : `line ${startLine}`;
}

export function fenceCodeSnippet(snippet: string): string {
  const normalized = snippet.replace(/\r\n/g, "\n").replace(/^\n+|\n+$/g, "");
  const truncated =
    normalized.length > CHAT_ASSISTANT_SELECTION_TEXT_MAX_CHARS
      ? normalized.slice(0, CHAT_ASSISTANT_SELECTION_TEXT_MAX_CHARS)
      : normalized;
  const longestBacktickRun = truncated
    .match(/`+/g)
    ?.reduce((max, run) => Math.max(max, run.length), 0);
  const fence = "`".repeat(Math.max(3, (longestBacktickRun ?? 0) + 1));
  return `${fence}\n${truncated}\n${fence}`;
}

export function formatSelectionLabel(reference: ChatFileReference): string | null {
  if (typeof reference.startLine !== "number") {
    return null;
  }
  const endLine = reference.endLine ?? reference.startLine;
  const { startColumn, endColumn } = reference;
  if (typeof startColumn !== "number" || typeof endColumn !== "number") {
    return formatLineRangeLabel(reference.startLine, endLine);
  }
  if (reference.startLine === endLine) {
    const columns = startColumn === endColumn ? `${startColumn}` : `${startColumn}-${endColumn}`;
    return `line ${reference.startLine}:${columns}`;
  }
  return `lines ${reference.startLine}:${startColumn}-${endLine}:${endColumn}`;
}

export function formatChatFileReference(reference: ChatFileReference): string {
  const token = formatComposerMentionToken(reference.path);
  const label = formatSelectionLabel(reference);
  if (label) {
    return `${token} (${label})`;
  }
  if (reference.snippet !== undefined && reference.snippet.trim().length > 0) {
    return `${token}\n${fenceCodeSnippet(reference.snippet)}`;
  }
  return token;
}

export function buildWhyChangedPrompt(path: string): string {
  return `Why did we implement the changes in ${formatComposerMentionToken(path)}?`;
}

export function buildWhyLinesPrompt(reference: ChatFileReference): string {
  const token = formatComposerMentionToken(reference.path);
  if (typeof reference.startLine !== "number") {
    return `Why did we implement ${token} this way? Check the git history if needed and explain the reasoning.`;
  }
  const endLine = reference.endLine ?? reference.startLine;
  return `Why were ${formatLineRangeLabel(reference.startLine, endLine)} in ${token} implemented this way? Check git blame/history for the relevant commits and explain the reasoning.`;
}

export function buildDiffSelectionReference(path: string, snippet: string): string {
  return formatChatFileReference({ path, snippet });
}
