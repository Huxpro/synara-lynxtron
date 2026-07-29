// FILE: Sidebar.logic.ts
// Purpose: Shared sidebar sorting and status helpers used by the thread list UI.
// Exports: Sidebar row state derivation, add-project error helpers, sort utilities, and visibility helpers.

import {
  type ProjectId,
  type ThreadId,
} from "@synara/contracts";
import { resolveThreadEnvironmentMode } from "@synara/shared/threadEnvironment";
import { isWorkspaceRootWithin, workspaceRootsEqual } from "@synara/shared/threadWorkspace";
import type { SidebarThreadSortOrder } from "../appSettings";
import type { Project, SidebarThreadSummary, Thread } from "../types";
import { cn } from "../lib/utils";
import {
  SIDEBAR_ROW_ACTIVE_CLASS_NAME,
  SIDEBAR_ROW_HOVER_CLASS_NAME,
  SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
  SIDEBAR_THREAD_ROW_BASE_CLASS_NAME,
} from "../sidebarRowStyles";
import { isDuplicateProjectCreateError } from "../lib/projectCreateRecovery";
import { formatWorktreePathForDisplay } from "../worktreeCleanup";
import {
  buildProjectThreadTree as buildProjectThreadTreeShared,
  getVisibleSidebarEntriesForPreview as getVisibleSidebarEntriesForPreviewShared,
  getVisibleThreadsForProject as getVisibleThreadsForProjectShared,
  resolveSidebarThreadListPaging as resolveSidebarThreadListPagingShared,
} from "./SidebarThreadPaging.logic";
import {
  sortThreadsForSidebar,
  type SidebarThreadSortInput,
} from "./SidebarThreadSort.logic";
import { deriveSidebarProjectRows } from "./SidebarProjectRows.logic";
import { getUnpinnedThreadsForSidebar } from "./SidebarThreadPinning.logic";
import { resolveSidebarProjectStatus } from "./SidebarStatus.logic";
import {
  resolveThreadStatusPill,
  type ThreadStatusPill,
} from "./SidebarThreadStatus.logic";

export {
  resolvePullRequestReviewBadge,
  type SidebarActionBadge,
} from "./SidebarActionBadges.logic";
export {
  isProjectsSidebarSurface,
  resolveSidebarPrimarySurface,
  type SidebarPrimarySurface,
} from "./SidebarSurface.logic";
export {
  extractDuplicateProjectCreateProjectId,
  isDuplicateProjectCreateError,
} from "../lib/projectCreateRecovery";
export {
  groupSidebarThreadsByProjectId,
  sortSidebarRowsByUpdatedAt,
} from "./SidebarProjection.logic";
export { resolveSidebarThreadRowModel } from "./SidebarThreadRowModel.logic";
export {
  getFallbackThreadIdAfterDelete,
  getProjectSortTimestamp,
  hasUnseenCompletion,
  isThreadActivelyWorking,
  sortProjectsForSidebar,
  sortThreadsForSidebar,
} from "./SidebarThreadSort.logic";
export {
  SIDEBAR_THREAD_PREVIEW_LIMIT,
  SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
} from "./SidebarThreadPaging.logic";
export {
  collectVisibleSidebarThreadIds,
  getNextVisibleSidebarThreadId,
  getSidebarThreadIdForJumpCommand,
  getSidebarThreadIdsToPrewarm,
  SIDEBAR_THREAD_PREWARM_LIMIT,
} from "./SidebarThreadNavigation.logic";
export {
  derivePinnedThreadIdsForSidebar,
  getPinnedThreadsForSidebar,
  getUnpinnedThreadsForSidebar,
  isLatestPinnedThreadMutation,
  shouldPrunePinnedThreads,
} from "./SidebarThreadPinning.logic";
export {
  derivePinnedProjectIdsForSidebar,
  isLatestPinnedProjectMutation,
  orderPinnedProjectsForSidebar,
} from "./SidebarProjectPinning.logic";
export {
  resolveProjectEmptyState,
  resolveSidebarProjectsSectionState,
  type ProjectEmptyState,
  type SidebarProjectsSectionState,
} from "./SidebarProjectsState.logic";
export { pruneProjectThreadListPagingForCollapsedProjects } from "./SidebarProjectPaging.logic";
export {
  resolveSettingsBackTarget,
  type SettingsBackTarget,
} from "./SidebarSettingsBack.logic";
export {
  resolveThreadStatusPill,
  type ThreadStatusPill,
} from "./SidebarThreadStatus.logic";

