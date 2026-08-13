// P2-V6: react-query selectors over the real Synara Effect-RPC WebSocket
// snapshot. The transport is a singleton; both queries share its latest read.

import { QueryClient } from '@tanstack/react-query';
import type {
  AutomationListResult,
  MessageId,
  ModelSelection,
  OrchestrationThreadPullRequest,
  PinnedMessage,
  ProjectId,
  ProviderKind,
  ThreadMarker,
  PullRequestDetail,
  PullRequestDetailInput,
  PullRequestDiffResult,
  PullRequestActionInput,
  PullRequestActionResult,
  PullRequestCommentInput,
  PullRequestListEntry,
  PullRequestsListError,
  PullRequestsListRepositoryBatch,
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  PullRequestState,
  ProjectListDirectoriesResult,
  ProjectReadFileResult,
  ProjectSearchEntriesResult,
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
import { webStorage } from '../platform/storage';
import {
  deriveThreadRecapSource,
  persistThreadRecapCache,
  readPersistedThreadRecapCache,
  upsertPersistedThreadRecap,
} from '@synara-web/lib/threadRecap';
import type { NativeSyntaxHighlightThemes } from '../main/syntaxHighlightingContract.logic';

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
  readonly defaultModelSelection: ModelSelection | null;
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
  readonly projectId: string;
  readonly project: string;
  readonly branch: string | null;
  readonly envMode: 'local' | 'worktree';
  readonly provider?: ProviderKind;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: 'full-access' | 'approval-required';
  readonly interactionMode: 'default' | 'plan';
  readonly sessionStatus: string | null;
  readonly activeTurnId: string | null;
  readonly latestTurnState: string | null;
  readonly workspaceRoot: string | null;
  readonly notes: string;
  readonly pinnedMessages: readonly PinnedMessage[];
  readonly pinnedMessageTextById: Readonly<Record<string, string>>;
  readonly pinnedRevision: string;
  readonly threadMarkers: readonly ThreadMarker[];
  readonly markerRevision: string;
  readonly lastKnownPr: OrchestrationThreadPullRequest | null;
}

export interface ThreadRecapSummary {
  readonly coveredMessageId: string | null;
  readonly sourceSignature: string;
  readonly text: string;
  readonly updatedAt: string;
}

