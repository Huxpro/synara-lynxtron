import { sortThreadsForSidebar } from "@synara-web/components/SidebarThreadSort.logic";
import type { SidebarThreadSortOrderValue } from "@synara-web/sidebarSortDefaults";
import {
  groupItemsBySpace,
  resolveActiveSpaceId,
  spaceDisplayName,
} from "@synara-web/lib/spaceGrouping";
import type { Space } from "@synara-web/types";
import type { SpaceId } from "@synara/contracts";

import type { ThreadSummary } from "./queries";

export interface EditorProjectSwitchProject {
  readonly id: string;
  readonly kind: "project" | "chat" | "studio" | "group";
  readonly title: string;
  readonly spaceId?: SpaceId | null;
}

export interface EditorProjectSwitchOption {
  readonly id: string;
  readonly selected: boolean;
  readonly threadId: string | null;
  readonly title: string;
  readonly spaceId: SpaceId | null;
}

const EDITOR_PROJECT_SWITCH_LIST_MAX_HEIGHT = 264;
const EDITOR_PROJECT_SWITCH_LIST_PADDING = 12;
const EDITOR_PROJECT_SWITCH_GROUP_LABEL_HEIGHT = 28;
const EDITOR_PROJECT_SWITCH_ITEM_HEIGHT = 32;
const EDITOR_PROJECT_SWITCH_SEPARATOR_HEIGHT = 9;
const EDITOR_PROJECT_SWITCH_EMPTY_HEIGHT = 76;

/**
 * Native Lynx scroll-views do not use their descendants' intrinsic height the
 * same way a browser overflow container does. Give the project picker a real,
 * content-derived viewport while preserving Web's 264px maximum.
 */
export function resolveEditorProjectSwitchListHeight(
  groups: readonly { readonly items: readonly unknown[] }[],
): number {
  if (groups.length === 0) return EDITOR_PROJECT_SWITCH_EMPTY_HEIGHT;
  const contentHeight = groups.reduce(
    (height, group, index) =>
      height +
      (index > 0 ? EDITOR_PROJECT_SWITCH_SEPARATOR_HEIGHT : 0) +
      EDITOR_PROJECT_SWITCH_GROUP_LABEL_HEIGHT +
      group.items.length * EDITOR_PROJECT_SWITCH_ITEM_HEIGHT,
    EDITOR_PROJECT_SWITCH_LIST_PADDING,
  );
  return Math.min(EDITOR_PROJECT_SWITCH_LIST_MAX_HEIGHT, contentHeight);
}

export function groupEditorProjectSwitchOptions(input: {
  readonly activeSpaceId: SpaceId | null;
  readonly options: readonly EditorProjectSwitchOption[];
  readonly query: string;
  readonly spaces: readonly Space[];
}) {
  const activeSpaceId = resolveActiveSpaceId(input.activeSpaceId, input.spaces);
  const normalizedQuery = input.query.trim().toLocaleLowerCase();
  const filtered = input.options.filter(
    (option) =>
      normalizedQuery.length === 0 ||
      option.title.toLocaleLowerCase().includes(normalizedQuery) ||
      spaceDisplayName(option.spaceId, input.spaces).toLocaleLowerCase().includes(normalizedQuery),
  );
  return groupItemsBySpace({
    items: filtered,
    spaces: input.spaces,
    activeSpaceId,
    spaceIdOf: (option) => option.spaceId,
  });
}

export type EditorProjectSwitchTarget =
  | { readonly kind: "current" }
  | { readonly kind: "thread"; readonly threadId: string }
  | { readonly kind: "draft"; readonly projectId: string };

export function resolveEditorProjectSwitchTarget(
  option: EditorProjectSwitchOption,
): EditorProjectSwitchTarget {
  if (option.selected) return { kind: "current" };
  if (option.threadId) {
    return { kind: "thread", threadId: option.threadId };
  }
  return { kind: "draft", projectId: option.id };
}

export function resolveEditorProjectSwitchOptions(input: {
  readonly currentProjectId: string | null;
  readonly projects: readonly EditorProjectSwitchProject[];
  readonly sortOrder: SidebarThreadSortOrderValue;
  readonly threads: readonly ThreadSummary[];
}): EditorProjectSwitchOption[] {
  const options: EditorProjectSwitchOption[] = [];
  for (const project of input.projects) {
    if (project.kind !== "project") continue;
    const latestThread =
      sortThreadsForSidebar(
        input.threads.filter(
          (thread) => thread.projectId === project.id && thread.archivedAt == null,
        ),
        input.sortOrder,
      )[0] ?? null;
    options.push({
      id: project.id,
      selected: project.id === input.currentProjectId,
      threadId: latestThread?.id ?? null,
      title: project.title.trim() || "Untitled project",
      spaceId: project.spaceId ?? null,
    });
  }
  return options;
}
