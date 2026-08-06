// P2-V6: react-query selectors over the real Synara Effect-RPC WebSocket
// snapshot. The transport is a singleton; both queries share its latest read.

import { QueryClient } from '@tanstack/react-query';
import type {
  ModelSelection,
  ProjectId,
  ProviderKind,
  PullRequestDetail,
  PullRequestDetailInput,
  PullRequestDiffResult,
  PullRequestActionInput,
  PullRequestActionResult,
  PullRequestListEntry,
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  PullRequestState,
} from '@synara/contracts';
import type { SidebarStatusPresentation } from '@synara-web/components/SidebarStatus.logic';
import { resolveThreadStatusPill } from '@synara-web/components/SidebarThreadStatus.logic';
import {
  deriveMessagesTimelineRows,
  type MessagesTimelineRow,
} from '@synara-web/components/chat/MessagesTimeline.logic';
import {
  deriveTimelineEntries,
  deriveWorkLogEntries,
} from '@synara-web/session-logic';
import {
  createSidebarDisplayThreadsSelector,
  createThreadShellsSelector,
} from '@synara-web/storeSelectors';
import type {
  Project,
  SidebarThreadSummary,
} from '@synara-web/types';
import type {
  SidebarSearchProject,
  SidebarSearchThread,
} from '@synara-web/components/SidebarSearchPalette.logic';
import {
  projectSidebarSearchProject,
  projectSidebarSearchThreads,
} from '@synara-web/components/SidebarSearchProjection.logic';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 2_000,
      retry: 1,
    },
  },
});

export interface ThreadSummary {
  readonly id: string;
  readonly title: string;
  readonly projectId: string;
  readonly project: string;
  readonly messageCount: number;
  readonly createdAt?: string;
  readonly updatedAt: string;
  readonly archivedAt?: string | null;
  readonly latestUserMessageAt?: string | null;
  readonly live: boolean;
  readonly provider?: ProviderKind;
  readonly isPinned?: boolean;
  readonly sessionStatus?: string | null;
  readonly parentThreadId?: string | null;
  readonly subagentAgentId?: string | null;
  readonly subagentNickname?: string | null;
  readonly subagentRole?: string | null;
  readonly forkSourceThreadId?: string | null;
  readonly sidechatSourceThreadId?: string | null;
  readonly handoffSourceProvider?: string | null;
  readonly status?: SidebarStatusPresentation | null;
}

export interface ProjectSummary {
  readonly id: string;
  readonly kind: 'project' | 'chat' | 'studio';
  readonly title: string;
  readonly workspaceRoot: string;
  readonly isPinned?: boolean;
}

export interface WorktreeThreadSummary {
  readonly id: string;
  readonly title: string;
  readonly archivedAt?: string | null;
  readonly worktreePath?: string | null;
  readonly associatedWorktreePath?: string | null;
}

export interface ThreadHeaderSummary {
  readonly id: string;
  readonly title: string;
  readonly project: string;
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly provider?: ProviderKind;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: 'full-access' | 'approval-required';
  readonly interactionMode: 'default' | 'plan';
  readonly sessionStatus: string | null;
  readonly activeTurnId: string | null;
  readonly workspaceRoot: string | null;
}

export interface SidebarSnapshot {
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly archivedThreads: readonly ThreadSummary[];
  readonly workspaceThreads: readonly WorktreeThreadSummary[];
  readonly searchProjects: readonly SidebarSearchProject[];
  readonly searchThreads: readonly SidebarSearchThread[];
  readonly kanbanProjects: readonly Pick<Project, 'id' | 'kind' | 'name'>[];
  readonly kanbanThreads: readonly SidebarThreadSummary[];
}

export type ThreadTranscriptRow = MessagesTimelineRow;

let sidebarSnapshotCache:
  | {
      readonly shellSnapshotSequence: number;
      readonly searchSnapshotSequence: number;
      readonly value: SidebarSnapshot;
    }
  | undefined;

const transcriptRowsByThreadId = new Map<
  string,
  {
    readonly snapshotSequence: number;
    readonly rows: ThreadTranscriptRow[];
  }
>();

export interface PullRequestSnapshot {
  readonly viewer: string | null;
  readonly entries: readonly PullRequestListEntry[];
}