export const THREAD_SELECTION_SAFE_SELECTOR = "[data-thread-item], [data-thread-selection-safe]";
export const DEBUG_FEATURE_FLAGS_MENU_STORAGE_KEY = "synara:show-debug-feature-flags-menu";
export type SidebarNewThreadEnvMode = "local" | "worktree";
export type { SidebarView } from "./SidebarSegmentedPicker.logic";

/** Stable repository-resolution input for PR caches. Sidebar-only presentation changes such as
 * expand/collapse and ordering do not invalidate; project roots/names do. */
export function pullRequestRepositoryConfigFingerprint(
  projects: ReadonlyArray<Pick<Project, "id" | "kind" | "cwd" | "name" | "remoteName">>,
): string {
  return JSON.stringify(
    projects
      .filter((project) => project.kind === "project")
      .map((project) => [project.id, project.cwd, project.name, project.remoteName] as const)
      .toSorted((left, right) => left[0].localeCompare(right[0])),
  );
}

/** The optimistic segment follows a destination click and clears when the user returns. */
export { resolvePendingSidebarViewSelection } from "./SidebarSegmentedPicker.logic";

function nonEmptyDisplayValue(value: string | null | undefined): string | null {
  const trimmed = value?.trim();
  return trimmed && trimmed.length > 0 ? trimmed : null;
}

function differentDisplayValue(
  value: string | null | undefined,
  existing: string | null,
): string | null {
  const normalized = nonEmptyDisplayValue(value);
  if (!normalized) {
    return null;
  }
  return existing !== null && normalized === existing ? null : normalized;
}

export type SidebarThreadHoverMetadata = {
  projectName: string | null;
  projectCwd: string | null;
  sourceProjectName: string | null;
  branch: string | null;
  worktreeName: string | null;
};

export function resolveThreadHoverCardMetadata(input: {
  thread: Pick<
    SidebarThreadSummary,
    "envMode" | "branch" | "worktreePath" | "associatedWorktreePath" | "associatedWorktreeBranch"
  >;
  project: Pick<Project, "name" | "folderName" | "cwd"> | null;
}): SidebarThreadHoverMetadata {
  const projectName =
    nonEmptyDisplayValue(input.project?.name) ?? nonEmptyDisplayValue(input.project?.folderName);
  const activeWorktreePath = nonEmptyDisplayValue(input.thread.worktreePath);
  const isWorktree =
    resolveThreadEnvironmentMode({
      envMode: input.thread.envMode,
      worktreePath: activeWorktreePath,
    }) === "worktree";
  const associatedWorktreePath = nonEmptyDisplayValue(input.thread.associatedWorktreePath);
  const worktreePath = isWorktree ? (associatedWorktreePath ?? activeWorktreePath) : null;

  return {
    projectName,
    projectCwd: input.project?.cwd ?? null,
    sourceProjectName: isWorktree
      ? differentDisplayValue(input.project?.folderName, projectName)
      : null,
    branch:
      nonEmptyDisplayValue(input.thread.associatedWorktreeBranch) ??
      nonEmptyDisplayValue(input.thread.branch),
    worktreeName: worktreePath ? formatWorktreePathForDisplay(worktreePath) : null,
  };
}

export function isLoopbackHostname(hostname: string): boolean {
  const normalizedHostname = hostname.trim().toLowerCase().replace(/\.$/, "");

  return (
    normalizedHostname === "localhost" ||
    normalizedHostname === "127.0.0.1" ||
    normalizedHostname === "::1" ||
    normalizedHostname === "[::1]"
  );
}

