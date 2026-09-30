// FILE: SettingsNavigationComposition.tsx
// Purpose: Physical-shared settings section taxonomy, grouping, order, and availability.

import type { SettingsSectionId } from "../settingsNavigation";
import { resolveSettingsNavigationCompositionGroups } from "./SettingsNavigationComposition.logic";
import {
  SettingsNavigationGroupElement,
  SettingsNavigationGroupLabelElement,
  SettingsNavigationIconElement,
  SettingsNavigationItemButtonElement,
  SettingsNavigationItemElement,
  SettingsNavigationItemLabelElement,
  SettingsNavigationListElement,
  SettingsNavigationRootElement,
} from "~/components/SettingsNavigationCompositionElements";

export function SettingsNavigationComposition(props: {
  readonly activeSection: SettingsSectionId;
  readonly availableSections?: readonly SettingsSectionId[] | undefined;
  readonly onSelectSection: (section: SettingsSectionId) => void;
}) {
  const groups = resolveSettingsNavigationCompositionGroups(props);

  return (
    <SettingsNavigationRootElement>
      {groups.map((group) => (
        <SettingsNavigationGroupElement key={group.id} groupId={group.id}>
          <SettingsNavigationGroupLabelElement groupId={group.id}>
            {group.label}
          </SettingsNavigationGroupLabelElement>
          <SettingsNavigationListElement>
            {group.items.map((item) => (
              <SettingsNavigationItemElement key={item.id}>
                <SettingsNavigationItemButtonElement
                  active={item.active}
                  accessibleLabel={item.label}
                  disabled={!item.available}
                  onSelect={() => props.onSelectSection(item.id)}
                >
                  <SettingsNavigationIconElement name={item.icon} />
                  <SettingsNavigationItemLabelElement>
                    {item.label}
                  </SettingsNavigationItemLabelElement>
                </SettingsNavigationItemButtonElement>
              </SettingsNavigationItemElement>
            ))}
          </SettingsNavigationListElement>
        </SettingsNavigationGroupElement>
      ))}
    </SettingsNavigationRootElement>
  );
}
