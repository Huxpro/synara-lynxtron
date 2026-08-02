// FILE: sidebarSearch.ts
// Purpose: Own the bounded global-search message projection shared by Web,
// Native, and the server-side WebSocket read path.
// Layer: Shared runtime utility

import { ORCHESTRATION_SIDEBAR_SEARCH_LIMITS } from "@synara/contracts";

export const SIDEBAR_SEARCH_LIMITS = ORCHESTRATION_SIDEBAR_SEARCH_LIMITS;

export interface SidebarSearchMessageThreadSource {
  readonly id: string;
  readonly createdAt: string;
  readonly updatedAt?: string;
  readonly messages?: readonly { readonly text: string }[];
}

function boundedMessageText(text: string, limit: number): string {
  if (text.length <= limit) return text;
  if (limit <= 1) return text.slice(0, limit);
  const tailLength = Math.min(400, Math.floor((limit - 1) / 3));
  const headLength = limit - tailLength - 1;
  return `${text.slice(0, headLength)}…${text.slice(-tailLength)}`;
}

export function projectBoundedSidebarSearchMessages(
  threads: readonly SidebarSearchMessageThreadSource[],
): ReadonlyMap<string, readonly { readonly text: string }[]> {
  const recentThreadCandidates = threads
    .map((thread, index) => ({
      index,
      thread,
      recency: Date.parse(thread.updatedAt ?? thread.createdAt) || 0,
    }))
    .filter(({ thread }) => (thread.messages?.length ?? 0) > 0)
    .sort((left, right) => {
      if (left.recency !== right.recency) return right.recency - left.recency;
      return left.index - right.index;
    })
    .slice(0, SIDEBAR_SEARCH_LIMITS.messageThreadCount);

  const projected = new Map<string, readonly { readonly text: string }[]>();
  let remainingChars = SIDEBAR_SEARCH_LIMITS.messageCharsTotal;

  for (const { thread } of recentThreadCandidates) {
    if (remainingChars <= 0) break;
    const sourceMessages = (thread.messages ?? []).slice(
      -SIDEBAR_SEARCH_LIMITS.messagesPerThread,
    );
    const messages: Array<{ readonly text: string }> = [];
    for (const message of sourceMessages) {
      if (remainingChars <= 0) break;
      const searchableText = boundedMessageText(
        message.text,
        Math.min(SIDEBAR_SEARCH_LIMITS.messageCharsPerMessage, remainingChars),
      );
      remainingChars -= searchableText.length;
      if (searchableText.length > 0) messages.push({ text: searchableText });
    }
    if (messages.length > 0) projected.set(thread.id, messages);
  }

  return projected;
}