export function shouldShowDebugFeatureFlagsMenu(input: {
  readonly isDev: boolean;
  readonly hostname: string;
  readonly storageValue: string | null;
}): boolean {
  return input.isDev && isLoopbackHostname(input.hostname) && input.storageValue === "true";
}

export type SidebarProjectEntry = {
  kind: "thread";
  rowId: ThreadId;
  rootRowId: ThreadId;
  thread: SidebarThreadSummary;
  depth: number;
};

export type SidebarThreadHoverAnchorScope = "pinned" | "chat" | "project";

export function createSidebarThreadHoverAnchorId(input: {
  scope: SidebarThreadHoverAnchorScope;
  threadId: ThreadId;
}): string {
  return `${input.scope}:${input.threadId}`;
}

export type SidebarDerivedProjectData = {
  allProjectThreadCount: number;
  projectThreads: SidebarThreadSummary[];
  orderedProjectThreadIds: ThreadId[];
  visibleEntries: SidebarProjectEntry[];
  /** Extra "Show more" pages currently applied, clamped to the real row count. */
  threadListExtraPages: number;
  canShowMoreThreads: boolean;
  canShowLessThreads: boolean;
  activeEntryId: ThreadId | null;
  projectStatus: ReturnType<typeof resolveProjectStatusIndicator>;
};

export function shouldClearThreadSelectionOnMouseDown(target: HTMLElement | null): boolean {
  if (target === null) return true;
  return !target.closest(THREAD_SELECTION_SAFE_SELECTOR);
}

export function resolveSidebarNewThreadEnvMode(input: {
  requestedEnvMode?: SidebarNewThreadEnvMode;
  defaultEnvMode: SidebarNewThreadEnvMode;
}): SidebarNewThreadEnvMode {
  return input.requestedEnvMode ?? input.defaultEnvMode;
}

/**
 * Trailing padding that protects the title from the absolutely-positioned
 * trailing cluster, sized to what the slot ACTUALLY shows so the title runs as
 * far right as the on-screen content allows:
 *
 * - The relative time now lives in the row hover card, so an idle row with no
 *   status/jump glyph and no meta chips reserves almost nothing — the title runs
 *   to the row edge instead of truncating against permanently reserved space.
 * - A status/loader (or keyboard-jump) glyph occupies a ~2.25rem slot, and each
 *   fork/worktree/handoff meta chip adds width; the reserve grows only for the
 *   badges that are present.
 * - The wider reserve that clears the hover pin/archive actions is applied only
 *   on hover/focus (mirroring the project header row), so the title gives up that
 *   width exactly when those actions appear and not a moment sooner.
 *
 * Literal class strings are required so Tailwind's JIT scanner emits them.
 */
export function resolveThreadRowTrailingReserveClass(input: {
  metaChipCount: number;
  hasTrailingGlyph: boolean;
}): string {
  // Hover/focus reveals the pin/archive actions; the meta chips + glyph fade out
  // at the same time, so the hover reserve is constant regardless of rest content.
  const hoverReserve =
    "transition-[padding] duration-150 ease-out group-hover/thread-row:pr-[4.75rem] group-focus-within/thread-row:pr-[4.75rem]";
  const { metaChipCount, hasTrailingGlyph } = input;
  if (metaChipCount <= 0) {
    return cn(hasTrailingGlyph ? "pr-[1.75rem]" : "pr-2", hoverReserve);
  }
  if (metaChipCount === 1) {
    return cn(hasTrailingGlyph ? "pr-[3rem]" : "pr-[1.75rem]", hoverReserve);
  }
  if (metaChipCount === 2) {
    return cn(hasTrailingGlyph ? "pr-[4rem]" : "pr-[3rem]", hoverReserve);
  }
  return cn(hasTrailingGlyph ? "pr-[4.5rem]" : "pr-[4.25rem]", hoverReserve);
}

