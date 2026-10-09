// P2-V6: react-query selectors over the real Synara Effect-RPC WebSocket
// snapshot. The transport is a singleton; both queries share its latest read.

import { pullRequestListEntryHasProject } from "@synara/shared/githubRepository";
import { ORCHESTRATION_WS_METHODS, type ThreadId } from "@synara/contracts";
import { ensureNativeApi } from "~/nativeApi";
import { queryClient } from "./queryClient";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
  resolveAssistantDeliveryMode,
} from "@synara-web/appSettingsStorageProjection.logic";
import type {
  AssistantDeliveryMode,
  AutomationListResult,
  AutomationDefinition,
  AutomationCreateInput,
  AutomationDeleteInput,
  AutomationUpdateInput,
  AutomationRunNowInput,
  AutomationRunNowResult,
  MessageId,
  ModelSelection,
  OrchestrationThreadPullRequest,
  PinnedMessage,
  ProjectId,
  ProviderInteractionMode,
  ProviderKind,
  PullRequestDetail,
  PullRequestDetailInput,
  PullRequestDiffResult,
  PullRequestActionInput,
  PullRequestActionResult,
  PullRequestCommentInput,
  PullRequestListEntry,
  PullRequestSetPinnedInput,
  PullRequestSetPinnedResult,
  PullRequestState,
  ProviderComposerCapabilities,
  ProviderListModelsResult,
  ProviderListPluginsResult,
  ProviderListSkillsResult,
  ProjectListDirectoriesResult,
  ProjectReadFileResult,
  ProjectSearchEntriesResult,
  OrchestrationMessage,
  OrchestrationSidebarSearchSnapshot,
  OrchestrationCheckpointSummary,
  OrchestrationThreadActivity,
  ThreadHandoff,
  TurnId,
  RuntimeMode,
} from "@synara/contracts";
import type { SidebarStatusPresentation } from "@synara-web/components/SidebarStatus.logic";
import {
  buildRevertTurnCountByUserMessageId,
  buildTurnDiffSummaryByAssistantMessageId,
  deriveMessagesTimelineRows,
  type MessagesTimelineRow,
} from "@synara-web/components/chat/MessagesTimeline.logic";
import {
  filterSidechatTranscriptMessages,
  threadHasProviderLockingActivity,
} from "@synara-web/components/ChatView.logic";
import {
  formatAgentActivityEntryPreview,
  isReasoningUpdateWorkEntry,
} from "@synara-web/components/chat/agentActivity.logic";
import {
  derivePendingApprovals,
  derivePendingUserInputs,
  deriveTimelineEntries,
  deriveWorkLogEntries,
  type PendingApproval,
  type PendingUserInput,
} from "@synara-web/session-logic";
import type { Project, SidebarThreadSummary, Space } from "@synara-web/types";
import type {
  SidebarSearchProject,
  SidebarSearchThread,
} from "@synara-web/components/SidebarSearchPalette.logic";
import { webStorage } from "../platform/storage";
import {
  deriveThreadRecapSource,
  persistThreadRecapCache,
  readPersistedThreadRecapCache,
  upsertPersistedThreadRecap,
} from "@synara-web/lib/threadRecap";
import type { NativeSyntaxHighlightThemes } from "../main/syntaxHighlightingContract.logic";
import { resolveSnapshotThreadProvider } from "./threadSummaryProjection.logic";
import { parseMarkdown, type MarkdownNode } from "../components/markdown/markdownAst.lynx";

export { queryClient };

export interface ThreadSummary {
  readonly id: string;
  readonly title: string;
  readonly projectId: string;
  readonly project: string;
  readonly messageCount: number;
  readonly createdAt: string;
  readonly updatedAt: string;
  readonly archivedAt?: string | null;
  readonly latestUserMessageAt?: string | null;
  readonly live: boolean;
  readonly provider?: ProviderKind;
  readonly isPinned?: boolean;
  readonly sessionStatus?: string | null;
  readonly activeTurnId?: string | null;
  readonly hasPendingApprovals?: boolean;
  readonly hasPendingUserInput?: boolean;
  readonly latestTurnCompletedAt?: string | null;
  readonly latestTurnState?: string | null;
  readonly parentThreadId?: string | null;
  readonly subagentAgentId?: string | null;
  readonly subagentNickname?: string | null;
  readonly subagentRole?: string | null;
  readonly forkSourceThreadId?: string | null;
  readonly sidechatSourceThreadId?: string | null;
  readonly handoffSourceProvider?: string | null;
  readonly envMode?: "local" | "worktree";
  readonly branch?: string | null;
  readonly worktreePath?: string | null;
  readonly associatedWorktreePath?: string | null;
  readonly associatedWorktreeBranch?: string | null;
  readonly status?: SidebarStatusPresentation | null;
}

