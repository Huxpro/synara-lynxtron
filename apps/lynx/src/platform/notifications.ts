import "background-only";

import { bridgeCall } from "./bridge";

export interface SystemNotificationRequest {
  readonly body: string;
  readonly threadId?: string | null;
  readonly title: string;
}

export async function isSystemNotificationSupported(): Promise<boolean> {
  const result = await bridgeCall<{ readonly supported?: boolean }>("notificationsIsSupported");
  return result.supported === true;
}

export async function showSystemNotification(request: SystemNotificationRequest): Promise<boolean> {
  const result = await bridgeCall<{ readonly shown?: boolean }>("notificationsShow", request);
  return result.shown === true;
}