export function resolveThreadRowClassName(input: {
  isActive: boolean;
  isSelected: boolean;
}): string {
  // Trailing reserve for the absolute cluster is applied separately by callers
  // via resolveThreadRowTrailingReserveClass so it can flex with the chip count.
  const baseClassName = SIDEBAR_THREAD_ROW_BASE_CLASS_NAME;

  if (input.isSelected && input.isActive) {
    return cn(baseClassName, SIDEBAR_ROW_ACTIVE_CLASS_NAME);
  }

  if (input.isSelected) {
    return cn(baseClassName, SIDEBAR_ROW_ACTIVE_CLASS_NAME);
  }

  if (input.isActive) {
    return cn(baseClassName, SIDEBAR_ROW_ACTIVE_CLASS_NAME);
  }

  return cn(baseClassName, SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME, SIDEBAR_ROW_HOVER_CLASS_NAME);
}

export function resolveProjectStatusIndicator(
  statuses: ReadonlyArray<ThreadStatusPill | null>,
): ThreadStatusPill | null {
  return resolveSidebarProjectStatus(statuses);
}

export function findWorkspaceRootMatch<T>(
  items: readonly T[],
  targetWorkspaceRoot: string,
  getWorkspaceRoot: (item: T) => string,
): T | undefined {
  return items.find((item) => workspaceRootsEqual(getWorkspaceRoot(item), targetWorkspaceRoot));
}

// Finds the item whose workspace root most specifically contains `targetPath`
// (equal to it, or its closest ancestor). Used to attribute a dev server's cwd
// to a project even when it runs from a monorepo subdirectory; the deepest root
// wins so a nested project beats its parent.
export function findDeepestWorkspaceRootMatch<T>(
  items: readonly T[],
  targetPath: string,
  getWorkspaceRoot: (item: T) => string,
): T | undefined {
  let best: T | undefined;
  let bestRootLength = -1;
  for (const item of items) {
    const root = getWorkspaceRoot(item);
    if (!isWorkspaceRootWithin(targetPath, root)) {
      continue;
    }
    if (root.length > bestRootLength) {
      best = item;
      bestRootLength = root.length;
    }
  }
  return best;
}

// Rechecks an existing local project against the server before the add flow decides to reuse it.
export async function recoverExistingAddProjectTarget(input: {
  readonly existingProjectId: ProjectId | null | undefined;
  readonly workspaceRoot: string;
  readonly recoverByProjectId: (projectId: ProjectId) => Promise<boolean>;
  readonly recoverByWorkspaceRoot: (workspaceRoot: string) => Promise<boolean>;
}): Promise<"recovered" | "create"> {
  if (!input.existingProjectId) {
    return "create";
  }

  if (await input.recoverByProjectId(input.existingProjectId)) {
    return "recovered";
  }

  if (await input.recoverByWorkspaceRoot(input.workspaceRoot)) {
    return "recovered";
  }

  return "create";
}

// Translates low-level add-project failures into a short explanation without
// hiding the original error text that developers may need for diagnosis.
export function describeAddProjectError(message: string): string | null {
  if (isDuplicateProjectCreateError(message)) {
    return "This usually means the folder is already linked to an existing project. On Windows, the same folder can arrive with a different path format, so it looks new even when it is not.";
  }

  if (
    message.startsWith("Failed to create project directory: /") ||
    message.startsWith("Project directory does not exist: /")
  ) {
    return "This is an absolute path from the filesystem root. If the folder is in your home directory, use ~/Developer/... or the full /Users/<name>/Developer/... path.";
  }

  return null;
}

// One "Show more" click reveals one extra page of rows; "Show less" hides one page again.
// The requested page count is clamped to what the list can actually use, so stale persisted
// values (or shrinking thread lists) self-heal instead of requiring dead "Show less" clicks.
export type SidebarThreadListPaging = {
  /** Requested pages clamped to what `totalCount` can actually consume. */
  effectiveExtraPages: number;
  /** Row cap to render: `baseLimit + effectiveExtraPages * pageSize`. */
  previewLimit: number;
  canShowMore: boolean;
  canShowLess: boolean;
};

