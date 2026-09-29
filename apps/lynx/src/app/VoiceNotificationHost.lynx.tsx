import { useEffect } from "@lynx-js/react";

import { IconButton } from "../components/ui/icon-button.lynx";
import { Button } from "../components/ui/button.lynx";
import { CircleAlertIcon } from "../lib/icons.lynx";
import { useLynxVoiceNotificationStore } from "./voiceNotificationStore.lynx";
import { NotificationDismissIcon } from "./NotificationDismissIcon.lynx";

const VOICE_NOTIFICATION_VISIBLE_MS = 8_000;

export function VoiceNotificationHost() {
  const notification = useLynxVoiceNotificationStore((state) => state.notification);
  const dismiss = useLynxVoiceNotificationStore((state) => state.dismiss);

  useEffect(() => {
    "background only";
    if (!notification) return;
    const timer = setTimeout(dismiss, VOICE_NOTIFICATION_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [dismiss, notification]);

  if (!notification) return null;
  return (
    <view
      className="VoiceNotificationToast"
      accessibility-element
      accessibility-label={notification.title}
    >
      <CircleAlertIcon className="VoiceNotificationToastIcon" size={18} />
      <view className="VoiceNotificationToastCopy">
        <text className="VoiceNotificationToastTitle">{notification.title}</text>
        {notification.description ? (
          <text className="VoiceNotificationToastDescription">{notification.description}</text>
        ) : null}
      </view>
      {notification.actionLabel && notification.onAction ? (
        <Button size="xs" variant="secondary" onClick={() => notification.onAction?.()}>
          {notification.actionLabel}
        </Button>
      ) : null}
      <IconButton label="Dismiss voice notification" onClick={dismiss}>
        <NotificationDismissIcon />
      </IconButton>
    </view>
  );
}
