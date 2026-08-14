import type { SidebarThreadSortOrder } from '@synara-web/appSettings';
import { sortThreadsForSidebar } from '@synara-web/components/SidebarThreadSort.logic';

import type { ThreadSummary } from './queries';

export const EDITOR_CHAT_HISTORY_LIMIT = 30;

export function resolveEditorChatHistoryThreads(input: {
  readonly projectId: string;
  readonly sortOrder: SidebarThreadSortOrder;
  readonly threads: readonly ThreadSummary[];
}): ThreadSummary[] {
  return sortThreadsForSidebar(
    input.threads.filter((thread) => thread.projectId === input.projectId),
    input.sortOrder
  ).slice(0, EDITOR_CHAT_HISTORY_LIMIT);
}