export interface ProjectSummary {
  readonly id: string;
  readonly kind: "project" | "chat" | "studio" | "group";
  readonly title: string;
  readonly remoteName: string;
  readonly folderName: string;
  readonly localName: string | null;
  readonly workspaceRoot: string;
  readonly defaultModelSelection: ModelSelection | null;
  readonly scripts: readonly import("@synara/contracts").ProjectScript[];
  readonly isPinned?: boolean;
  readonly spaceId?: import("@synara/contracts").SpaceId | null;
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
  readonly envMode: "local" | "worktree";
  readonly handoff: ThreadHandoff | null;
  readonly messages: readonly OrchestrationMessage[];
  readonly activities: readonly OrchestrationThreadActivity[];
  readonly worktreePath: string | null;
  readonly associatedWorktreePath: string | null;
  readonly associatedWorktreeBranch: string | null;
  readonly associatedWorktreeRef: string | null;
  readonly createBranchFlowCompleted: boolean;
  readonly provider?: ProviderKind;
  /** Electron's `lockedProvider`: a thread with native activity keeps its provider. */
  readonly lockedProvider: ProviderKind | null;
  readonly modelSelection: ModelSelection;
  readonly runtimeMode: RuntimeMode;
  readonly interactionMode: ProviderInteractionMode;
  readonly sessionStatus: string | null;
  readonly error: string | null;
  readonly errorRevision: string | null;
  readonly activeTurnId: TurnId | null;
  readonly sidechatSourceThreadId: string | null;
  readonly parentThreadId: string | null;
  readonly workingDirectory: string | null;
  readonly latestTurnState: string | null;
  readonly workspaceRoot: string | null;
  readonly notes: string;
  readonly pinnedMessages: readonly PinnedMessage[];
  readonly pinnedMessageTextById: Readonly<Record<string, string>>;
  readonly pinnedRevision: string;
  readonly lastKnownPr: OrchestrationThreadPullRequest | null;
  readonly pendingApprovals: readonly PendingApproval[];
  readonly pendingUserInputs: readonly PendingUserInput[];
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
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
  readonly spaces: readonly Space[];
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly archivedThreads: readonly ThreadSummary[];
  readonly workspaceThreads: readonly WorktreeThreadSummary[];
  readonly searchProjects: readonly SidebarSearchProject[];
  readonly searchThreads: readonly SidebarSearchThread[];
  readonly kanbanProjects: readonly Pick<Project, "id" | "kind" | "name">[];
  readonly kanbanThreads: readonly SidebarThreadSummary[];
}

export type ThreadTranscriptRow = MessagesTimelineRow & {
  readonly markdownTree?: MarkdownNode | null;
  readonly markdownTreesByMessageId?: Readonly<Record<string, MarkdownNode | null>>;
  readonly markdownTreesByWorkEntryId?: Readonly<Record<string, MarkdownNode | null>>;
};

// Directory listings are never truncated; only search results report it.
export type ExplorerEntriesResult =
  | (ProjectListDirectoriesResult & { readonly truncated?: undefined })
  | ProjectSearchEntriesResult;

/**
 * The delivery mode for a new turn, resolved at send time from the same setting the
 * web app uses (server value first, then the stored app settings, default streaming).
 */
export async function resolveNativeAssistantDeliveryMode(): Promise<AssistantDeliveryMode> {
  "background only";
  const { webStorage } = await import(/* webpackMode: "eager" */ "../platform/storage");
  const serverSettings = await ensureNativeApi()
    .server.getSettings()
    .catch(() => null);
  return resolveAssistantDeliveryMode(
    readSettingsBehaviorProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      serverSettings?.enableAssistantStreaming,
    ),
  );
}

