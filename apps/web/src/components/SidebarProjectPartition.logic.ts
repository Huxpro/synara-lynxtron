// FILE: SidebarProjectPartition.logic.ts
// Purpose: Keep the Projects, Chats, and Studio project partitions identical
//          across the Web and Lynx sidebar renderers.

export type SidebarProjectSection = "project" | "chat" | "studio";

export interface SidebarProjectPartitions<T> {
  readonly projects: readonly T[];
  readonly chats: readonly T[];
  readonly studio: readonly T[];
}

export function partitionSidebarProjects<T>(
  projects: readonly T[],
  resolveSection: (project: T) => SidebarProjectSection | null,
): SidebarProjectPartitions<T> {
  const ordinaryProjects: T[] = [];
  const chats: T[] = [];
  const studio: T[] = [];

  for (const project of projects) {
    switch (resolveSection(project)) {
      case "project":
        ordinaryProjects.push(project);
        break;
      case "chat":
        chats.push(project);
        break;
      case "studio":
        studio.push(project);
        break;
      default:
        break;
    }
  }

  return { projects: ordinaryProjects, chats, studio };
}
