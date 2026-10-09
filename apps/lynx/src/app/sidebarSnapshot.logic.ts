// Sidebar read model on Lynx: a pure projection of the shared Web store.
//
// Upstream's session sync (`EventRouter`) keeps the store live; this module
// only reshapes what the upstream selectors return into the summaries the Lynx
// sidebar surfaces already render. Nothing here fetches or commits.

import type { OrchestrationSidebarSearchSnapshot } from "@synara/contracts";
import { resolveThreadStatusPill } from "@synara-web/components/SidebarThreadStatus.logic";
import {
  projectSidebarSearchProject,
  projectSidebarSearchThreads,
} from "@synara-web/components/SidebarSearchProjection.logic";
import {
  createSidebarDisplayThreadsSelector,
  createSidebarTreeThreadsSelector,
  createThreadShellsSelector,
} from "@synara-web/storeSelectors";
import type { AppState } from "@synara-web/storeState";

import type { SidebarSnapshot, ThreadSummary } from "./queries";

/** Inputs of the sidebar projection that do not live in the shared store. */
export interface SidebarSnapshotLocalInputs {
  /** False until the renderer-local inputs below have been read once. */
  readonly ready: boolean;
  /** Message windows for the search palette; a Lynx-only server read. */
  readonly searchSnapshot: OrchestrationSidebarSearchSnapshot | undefined;
  readonly dismissedThreadStatusKeyByThreadId: Readonly<Record<string, string>>;
}

export function projectSidebarSnapshot(
  state: AppState,
  local: Pick<SidebarSnapshotLocalInputs, "searchSnapshot" | "dismissedThreadStatusKeyByThreadId">,
  selectors: {
    readonly selectDisplayThreads: ReturnType<typeof createSidebarDisplayThreadsSelector>;
    readonly selectThreadShells: ReturnType<typeof createThreadShellsSelector>;
  } = {
    selectDisplayThreads: createSidebarDisplayThreadsSelector(),
    selectThreadShells: createThreadShellsSelector(),
  },
): SidebarSnapshot {
  const projectNames = new Map(state.projects.map((project) => [project.id, project.name]));
  const spaceNames = new Map(state.spaces.map((space) => [space.id, space.name]));
  const displayThreads = selectors.selectDisplayThreads(state);
  const threadShells = selectors.selectThreadShells(state);
  const archivedThreadShells = threadShells.filter((thread) => thread.archivedAt != null);
  const workspaceThreads = threadShells.map((thread) => ({
    id: thread.id,
    title: thread.title,
    archivedAt: thread.archivedAt ?? null,
    worktreePath: thread.worktreePath ?? null,
    associatedWorktreePath: thread.associatedWorktreePath ?? null,
  }));
  const searchMessagesByThreadId = new Map(
    (local.searchSnapshot?.threads ?? []).map(
      (thread) => [thread.threadId, thread.messages] as const,
    ),
  );
  const threads = displayThreads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: projectNames.get(thread.projectId) ?? "Unknown project",
    messageCount:
      state.messageIdsByThreadId?.[thread.id]?.length ??
      searchMessagesByThreadId.get(thread.id)?.length ??
      0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt ?? thread.createdAt,
    archivedAt: thread.archivedAt ?? null,
    latestUserMessageAt: thread.latestUserMessageAt ?? null,
    live: thread.hasLiveTailWork,
    provider: thread.session?.provider ?? thread.modelSelection.provider,
    isPinned: thread.isPinned,
    sessionStatus: thread.session?.status ?? null,
    activeTurnId: thread.session?.activeTurnId ?? null,
    parentThreadId: thread.parentThreadId ?? null,
    subagentAgentId: thread.subagentAgentId ?? null,
    subagentNickname: thread.subagentNickname ?? null,
    subagentRole: thread.subagentRole ?? null,
    forkSourceThreadId: thread.forkSourceThreadId ?? null,
    sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
    handoffSourceProvider: thread.handoff?.sourceProvider ?? null,
    envMode: thread.envMode,
    branch: thread.branch,
    worktreePath: thread.worktreePath,
    associatedWorktreePath: thread.associatedWorktreePath,
    associatedWorktreeBranch: thread.associatedWorktreeBranch,
    status: resolveThreadStatusPill({
      thread: {
        ...thread,
        dismissedStatusKey: local.dismissedThreadStatusKeyByThreadId[thread.id],
      },
      hasPendingApprovals: thread.hasPendingApprovals,
      hasPendingUserInput: thread.hasPendingUserInput,
    }),
  }));
  const archivedThreads = archivedThreadShells.map((thread) => ({
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: projectNames.get(thread.projectId) ?? "Unknown project",
    messageCount: state.messageIdsByThreadId?.[thread.id]?.length ?? 0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt ?? thread.createdAt,
    archivedAt: thread.archivedAt ?? null,
    latestUserMessageAt: thread.latestUserMessageAt ?? null,
    live: false,
    provider: thread.modelSelection.provider,
  }));
  const searchProjects = state.projects.map((project) =>
    projectSidebarSearchProject({
      id: project.id,
      name: project.name,
      remoteName: project.remoteName,
      folderName: project.folderName,
      localName: project.localName,
      cwd: project.cwd,
      spaceName: project.spaceId
        ? (spaceNames.get(project.spaceId) ?? "Unknown space")
        : project.kind === "project"
          ? "Void"
          : "Global",
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    }),
  );
  const searchThreads = projectSidebarSearchThreads({
    projects: searchProjects,
    threads: displayThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      projectId: thread.projectId,
      provider: thread.session?.provider ?? thread.modelSelection.provider,
      createdAt: thread.createdAt,
      updatedAt: thread.updatedAt,
      // The server has already capped this message window before it crosses
      // the Native WebSocket; the shared projection reapplies the same
      // deterministic contract before data reaches the renderer.
      messages: searchMessagesByThreadId.get(thread.id),
    })),
  });
  return {
    spaces: state.spaces,
    projects: state.projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      title: project.name,
      remoteName: project.remoteName,
      folderName: project.folderName,
      localName: project.localName,
      workspaceRoot: project.cwd,
      defaultModelSelection: project.defaultModelSelection,
      scripts: project.scripts,
      isPinned: project.isPinned,
      spaceId: project.spaceId ?? null,
    })),
    threads,
    archivedThreads,
    workspaceThreads,
    searchProjects,
    searchThreads,
    kanbanProjects: state.projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      name: project.name,
    })),
    kanbanThreads: displayThreads,
  };
}