const transcriptRowsByThreadId = new Map<
  string,
  {
    readonly snapshotSequence: number;
    readonly rows: ThreadTranscriptRow[];
  }
>();

/** A project or repository whose pull requests are missing or stale. */
export interface PullRequestListError {
  readonly projectId: ProjectId;
  readonly projectTitle: string;
  readonly message: string;
}

export interface PullRequestRepositoryBatch {
  readonly repository: string;
  readonly projectIds: readonly ProjectId[];
  /** More pull requests exist in the listed state than the server returned. */
  readonly truncated: boolean;
}

export interface PullRequestSnapshot {
  readonly viewer: string | null;
  readonly entries: readonly PullRequestListEntry[];
  readonly errors: readonly PullRequestListError[];
  readonly repositoryBatches: readonly PullRequestRepositoryBatch[];
}

/** Message windows for the sidebar search palette; a server read upstream does not have. */
export async function fetchSidebarSearchSnapshot(): Promise<OrchestrationSidebarSearchSnapshot> {
  "background only";
  // `orchestration.getSidebarSearchSnapshot` is a fork-only RPC with no method
  // on upstream's facade, so it goes straight to the shared host relay request.
  const { nativeRpcRequest } = await import(/* webpackMode: "eager" */ "../data/nativeRpcBridge");
  return nativeRpcRequest<OrchestrationSidebarSearchSnapshot>(
    ORCHESTRATION_WS_METHODS.getSidebarSearchSnapshot,
    {},
  );
}

/** The Explorer's file on screen: upstream's read plus the host's highlighting. */
export interface ExplorerFileResult {
  readonly file: ProjectReadFileResult;
  readonly syntaxHighlight: NativeSyntaxHighlightThemes | null;
}

