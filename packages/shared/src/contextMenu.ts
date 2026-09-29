import type { ContextMenuItem } from "@synara/contracts";

export interface NormalizedContextMenuItem<T extends string = string> {
  readonly id: T;
  readonly label: string;
  readonly type: "normal" | "checkbox" | "radio";
  readonly enabled: boolean;
  readonly visible: boolean;
  readonly checked: boolean;
  readonly accelerator?: string;
  readonly destructive: boolean;
  readonly separatorBefore: boolean;
  readonly submenu?: readonly NormalizedContextMenuItem<T>[];
}

const MAX_CONTEXT_MENU_DEPTH = 8;

export type ArchivedThreadContextMenuAction = "restore" | "delete";
export type SelectedThreadsContextMenuAction = "mark-unread" | "archive" | "delete";
export type TerminalSelectionContextMenuAction = "add-to-chat";
export type ThreadContextMenuActionId =
  | "rename"
  | "toggle-pin"
  | "clear-notification"
  | "mark-unread"
  | "copy-path"
  | "open-path-in-terminal"
  | "copy-thread-id"
  | "archive"
  | "delete";
export type ContentContextMenuAction =
  | `spellcheck:${number}`
  | "no-spelling-suggestions"
  | "copy-image"
  | "cut"
  | "copy"
  | "paste"
  | "select-all";
export type SpaceContextMenuAction = "edit" | "delete";
export type ProjectContextMenuCoreAction =
  | "open-in-finder"
  | "open-in-kanban"
  | "copy-path"
  | "toggle-pin";
export type ProjectContextMenuCommand =
  | ProjectContextMenuCoreAction
  | "start-dev"
  | "stop-dev"
  | "open-dev-server"
  | "rename"
  | "archive-threads"
  | "delete-threads"
  | "delete";
export type ProjectContextMenuAction =
  | ProjectContextMenuCommand
  | "move-to-space"
  | "move-to-void"
  | `move-to-space:${string}`
  | "new-space";

export interface ProjectContextMenuSpace {
  readonly id: string;
  readonly label: string;
}

export function buildProjectMoveToSpaceItem(input: {
  readonly currentSpaceId: string | null;
  readonly includeNewSpace: boolean;
  readonly separatorBefore?: boolean;
  readonly spaces: readonly ProjectContextMenuSpace[];
}): ContextMenuItem<ProjectContextMenuAction> {
  return {
    id: "move-to-space",
    label: "Move to space",
    ...(input.separatorBefore ? { separatorBefore: true } : {}),
    submenu: [
      {
        id: "move-to-void",
        label: "Void",
        type: "radio",
        checked: input.currentSpaceId === null,
      },
      ...input.spaces.map(
        (space): ContextMenuItem<ProjectContextMenuAction> => ({
          id: `move-to-space:${space.id}`,
          label: space.label,
          type: "radio",
          checked: input.currentSpaceId === space.id,
        }),
      ),
      ...(input.includeNewSpace
        ? [
            {
              id: "new-space" as const,
              label: "New space…",
              separatorBefore: true,
            },
          ]
        : []),
    ],
  };
}

export function buildProjectContextMenuExecutableItems(input: {
  readonly currentSpaceId: string | null;
  readonly devServerRunning?: boolean;
  readonly hasOpenDevServer?: boolean;
  readonly includeStartDev?: boolean;
  readonly hasArchivableThreads?: boolean;
  readonly includeNewSpace?: boolean;
  readonly includeRename?: boolean;
  readonly isPinned: boolean;
  readonly spaces: readonly ProjectContextMenuSpace[];
}): ContextMenuItem<ProjectContextMenuAction>[] {
  const core = buildProjectContextMenuCoreItems({ isPinned: input.isPinned });
  const togglePin = core.at(-1);
  if (!togglePin) return [];
  return [
    ...core.slice(0, -1),
    ...(input.devServerRunning
      ? [
          { id: "stop-dev" as const, label: "Stop dev", separatorBefore: true },
          ...(input.hasOpenDevServer
            ? [{ id: "open-dev-server" as const, label: "Open dev server" }]
            : []),
        ]
      : input.includeStartDev
        ? [{ id: "start-dev" as const, label: "Start dev", separatorBefore: true }]
        : []),
    buildProjectMoveToSpaceItem({
      currentSpaceId: input.currentSpaceId,
      includeNewSpace: input.includeNewSpace ?? false,
      separatorBefore: true,
      spaces: input.spaces,
    }),
    ...(input.includeRename
      ? [{ id: "rename" as const, label: "Edit name", separatorBefore: true }]
      : []),
    { ...togglePin, separatorBefore: false },
    ...(input.hasArchivableThreads
      ? [
          {
            id: "archive-threads" as const,
            label: "Archive threads",
            separatorBefore: true,
          },
        ]
      : []),
  ];
}

