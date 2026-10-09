// Sidebar read model on Lynx: a pure projection of the shared Web store.
//
// Upstream's session sync (`EventRouter`) keeps the store live; this module
// only reshapes what the upstream selectors return into the summaries the Lynx
// sidebar surfaces already render. Nothing here fetches or commits.

import type {
  OrchestrationShellSnapshot,
  OrchestrationSidebarSearchSnapshot,
  ProjectId,
} from "@synara/contracts";
import { isThreadActivelyWorking } from "@synara-web/components/SidebarThreadSort.logic";
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
import { syncServerShellSnapshot } from "@synara-web/storeProjection";
import type { AppState } from "@synara-web/storeState";
import type { SidebarThreadSummary } from "@synara-web/types";

import type { SidebarSnapshot, ThreadSummary, WorktreeThreadSummary } from "./queries";

/** Inputs of the sidebar projection that do not live in the shared store. */
export interface SidebarSnapshotLocalInputs {
  /** False until the renderer-local inputs below have been read once. */
  readonly ready: boolean;
  /** Message windows for the search palette; a Lynx-only server read. */
  readonly searchSnapshot: OrchestrationSidebarSearchSnapshot | undefined;
  readonly dismissedThreadStatusKeyByThreadId: Readonly<Record<string, string>>;
}

/** What the sidebar shows of an archived thread shell, before project names and counts. */
interface ArchivedThreadBase {
  readonly id: string;
  readonly title: string;
  readonly projectId: ProjectId;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt: string | null;
  readonly latestUserMessageAt: string | null;
  readonly provider: ThreadSummary["provider"];
}

/**
 * The store slices the projection reads, reduced to what the sidebar exposes.
 * `threadShellById` and `messageIdsByThreadId` are replaced on every streamed
 * message batch (the shell carries `updatedAt`, the id list is rebuilt), so the
 * projection never keys on them: it keys on these reductions, which keep their
 * reference while the exposed values are unchanged.
 */
interface SidebarSnapshotInputs {
  readonly projects: AppState["projects"];
  readonly spaces: AppState["spaces"];
  readonly displayThreads: readonly SidebarThreadSummary[];
  readonly workspaceThreads: readonly WorktreeThreadSummary[];
  readonly archivedThreads: readonly ArchivedThreadBase[];
  /** Messages the store holds per thread; absent while a thread has no detail. */
  readonly messageCountByThreadId: Readonly<Record<string, number>>;
}

function reduceWorkspaceThreads(
  state: AppState,
  selectThreadShells: ReturnType<typeof createThreadShellsSelector>,
): { workspaceThreads: WorktreeThreadSummary[]; archivedThreads: ArchivedThreadBase[] } {
  const workspaceThreads: WorktreeThreadSummary[] = [];
  const archivedThreads: ArchivedThreadBase[] = [];
  for (const thread of selectThreadShells(state)) {
    workspaceThreads.push({
      id: thread.id,
      title: thread.title,
      archivedAt: thread.archivedAt ?? null,
      worktreePath: thread.worktreePath ?? null,
      associatedWorktreePath: thread.associatedWorktreePath ?? null,
    });
    if (thread.archivedAt != null) {
      archivedThreads.push({
        id: thread.id,
        title: thread.title,
        projectId: thread.projectId,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt ?? thread.createdAt,
        archivedAt: thread.archivedAt ?? null,
        latestUserMessageAt: thread.latestUserMessageAt ?? null,
        provider: thread.modelSelection.provider,
      });
    }
  }
  return { workspaceThreads, archivedThreads };
}

function reduceMessageCounts(state: AppState): Record<string, number> {
  const counts: Record<string, number> = {};
  const messageIdsByThreadId = state.messageIdsByThreadId;
  if (!messageIdsByThreadId) return counts;
  for (const threadId of state.threadIds ?? []) {
    const messageIds = messageIdsByThreadId[threadId];
    if (messageIds) counts[threadId] = messageIds.length;
  }
  return counts;
}