export function resolveSidebarThreadListPaging(input: {
  totalCount: number;
  baseLimit: number;
  pageSize: number;
  requestedExtraPages: number;
}): SidebarThreadListPaging {
  return resolveSidebarThreadListPagingShared(input);
}

export function getVisibleThreadsForProject<T extends Pick<SidebarThreadSummary, "id">>(input: {
  threads: readonly T[];
  activeThreadId: Thread["id"] | undefined;
  previewLimit: number;
}): {
  hasHiddenThreads: boolean;
  visibleThreads: T[];
} {
  return getVisibleThreadsForProjectShared(input);
}

export interface SidebarThreadTreeRow<
  T extends Pick<SidebarThreadSummary, "id" | "parentThreadId">,
> {
  thread: T;
  depth: number;
  rootThreadId: T["id"];
}

// Build the project-local parent/child thread tree while preserving sort order from the input list.
export function buildProjectThreadTree<
  T extends Pick<SidebarThreadSummary, "id" | "parentThreadId">,
>(input: {
  threads: readonly T[];
  forceVisibleThreadId?: T["id"] | undefined;
}): SidebarThreadTreeRow<T>[] {
  return buildProjectThreadTreeShared(input);
}

export function getVisibleSidebarEntriesForPreview<
  T extends {
    rowId: Thread["id"];
    rootRowId: Thread["id"];
  },
>(input: {
  entries: readonly T[];
  activeEntryId: Thread["id"] | undefined;
  previewLimit: number;
}): {
  hasHiddenEntries: boolean;
  visibleEntries: T[];
} {
  return getVisibleSidebarEntriesForPreviewShared(input);
}

// Match the exact rows the sidebar renders for one project, including folded previews.
export function getRenderedThreadsForSidebarProject<
  T extends Pick<SidebarThreadSummary, "id"> & SidebarThreadSortInput,
>(input: {
  project: Pick<Project, "expanded">;
  threads: readonly T[];
  activeThreadId: Thread["id"] | undefined;
  previewLimit: number;
}): {
  hasHiddenThreads: boolean;
  renderedThreads: T[];
} {
  const { activeThreadId, previewLimit, project, threads } = input;
  const pinnedCollapsedThread =
    !project.expanded && activeThreadId
      ? (threads.find((thread) => thread.id === activeThreadId) ?? null)
      : null;
  const { hasHiddenThreads, visibleThreads } = getVisibleThreadsForProject({
    threads,
    activeThreadId,
    previewLimit,
  });

  return {
    hasHiddenThreads,
    renderedThreads: pinnedCollapsedThread ? [pinnedCollapsedThread] : visibleThreads,
  };
}

// Flatten the sidebar's current project/thread visibility into the same order the user sees.
export function getVisibleSidebarThreadIds(input: {
  projects: readonly Pick<Project, "id" | "expanded">[];
  threads: readonly (Pick<SidebarThreadSummary, "id" | "projectId" | "parentThreadId"> &
    SidebarThreadSortInput)[];
  activeThreadId: Thread["id"] | undefined;
  threadListExtraPagesByProjectId: ReadonlyMap<Project["id"], number>;
  previewLimit: number;
  previewPageSize: number;
  threadSortOrder: SidebarThreadSortOrder;
}): Thread["id"][] {
  const {
    activeThreadId,
    previewLimit,
    previewPageSize,
    projects,
    threadListExtraPagesByProjectId,
    threadSortOrder,
    threads,
  } = input;
  const visibleThreadIds: Thread["id"][] = [];
  const threadsByProjectId = new Map<ProjectId, (typeof threads)[number][]>();

  for (const thread of threads) {
    const projectThreads = threadsByProjectId.get(thread.projectId);
    if (projectThreads) {
      projectThreads.push(thread);
    } else {
      threadsByProjectId.set(thread.projectId, [thread]);
    }
  }

  for (const project of projects) {
    const projectThreads = sortThreadsForSidebar(
      threadsByProjectId.get(project.id) ?? [],
      threadSortOrder,
    );
    const projectThreadTree = buildProjectThreadTree({
      threads: projectThreads,
      forceVisibleThreadId: activeThreadId,
    });
    const paging = resolveSidebarThreadListPaging({
      totalCount: projectThreadTree.length,
      baseLimit: previewLimit,
      pageSize: previewPageSize,
      requestedExtraPages: threadListExtraPagesByProjectId.get(project.id) ?? 0,
    });
    const { visibleEntries } = getVisibleSidebarEntriesForPreview({
      entries: projectThreadTree.map((row) => ({
        rowId: row.thread.id,
        rootRowId: row.rootThreadId,
        threadId: row.thread.id,
      })),
      activeEntryId: activeThreadId,
      previewLimit: paging.previewLimit,
    });
    const pinnedCollapsedThread =
      !project.expanded && activeThreadId
        ? (projectThreads.find((thread) => thread.id === activeThreadId) ?? null)
        : null;

    if (pinnedCollapsedThread) {
      visibleThreadIds.push(pinnedCollapsedThread.id);
      continue;
    }

    for (const entry of visibleEntries) {
      visibleThreadIds.push(entry.threadId);
    }
  }

  return visibleThreadIds;
}

