import type { SidebarSearchAction } from "./SidebarSearchPalette.logic";

export interface SidebarSearchSpaceAction {
  readonly id: string;
  readonly name: string;
  readonly icon?: SidebarSearchAction["icon"] | undefined;
}

export interface BuildSidebarSearchActionsInput {
  readonly newChatShortcutLabel?: string | null | undefined;
  readonly newThreadShortcutLabel?: string | null | undefined;
  readonly addProjectShortcutLabel?: string | null | undefined;
  readonly importThreadShortcutLabel?: string | null | undefined;
  readonly usageSettingsShortcutLabel?: string | null | undefined;
  readonly includeNewChat?: boolean | undefined;
  readonly includeNewThread?: boolean | undefined;
  readonly includeAddProject?: boolean | undefined;
  readonly includeImportThread?: boolean | undefined;
  readonly includeFeedback?: boolean | undefined;
  readonly includeSettings?: boolean | undefined;
  readonly includeUsageSettings?: boolean | undefined;
  readonly includeSpaces?: boolean | undefined;
  readonly includeNewSpace?: boolean | undefined;
  readonly spaces?: readonly SidebarSearchSpaceAction[] | undefined;
  readonly voidSpaceName?: string | undefined;
  readonly voidSpaceIcon?: SidebarSearchAction["icon"] | undefined;
  readonly newSpaceIcon?: SidebarSearchAction["icon"] | undefined;
  readonly onAddProject?: (() => void) | undefined;
  readonly onSelectVoidSpace?: (() => void) | undefined;
  readonly onSelectSpace?: ((spaceId: string) => void) | undefined;
  readonly onCreateSpace?: (() => void) | undefined;
}

function enabled(value: boolean | undefined): boolean {
  return value !== false;
}

/** Authoritative palette action catalog shared by Web and Lynx. */
export function buildSidebarSearchActions(
  input: BuildSidebarSearchActionsInput,
): SidebarSearchAction[] {
  const actions: SidebarSearchAction[] = [];

  if (enabled(input.includeNewChat)) {
    actions.push({
      id: "new-chat",
      label: "New chat",
      description: "Open the new chat landing screen.",
      keywords: ["chat", "new", "home"],
      shortcutLabel: input.newChatShortcutLabel ?? null,
    });
  }
  if (enabled(input.includeNewThread)) {
    actions.push({
      id: "new-thread",
      label: "New thread",
      description: "Start a fresh thread in the current or most recently used project.",
      keywords: ["thread", "new", "project"],
      shortcutLabel: input.newThreadShortcutLabel ?? null,
    });
  }
  if (enabled(input.includeAddProject)) {
    actions.push({
      id: "add-project",
      label: "Add project",
      description: "Open a repository or folder in the sidebar.",
      keywords: ["folder", "repo", "repository", "open"],
      shortcutLabel: input.addProjectShortcutLabel ?? null,
      ...(input.onAddProject ? { run: input.onAddProject } : {}),
    });
  }
  if (enabled(input.includeImportThread)) {
    actions.push({
      id: "import-thread",
      label: "Import thread from...",
      description: "Attach a local thread to an existing provider session.",
      keywords: ["import", "resume", "thread", "session", "codex", "claude", "cursor", "opencode"],
      shortcutLabel: input.importThreadShortcutLabel ?? null,
    });
  }
  if (enabled(input.includeFeedback)) {
    actions.push({
      id: "feedback",
      label: "Feedback Synara",
      description: "Send feedback or report an issue to the Synara team.",
      keywords: ["feedback", "bug", "issue", "problem", "report", "support", "synara"],
    });
  }
  if (enabled(input.includeSettings)) {
    actions.push({
      id: "settings",
      label: "Settings",
      description: "Open app settings.",
      keywords: ["preferences", "config"],
    });
  }
  if (enabled(input.includeUsageSettings)) {
    actions.push({
      id: "usage-settings",
      label: "Usage settings",
      description: "Open provider usage and remaining credits.",
      keywords: ["usage", "limits", "credits", "quota", "providers"],
      shortcutLabel: input.usageSettingsShortcutLabel ?? null,
    });
  }

  const spaces = input.spaces ?? [];
  if (enabled(input.includeSpaces) && spaces.length > 0) {
    actions.push({
      id: "switch-space-void",
      label: `Switch to ${input.voidSpaceName ?? "Void"}`,
      description: "Jump to unassigned projects.",
      keywords: ["space", "switch", "void", "unassigned"],
      requiresQuery: true,
      ...(input.onSelectVoidSpace ? { run: input.onSelectVoidSpace } : {}),
      ...(input.voidSpaceIcon ? { icon: input.voidSpaceIcon } : {}),
    });
    for (const space of spaces) {
      actions.push({
        id: `switch-space-${space.id}`,
        label: `Switch to ${space.name}`,
        description: "Jump to this space and restore its last context.",
        keywords: ["space", "switch", space.name],
        requiresQuery: true,
        run: () => input.onSelectSpace?.(space.id),
        ...(space.icon ? { icon: space.icon } : {}),
      });
    }
  }
  if (enabled(input.includeNewSpace)) {
    actions.push({
      id: "new-space",
      label: "New space",
      description: "Group projects into a focused work context.",
      keywords: ["space", "create", "new", "group", "workspace"],
      ...(input.onCreateSpace ? { run: input.onCreateSpace } : {}),
      ...(input.newSpaceIcon ? { icon: input.newSpaceIcon } : {}),
    });
  }

  return actions;
}
