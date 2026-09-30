// FILE: SettingsPanelHeaderComposition.logic.ts
// Purpose: Host-neutral projection of canonical settings panel title and description.

import type { SettingsSectionId } from "../../settingsNavigation";
import { SETTINGS_NAV_ITEMS } from "../../settingsNavigation";

export function resolveSettingsPanelHeader(section: SettingsSectionId): {
  readonly title: string;
  readonly description: string;
} {
  const item = SETTINGS_NAV_ITEMS.find((candidate) => candidate.id === section);
  return {
    title: item?.label ?? "General",
    description:
      item?.description ?? "Choose defaults for new chats, navigation, and the Environment panel.",
  };
}
