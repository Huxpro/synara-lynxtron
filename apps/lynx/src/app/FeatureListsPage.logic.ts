import type { KanbanBoard, KanbanProjectBoard } from "@synara-web/components/kanban/kanban.logic";
import { buildKanbanBoard } from "@synara-web/components/kanban/kanban.logic";
import type { SidebarSnapshot } from "./queries";

export const EMPTY_KANBAN_BOARD: KanbanBoard = {
  projects: [],
  totalCount: 0,
};

export function buildCanonicalSliceKanbanBoard(
  snapshot: SidebarSnapshot | undefined,
  composerDraftByThreadId: Parameters<typeof buildKanbanBoard>[0]["composerDraftByThreadId"] = {},
): KanbanBoard {
  if (!snapshot) return EMPTY_KANBAN_BOARD;
  // Match Web's boot-safe container partition: without workspace-path state,
  // `kind === "chat"` is the canonical home-chat signal and `studio` stays out
  // of Kanban. Fold duplicate chat containers into one trailing "Chats" board.
  const chatContainers = snapshot.kanbanProjects.filter((project) => project.kind === "chat");
  const canonicalChatContainer = chatContainers[0];
  const projectIdAliases = Object.fromEntries(
    chatContainers.slice(1).map((project) => [project.id, canonicalChatContainer?.id]),
  );
  const projects = [
    ...snapshot.kanbanProjects.filter(
      (project) => project.kind !== "chat" && project.kind !== "studio",
    ),
    ...(canonicalChatContainer ? [{ ...canonicalChatContainer, name: "Chats" }] : []),
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
  projectId: string,
): KanbanProjectBoard | undefined {
  return board.projects.find((project) => project.projectId === projectId);
}

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
