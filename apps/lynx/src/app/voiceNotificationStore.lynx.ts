import { create } from "zustand";

export interface LynxVoiceNotification {
  readonly id: number;
  readonly title: string;
  readonly description?: string;
  readonly actionLabel?: string;
  readonly onAction?: () => void;
}

interface LynxVoiceNotificationState {
  readonly notification: LynxVoiceNotification | null;
  readonly dismiss: () => void;
  readonly show: (notification: Omit<LynxVoiceNotification, "id">) => void;
}

let nextVoiceNotificationId = 1;

export const useLynxVoiceNotificationStore = create<LynxVoiceNotificationState>((set) => ({
  notification: null,
  dismiss: () => set({ notification: null }),
  show: (notification) =>
    set({
      notification: { id: nextVoiceNotificationId++, ...notification },
    }),
}));