/**
 * Memoized store selector for the sidebar snapshot. Returns `undefined` until
 * session sync has delivered its first shell snapshot and the renderer-local
 * inputs have been read: before that the store holds its empty initial value,
 * which must read as "loading", not as "no projects".
 *
 * The result is reference-stable while the slices it reads are unchanged, so it
 * is safe as a zustand selector and message streaming does not re-render the
 * sidebar.
 */
export function createSidebarSnapshotSelector(): (
  state: AppState,
  local: SidebarSnapshotLocalInputs,
) => SidebarSnapshot | undefined {
  const selectors = {
    selectDisplayThreads: createSidebarDisplayThreadsSelector(),
    selectThreadShells: createThreadShellsSelector(),
  };
  let previous:
    | {
        readonly projects: AppState["projects"];
        readonly spaces: AppState["spaces"];
        readonly threadIds: AppState["threadIds"];
        readonly threadShellById: AppState["threadShellById"];
        readonly sidebarThreadSummaryById: AppState["sidebarThreadSummaryById"];
        readonly messageIdsByThreadId: AppState["messageIdsByThreadId"];
        readonly local: SidebarSnapshotLocalInputs;
        readonly value: SidebarSnapshot;
      }
    | undefined;

  return (state, local) => {
    if (!state.threadsHydrated || !local.ready) return undefined;
    if (
      previous &&
      previous.projects === state.projects &&
      previous.spaces === state.spaces &&
      previous.threadIds === state.threadIds &&
      previous.threadShellById === state.threadShellById &&
      previous.sidebarThreadSummaryById === state.sidebarThreadSummaryById &&
      previous.messageIdsByThreadId === state.messageIdsByThreadId &&
      previous.local === local
    ) {
      return previous.value;
    }
    previous = {
      projects: state.projects,
      spaces: state.spaces,
      threadIds: state.threadIds,
      threadShellById: state.threadShellById,
      sidebarThreadSummaryById: state.sidebarThreadSummaryById,
      messageIdsByThreadId: state.messageIdsByThreadId,
      local,
      value: projectSidebarSnapshot(state, local, selectors),
    };
    return previous.value;
  };
}

/**
 * Every unarchived thread (subagent children included) in store order, as the
 * route shell consumes them: restore targets, recent views, completion toasts.
 * `undefined` until session sync hydrates the store.
 */
export function createRouteThreadSummariesSelector(): (
  state: AppState,
) => readonly ThreadSummary[] | undefined {
  const selectTreeThreads = createSidebarTreeThreadsSelector();
  let previousThreads: ReturnType<typeof selectTreeThreads> | undefined;
  let previousProjects: AppState["projects"] | undefined;
  let previousValue: readonly ThreadSummary[] = [];

  return (state) => {
    if (!state.threadsHydrated) return undefined;
    const threads = selectTreeThreads(state);
    if (threads === previousThreads && state.projects === previousProjects) {
      return previousValue;
    }
    previousThreads = threads;
    previousProjects = state.projects;
    const projectNames = new Map(state.projects.map((project) => [project.id, project.name]));
    previousValue = threads.map((thread) => {
      // The orchestration status, not the store's legacy phase: completion
      // toasts and handoff availability compare against server session states.
      const sessionStatus = thread.session?.orchestrationStatus ?? null;
      return {
        id: thread.id,
        title: thread.title,
        projectId: thread.projectId,
        project: projectNames.get(thread.projectId) ?? "Unknown project",
        messageCount: 0,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt ?? thread.createdAt,
        archivedAt: thread.archivedAt ?? null,
        latestUserMessageAt: thread.latestUserMessageAt ?? null,
        live: sessionStatus === "running" || sessionStatus === "starting",
        provider: thread.session?.provider ?? thread.modelSelection.provider,
        isPinned: thread.isPinned,
        sessionStatus,
        hasPendingApprovals: thread.hasPendingApprovals,
        hasPendingUserInput: thread.hasPendingUserInput,
        latestTurnCompletedAt: thread.latestTurn?.completedAt ?? null,
        latestTurnState: thread.latestTurn?.state ?? null,
        parentThreadId: thread.parentThreadId ?? null,
        subagentAgentId: thread.subagentAgentId ?? null,
        subagentNickname: thread.subagentNickname ?? null,
        subagentRole: thread.subagentRole ?? null,
        forkSourceThreadId: thread.forkSourceThreadId ?? null,
        sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
        handoffSourceProvider: thread.handoff?.sourceProvider ?? null,
      };
    });
    return previousValue;
  };
}