function reduceSidebarSnapshotInputs(
  state: AppState,
  selectors: {
    readonly selectDisplayThreads: ReturnType<typeof createSidebarDisplayThreadsSelector>;
    readonly selectThreadShells: ReturnType<typeof createThreadShellsSelector>;
  },
): SidebarSnapshotInputs {
  return {
    projects: state.projects,
    spaces: state.spaces,
    displayThreads: selectors.selectDisplayThreads(state),
    ...reduceWorkspaceThreads(state, selectors.selectThreadShells),
    messageCountByThreadId: reduceMessageCounts(state),
  };
}

function shallowEqualRecords(
  left: Readonly<Record<string, unknown>>,
  right: Readonly<Record<string, unknown>>,
): boolean {
  const leftKeys = Object.keys(left);
  if (leftKeys.length !== Object.keys(right).length) return false;
  for (const key of leftKeys) {
    if (left[key] !== right[key]) return false;
  }
  return true;
}

/** `next` unless it equals `previous` row by row, in which case `previous` keeps its reference. */
function keepEqualRows<Row extends object>(
  previous: readonly Row[] | undefined,
  next: readonly Row[],
): readonly Row[] {
  if (!previous || previous.length !== next.length) return next;
  for (let index = 0; index < next.length; index += 1) {
    const left = previous[index] as Readonly<Record<string, unknown>>;
    const right = next[index] as Readonly<Record<string, unknown>>;
    if (left !== right && !shallowEqualRecords(left, right)) return next;
  }
  return previous;
}

function projectSidebarSnapshotFromInputs(
  inputs: SidebarSnapshotInputs,
  local: Pick<SidebarSnapshotLocalInputs, "searchSnapshot" | "dismissedThreadStatusKeyByThreadId">,
): SidebarSnapshot {
  const { projects, spaces, displayThreads, messageCountByThreadId } = inputs;
  const projectNames = new Map(projects.map((project) => [project.id, project.name]));
  const spaceNames = new Map(spaces.map((space) => [space.id, space.name]));
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
      messageCountByThreadId[thread.id] ?? searchMessagesByThreadId.get(thread.id)?.length ?? 0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt ?? thread.createdAt,
    archivedAt: thread.archivedAt ?? null,
    latestUserMessageAt: thread.latestUserMessageAt ?? null,
    // Upstream's own "is this thread working" rule (the status pill and the
    // sort use it): live tail work, or a running session with a live turn.
    // `hasLiveTailWork` alone stays false for a whole turn when the running
    // shell arrives before the first streamed message, because streaming does
    // not rewrite the sidebar summary; the session state does flip with the
    // shell at stream start and end. Archive and Delete are gated on this.
    live: isThreadActivelyWorking(thread),
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
  const archivedThreads = inputs.archivedThreads.map((thread) => ({
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: projectNames.get(thread.projectId) ?? "Unknown project",
    messageCount: messageCountByThreadId[thread.id] ?? 0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt,
    archivedAt: thread.archivedAt,
    latestUserMessageAt: thread.latestUserMessageAt,
    live: false,
    provider: thread.provider,
  }));
  const searchProjects = projects.map((project) =>
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
    spaces,
    projects: projects.map((project) => ({
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
    workspaceThreads: inputs.workspaceThreads,
    searchProjects,
    searchThreads,
    kanbanProjects: projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      name: project.name,
    })),
    kanbanThreads: displayThreads,
  };
}

/** One-off projection of a store state (no memoization). */
export function projectSidebarSnapshot(
  state: AppState,
  local: Pick<SidebarSnapshotLocalInputs, "searchSnapshot" | "dismissedThreadStatusKeyByThreadId">,
): SidebarSnapshot {
  return projectSidebarSnapshotFromInputs(
    reduceSidebarSnapshotInputs(state, {
      selectDisplayThreads: createSidebarDisplayThreadsSelector(),
      selectThreadShells: createThreadShellsSelector(),
    }),
    local,
  );
}

