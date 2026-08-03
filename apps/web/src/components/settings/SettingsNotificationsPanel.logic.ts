export type NotificationSettingKey =
  | "enableTaskCompletionToasts"
  | "enableSystemTaskCompletionNotifications";

export type NotificationSettingsValues = Readonly<
  Record<NotificationSettingKey, boolean>
>;

export const DEFAULT_NOTIFICATION_SETTINGS_VALUES: NotificationSettingsValues = {
  enableTaskCompletionToasts: true,
  enableSystemTaskCompletionNotifications: true,
};

export function notificationSettingsValuesEqual(
  left: NotificationSettingsValues,
  right: NotificationSettingsValues,
): boolean {
  return (
    left.enableTaskCompletionToasts === right.enableTaskCompletionToasts &&
    left.enableSystemTaskCompletionNotifications ===
      right.enableSystemTaskCompletionNotifications
  );
}