export async function fetchExplorerLocalPreviewUrl(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<string> {
  "background only";
  const [{ bridgeCall }, { buildWorkspaceLocalPreviewUrl }] = await Promise.all([
    import(/* webpackMode: "eager" */ "../platform/bridge"),
    import(/* webpackMode: "eager" */ "./localPreview.logic"),
  ]);
  const runtime = await bridgeCall<{ readonly wsUrl?: unknown }>("runtimeGetSynaraWsUrl");
  const wsUrl = typeof runtime?.wsUrl === "string" ? runtime.wsUrl.trim() : "";
  if (!wsUrl) throw new Error("Synara runtime endpoint is unavailable.");
  return buildWorkspaceLocalPreviewUrl({
    wsUrl,
    cwd: input.workspaceRoot,
    path: input.relativePath,
  });
}

export async function fetchEditorIconUrl(editorId: string): Promise<string> {
  "background only";
  const { bridgeCall } = await import(/* webpackMode: "eager" */ "../platform/bridge");
  const response = await bridgeCall<{ readonly dataUrl?: unknown }>("runtimeGetEditorIcon", {
    editorId,
  });
  const dataUrl = typeof response?.dataUrl === "string" ? response.dataUrl.trim() : "";
  if (!dataUrl.startsWith("data:image/")) {
    throw new Error("Editor icon is unavailable.");
  }
  return dataUrl;
}

export async function fetchExplorerPdfMetadata(input: {
  readonly relativePath: string;
  readonly workspaceRoot: string;
}): Promise<{
  readonly pageCount: number;
  readonly width: number;
  readonly height: number;
}> {
  "background only";
  // No upstream query for PDF metadata (the Web preview reads it with pdf.js).
  return ensureNativeApi().projects.inspectPdf({
    cwd: input.workspaceRoot,
    path: input.relativePath,
  });
}

/** One authoritative thread detail read through the shared facade. */
function fetchThreadDetailSnapshot(threadId: string) {
  "background only";
  return ensureNativeApi().orchestration.getThreadDetailSnapshot({
    threadId: threadId as ThreadId,
  });
}

export async function fetchThreadCompletionAssistantSummary(
  threadId: string,
): Promise<string | null> {
  "background only";
  const { summarizeTaskCompletionAssistantMessage } = await import(
    /* webpackMode: "eager" */ "@synara-web/notifications/taskCompletion.logic"
  );
  const snapshot = await fetchThreadDetailSnapshot(threadId);
  return snapshot?.thread ? summarizeTaskCompletionAssistantMessage(snapshot.thread) : null;
}

export async function fetchThreadHeaderSummary(
  threadId: string,
): Promise<ThreadHeaderSummary | undefined> {
  "background only";
  const [detail, shell] = await Promise.all([
    fetchThreadDetailSnapshot(threadId),
    ensureNativeApi().orchestration.getShellSnapshot(),
  ]);
  const thread = detail?.thread;
  if (!thread) return undefined;
  const project = shell.projects.find((candidate) => candidate.id === thread.projectId);
  return {
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: project?.title ?? "Synara",
    // The snapshot omits null keys; commands built from this summary (Side, fork) must
    // send them as explicit nulls or the server rejects the missing key.
    branch: thread.branch ?? null,
    envMode: thread.envMode ?? "local",
    handoff: thread.handoff ?? null,
    messages: thread.messages,
    activities: thread.activities,
    worktreePath: thread.worktreePath ?? null,
    associatedWorktreePath: thread.associatedWorktreePath ?? null,
    associatedWorktreeBranch: thread.associatedWorktreeBranch ?? null,
    associatedWorktreeRef: thread.associatedWorktreeRef ?? null,
    createBranchFlowCompleted: thread.createBranchFlowCompleted ?? false,
    provider: resolveSnapshotThreadProvider(thread),
    lockedProvider: threadHasProviderLockingActivity({
      messages: thread.messages as never,
      sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
      latestTurn: thread.latestTurn as never,
      session: thread.session as never,
    })
      ? resolveSnapshotThreadProvider(thread)
      : null,
    modelSelection: thread.modelSelection,
    runtimeMode: thread.runtimeMode,
    interactionMode: thread.interactionMode,
    sessionStatus: thread.session?.status ?? null,
    error: thread.session?.lastError ?? null,
    errorRevision: thread.session?.updatedAt ?? null,
    activeTurnId: thread.session?.activeTurnId ?? null,
    sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
    parentThreadId: thread.parentThreadId ?? null,
    workingDirectory: thread.workingDirectory ?? null,
    latestTurnState: thread.latestTurn?.state ?? null,
    workspaceRoot: project?.workspaceRoot ?? null,
    notes: thread.notes ?? "",
    pinnedMessages: thread.pinnedMessages ?? [],
    pinnedMessageTextById: Object.fromEntries(
      thread.messages
        .filter(
          (message) =>
            (message.role === "user" || message.role === "assistant") &&
            message.text.trim().length > 0,
        )
        .map((message) => [message.id as MessageId, message.text]),
    ),
    pinnedRevision: JSON.stringify(thread.pinnedMessages ?? []),
    lastKnownPr: thread.lastKnownPr ?? null,
    pendingApprovals: derivePendingApprovals(thread.activities, thread.pendingInteractions),
    pendingUserInputs: derivePendingUserInputs(thread.activities, thread.pendingInteractions),
    checkpoints: thread.checkpoints,
  };
}

export async function fetchThreadTranscriptRows(threadId: string): Promise<ThreadTranscriptRow[]> {
  "background only";
  const [{ useStore }, { projectThreadDetailSnapshot }] = await Promise.all([
    import(/* webpackMode: "eager" */ "@synara-web/store"),
    import(/* webpackMode: "eager" */ "./threadDetailProjection.logic"),
  ]);
  const snapshot = await fetchThreadDetailSnapshot(threadId);
  if (!snapshot) return [];
  const cached = transcriptRowsByThreadId.get(threadId);
  if (cached?.snapshotSequence === snapshot.snapshotSequence) {
    return cached.rows;
  }
  // Projected, not committed: upstream session sync owns thread detail in the store.
  const thread = projectThreadDetailSnapshot(useStore.getState(), snapshot.thread);
  if (!thread) {
    transcriptRowsByThreadId.set(threadId, {
      snapshotSequence: snapshot.snapshotSequence,
      rows: [],
    });
    return [];
  }

  const visibleMessages = filterSidechatTranscriptMessages(
    thread.messages,
    Boolean(thread.sidechatSourceThreadId),
  );
  const visibleTurnIds = new Set(
    visibleMessages.flatMap((message) => (message.turnId ? [message.turnId] : [])),
  );
  if (thread.latestTurn?.turnId) {
    visibleTurnIds.add(thread.latestTurn.turnId);
  }
  const workEntries = deriveWorkLogEntries(
    thread.activities,
    thread.latestTurn?.turnId ?? undefined,
    { visibleTurnIds },
  );
  const timelineEntries = deriveTimelineEntries(
    visibleMessages as Parameters<typeof deriveTimelineEntries>[0],
    thread.proposedPlans as Parameters<typeof deriveTimelineEntries>[1],
    workEntries,
  );
  const activeTurnInProgress = thread.latestTurn?.state === "running";
  const turnDiffSummaryByAssistantMessageId = buildTurnDiffSummaryByAssistantMessageId({
    turnDiffSummaries: thread.turnDiffSummaries,
    messages: visibleMessages.map((message) => ({
      id: message.id,
      role: message.role,
      turnId: message.turnId ?? null,
    })),
  });
  const inferredCheckpointTurnCountByTurnId = Object.fromEntries(
    [...thread.turnDiffSummaries]
      .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
      .map((summary, index) => [summary.turnId, index + 1]),
  );
  const revertTurnCountByUserMessageId = buildRevertTurnCountByUserMessageId({
    timelineEntries,
    turnDiffSummaryByAssistantMessageId,
    inferredCheckpointTurnCountByTurnId,
  });
  const derivedRows = deriveMessagesTimelineRows({
    timelineEntries,
    isWorking: activeTurnInProgress,
    worktreeSetup: null,
    worktreeSetupOpen: false,
    activeTurnInProgress,
    activeTurnId: thread.latestTurn?.turnId ?? null,
    activeTurnStartedAt: thread.latestTurn?.startedAt ?? null,
    turnDiffSummaryByAssistantMessageId,
    revertTurnCountByUserMessageId,
  });
  const markdownMessages = derivedRows.flatMap((row) =>
    row.kind === "message"
      ? [
          row.message,
          ...(row.collapsedTurnItems ?? []).flatMap((item) =>
            item.kind === "narration" ? [item.message] : [],
          ),
        ]
      : [],
  );
  const markdownWorkEntries = derivedRows.flatMap((row) => {
    const entries =
      row.kind === "work"
        ? row.groupedEntries
        : row.kind === "message"
          ? [
              ...(row.leadingWorkEntries ?? []),
              ...(row.inlineWorkEntries ?? []),
              ...(row.collapsedTurnItems ?? []).flatMap((item) =>
                item.kind === "work" ? [item.entry] : [],
              ),
            ]
          : [];
    return entries.filter(isReasoningUpdateWorkEntry);
  });
  const parsedMarkdownTrees = [
    ...markdownMessages.map((message) =>
      parseMarkdown(message.text, message.role === "user" ? "user" : "assistant"),
    ),
    ...markdownWorkEntries.map((entry) =>
      parseMarkdown(
        formatAgentActivityEntryPreview(entry) ?? entry.preview ?? entry.detail ?? entry.label,
        "assistant",
      ),
    ),
  ];
  const parsedTreeByMessageId = new Map(
    markdownMessages.map((message, index) => [message.id, parsedMarkdownTrees[index] ?? null]),
  );
  const parsedTreeByWorkEntryId = new Map(
    markdownWorkEntries.map((entry, index) => [
      entry.id,
      parsedMarkdownTrees[markdownMessages.length + index] ?? null,
    ]),
  );
  const rows = derivedRows.map((row): ThreadTranscriptRow => {
    const rowWorkEntries =
      row.kind === "work"
        ? row.groupedEntries
        : row.kind === "message"
          ? [
              ...(row.leadingWorkEntries ?? []),
              ...(row.inlineWorkEntries ?? []),
              ...(row.collapsedTurnItems ?? []).flatMap((item) =>
                item.kind === "work" ? [item.entry] : [],
              ),
            ]
          : [];
    const markdownTreesByWorkEntryId = Object.fromEntries(
      rowWorkEntries
        .filter(isReasoningUpdateWorkEntry)
        .map((entry) => [entry.id, parsedTreeByWorkEntryId.get(entry.id) ?? null]),
    );
    if (row.kind !== "message") {
      return Object.keys(markdownTreesByWorkEntryId).length > 0
        ? { ...row, markdownTreesByWorkEntryId }
        : row;
    }
    const messages = [
      row.message,
      ...(row.collapsedTurnItems ?? []).flatMap((item) =>
        item.kind === "narration" ? [item.message] : [],
      ),
    ];
    const markdownTreesByMessageId: Record<string, MarkdownNode | null> = {};
    for (const message of messages)
      markdownTreesByMessageId[message.id] = parsedTreeByMessageId.get(message.id) ?? null;
    return {
      ...row,
      markdownTree: markdownTreesByMessageId[row.message.id] ?? null,
      markdownTreesByMessageId,
      markdownTreesByWorkEntryId,
    };
  });
  transcriptRowsByThreadId.set(threadId, {
    snapshotSequence: snapshot.snapshotSequence,
    rows,
  });
  return rows;
}

export async function fetchThreadRecapSummary(
  threadId: string,
): Promise<ThreadRecapSummary | null> {
  "background only";
  const cache = readPersistedThreadRecapCache(webStorage);
  return cache[threadId as keyof typeof cache] ?? null;
}

export async function prepareThreadRecap(threadId: string): Promise<ThreadRecapPlan | null> {
  "background only";
  const [{ useStore }, { projectThreadDetailSnapshot }] = await Promise.all([
    import(/* webpackMode: "eager" */ "@synara-web/store"),
    import(/* webpackMode: "eager" */ "./threadDetailProjection.logic"),
  ]);
  const snapshot = await fetchThreadDetailSnapshot(threadId);
  if (!snapshot) return null;
  // Projected, not committed: upstream session sync owns thread detail in the store.
  const thread = projectThreadDetailSnapshot(useStore.getState(), snapshot.thread);
  if (!thread) return null;
  const cache = readPersistedThreadRecapCache(webStorage);
  const existing = cache[threadId] ?? null;
  const hasStreamingAssistant = thread.messages.some(
    (message) => message.role === "assistant" && message.streaming,
  );
  if (thread.latestTurn?.state === "running" || hasStreamingAssistant) {
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
  "background only";
  const cache = readPersistedThreadRecapCache(webStorage);
  const result = await ensureNativeApi().server.generateThreadRecap({
    cwd: input.cwd,
    newMaterial: input.plan.newMaterial,
    currentState: input.plan.currentState,
    ...(input.plan.existing?.text ? { previousRecap: input.plan.existing.text } : {}),
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
      persisted,
    ),
    webStorage,
  );
  return persisted;
}

/**
 * Pull requests for the Lynx list. Upstream replaced `pullRequests.list` with the GitHub
 * inbox (`githubInbox.list`: pull requests and issues of every project in one superset); this
 * keeps the pull-request rows and scopes them to `projectId` on the client, as upstream does.
 * The inbox knows open and closed; merged pull requests arrive in the closed list.
 */
export async function fetchPullRequests(input: {
  readonly state: PullRequestState;
  readonly projectId: ProjectId | null;
}): Promise<PullRequestSnapshot> {
  "background only";
  const result = await ensureNativeApi().githubInbox.list({
    state: input.state === "open" ? "open" : "closed",
  });
  const inProject = (projectIds: readonly ProjectId[]) =>
    input.projectId === null || projectIds.includes(input.projectId);
  return {
    viewer: result.viewer,
    entries: result.items.flatMap((item) => {
      if (item.kind !== "pullRequest" || item.state !== input.state) return [];
      const { kind: _kind, ...entry } = item;
      return input.projectId === null || pullRequestListEntryHasProject(entry, input.projectId)
        ? [entry]
        : [];
    }),
    errors: result.errors
      .filter((error) => !error.showingCachedData && inProject([error.projectId]))
      .map(({ projectId, projectTitle, message }) => ({ projectId, projectTitle, message })),
    repositoryBatches: result.repositoryBatches
      .filter((batch) => inProject(batch.projectIds))
      .map((batch) => ({
        repository: batch.repository,
        projectIds: batch.projectIds,
        truncated: batch.truncatedPullRequests,
      })),
  };
}
