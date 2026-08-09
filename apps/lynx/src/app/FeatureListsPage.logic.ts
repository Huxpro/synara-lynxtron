import type {
  KanbanBoard,
  KanbanProjectBoard,
} from '@synara-web/components/kanban/kanban.logic';
import { buildKanbanBoard } from '@synara-web/components/kanban/kanban.logic';
import {
  filterPullRequestEntriesByInvolvement,
  groupPullRequestEntriesByInvolvement,
  matchesPullRequestSearchQuery,
  orderPullRequestEntriesPinnedFirst,
  type PullRequestListGroup,
} from '@synara-web/components/pullRequest/pullRequestList.logic';
import { coalescePullRequestListEntries } from '@synara/shared/githubRepository';
import type {
  PullRequestInvolvement,
  PullRequestListEntry,
} from '@synara/contracts';
import type { PullRequestSnapshot, SidebarSnapshot } from './queries';

export const EMPTY_KANBAN_BOARD: KanbanBoard = {
  projects: [],
  totalCount: 0,
};

export function buildCanonicalSliceKanbanBoard(
  snapshot: SidebarSnapshot | undefined,
  composerDraftByThreadId: Parameters<typeof buildKanbanBoard>[0]['composerDraftByThreadId'] = {}
): KanbanBoard {
  if (!snapshot) return EMPTY_KANBAN_BOARD;
  // Match Web's boot-safe container partition: without workspace-path state,
  // `kind === "chat"` is the canonical home-chat signal and `studio` stays out
  // of Kanban. Fold duplicate chat containers into one trailing "Chats" board.
  const chatContainers = snapshot.kanbanProjects.filter(
    (project) => project.kind === 'chat'
  );
  const canonicalChatContainer = chatContainers[0];
  const projectIdAliases = Object.fromEntries(
    chatContainers
      .slice(1)
      .map((project) => [project.id, canonicalChatContainer?.id])
  );
  const projects = [
    ...snapshot.kanbanProjects.filter(
      (project) => project.kind !== 'chat' && project.kind !== 'studio'
    ),
    ...(canonicalChatContainer
      ? [{ ...canonicalChatContainer, name: 'Chats' }]
      : []),
  ];
  return buildKanbanBoard({
    projects,
    threads: snapshot.kanbanThreads,
    draftThreads: [],
    composerDraftByThreadId,
    draftOrderByProjectId: {},
    projectIdAliases,
  });
}

export function selectKanbanProjectBoard(
  board: KanbanBoard,
  projectId: string
): KanbanProjectBoard | undefined {
  return board.projects.find((project) => project.projectId === projectId);
}

export interface CanonicalSlicePullRequestList {
  readonly entries: readonly PullRequestListEntry[];
  readonly grouped: readonly PullRequestListGroup[] | null;
}

export const EMPTY_PULL_REQUEST_LIST: CanonicalSlicePullRequestList = {
  entries: [],
  grouped: null,
};

export interface PullRequestActionGate {
  readonly tryAcquire: () => boolean;
  readonly release: () => void;
}

/** React Query's pending state is scheduled, so use a synchronous gate to reject two action
 *  taps delivered in the same frame. */
export function createPullRequestActionGate(): PullRequestActionGate {
  let active = false;
  return {
    tryAcquire: () => {
      if (active) return false;
      active = true;
      return true;
    },
    release: () => {
      active = false;
    },
  };
}

export function buildCanonicalSlicePullRequestList(
  snapshot: PullRequestSnapshot | undefined,
  involvement: PullRequestInvolvement = 'all',
  searchQuery = ''
): CanonicalSlicePullRequestList {
  if (!snapshot) return EMPTY_PULL_REQUEST_LIST;
  const normalizedQuery = searchQuery.trim().toLowerCase();
  const entries = orderPullRequestEntriesPinnedFirst(
    coalescePullRequestListEntries(
      filterPullRequestEntriesByInvolvement(
        snapshot.entries,
        snapshot.viewer,
        involvement
      ).filter((entry) =>
        matchesPullRequestSearchQuery(entry, normalizedQuery)
      )
    )
  );
  return {
    entries,
    grouped:
      involvement === 'all'
        ? groupPullRequestEntriesByInvolvement(entries, snapshot.viewer)
        : null,
  };
}