export async function fetchSidebarSnapshot(): Promise<SidebarSnapshot> {
  'background only';
  const [
    { fetchSynaraSidebarShellSnapshot, fetchSynaraSidebarSearchSnapshot },
    { useStore },
    { hydrateStorage },
    { readSidebarUiState },
  ] = await Promise.all([
    import(/* webpackMode: "eager" */ '../data/synaraClient'),
    import(/* webpackMode: "eager" */ '@synara-web/store'),
    import(/* webpackMode: "eager" */ '../platform/storage'),
    import(/* webpackMode: "eager" */ '@synara-web/components/Sidebar.uiState'),
  ]);
  const [snapshot, searchSnapshot] = await Promise.all([
    fetchSynaraSidebarShellSnapshot(),
    fetchSynaraSidebarSearchSnapshot(),
    hydrateStorage(),
  ]);
  if (
    sidebarSnapshotCache?.shellSnapshotSequence === snapshot.snapshotSequence &&
    sidebarSnapshotCache.searchSnapshotSequence === searchSnapshot.snapshotSequence
  ) {
    return sidebarSnapshotCache.value;
  }
  const dismissedThreadStatusKeyByThreadId =
    readSidebarUiState().dismissedThreadStatusKeyByThreadId;
  // The real Web client store is the single state container here too: the read
  // model goes through the same zustand action the Web app uses, and the sidebar
  // projection reads back from that store instead of a slice-local copy.
  let normalized;
  try {
    useStore
      .getState()
      .syncServerShellSnapshot(
        snapshot as Parameters<ReturnType<typeof useStore.getState>['syncServerShellSnapshot']>[0]
      );
    normalized = useStore.getState();
  } catch (error) {
    console.error('[slice] main store projection failed', error);
    throw error;
  }
  const projectNames = new Map(
    normalized.projects.map((project) => [project.id, project.name])
  );
  const spaceNames = new Map(
    normalized.spaces.map((space) => [space.id, space.name])
  );
  const displayThreads = createSidebarDisplayThreadsSelector()(normalized);
  const archivedThreadShells = createThreadShellsSelector()(normalized).filter(
    (thread) => thread.archivedAt != null
  );
  const workspaceThreads = createThreadShellsSelector()(normalized).map(
    (thread) => ({
      id: thread.id,
      title: thread.title,
      archivedAt: thread.archivedAt ?? null,
      worktreePath: thread.worktreePath ?? null,
      associatedWorktreePath: thread.associatedWorktreePath ?? null,
    })
  );
  const searchMessagesByThreadId = new Map(
    searchSnapshot.threads.map((thread) => [thread.threadId, thread.messages] as const)
  );
  const threads = displayThreads.map((thread) => ({
      id: thread.id,
      title: thread.title,
      projectId: thread.projectId,
      project: projectNames.get(thread.projectId) ?? 'Unknown project',
      messageCount:
        normalized.messageIdsByThreadId?.[thread.id]?.length ??
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
      parentThreadId: thread.parentThreadId ?? null,
      subagentAgentId: thread.subagentAgentId ?? null,
      subagentNickname: thread.subagentNickname ?? null,
      subagentRole: thread.subagentRole ?? null,
      forkSourceThreadId: thread.forkSourceThreadId ?? null,
      sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
      handoffSourceProvider: thread.handoff?.sourceProvider ?? null,
      status: resolveThreadStatusPill({
        thread: {
          ...thread,
          dismissedStatusKey:
            dismissedThreadStatusKeyByThreadId[thread.id],
        },
        hasPendingApprovals: thread.hasPendingApprovals,
        hasPendingUserInput: thread.hasPendingUserInput,
      }),
    }));
  const archivedThreads = archivedThreadShells.map((thread) => ({
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: projectNames.get(thread.projectId) ?? 'Unknown project',
    messageCount: normalized.messageIdsByThreadId?.[thread.id]?.length ?? 0,
    createdAt: thread.createdAt,
    updatedAt: thread.updatedAt ?? thread.createdAt,
    archivedAt: thread.archivedAt ?? null,
    latestUserMessageAt: thread.latestUserMessageAt ?? null,
    live: false,
    provider: thread.modelSelection.provider,
  }));
  const searchProjects = normalized.projects.map((project) =>
    projectSidebarSearchProject({
      id: project.id,
      name: project.name,
      remoteName: project.remoteName,
      folderName: project.folderName,
      localName: project.localName,
      cwd: project.cwd,
      spaceName: project.spaceId
        ? spaceNames.get(project.spaceId) ?? 'Unknown space'
        : project.kind === 'project'
          ? 'Void'
          : 'Global',
      createdAt: project.createdAt,
      updatedAt: project.updatedAt,
    })
  );
  const searchThreads = projectSidebarSearchThreads({
    projects: searchProjects,
    threads: displayThreads.map((thread) => {
      return {
        id: thread.id,
        title: thread.title,
        projectId: thread.projectId,
        provider:
          thread.session?.provider ?? thread.modelSelection.provider,
        createdAt: thread.createdAt,
        updatedAt: thread.updatedAt,
        // The server has already capped this message window before it crosses
        // the Native WebSocket; the shared projection reapplies the same
        // deterministic contract before data reaches the renderer.
        messages: searchMessagesByThreadId.get(thread.id),
      };
    }),
  });
  const value = {
    projects: normalized.projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      title: project.name,
      workspaceRoot: project.cwd,
      isPinned: project.isPinned,
    })),
    threads,
    archivedThreads,
    workspaceThreads,
    searchProjects,
    searchThreads,
    kanbanProjects: normalized.projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      name: project.name,
    })),
    kanbanThreads: displayThreads,
  };
  sidebarSnapshotCache = {
    shellSnapshotSequence: snapshot.snapshotSequence,
    searchSnapshotSequence: searchSnapshot.snapshotSequence,
    value,
  };
  return value;
}

export async function fetchThreads(): Promise<ThreadSummary[]> {
  'background only';
  return (await fetchSidebarSnapshot()).threads as ThreadSummary[];
}