export function buildArchivedThreadContextMenuItems(): ContextMenuItem<ArchivedThreadContextMenuAction>[] {
  return [
    { id: "restore", label: "Restore" },
    { id: "delete", label: "Delete", destructive: true },
  ];
}

export function buildSelectedThreadsContextMenuItems(
  count: number,
): ContextMenuItem<SelectedThreadsContextMenuAction>[] {
  if (!Number.isSafeInteger(count) || count <= 0) return [];
  return [
    { id: "mark-unread", label: `Mark unread (${count})` },
    { id: "archive", label: `Archive (${count})` },
    { id: "delete", label: `Delete (${count})`, destructive: true },
  ];
}

export function buildTerminalSelectionContextMenuItems(): ContextMenuItem<TerminalSelectionContextMenuAction>[] {
  return [{ id: "add-to-chat", label: "Add to chat" }];
}

export function buildThreadContextMenuItems(input: {
  readonly isPinned: boolean;
  readonly renameAvailable?: boolean;
  readonly pinAvailable?: boolean;
  readonly clearNotificationAvailable?: boolean;
  readonly markUnreadAvailable?: boolean;
  readonly middleItems?: readonly ContextMenuItem<string>[];
  readonly copyPathAvailable?: boolean;
  readonly openPathInTerminalAvailable?: boolean;
  readonly copyThreadIdAvailable?: boolean;
  readonly extraItems?: readonly ContextMenuItem<string>[];
  readonly archiveAvailable?: boolean;
  readonly deleteAvailable?: boolean;
}): ContextMenuItem<string>[] {
  const items: ContextMenuItem<string>[] = [];
  if (input.renameAvailable !== false) {
    items.push({ id: "rename", label: "Rename thread" });
  }
  if (input.pinAvailable !== false) {
    items.push({
      id: "toggle-pin",
      label: (input.isPinned ? "Unpin" : "Pin") + " thread",
    });
  }
  if (input.clearNotificationAvailable) {
    items.push({ id: "clear-notification", label: "Clear notification" });
  }
  if (input.markUnreadAvailable !== false) {
    items.push({ id: "mark-unread", label: "Mark unread" });
  }
  items.push(...(input.middleItems ?? []));

  let copyGroupStarted = false;
  if (input.copyPathAvailable) {
    items.push({ id: "copy-path", label: "Copy Path", separatorBefore: true });
    copyGroupStarted = true;
  }
  if (input.openPathInTerminalAvailable) {
    items.push({
      id: "open-path-in-terminal",
      label: "Open Path in Terminal",
      ...(!copyGroupStarted ? { separatorBefore: true } : {}),
    });
    copyGroupStarted = true;
  }
  if (input.copyThreadIdAvailable !== false) {
    items.push({
      id: "copy-thread-id",
      label: "Copy Thread ID",
      ...(!copyGroupStarted ? { separatorBefore: true } : {}),
    });
  }
  items.push(...(input.extraItems ?? []));
  if (input.archiveAvailable !== false) {
    items.push({ id: "archive", label: "Archive", separatorBefore: true });
  }
  if (input.deleteAvailable !== false) {
    items.push({ id: "delete", label: "Delete", destructive: true });
  }
  return items;
}

export function buildContentContextMenuItems(input: {
  readonly dictionarySuggestions: readonly string[];
  readonly misspelledWord: boolean;
  readonly image: boolean;
  readonly canCut: boolean;
  readonly canCopy: boolean;
  readonly canPaste: boolean;
  readonly canSelectAll: boolean;
}): ContextMenuItem<ContentContextMenuAction>[] {
  const suggestions = input.dictionarySuggestions.slice(0, 5);
  return [
    ...(input.misspelledWord
      ? suggestions.length > 0
        ? suggestions.map((suggestion, index) => ({
            id: `spellcheck:${index}` as const,
            label: suggestion,
          }))
        : [
            {
              id: "no-spelling-suggestions" as const,
              label: "No suggestions",
              enabled: false,
            },
          ]
      : []),
    ...(input.image
      ? [
          {
            id: "copy-image" as const,
            label: "Copy Image",
            separatorBefore: input.misspelledWord,
          },
        ]
      : []),
    {
      id: "cut",
      label: "Cut",
      enabled: input.canCut,
      separatorBefore: input.misspelledWord || input.image,
    },
    { id: "copy", label: "Copy", enabled: input.canCopy },
    { id: "paste", label: "Paste", enabled: input.canPaste },
    { id: "select-all", label: "Select All", enabled: input.canSelectAll },
  ];
}