export interface ThreadRecapPlan {
  readonly currentState: string;
  readonly existing: ThreadRecapSummary | null;
  readonly latestMessageId: string | null;
  readonly newMaterial: string;
  readonly sourceSignature: string;
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

export type ExplorerEntriesResult =
  | ProjectListDirectoriesResult
  | ProjectSearchEntriesResult;

export async function fetchAutomations(): Promise<AutomationListResult> {
  'background only';
  const { fetchAutomations: fetchAutomationList } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return fetchAutomationList();
}

const EXPLORER_CACHE_TTL_MS = 2_000;
const EXPLORER_DIRECTORY_CACHE_TTL_MS = 30_000;
const explorerEntriesCache = new Map<
  string,
  {
    readonly expiresAt: number;
    readonly result: Promise<ExplorerEntriesResult>;
  }
>();
const explorerDirectoryCache = new Map<
  string,
  {
    readonly expiresAt: number;
    readonly result: Promise<ProjectListDirectoriesResult>;
  }
>();
const explorerFileCache = new Map<
  string,
  {
    readonly expiresAt: number;
    readonly result: Promise<{
      readonly file: ProjectReadFileResult;
      readonly syntaxHighlight: NativeSyntaxHighlightThemes | null;
    }>;
  }
>();

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
  readonly errors: readonly PullRequestsListError[];
  readonly repositoryBatches: readonly PullRequestsListRepositoryBatch[];
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
      defaultModelSelection: project.defaultModelSelection,
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

export async function fetchExplorerEntries(input: {
  readonly query: string;
  readonly workspaceRoot: string;
}): Promise<ExplorerEntriesResult> {
  'background only';
  const cacheKey = `${input.workspaceRoot}\0${input.query}`;
  const cached = explorerEntriesCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const { listProjectDirectories, searchProjectEntries } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const result = input.query
    ? searchProjectEntries({
        cwd: input.workspaceRoot,
        query: input.query,
        kind: 'file',
        limit: 80,
      })
    : listProjectDirectories({
        cwd: input.workspaceRoot,
        includeFiles: true,
        depth: 1,
      });
  explorerEntriesCache.set(cacheKey, {
    expiresAt: Date.now() + EXPLORER_CACHE_TTL_MS,
    result,
  });
  return result;
}

export async function fetchExplorerDirectory(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<ProjectListDirectoriesResult> {
  'background only';
  const cacheKey = `${input.workspaceRoot}\0${input.relativePath}`;
  const cached = explorerDirectoryCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const { listProjectDirectories } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const result = listProjectDirectories({
    cwd: input.workspaceRoot,
    relativePath: input.relativePath,
    includeFiles: true,
    depth: 1,
  });
  explorerDirectoryCache.set(cacheKey, {
    expiresAt: Date.now() + EXPLORER_DIRECTORY_CACHE_TTL_MS,
    result,
  });
  void result.catch(() => {
    if (explorerDirectoryCache.get(cacheKey)?.result === result) {
      explorerDirectoryCache.delete(cacheKey);
    }
  });
  return result;
}

export async function fetchExplorerFile(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<{
  readonly file: ProjectReadFileResult;
  readonly syntaxHighlight: NativeSyntaxHighlightThemes | null;
}> {
  'background only';
  const cacheKey = `${input.workspaceRoot}\0${input.relativePath}`;
  const cached = explorerFileCache.get(cacheKey);
  if (cached && cached.expiresAt > Date.now()) return cached.result;
  const { readProjectFileWithSyntax } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const result = readProjectFileWithSyntax({
    cwd: input.workspaceRoot,
    relativePath: input.relativePath,
  });
  explorerFileCache.set(cacheKey, {
    expiresAt: Date.now() + EXPLORER_CACHE_TTL_MS,
    result,
  });
  return result;
}

export async function fetchExplorerLocalPreviewUrl(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<string> {
  'background only';
  const [{ bridgeCall }, { buildWorkspaceLocalPreviewUrl }] = await Promise.all([
    import(/* webpackMode: "eager" */ '../platform/bridge'),
    import(/* webpackMode: "eager" */ './localPreview.logic'),
  ]);
  const runtime = await bridgeCall<{ readonly wsUrl?: unknown }>(
    'runtimeGetSynaraWsUrl'
  );
  const wsUrl =
    typeof runtime?.wsUrl === 'string' ? runtime.wsUrl.trim() : '';
  if (!wsUrl) throw new Error('Synara runtime endpoint is unavailable.');
  return buildWorkspaceLocalPreviewUrl({
    wsUrl,
    cwd: input.workspaceRoot,
    path: input.relativePath,
  });
}

export async function fetchExplorerPdfMetadata(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<{ readonly pageCount: number }> {
  'background only';
  const { inspectProjectPdf } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return inspectProjectPdf({
    cwd: input.workspaceRoot,
    path: input.relativePath,
  });
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
    projectId: thread.projectId,
    project: project?.title ?? 'Synara',
    branch: thread.branch,
    envMode: thread.envMode,
    provider: thread.session?.provider ?? thread.modelSelection.provider,
    modelSelection: thread.modelSelection,
    runtimeMode: thread.runtimeMode,
    interactionMode: thread.interactionMode,
    sessionStatus: thread.session?.status ?? null,
    activeTurnId: thread.session?.activeTurnId ?? null,
    latestTurnState: thread.latestTurn?.state ?? null,
    workspaceRoot: project?.workspaceRoot ?? null,
    notes: thread.notes ?? '',
    pinnedMessages: thread.pinnedMessages ?? [],
    pinnedMessageTextById: Object.fromEntries(
      thread.messages
        .filter(
          (message) =>
            (message.role === 'user' || message.role === 'assistant') &&
            message.text.trim().length > 0
        )
        .map((message) => [message.id as MessageId, message.text])
    ),
    pinnedRevision: JSON.stringify(thread.pinnedMessages ?? []),
    threadMarkers: thread.threadMarkers ?? [],
    markerRevision: JSON.stringify(thread.threadMarkers ?? []),
    lastKnownPr: thread.lastKnownPr ?? null,
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

export async function fetchThreadRecapSummary(
  threadId: string
): Promise<ThreadRecapSummary | null> {
  'background only';
  const cache = readPersistedThreadRecapCache(webStorage);
  return cache[threadId as keyof typeof cache] ?? null;
}

export async function prepareThreadRecap(
  threadId: string
): Promise<ThreadRecapPlan | null> {
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
  if (!snapshot) return null;
  useStore
    .getState()
    .syncServerThreadDetail(
      snapshot.thread as Parameters<ReturnType<typeof useStore.getState>['syncServerThreadDetail']>[0]
    );
  const thread = getThreadFromState(
    useStore.getState(),
    threadId as Parameters<typeof getThreadFromState>[1]
  );
  if (!thread) return null;
  const cache = readPersistedThreadRecapCache(webStorage);
  const existing = cache[threadId] ?? null;
  const hasStreamingAssistant = thread.messages.some(
    (message) => message.role === 'assistant' && message.streaming
  );
  if (thread.latestTurn?.state === 'running' || hasStreamingAssistant) {
    return null;
  }
  const source = deriveThreadRecapSource({
    thread,
    previousCoveredMessageId: existing?.coveredMessageId ?? null,
    hasPreviousRecap: Boolean(existing?.text),
  });
  if (!source.hasNewMaterial || existing?.sourceSignature === source.signature) {
    return null;
  }
  return {
    currentState: source.currentState,
    existing,
    latestMessageId: source.latestMessageId,
    newMaterial: source.newMaterial,
    sourceSignature: source.signature,
  };
}

export async function generatePreparedThreadRecap(input: {
  readonly cwd: string;
  readonly plan: ThreadRecapPlan;
  readonly threadId: string;
}): Promise<ThreadRecapSummary> {
  'background only';
  const { generateThreadRecap } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  const cache = readPersistedThreadRecapCache(webStorage);
  const result = await generateThreadRecap({
    cwd: input.cwd,
    newMaterial: input.plan.newMaterial,
    currentState: input.plan.currentState,
    ...(input.plan.existing?.text
      ? { previousRecap: input.plan.existing.text }
      : {}),
  });
  const persisted = {
    text: result.recap,
    coveredMessageId: input.plan.latestMessageId,
    sourceSignature: input.plan.sourceSignature,
    updatedAt: new Date().toISOString(),
  };
  persistThreadRecapCache(
    upsertPersistedThreadRecap(
      cache,
      input.threadId as Parameters<typeof upsertPersistedThreadRecap>[1],
      persisted
    ),
    webStorage
  );
  return persisted;
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
    errors: result.errors,
    repositoryBatches: result.repositoryBatches,
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

export async function postPullRequestComment(
  input: PullRequestCommentInput
): Promise<PullRequestActionResult> {
  'background only';
  const { postSynaraPullRequestComment } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  return postSynaraPullRequestComment(input);
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
