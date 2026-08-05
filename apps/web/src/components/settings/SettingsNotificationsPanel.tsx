import type { ReactNode } from "react";

import { SettingsPanelStackElement } from "~/components/settings/SettingsSectionElements";
import { SettingsRow } from "./SettingsRow";
import { SettingsSection } from "./SettingsSection";
import type {
  NotificationSettingKey,
  NotificationSettingsValues,
} from "./SettingsNotificationsPanel.logic";

export type {
  NotificationSettingKey,
  NotificationSettingsValues,
} from "./SettingsNotificationsPanel.logic";

type ControlRenderArgs = {
  readonly key: NotificationSettingKey;
  readonly checked: boolean;
  readonly ariaLabel: string;
  readonly onCheckedChange: (checked: boolean) => void;
};

type ResetRenderArgs = {
  readonly changed: boolean;
  readonly label: string;
  readonly onReset: () => void;
};

export function SettingsNotificationsPanel({
  settings,
  defaults,
  activityStatus,
  desktopStatus,
  updateSetting,
  renderControl,
  renderResetAction,
}: {
  readonly settings: NotificationSettingsValues;
  readonly defaults: NotificationSettingsValues;
  readonly activityStatus?: ReactNode;
  readonly desktopStatus?: ReactNode;
  readonly updateSetting: (key: NotificationSettingKey, value: boolean) => void;
  readonly renderControl: (args: ControlRenderArgs) => ReactNode;
  readonly renderResetAction: (args: ResetRenderArgs) => ReactNode;
}) {
  return (
    <SettingsPanelStackElement className="space-y-6">
      <SettingsSection title="Activity alerts">
        <SettingsRow
          title="Activity toasts"
          description="Show an in-app toast when a chat or managed terminal agent finishes or needs input."
          status={activityStatus}
          resetAction={renderResetAction({
            changed:
              settings.enableTaskCompletionToasts !==
              defaults.enableTaskCompletionToasts,
            label: "activity toasts",
            onReset: () =>
              updateSetting(
                "enableTaskCompletionToasts",
                defaults.enableTaskCompletionToasts,
              ),
          })}
          control={renderControl({
            key: "enableTaskCompletionToasts",
            checked: settings.enableTaskCompletionToasts,
            ariaLabel: "Activity toast notifications",
            onCheckedChange: (checked) =>
              updateSetting("enableTaskCompletionToasts", checked),
          })}
        />
        <SettingsRow
          title="Desktop notifications"
          description="Show an OS notification when a chat or managed terminal agent finishes or needs input while the app is in the background."
          status={desktopStatus}
          resetAction={renderResetAction({
            changed:
              settings.enableSystemTaskCompletionNotifications !==
              defaults.enableSystemTaskCompletionNotifications,
            label: "desktop notifications",
            onReset: () =>
              updateSetting(
                "enableSystemTaskCompletionNotifications",
                defaults.enableSystemTaskCompletionNotifications,
              ),
          })}
          control={renderControl({
            key: "enableSystemTaskCompletionNotifications",
            checked: settings.enableSystemTaskCompletionNotifications,
            ariaLabel: "Desktop activity notifications",
            onCheckedChange: (checked) =>
              updateSetting("enableSystemTaskCompletionNotifications", checked),
          })}
        />
      </SettingsSection>
    </SettingsPanelStackElement>
  );
}
