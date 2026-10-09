import type { LastThreadRoute } from "@synara-web/chatRouteRestore";
import { sortThreadsForSidebar } from "@synara-web/components/SidebarThreadSort.logic";
import type { SidebarThreadSortOrderValue } from "@synara-web/sidebarSortDefaults";
import type { ThreadSummary } from "./queries";

export function collectStudioProjectIds(
  projects: readonly {
    readonly id: string;
    readonly kind: "project" | "chat" | "studio" | "group";
  }[],
): ReadonlySet<string> {
  return new Set(
    projects.filter((project) => project.kind === "studio").map((project) => project.id),
  );
}

export function resolveStudioRestoreRoute(input: {
  readonly lastThreadRoute: LastThreadRoute | null;
  readonly projects: readonly {
    readonly id: string;
    readonly kind: "project" | "chat" | "studio" | "group";
  }[];
  readonly sortOrder: SidebarThreadSortOrderValue;
  readonly threads: readonly ThreadSummary[];
}): LastThreadRoute | null {
  const studioProjectIds = collectStudioProjectIds(input.projects);
  const studioThreads = sortThreadsForSidebar(
    input.threads
      .filter((thread) => thread.archivedAt == null && studioProjectIds.has(thread.projectId))
      .map((thread) => ({
        ...thread,
        createdAt: thread.createdAt ?? thread.updatedAt,
        hasLiveTailWork: thread.live,
        session: thread.sessionStatus == null ? undefined : { status: thread.sessionStatus },
      })),
    input.sortOrder,
  );
  const availableThreadIds = new Set(studioThreads.map((thread) => thread.id));
  if (input.lastThreadRoute && availableThreadIds.has(input.lastThreadRoute.threadId)) {
    return { threadId: input.lastThreadRoute.threadId };
  }
  return studioThreads[0] ? { threadId: studioThreads[0].id } : null;
}
