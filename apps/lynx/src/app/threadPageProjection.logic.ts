// What the Lynx thread surfaces render, projected from a thread of the shared
// Web store (plan Step 4 / M3b).
//
// Upstream's session sync (`EventRouter`) is the only writer of thread detail;
// these functions only reshape a store `Thread` into the header summary and the
// transcript rows the Lynx components already take. The derivations themselves
// are upstream's (`session-logic`, `MessagesTimeline.logic`, `ChatView.logic`),
// called in the order `ChatView.tsx` calls them; upstream wires them inside
// that component, so the wiring is the part that exists twice. Markdown
// parsing is the Lynx adapter (the Web renderer parses inside its DOM
// component).

import type { OrchestrationCheckpointSummary, MessageId } from "@synara/contracts";
import {
  buildRevertTurnCountByUserMessageId,
  buildTurnDiffSummaryByAssistantMessageId,
  deriveMessagesTimelineRows,
} from "@synara-web/components/chat/MessagesTimeline.logic";
import {
  filterSidechatTranscriptMessages,
  resolveThreadDetailHydration,
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
} from "@synara-web/session-logic";
import type { ThreadDetailSyncState } from "@synara-web/storeState";
import type { Project, Thread } from "@synara-web/types";

import { parseMarkdown, type MarkdownNode } from "../components/markdown/markdownAst.lynx";
import { RpcTransportError } from "../data/rpcTransport.logic";
import type { ThreadHeaderSummary, ThreadTranscriptRow } from "./queries";
import type { TransportNoticeState } from "./transportRecovery.logic";

/**
 * Parsed markdown of the previous projection of one thread, by row source.
 * A streamed delta changes one message; every other tree is reused, which also
 * keeps the unchanged rows reference-equal for the list.
 */
export interface ThreadMarkdownCache {
  trees: Map<string, { readonly text: string; readonly tree: MarkdownNode | null }>;
  /**
   * History-wide derivations of the previous projection, each with the inputs
   * it was computed from. Streamed text changes `thread.messages` only, so the
   * work log (from activities) and the checkpoint maps (from diff summaries and
   * message identity) are reused instead of being rebuilt every flush.
   */
  slices?: {
    workLog?: { readonly inputs: readonly unknown[]; readonly value: unknown };
    turnDiffs?: { readonly inputs: readonly unknown[]; readonly value: unknown };
  };
}

function reuseSlice<Value>(
  cache: ThreadMarkdownCache,
  name: "workLog" | "turnDiffs",
  inputs: readonly unknown[],
  compute: () => Value,
): Value {
  const slices = (cache.slices ??= {});
  const previous = slices[name];
  if (
    previous &&
    previous.inputs.length === inputs.length &&
    previous.inputs.every((input, index) => Object.is(input, inputs[index]))
  ) {
    return previous.value as Value;
  }
  const value = compute();
  slices[name] = { inputs, value };
  return value;
}

export function createThreadMarkdownCache(): ThreadMarkdownCache {
  return { trees: new Map() };
}

/**
 * Transcript rows of a store thread. `cache` is updated to hold exactly the
 * trees this projection used.
 */
