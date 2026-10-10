import type { ProjectSummary, ThreadSummary } from "../../app/queries";
import type { SpaceId } from "@synara/contracts";
import { deriveSidebarSectionCollections } from "@synara-web/components/SidebarSections.logic";
import {
  derivePinnedThreadIdsForSidebar,
  getPinnedThreadsForSidebar,
  getUnpinnedThreadsForSidebar,
} from "@synara-web/components/SidebarThreadPinning.logic";
import {
  derivePinnedProjectIdsForSidebar,
  orderPinnedProjectsForSidebar,
} from "@synara-web/components/SidebarProjectPinning.logic";
// Sort defaults are settings-owned on Web; consume the same side-effect-free
// source instead of restating two literals that would silently drift.
import {
  DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
  DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
  type SidebarProjectSortOrderValue,
  type SidebarThreadSortOrderValue,
} from "@synara-web/sidebarSortDefaults";

export interface SidebarProjectGroup {
  readonly id: string;
  readonly isPinned?: boolean;
  readonly spaceId?: SpaceId | null;
  readonly title: string;
  readonly workspaceRoot: string;
  readonly threads: readonly ThreadSummary[];
}

export interface SidebarSections {
  readonly projectGroups: readonly SidebarProjectGroup[];
  readonly pinnedThreads: readonly ThreadSummary[];
  readonly chatThreads: readonly ThreadSummary[];
  readonly studioThreads: readonly ThreadSummary[];
}

export function resolveNativeSidebarSpaceId(input: {
  readonly activeThreadId: string | null;
  readonly projects: readonly ProjectSummary[];
  readonly spaces: readonly { readonly id: SpaceId }[];
  readonly storedActiveSpaceId: SpaceId | null;
  readonly threads: readonly ThreadSummary[];
}): SpaceId | null {
  if (input.activeThreadId) {
    const thread = input.threads.find((candidate) => candidate.id === input.activeThreadId);
    const project = thread
      ? input.projects.find((candidate) => candidate.id === thread.projectId)
      : null;
    if (project?.kind === "project") return project.spaceId ?? null;
  }
  return input.storedActiveSpaceId !== null &&
    input.spaces.some((space) => space.id === input.storedActiveSpaceId)
    ? input.storedActiveSpaceId
    : null;
}

/**
 * Pure projection shared by the Lynx sidebar renderer and its tests. It mirrors
 * the Web Sidebar.logic.ts boundary: stable project order, recent-first rows,
 * and an explicit orphan group while snapshots converge.
 */
export function deriveSidebarSections(input: {
  readonly projects: readonly ProjectSummary[];
  readonly threads: readonly ThreadSummary[];
  readonly persistedPinnedThreadIds?: readonly string[];
  readonly persistedPinnedProjectIds?: readonly string[];
  readonly projectSortOrder?: SidebarProjectSortOrderValue;
  readonly threadSortOrder?: SidebarThreadSortOrderValue;
  readonly activeSpaceId?: SpaceId | null;
}): SidebarSections {
  const projects = input.projects.map((project) => ({
    ...project,
    name: project.title,
  }));
  const visibleProjects = projects.filter(
    (project) =>
      project.kind !== "project" || (project.spaceId ?? null) === (input.activeSpaceId ?? null),
  );
  const pinnedProjectIds = derivePinnedProjectIdsForSidebar({
    projects: projects.filter((project) => project.kind === "project"),
    persistedPinnedProjectIds: input.persistedPinnedProjectIds ?? [],
    optimisticPinnedStateByProjectId: new Map(),
  });
  const orderedProjects = orderPinnedProjectsForSidebar(visibleProjects, pinnedProjectIds);
  const pinnedThreadIds = derivePinnedThreadIdsForSidebar({
    threads: input.threads,
    persistedPinnedThreadIds: input.persistedPinnedThreadIds ?? [],
    optimisticPinnedStateByThreadId: new Map(),
  });
  const projectById = new Map(projects.map((project) => [project.id, project] as const));
  const visibleThreads = input.threads.filter((thread) => {
    const project = projectById.get(thread.projectId);
    return (
      project === undefined ||
      project.kind !== "project" ||
      (project.spaceId ?? null) === (input.activeSpaceId ?? null)
    );
  });
  const pinnedThreads = getPinnedThreadsForSidebar(visibleThreads, pinnedThreadIds);
  const listThreads = getUnpinnedThreadsForSidebar(visibleThreads, pinnedThreadIds);
  const threads = listThreads.map((thread) => ({
    ...thread,
    createdAt: thread.createdAt ?? thread.updatedAt,
    hasLiveTailWork: thread.live,
    session: thread.sessionStatus == null ? undefined : { status: thread.sessionStatus },
  }));
  const sections = deriveSidebarSectionCollections({
    projects: orderedProjects,
    treeThreads: threads,
    projectSortOrder: input.projectSortOrder ?? DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
    threadSortOrder: input.threadSortOrder ?? DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
    // Hubs ("group" containers) are not on Lynx yet; they stay out of every section.
    resolveProjectSection: (project) => (project.kind === "group" ? null : project.kind),
  });
  const groups: SidebarProjectGroup[] = sections.projectPartitions.projects.map((project) => ({
    id: project.id,
    isPinned: project.isPinned,
    spaceId: project.spaceId ?? null,
    title: project.title.trim() || "Untitled project",
    workspaceRoot: project.workspaceRoot,
    threads: sections.sortedThreadsByProjectId.get(project.id) ?? [],
  }));
  const orphanThreads = sections.unpartitionedThreads;
  if (orphanThreads.length > 0) {
    groups.push({
      id: "__orphan__",
      title: "Other",
      workspaceRoot: "",
      threads: orphanThreads,
    });
  }

  return {
    projectGroups: groups,
    pinnedThreads,
    chatThreads: sections.chatThreads,
    studioThreads: sections.studioThreads,
  };
}
