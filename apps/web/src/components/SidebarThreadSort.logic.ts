// FILE: SidebarThreadSort.logic.ts
// Purpose: Runtime-portable sidebar attention and timestamp ordering.
// Exports: Shared thread/project sorting used by Web and Lynx sidebar controllers.

import { hasLiveLatestTurn } from "../sessionActivity.logic";

type SidebarProjectSortOrder = "updated_at" | "created_at" | "manual";
type SidebarThreadSortOrder = "updated_at" | "created_at";
type SidebarLatestTurnTiming = {
  readonly state: string;
  readonly startedAt?: string | null | undefined;
  readonly completedAt?: string | null | undefined;
};
type SidebarSessionActivity = {
  readonly status: string;
  readonly orchestrationStatus?: string | null | undefined;
  readonly activeTurnId?: string | null | undefined;
};

export type SidebarProjectSortInput = {
  id: string;
  name: string;
  createdAt?: string | undefined;
  updatedAt?: string | undefined;
};

export type SidebarThreadSortInput = {
  createdAt: string;
  updatedAt?: string | undefined;
  latestUserMessageAt?: string | null | undefined;
  messages?: ReadonlyArray<{
    readonly role: string;
    readonly createdAt: string;
  }> | undefined;
  latestTurn?: SidebarLatestTurnTiming | null | undefined;
  lastVisitedAt?: string | null | undefined;
  hasLiveTailWork?: boolean | undefined;
  session?: SidebarSessionActivity | null | undefined;
};

export function hasUnseenCompletion(
  thread: Pick<SidebarThreadSortInput, "latestTurn" | "lastVisitedAt">,
): boolean {
  if (!thread.latestTurn?.completedAt) return false;
  const completedAt = Date.parse(thread.latestTurn.completedAt);
  if (Number.isNaN(completedAt)) return false;
  if (!thread.lastVisitedAt) return true;

  const lastVisitedAt = Date.parse(thread.lastVisitedAt);
  if (Number.isNaN(lastVisitedAt)) return true;
  return completedAt > lastVisitedAt;
}

export function isThreadActivelyWorking(thread: {
  hasLiveTailWork?: boolean | undefined;
  session?: SidebarSessionActivity | null | undefined;
  latestTurn?: SidebarLatestTurnTiming | null | undefined;
}): boolean {
  if (thread.hasLiveTailWork === true) {
    return true;
  }
  const session = thread.session ?? null;
  return (
    session?.status === "running" &&
    (thread.latestTurn == null || hasLiveLatestTurn(thread.latestTurn, session))
  );
}

function toSortableTimestamp(iso: string | undefined): number | null {
  if (!iso) return null;
  const ms = Date.parse(iso);
  return Number.isFinite(ms) ? ms : null;
}

function getLatestUserMessageTimestamp(thread: SidebarThreadSortInput): number {
  const latestUserMessageAt = toSortableTimestamp(thread.latestUserMessageAt ?? undefined);
  if (latestUserMessageAt !== null) {
    return latestUserMessageAt;
  }

  let latestUserMessageTimestamp: number | null = null;
  for (const message of thread.messages ?? []) {
    if (message.role !== "user") continue;
    const messageTimestamp = toSortableTimestamp(message.createdAt);
    if (messageTimestamp === null) continue;
    latestUserMessageTimestamp =
      latestUserMessageTimestamp === null
        ? messageTimestamp
        : Math.max(latestUserMessageTimestamp, messageTimestamp);
  }

  if (latestUserMessageTimestamp !== null) {
    return latestUserMessageTimestamp;
  }
  return toSortableTimestamp(thread.updatedAt ?? thread.createdAt) ?? Number.NEGATIVE_INFINITY;
}

function getThreadSortTimestamp(
  thread: SidebarThreadSortInput,
  sortOrder: SidebarThreadSortOrder | Exclude<SidebarProjectSortOrder, "manual">,
): number {
  if (sortOrder === "created_at") {
    return toSortableTimestamp(thread.createdAt) ?? Number.NEGATIVE_INFINITY;
  }
  return getLatestUserMessageTimestamp(thread);
}

