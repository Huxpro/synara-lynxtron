// FILE: SettingsNavigationComposition.logic.ts
// Purpose: Host-neutral settings taxonomy grouping, active state, and availability.

import type { SettingsSectionId } from "../settingsNavigation";
import { SETTINGS_NAV_GROUPS, SETTINGS_NAV_ITEMS } from "../settingsNavigation";

export type SettingsNavigationCompositionGroup = {
  readonly id: (typeof SETTINGS_NAV_GROUPS)[number]["id"];
  readonly label: string;
  readonly items: ReadonlyArray<{
    readonly id: SettingsSectionId;
    readonly label: string;
    readonly icon: string;
    readonly active: boolean;
    readonly available: boolean;
  }>;
};

export function resolveSettingsNavigationCompositionGroups(input: {
  readonly activeSection: SettingsSectionId;
  readonly availableSections?: readonly SettingsSectionId[] | undefined;
}): readonly SettingsNavigationCompositionGroup[] {
  return SETTINGS_NAV_GROUPS.map((group) => ({
    id: group.id,
    label: group.label,
    items: SETTINGS_NAV_ITEMS.filter((item) => item.group === group.id).map((item) => ({
      id: item.id,
      label: item.label,
      icon: item.icon,
      active: item.id === input.activeSection,
      available: input.availableSections === undefined || input.availableSections.includes(item.id),
    })),
  })).filter((group) => group.items.length > 0);
}