export async function fetchThreadHeaderSummary(
  threadId: string
): Promise<ThreadHeaderSummary | undefined> {
  'background only';
  const { fetchSynaraThreadDetailSnapshot, fetchSynaraSidebarShellSnapshot } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const [detail, shell] = await Promise.all([
    fetchSynaraThreadDetailSnapshot(threadId),
    fetchSynaraSidebarShellSnapshot(),
  ]);
  const thread = detail?.thread;
  if (!thread) return undefined;
  const project = shell.projects.find(
    (candidate) => candidate.id === thread.projectId
  );
  return {
    id: thread.id,
    title: thread.title,
    project: project?.title ?? 'Synara',
    branch: thread.branch,
    envMode: thread.envMode,
    provider: thread.session?.provider ?? thread.modelSelection.provider,
    modelSelection: thread.modelSelection,
    runtimeMode: thread.runtimeMode,
    interactionMode: thread.interactionMode,
    sessionStatus: thread.session?.status ?? null,
    activeTurnId: thread.session?.activeTurnId ?? null,
    workspaceRoot: project?.workspaceRoot ?? null,
  };
}

export async function fetchThreadTranscriptRows(
  threadId: string
): Promise<ThreadTranscriptRow[]> {
  'background only';
  const [
    { fetchSynaraThreadDetailSnapshot },
    { useStore },
    { getThreadFromState },
  ] = await Promise.all([
    import(/* webpackMode: "eager" */ '../data/synaraClient'),
    import(/* webpackMode: "eager" */ '@synara-web/store'),
    import(/* webpackMode: "eager" */ '@synara-web/threadDerivation'),
  ]);
  const snapshot = await fetchSynaraThreadDetailSnapshot(threadId);
  if (!snapshot) return [];
  const cached = transcriptRowsByThreadId.get(threadId);
  if (cached?.snapshotSequence === snapshot.snapshotSequence) {
    return cached.rows;
  }
  useStore
    .getState()
    .syncServerThreadDetail(
      snapshot.thread as Parameters<ReturnType<typeof useStore.getState>['syncServerThreadDetail']>[0]
    );
  const thread = getThreadFromState(
    useStore.getState(),
    threadId as Parameters<typeof getThreadFromState>[1]
  );
  if (!thread) {
    transcriptRowsByThreadId.set(threadId, {
      snapshotSequence: snapshot.snapshotSequence,
      rows: [],
    });
    return [];
  }

  const visibleTurnIds = new Set(
    thread.messages.flatMap((message) =>
      message.turnId ? [message.turnId] : []
    )
  );
  if (thread.latestTurn?.turnId) {
    visibleTurnIds.add(thread.latestTurn.turnId);
  }
  const workEntries = deriveWorkLogEntries(
    thread.activities,
    thread.latestTurn?.turnId ?? undefined,
    { visibleTurnIds }
  );
  const timelineEntries = deriveTimelineEntries(
    thread.messages as Parameters<typeof deriveTimelineEntries>[0],
    thread.proposedPlans as Parameters<typeof deriveTimelineEntries>[1],
    workEntries
  );
  const activeTurnInProgress = thread.latestTurn?.state === 'running';
  const rows = deriveMessagesTimelineRows({
    timelineEntries,
    isWorking: activeTurnInProgress,
    worktreeSetup: null,
    worktreeSetupOpen: false,
    activeTurnInProgress,
    activeTurnId: thread.latestTurn?.turnId ?? null,
    activeTurnStartedAt: thread.latestTurn?.startedAt ?? null,
    turnDiffSummaryByAssistantMessageId: new Map(),
    revertTurnCountByUserMessageId: new Map(),
  });
  transcriptRowsByThreadId.set(threadId, {
    snapshotSequence: snapshot.snapshotSequence,
    rows,
  });
  return rows;
}

export async function fetchPullRequests(input: {
  readonly state: PullRequestState;
  readonly projectId: ProjectId | null;
}): Promise<PullRequestSnapshot> {
  'background only';
  const { fetchSynaraPullRequests } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const result = await fetchSynaraPullRequests(input);
  return {
    viewer: result.viewer,
    entries: result.entries,
  };
}

export async function fetchPullRequestDetail(
  input: PullRequestDetailInput
): Promise<PullRequestDetail> {
  'background only';
  const { fetchSynaraPullRequestDetail } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return fetchSynaraPullRequestDetail(input);
}

export async function fetchPullRequestDiff(
  input: PullRequestDetailInput
): Promise<PullRequestDiffResult> {
  'background only';
  const { fetchSynaraPullRequestDiff } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return fetchSynaraPullRequestDiff(input);
}

export async function performPullRequestAction(
  input: PullRequestActionInput
): Promise<PullRequestActionResult> {
  'background only';
  const { performSynaraPullRequestAction } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return performSynaraPullRequestAction(input);
}

export async function setPullRequestPinned(
  input: PullRequestSetPinnedInput
): Promise<PullRequestSetPinnedResult> {
  'background only';
  const { setSynaraPullRequestPinned } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return setSynaraPullRequestPinned(input);
}
