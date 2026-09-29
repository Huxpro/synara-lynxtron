import type { Notification as LynxtronNotification } from "@lynx-js/lynxtron";

export type NativeNotificationConstructor = typeof LynxtronNotification;

export interface NativeNotificationRequest {
  readonly body: string;
  readonly threadId?: string | null;
  readonly title: string;
}

export function createNativeNotificationService(input: {
  readonly Notification: NativeNotificationConstructor | undefined;
  readonly openThread: (threadId: string) => void;
}) {
  const liveNotifications = new Set<InstanceType<NativeNotificationConstructor>>();
  return {
    isSupported(): boolean {
      return typeof input.Notification === "function";
    },
    show(request: NativeNotificationRequest): Promise<boolean> {
      if (!input.Notification) {
        return Promise.resolve(false);
      }
      const title = request.title.trim();
      const body = request.body.trim();
      if (!title || !body) {
        return Promise.resolve(false);
      }
      const notification = new input.Notification({
        title,
        body,
        silent: false,
      });
      liveNotifications.add(notification);
      const release = () => liveNotifications.delete(notification);
      notification.once("close", release);
      notification.once("failed", release);
      const threadId = request.threadId?.trim();
      if (threadId) {
        notification.on("click", () => input.openThread(threadId));
      }
      return new Promise((resolve) => {
        let settled = false;
        const settle = (shown: boolean) => {
          if (settled) return;
          settled = true;
          clearTimeout(timeoutId);
          resolve(shown);
        };
        const timeoutId = setTimeout(() => settle(false), 3_000);
        notification.once("show", () => settle(true));
        notification.once("failed", () => settle(false));
        notification.show();
      });
    },
  };
}
