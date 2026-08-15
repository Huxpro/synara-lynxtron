import { sortThreadsForSidebar } from '@synara-web/components/SidebarThreadSort.logic';
import type { SidebarThreadSortOrderValue } from '@synara-web/sidebarSortDefaults';

import type { ThreadSummary } from './queries';

export interface EditorProjectSwitchProject {
  readonly id: string;
  readonly kind: 'project' | 'chat' | 'studio';
  readonly title: string;
}

export interface EditorProjectSwitchOption {
  readonly id: string;
  readonly selected: boolean;
  readonly threadId: string | null;
  readonly title: string;
}

export function resolveEditorProjectSwitchOptions(input: {
  readonly currentProjectId: string | null;
  readonly projects: readonly EditorProjectSwitchProject[];
  readonly sortOrder: SidebarThreadSortOrderValue;
  readonly threads: readonly ThreadSummary[];
}): EditorProjectSwitchOption[] {
  const options: EditorProjectSwitchOption[] = [];
  for (const project of input.projects) {
    if (project.kind !== 'project') continue;
    const latestThread =
      sortThreadsForSidebar(
        input.threads.filter(
          (thread) =>
            thread.projectId === project.id && thread.archivedAt == null
        ),
        input.sortOrder
      )[0] ?? null;
    options.push({
      id: project.id,
      selected: project.id === input.currentProjectId,
      threadId: latestThread?.id ?? null,
      title: project.title.trim() || 'Untitled project',
    });
  }
  return options;
}