export function projectThreadTranscriptRows(
  thread: Thread,
  cache: ThreadMarkdownCache = createThreadMarkdownCache(),
): ThreadTranscriptRow[] {
  // Markdown parsing is background-thread code; the directive keeps it out of
  // the main-thread bundle. The main thread never has a thread to project (the
  // store is only hydrated by session sync, on the background thread).
  "background only";
  const nextTrees: ThreadMarkdownCache["trees"] = new Map();
  const parse = (key: string, text: string, role: "user" | "assistant"): MarkdownNode | null => {
    const used = nextTrees.get(key);
    if (used && used.text === text) return used.tree;
    const cached = cache.trees.get(key);
    const entry =
      cached && cached.text === text ? cached : { text, tree: parseMarkdown(text, role) };
    nextTrees.set(key, entry);
    return entry.tree;
  };

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
  const latestTurnId = thread.latestTurn?.turnId ?? undefined;
  const workEntries = reuseSlice(
    cache,
    "workLog",
    [thread.activities, latestTurnId, [...visibleTurnIds].join("\n")],
    () => deriveWorkLogEntries(thread.activities, latestTurnId, { visibleTurnIds }),
  );
  const timelineEntries = deriveTimelineEntries(
    visibleMessages as Parameters<typeof deriveTimelineEntries>[0],
    thread.proposedPlans as Parameters<typeof deriveTimelineEntries>[1],
    workEntries,
  );
  const activeTurnInProgress = thread.latestTurn?.state === "running";
  const { turnDiffSummaryByAssistantMessageId, inferredCheckpointTurnCountByTurnId } = reuseSlice(
    cache,
    "turnDiffs",
    [
      thread.turnDiffSummaries,
      visibleMessages
        .map((message) => `${message.id}\t${message.role}\t${message.turnId ?? ""}`)
        .join("\n"),
    ],
    () => ({
      turnDiffSummaryByAssistantMessageId: buildTurnDiffSummaryByAssistantMessageId({
        turnDiffSummaries: thread.turnDiffSummaries,
        messages: visibleMessages.map((message) => ({
          id: message.id,
          role: message.role,
          turnId: message.turnId ?? null,
        })),
      }),
      inferredCheckpointTurnCountByTurnId: Object.fromEntries(
        [...thread.turnDiffSummaries]
          .sort((left, right) => left.completedAt.localeCompare(right.completedAt))
          .map((summary, index) => [summary.turnId, index + 1]),
      ),
    }),
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
  const parsedTreeByMessageId = new Map(
    markdownMessages.map((message) => [
      message.id,
      parse(`message:${message.id}`, message.text, message.role === "user" ? "user" : "assistant"),
    ]),
  );
  const parsedTreeByWorkEntryId = new Map(
    markdownWorkEntries.map((entry) => [
      entry.id,
      parse(
        `work:${entry.id}`,
        formatAgentActivityEntryPreview(entry) ?? entry.preview ?? entry.detail ?? entry.label,
        "assistant",
      ),
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
  cache.trees = nextTrees;
  return rows;
}

/**
 * The store keeps a checkpoint as a turn diff summary (`normalizeTurnDiffSummaries`);
 * the diff surfaces take the checkpoint's own shape. A summary without a
 * checkpoint ref or turn count is a provisional one and has nothing to diff.
 */
function projectCheckpoints(
  turnDiffSummaries: Thread["turnDiffSummaries"],
): OrchestrationCheckpointSummary[] {
  return turnDiffSummaries.flatMap((summary) =>
    summary.checkpointRef === undefined || summary.checkpointTurnCount === undefined
      ? []
      : [
          {
            turnId: summary.turnId,
            checkpointTurnCount: summary.checkpointTurnCount,
            checkpointRef: summary.checkpointRef,
            status: (summary.status ?? "ready") as OrchestrationCheckpointSummary["status"],
            files: summary.files.map((file) => ({
              path: file.path,
              kind: file.kind ?? "modified",
              additions: file.additions ?? 0,
              deletions: file.deletions ?? 0,
            })),
            assistantMessageId: summary.assistantMessageId ?? null,
            completedAt: summary.completedAt,
          } as OrchestrationCheckpointSummary,
        ],
  );
}

/** Header, composer and dock inputs of a store thread. */
export function projectThreadHeaderSummary(
  thread: Thread,
  project: Pick<Project, "name" | "cwd"> | undefined,
): ThreadHeaderSummary {
  const provider = thread.session?.provider ?? thread.modelSelection.provider;
  return {
    id: thread.id,
    title: thread.title,
    projectId: thread.projectId,
    project: project?.name ?? "Synara",
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
    provider,
    lockedProvider: threadHasProviderLockingActivity(thread) ? provider : null,
    modelSelection: thread.modelSelection,
    runtimeMode: thread.runtimeMode,
    interactionMode: thread.interactionMode,
    // The server's session status; the store's `status` is the legacy phase.
    sessionStatus: thread.session?.orchestrationStatus ?? null,
    error: thread.session?.lastError ?? null,
    errorRevision: thread.session?.updatedAt ?? null,
    activeTurnId: thread.session?.activeTurnId ?? null,
    sidechatSourceThreadId: thread.sidechatSourceThreadId ?? null,
    parentThreadId: thread.parentThreadId ?? null,
    workingDirectory: thread.workingDirectory ?? null,
    latestTurnState: thread.latestTurn?.state ?? null,
    workspaceRoot: project?.cwd ?? null,
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
    checkpoints: projectCheckpoints(thread.turnDiffSummaries),
  };
}

export interface ThreadPageData {
  readonly data: ThreadTranscriptRow[];
  readonly summary: ThreadHeaderSummary | undefined;
}

export interface ThreadPageRead {
  /** `undefined` while there is nothing to show yet (loading or failed). */
  readonly data: ThreadPageData | undefined;
  readonly error: Error | null;
  readonly isPending: boolean;
}

const EMPTY_ROWS: ThreadTranscriptRow[] = [];
const UNKNOWN_THREAD: ThreadPageData = { data: EMPTY_ROWS, summary: undefined };

/**
 * What the thread page shows for the store's current view of a thread.
 *
 * - No shell yet: loading, or offline once the transport reports closed.
 * - Shell hydrated, thread unknown (deleted, or created a moment ago and not
 *   streamed yet): the empty page, as before.
 * - Thread known, detail not applied: upstream's `resolveThreadDetailHydration`
 *   decides between loading and failed; a shell row alone cannot tell "no
 *   messages" from "history not loaded".
 * - Otherwise the projected rows and summary. A dropped connection does not
 *   take content away: session sync resubscribes and catches up on its own.
 */
export function resolveThreadPageRead(input: {
  readonly threadsHydrated: boolean;
  readonly thread: Thread | undefined;
  readonly detailSyncState: ThreadDetailSyncState | null;
  readonly transport: TransportNoticeState;
  readonly project: () => ThreadPageData;
}): ThreadPageRead {
  const waiting = (): ThreadPageRead =>
    input.transport === "offline"
      ? {
          data: undefined,
          error: new RpcTransportError("Synara is offline."),
          isPending: false,
        }
      : { data: undefined, error: null, isPending: true };
  if (!input.thread) {
    return input.threadsHydrated
      ? { data: UNKNOWN_THREAD, error: null, isPending: false }
      : waiting();
  }
  // Rows are only derived once there can be any: before the detail is applied
  // the thread has no messages, activities or plans.
  const hasDetail =
    input.detailSyncState === "synced" ||
    input.thread.messages.length > 0 ||
    input.thread.activities.length > 0 ||
    input.thread.proposedPlans.length > 0;
  const projected = hasDetail ? input.project() : undefined;
  const hydration = resolveThreadDetailHydration({
    isServerThread: true,
    hasTimelineEntries: (projected?.data.length ?? 0) > 0,
    detailSyncState: input.detailSyncState,
  });
  if (hydration === "ready") {
    return { data: projected ?? input.project(), error: null, isPending: false };
  }
  if (hydration === "failed") {
    return {
      data: undefined,
      error: new Error("Thread updates could not be loaded."),
      isPending: false,
    };
  }
  return waiting();
}
