// FILE: SettingsSection.tsx
// Purpose: Shared settings section/card composition with platform elements below it.
// Layer: Settings UI composition

import type { ReactNode } from "react";

import {
  SETTINGS_CARD_CLASS_NAME,
  SETTINGS_PANEL_SECTION_CLASS_NAME,
  SETTINGS_SECTION_LABEL_CLASS_NAME,
  SETTINGS_STACKED_ROWS_DIVIDER_CLASS_NAME,
} from "~/settingsPanelStyles";
import {
  SettingsCardElement,
  SettingsSectionElement,
  SettingsSectionTitleElement,
} from "~/components/settings/SettingsSectionElements";

/**
 * Grouped settings card. Children stack as rows separated by hairlines; pass
 * `divided={false}` for a card that draws its own internal structure (the theme editor's
 * header/body split) and `className` for one that adds layout to the card itself.
 */
export function SettingsCard({
  divided = true,
  className,
  children,
}: {
  divided?: boolean | undefined;
  className?: string | undefined;
  children: ReactNode;
}) {
  const cardClassName = [
    SETTINGS_CARD_CLASS_NAME,
    divided ? SETTINGS_STACKED_ROWS_DIVIDER_CLASS_NAME : "",
    className ?? "",
  ]
    .filter(Boolean)
    .join(" ");
  return <SettingsCardElement className={cardClassName}>{children}</SettingsCardElement>;
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
