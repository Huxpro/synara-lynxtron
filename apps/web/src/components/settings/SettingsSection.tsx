// FILE: SettingsSection.tsx
// Purpose: Shared settings section/card composition with platform elements below it.
// Layer: Settings UI composition

import type { ReactNode } from "react";

import {
  SETTINGS_CARD_CLASS_NAME,
  SETTINGS_PANEL_SECTION_CLASS_NAME,
  SETTINGS_SECTION_LABEL_CLASS_NAME,
} from "~/settingsPanelStyles";
import {
  SettingsCardElement,
  SettingsSectionElement,
  SettingsSectionTitleElement,
} from "~/components/settings/SettingsSectionElements";

const settingsCardClassName = `${SETTINGS_CARD_CLASS_NAME} divide-y divide-[color:var(--color-border)]`;

export function SettingsCard({ children }: { children: ReactNode }) {
  return <SettingsCardElement className={settingsCardClassName}>{children}</SettingsCardElement>;
}

export function SettingsSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <SettingsSectionElement className={SETTINGS_PANEL_SECTION_CLASS_NAME}>
      <SettingsSectionTitleElement className={SETTINGS_SECTION_LABEL_CLASS_NAME}>
        {title}
      </SettingsSectionTitleElement>
      <SettingsCard>{children}</SettingsCard>
    </SettingsSectionElement>
  );
}
