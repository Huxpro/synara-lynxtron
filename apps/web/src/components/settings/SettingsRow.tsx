// FILE: SettingsRow.tsx
// Purpose: Shared settings row composition with platform elements beneath it.
// Layer: Settings UI composition

import type { ReactNode } from "react";

import { settingRowAnchorId } from "~/settingsNavigation";
import {
  SETTINGS_CARD_ROW_CLASS_NAME,
  SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME,
  SETTINGS_CARD_ROW_TITLE_CLASS_NAME,
} from "~/settingsPanelStyles";
import {
  SettingsRowDescriptionElement,
  SettingsRowInlineElement,
  SettingsRowLayoutElement,
  SettingsRowRootElement,
  SettingsRowTitleElement,
  SettingsRowViewElement,
} from "~/components/settings/SettingsRowElements";

export function SettingsRow({
  title,
  description,
  status,
  resetAction,
  control,
  children,
  onClick,
}: {
  title: ReactNode;
  description: string;
  status?: ReactNode | undefined;
  resetAction?: ReactNode | undefined;
  control?: ReactNode | undefined;
  children?: ReactNode | undefined;
  onClick?: (() => void) | undefined;
}) {
  const anchorId = typeof title === "string" ? settingRowAnchorId(title) : undefined;
  const rootClassName = `${SETTINGS_CARD_ROW_CLASS_NAME}${anchorId ? " scroll-mt-24" : ""}`;
  const layoutClassName = [
    "flex flex-col gap-2.5 sm:flex-row sm:items-center sm:justify-between",
    onClick ? "cursor-pointer" : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <SettingsRowRootElement id={anchorId} className={rootClassName}>
      <SettingsRowLayoutElement className={layoutClassName} onClick={onClick}>
        <SettingsRowViewElement className="min-w-0 flex-1 space-y-0.5">
          <SettingsRowViewElement className="flex min-h-5 items-center gap-1.5">
            <SettingsRowTitleElement className={SETTINGS_CARD_ROW_TITLE_CLASS_NAME}>
              {title}
            </SettingsRowTitleElement>
            <SettingsRowInlineElement className="inline-flex h-5 w-5 shrink-0 items-center justify-center">
              {resetAction}
            </SettingsRowInlineElement>
          </SettingsRowViewElement>
          <SettingsRowDescriptionElement className={SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME}>
            {description}
          </SettingsRowDescriptionElement>
          {status ? (
            <SettingsRowViewElement className="pt-1 text-ui-sm text-muted-foreground">
              {status}
            </SettingsRowViewElement>
          ) : null}
        </SettingsRowViewElement>
        {control ? (
          <SettingsRowViewElement className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {control}
          </SettingsRowViewElement>
        ) : null}
      </SettingsRowLayoutElement>
      {children}
    </SettingsRowRootElement>
  );
}
