import type { ProjectSummary, ThreadSummary } from '../../app/queries';
import { deriveSidebarSectionCollections } from '@synara-web/components/SidebarSections.logic';
import {
  derivePinnedThreadIdsForSidebar,
  getPinnedThreadsForSidebar,
  getUnpinnedThreadsForSidebar,
} from '@synara-web/components/SidebarThreadPinning.logic';
import {
  derivePinnedProjectIdsForSidebar,
  orderPinnedProjectsForSidebar,
} from '@synara-web/components/SidebarProjectPinning.logic';
// Sort defaults are settings-owned on Web; consume the same side-effect-free
// source instead of restating two literals that would silently drift.
import {
  DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
  DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
} from '@synara-web/sidebarSortDefaults';

export interface SidebarProjectGroup {
  readonly id: string;
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
}): SidebarSections {
  const projects = input.projects.map((project) => ({
    ...project,
    name: project.title,
  }));
  const pinnedProjectIds = derivePinnedProjectIdsForSidebar({
    projects: projects.filter((project) => project.kind === 'project'),
    persistedPinnedProjectIds: input.persistedPinnedProjectIds ?? [],
    optimisticPinnedStateByProjectId: new Map(),
  });
  const orderedProjects = orderPinnedProjectsForSidebar(projects, pinnedProjectIds);
  const pinnedThreadIds = derivePinnedThreadIdsForSidebar({
    threads: input.threads,
    persistedPinnedThreadIds: input.persistedPinnedThreadIds ?? [],
    optimisticPinnedStateByThreadId: new Map(),
  });
  const pinnedThreads = getPinnedThreadsForSidebar(input.threads, pinnedThreadIds);
  const listThreads = getUnpinnedThreadsForSidebar(input.threads, pinnedThreadIds);
  const threads = listThreads.map((thread) => ({
    ...thread,
    createdAt: thread.createdAt ?? thread.updatedAt,
    hasLiveTailWork: thread.live,
    session:
      thread.sessionStatus == null
        ? undefined
        : { status: thread.sessionStatus },
  }));
  const sections = deriveSidebarSectionCollections({
    projects: orderedProjects,
    treeThreads: threads,
    projectSortOrder: DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
    threadSortOrder: DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
    resolveProjectSection: (project) => project.kind,
  });
  const groups = sections.projectPartitions.projects.map((project) => ({
    id: project.id,
    title: project.title.trim() || 'Untitled project',
    workspaceRoot: project.workspaceRoot,
    threads: sections.sortedThreadsByProjectId.get(project.id) ?? [],
  }));
  const orphanThreads = sections.unpartitionedThreads;
  if (orphanThreads.length > 0) {
    groups.push({
      id: '__orphan__',
      title: 'Other',
      workspaceRoot: '',
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
