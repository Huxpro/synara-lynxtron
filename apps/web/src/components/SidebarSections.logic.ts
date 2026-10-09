// FILE: SidebarSections.logic.ts
// Purpose: Shared project/thread grouping, ordering, and section partition controller.
// Exports: One portable collection projection used by Web and Lynx sidebars.

import {
  partitionSidebarProjects,
  type SidebarProjectPartitions,
  type SidebarProjectSection,
} from "./SidebarProjectPartition.logic";
import { groupSidebarThreadsByProjectId } from "./SidebarProjection.logic";
import {
  sortProjectsForSidebar,
  sortThreadsForSidebar,
  type SidebarProjectSortInput,
  type SidebarThreadSortInput,
} from "./SidebarThreadSort.logic";

type ProjectSortOrder = "updated_at" | "created_at" | "manual";
type ThreadSortOrder = "updated_at" | "created_at";

export interface SidebarSectionCollections<
  TProject,
  TThread extends { readonly projectId: string },
> {
  readonly threadsByProjectId: ReadonlyMap<TThread["projectId"], TThread[]>;
  readonly sortedThreadsByProjectId: ReadonlyMap<TThread["projectId"], TThread[]>;
  readonly sortedProjects: readonly TProject[];
  readonly projectPartitions: SidebarProjectPartitions<TProject>;
  readonly chatThreads: readonly TThread[];
  readonly studioThreads: readonly TThread[];
  readonly unpartitionedThreads: readonly TThread[];
}

export function deriveSidebarSectionCollections<
  TProject extends SidebarProjectSortInput,
  TThread extends {
    readonly id: string;
    readonly projectId: string;
  } & SidebarThreadSortInput,
>(input: {
  readonly projects: readonly TProject[];
  readonly treeThreads: readonly TThread[];
  readonly projectSortThreads?: readonly TThread[] | undefined;
  readonly projectSortOrder: ProjectSortOrder;
  readonly threadSortOrder: ThreadSortOrder;
  readonly resolveProjectSection: (project: TProject) => SidebarProjectSection | null;
}): SidebarSectionCollections<TProject, TThread> {
  const threadsByProjectId = groupSidebarThreadsByProjectId(input.treeThreads);
  const sortedThreadsByProjectId = new Map<TThread["projectId"], TThread[]>();
  for (const [projectId, projectThreads] of threadsByProjectId) {
    sortedThreadsByProjectId.set(
      projectId,
      sortThreadsForSidebar(projectThreads, input.threadSortOrder),
    );
  }

  const sortedProjects = sortProjectsForSidebar(
    input.projects,
    input.projectSortThreads ?? input.treeThreads,
    input.projectSortOrder,
  );
  const projectPartitions = partitionSidebarProjects(sortedProjects, input.resolveProjectSection);
  const flattenSectionThreads = (projects: readonly TProject[]) =>
    sortThreadsForSidebar(
      projects.flatMap((project) => sortedThreadsByProjectId.get(project.id) ?? []),
      input.threadSortOrder,
    );
  const projectIds = new Set(input.projects.map((project) => project.id));

  return {
    threadsByProjectId,
    sortedThreadsByProjectId,
    sortedProjects,
    projectPartitions,
    chatThreads: flattenSectionThreads(projectPartitions.chats),
    studioThreads: flattenSectionThreads(projectPartitions.studio),
    unpartitionedThreads: sortThreadsForSidebar(
      input.treeThreads.filter((thread) => !projectIds.has(thread.projectId)),
      input.threadSortOrder,
    ),
  };
}