/**
 * The sidebar snapshot as the server has it right now: `shell` projected onto
 * the store state with the store's own projection, without writing the store.
 * For actions that must not decide on a read that may lag the shell stream
 * (a delayed or recovering stream leaves the store hydrated and stale).
 */
export function projectFreshSidebarSnapshot(
  state: AppState,
  shell: OrchestrationShellSnapshot,
  local: Pick<SidebarSnapshotLocalInputs, "searchSnapshot" | "dismissedThreadStatusKeyByThreadId">,
): SidebarSnapshot {
  return projectSidebarSnapshot(syncServerShellSnapshot(state, shell), local);
}

/**
 * Memoized store selector for the sidebar snapshot. Returns `undefined` until
 * session sync has delivered its first shell snapshot and the renderer-local
 * inputs have been read: before that the store holds its empty initial value,
 * which must read as "loading", not as "no projects".
 *
 * The result keeps its reference while nothing the sidebar shows has changed.
 * A streamed text delta replaces the store's shell and message-id dictionaries
 * but changes no title, worktree, archive state or message count, so it costs a
 * comparison pass over the thread list and re-renders no consumer.
 */
export function createSidebarSnapshotSelector(): (
  state: AppState,
  local: SidebarSnapshotLocalInputs,
) => SidebarSnapshot | undefined {
  const selectors = {
    selectDisplayThreads: createSidebarDisplayThreadsSelector(),
    selectThreadShells: createThreadShellsSelector(),
  };
  // Raw slices of the last call: when all are identical nothing is reduced.
  let previousState:
    | Pick<
        AppState,
        | "projects"
        | "spaces"
        | "threadIds"
        | "threadShellById"
        | "sidebarThreadSummaryById"
        | "messageIdsByThreadId"
      >
    | undefined;
  let previousInputs: SidebarSnapshotInputs | undefined;
  let previousLocal: SidebarSnapshotLocalInputs | undefined;
  let previousValue: SidebarSnapshot | undefined;

  return (state, local) => {
    if (!state.threadsHydrated || !local.ready) return undefined;
    let inputs = previousInputs;
    if (
      !inputs ||
      !previousState ||
      previousState.projects !== state.projects ||
      previousState.spaces !== state.spaces ||
      previousState.threadIds !== state.threadIds ||
      previousState.threadShellById !== state.threadShellById ||
      previousState.sidebarThreadSummaryById !== state.sidebarThreadSummaryById ||
      previousState.messageIdsByThreadId !== state.messageIdsByThreadId
    ) {
      const next = reduceSidebarSnapshotInputs(state, selectors);
      const displayThreads = keepEqualRows(previousInputs?.displayThreads, next.displayThreads);
      const workspaceThreads = keepEqualRows(
        previousInputs?.workspaceThreads,
        next.workspaceThreads,
      );
      const archivedThreads = keepEqualRows(previousInputs?.archivedThreads, next.archivedThreads);
      const messageCountByThreadId =
        previousInputs &&
        shallowEqualRecords(previousInputs.messageCountByThreadId, next.messageCountByThreadId)
          ? previousInputs.messageCountByThreadId
          : next.messageCountByThreadId;
      inputs =
        previousInputs &&
        previousInputs.projects === next.projects &&
        previousInputs.spaces === next.spaces &&
        previousInputs.displayThreads === displayThreads &&
        previousInputs.workspaceThreads === workspaceThreads &&
        previousInputs.archivedThreads === archivedThreads &&
        previousInputs.messageCountByThreadId === messageCountByThreadId
          ? previousInputs
          : {
              projects: next.projects,
              spaces: next.spaces,
              displayThreads,
              workspaceThreads,
              archivedThreads,
              messageCountByThreadId,
            };
      previousState = state;
    }
    if (previousValue && inputs === previousInputs && local === previousLocal) {
      return previousValue;
    }
    previousInputs = inputs;
    previousLocal = local;
    previousValue = projectSidebarSnapshotFromInputs(inputs, local);
    return previousValue;
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
