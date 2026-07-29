// FILE: SettingsPanelPrimitives.tsx
// Purpose: Shared settings section card and row primitives (Codex-style bordered groups).
// Layer: Settings UI components
// Exports: SettingsCard, SettingsSection, SettingsListRow, SettingsRow, SettingsSelectPopup

import { type ComponentProps, type ReactNode } from "react";
import { cn } from "~/lib/utils";
import {
  SETTINGS_CARD_ROW_CLASS_NAME,
  SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME,
  SETTINGS_CARD_ROW_TITLE_CLASS_NAME,
} from "~/settingsPanelStyles";
import { SelectPopup } from "~/components/ui/select";
import { composerPickerMenuShellClassName } from "~/components/chat/composerPickerSize";

export { SettingsCard, SettingsSection } from "./SettingsSection";
export { SettingsRow } from "./SettingsRow";

/** Frosted select dropdown panel with settings `rounded-lg` chrome. */
export function SettingsSelectPopup({
  align = "end",
  alignItemWithTrigger = false,
  shellClassName,
  ...props
}: Omit<ComponentProps<typeof SelectPopup>, "surface">) {
  return (
    <SelectPopup
      align={align}
      alignItemWithTrigger={alignItemWithTrigger}
      surface="settings"
      shellClassName={cn(composerPickerMenuShellClassName(), shellClassName)}
      {...props}
    />
  );
}

/**
 * A list item row inside a settings card — same chrome and typography as
 * {@link SettingsRow}, but for dynamic collections (archived threads, managed
 * worktrees, …) rather than a single setting + control. It deliberately omits
 * the search anchor (titles are data, not stable setting names) and supports a
 * right-click handler plus top-alignment for rows whose body can grow tall.
 *
 * Separators come from the parent card's `divide-y` (see {@link SettingsCard} /
 * {@link SettingsSection}); the row never draws its own border.
 */
export function SettingsListRow({
  title,
  description,
  actions,
  align = "center",
  onContextMenu,
}: {
  title: ReactNode;
  description?: ReactNode;
  actions?: ReactNode;
  align?: "center" | "start";
  onContextMenu?: ComponentProps<"div">["onContextMenu"];
}) {
  return (
    <div
      className={SETTINGS_CARD_ROW_CLASS_NAME}
      data-slot="settings-row"
      onContextMenu={onContextMenu}
    >
      <div
        className={cn(
          "flex flex-col gap-2.5 sm:flex-row sm:justify-between",
          align === "start" ? "sm:items-start" : "sm:items-center",
        )}
      >
        <div className="min-w-0 flex-1 space-y-0.5">
          <div className={cn(SETTINGS_CARD_ROW_TITLE_CLASS_NAME, "truncate")}>{title}</div>
          {description != null ? (
            <div className={SETTINGS_CARD_ROW_DESCRIPTION_CLASS_NAME}>{description}</div>
          ) : null}
        </div>
        {actions != null ? (
          <div className="flex w-full shrink-0 items-center gap-2 sm:w-auto sm:justify-end">
            {actions}
          </div>
        ) : null}
      </div>
    </div>
  );
}