function isUnseenFinishedThread(thread: SidebarThreadSortInput): boolean {
  if (thread.hasLiveTailWork === true) {
    return false;
  }
  return hasUnseenCompletion({
    latestTurn: thread.latestTurn ?? null,
    lastVisitedAt: thread.lastVisitedAt,
  });
}

function threadSortAttentionRank(thread: SidebarThreadSortInput): number {
  if (isThreadActivelyWorking(thread) || thread.session?.status === "connecting") {
    return 2;
  }
  if (isUnseenFinishedThread(thread)) {
    return 1;
  }
  return 0;
}

export function sortThreadsForSidebar<
  T extends { id: string } & SidebarThreadSortInput,
>(threads: readonly T[], sortOrder: SidebarThreadSortOrder): T[] {
  return [...threads].sort((left, right) => {
    const byAttentionRank = threadSortAttentionRank(right) - threadSortAttentionRank(left);
    if (byAttentionRank !== 0) return byAttentionRank;
    const rightTimestamp = getThreadSortTimestamp(right, sortOrder);
    const leftTimestamp = getThreadSortTimestamp(left, sortOrder);
    const byTimestamp =
      rightTimestamp === leftTimestamp ? 0 : rightTimestamp > leftTimestamp ? 1 : -1;
    if (byTimestamp !== 0) return byTimestamp;
    return right.id.localeCompare(left.id);
  });
}

export function getFallbackThreadIdAfterDelete<
  T extends { id: string; projectId: string } & SidebarThreadSortInput,
>(input: {
  threads: readonly T[];
  deletedThreadId: T["id"];
  sortOrder: SidebarThreadSortOrder;
  deletedThreadIds?: ReadonlySet<T["id"]>;
}): T["id"] | null {
  const { deletedThreadId, deletedThreadIds, sortOrder, threads } = input;
  const deletedThread = threads.find((thread) => thread.id === deletedThreadId);
  if (!deletedThread) return null;

  return (
    sortThreadsForSidebar(
      threads.filter(
        (thread) =>
          thread.projectId === deletedThread.projectId &&
          thread.id !== deletedThreadId &&
          !deletedThreadIds?.has(thread.id),
      ),
      sortOrder,
    )[0]?.id ?? null
  );
}

export function getProjectSortTimestamp(
  project: SidebarProjectSortInput,
  projectThreads: readonly SidebarThreadSortInput[],
  sortOrder: Exclude<SidebarProjectSortOrder, "manual">,
): number {
  if (projectThreads.length > 0) {
    return projectThreads.reduce(
      (latest, thread) => Math.max(latest, getThreadSortTimestamp(thread, sortOrder)),
      Number.NEGATIVE_INFINITY,
    );
  }
  if (sortOrder === "created_at") {
    return toSortableTimestamp(project.createdAt) ?? Number.NEGATIVE_INFINITY;
  }
  return toSortableTimestamp(project.updatedAt ?? project.createdAt) ?? Number.NEGATIVE_INFINITY;
}

export function sortProjectsForSidebar<
  TProject extends SidebarProjectSortInput,
  TThread extends { projectId: string } & SidebarThreadSortInput,
>(
  projects: readonly TProject[],
  threads: readonly TThread[],
  sortOrder: SidebarProjectSortOrder,
): TProject[] {
  if (sortOrder === "manual") return [...projects];

  const threadsByProjectId = new Map<string, TThread[]>();
  for (const thread of threads) {
    const existing = threadsByProjectId.get(thread.projectId) ?? [];
    existing.push(thread);
    threadsByProjectId.set(thread.projectId, existing);
  }

  return [...projects].sort((left, right) => {
    const rightTimestamp = getProjectSortTimestamp(
      right,
      threadsByProjectId.get(right.id) ?? [],
      sortOrder,
    );
    const leftTimestamp = getProjectSortTimestamp(
      left,
      threadsByProjectId.get(left.id) ?? [],
      sortOrder,
    );
    const byTimestamp =
      rightTimestamp === leftTimestamp ? 0 : rightTimestamp > leftTimestamp ? 1 : -1;
    if (byTimestamp !== 0) return byTimestamp;
    return left.name.localeCompare(right.name) || left.id.localeCompare(right.id);
  });
}