export function partitionSidebarThreadsByProjectIds<
  T extends Pick<SidebarThreadSummary, "projectId">,
>(
  threads: readonly T[],
  studioProjectIds: ReadonlySet<ProjectId>,
): {
  readonly studioThreads: T[];
  readonly nonStudioThreads: T[];
} {
  const studioThreads: T[] = [];
  const nonStudioThreads: T[] = [];
  for (const thread of threads) {
    if (studioProjectIds.has(thread.projectId)) {
      studioThreads.push(thread);
    } else {
      nonStudioThreads.push(thread);
    }
  }
  return { studioThreads, nonStudioThreads };
}

// Centralizes the expensive per-project row derivation so Sidebar.tsx can mostly orchestrate UI state.
export function deriveSidebarProjectData(input: {
  projects: readonly Pick<Project, "id" | "cwd" | "expanded">[];
  sortedSidebarThreadsByProjectId: ReadonlyMap<ProjectId, SidebarThreadSummary[]>;
  pinnedThreadIds: readonly ThreadId[];
  threadListExtraPagesByProjectCwd: ReadonlyMap<string, number>;
  normalizeProjectCwd: (cwd: string) => string;
  activeSidebarThreadId: ThreadId | undefined;
  previewLimit: number;
  previewPageSize: number;
  resolveThreadStatus?: (
    thread: SidebarThreadSummary,
  ) => ReturnType<typeof resolveThreadStatusPill>;
}): ReadonlyMap<ProjectId, SidebarDerivedProjectData> {
  return deriveSidebarProjectRows({
    projects: input.projects,
    sortedThreadsByProjectId: input.sortedSidebarThreadsByProjectId,
    pinnedThreadIds: input.pinnedThreadIds,
    filterPinnedThreads: getUnpinnedThreadsForSidebar,
    resolveThreadStatus: (thread) =>
        input.resolveThreadStatus
          ? input.resolveThreadStatus(thread)
          : resolveThreadStatusPill({
              thread,
              hasPendingApprovals: thread.hasPendingApprovals,
              hasPendingUserInput: thread.hasPendingUserInput,
            }),
    resolveProjectStatus: resolveProjectStatusIndicator,
    threadListExtraPagesByProjectCwd: input.threadListExtraPagesByProjectCwd,
    normalizeProjectCwd: input.normalizeProjectCwd,
    activeThreadId: input.activeSidebarThreadId,
    previewLimit: input.previewLimit,
    previewPageSize: input.previewPageSize,
  }) as ReadonlyMap<ProjectId, SidebarDerivedProjectData>;
}

// PR-state presentation (label/color/glyph) moved to
// ~/components/pullRequest/pullRequestStatePresentation so the sidebar badge, kanban chip,
// and the pull request feature surfaces all share one mapping.