export function buildSpaceContextMenuItems(): ContextMenuItem<SpaceContextMenuAction>[] {
  return [
    { id: "edit", label: "Edit space…" },
    // Deleting a Space files its projects back into Void, so this intentionally
    // stays neutral rather than inheriting destructive styling.
    { id: "delete", label: "Delete space" },
  ];
}

export function buildProjectContextMenuCoreItems(input: {
  readonly isPinned: boolean;
}): ContextMenuItem<ProjectContextMenuCoreAction>[] {
  return [
    { id: "open-in-finder", label: "Open in Finder" },
    { id: "open-in-kanban", label: "Open in Kanban" },
    { id: "copy-path", label: "Copy Path" },
    {
      id: "toggle-pin",
      label: input.isPinned ? "Unpin project" : "Pin project",
      separatorBefore: true,
    },
  ];
}

export function buildProjectContextMenuItems(input: {
  readonly isPinned: boolean;
  readonly isRunning: boolean;
  readonly hasOpenServer: boolean;
  readonly hasArchivableThreads: boolean;
  readonly hasAnyThreads: boolean;
  readonly currentSpaceId: string | null;
  readonly spaces: readonly ProjectContextMenuSpace[];
}): ContextMenuItem<ProjectContextMenuAction>[] {
  const coreItems = buildProjectContextMenuCoreItems(input);
  const togglePin = coreItems.at(-1);
  if (!togglePin) return [];

  return [
    ...coreItems.slice(0, -1),
    {
      id: input.isRunning ? "stop-dev" : "start-dev",
      label: input.isRunning ? "Stop dev" : "Start dev",
      separatorBefore: true,
    },
    ...(input.hasOpenServer ? [{ id: "open-dev-server" as const, label: "Open dev server" }] : []),
    buildProjectMoveToSpaceItem({
      currentSpaceId: input.currentSpaceId,
      includeNewSpace: true,
      spaces: input.spaces,
    }),
    { id: "rename", label: "Edit name", separatorBefore: true },
    { ...togglePin, separatorBefore: false },
    ...(input.hasArchivableThreads
      ? [
          {
            id: "archive-threads" as const,
            label: "Archive threads",
            separatorBefore: true,
          },
        ]
      : []),
    ...(input.hasAnyThreads
      ? [
          {
            id: "delete-threads" as const,
            label: "Delete threads",
            separatorBefore: !input.hasArchivableThreads,
          },
        ]
      : []),
    {
      id: "delete",
      label: "Remove",
      separatorBefore: true,
      destructive: true,
    },
  ];
}

function normalizeItem<T extends string>(
  input: unknown,
  depth: number,
): NormalizedContextMenuItem<T> | null {
  if (typeof input !== "object" || input === null) return null;
  const item = input as ContextMenuItem<T>;
  if (typeof item.id !== "string" || item.id.length === 0) return null;
  if (typeof item.label !== "string" || item.label.length === 0) return null;

  const submenu =
    depth < MAX_CONTEXT_MENU_DEPTH && Array.isArray(item.submenu)
      ? normalizeContextMenuItems<T>(item.submenu, depth + 1)
      : [];
  const type = item.type === "checkbox" || item.type === "radio" ? item.type : "normal";

  return {
    id: item.id,
    label: item.label,
    type,
    enabled: item.enabled !== false,
    visible: item.visible !== false,
    checked: item.checked === true,
    ...(typeof item.accelerator === "string" && item.accelerator.length > 0
      ? { accelerator: item.accelerator }
      : {}),
    destructive: item.destructive === true,
    separatorBefore: item.separatorBefore === true,
    ...(submenu.length > 0 ? { submenu } : {}),
  };
}

export function normalizeContextMenuItems<T extends string>(
  items: readonly unknown[],
  depth = 0,
): readonly NormalizedContextMenuItem<T>[] {
  if (depth > MAX_CONTEXT_MENU_DEPTH) return [];
  return items
    .map((item) => normalizeItem(item, depth))
    .filter((item): item is NormalizedContextMenuItem<T> => item !== null);
}

export type NativeContextMenuTemplateEntry<T extends string = string> =
  | { readonly type: "separator" }
  | NormalizedContextMenuItem<T>;

export function buildNativeContextMenuTemplate<T extends string>(
  items: readonly NormalizedContextMenuItem<T>[],
): readonly NativeContextMenuTemplateEntry<T>[] {
  const template: NativeContextMenuTemplateEntry<T>[] = [];
  let destructiveGroupStarted = false;
  for (const item of items) {
    const insertSeparator =
      template.length > 0 &&
      (item.separatorBefore || (item.destructive && !destructiveGroupStarted));
    if (insertSeparator) template.push({ type: "separator" });
    if (item.destructive) destructiveGroupStarted = true;
    template.push(item);
  }
  return template;
}
