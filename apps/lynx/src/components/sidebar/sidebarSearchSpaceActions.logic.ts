import { buildSidebarSearchActions } from "@synara-web/components/SidebarSearchActions.logic";
import { LYNX_PRIMARY_SHORTCUT_LABELS } from "./sidebarShortcuts";

export function buildLynxSidebarSearchActions(onCreateSpace: () => void) {
  return buildSidebarSearchActions({
    newChatShortcutLabel: LYNX_PRIMARY_SHORTCUT_LABELS.newChat,
    newThreadShortcutLabel: LYNX_PRIMARY_SHORTCUT_LABELS.newThread,
    addProjectShortcutLabel: LYNX_PRIMARY_SHORTCUT_LABELS.addProject,
    importThreadShortcutLabel: LYNX_PRIMARY_SHORTCUT_LABELS.importThread,
    usageSettingsShortcutLabel: LYNX_PRIMARY_SHORTCUT_LABELS.usageSettings,
    includeNewThread: true,
    includeAddProject: true,
    includeImportThread: true,
    includeFeedback: true,
    includeUsageSettings: true,
    includeSpaces: false,
    includeNewSpace: true,
    onCreateSpace,
  });
}
