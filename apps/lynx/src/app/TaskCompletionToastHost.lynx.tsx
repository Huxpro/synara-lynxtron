import { useEffect, useRef, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import type { TerminalEvent } from "@synara/contracts";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsNotificationsProjection,
} from "@synara-web/appSettingsStorageProjection.logic";

import { Button } from "../components/ui/button";
import { ensureNativeApi } from "~/nativeApi";
import { NotificationDismissIcon } from "./NotificationDismissIcon.lynx";
import { webStorage } from "../platform/storage";
import { fetchThreadCompletionAssistantSummary, queryClient, type ThreadSummary } from "./queries";
import {
  applyLynxTerminalActivityEvent,
  detectLynxTaskCompletionToasts,
  resolveLynxTaskCompletionSummaries,
  type LynxTerminalActivityState,
  type LynxTaskCompletionToast,
} from "./taskCompletionToast.logic";

const TOAST_VISIBLE_MS = 8_000;
const TERMINAL_EVENT_QUERY_KEY = ["terminal-activity-event"] as const;
interface TerminalEventSnapshot {
  readonly toast: LynxTaskCompletionToast | null;
  readonly version: number;
}

function deliverSystemNotifications(notifications: readonly LynxTaskCompletionToast[]) {
  "background only";
  if (notifications.length === 0) return;
  void import(/* webpackMode: "eager" */ "../platform/notifications").then(
    ({ showSystemNotification }) =>
      Promise.all(
        notifications.map((notification) =>
          showSystemNotification(notification).catch(() => false),
        ),
      ),
  );
}

export function TaskCompletionToastHost(props: {
  readonly activeThreadId: string | null;
  readonly threads: readonly ThreadSummary[];
  readonly onOpenThread: (threadId: string) => void;
}) {
  const previousRef = useRef<readonly ThreadSummary[] | null>(null);
  const activeThreadIdRef = useRef(props.activeThreadId);
  activeThreadIdRef.current = props.activeThreadId;
  const mountedRef = useRef(true);
  const completionRunRef = useRef(0);
  const terminalActivityRef = useRef<ReadonlyMap<string, LynxTerminalActivityState>>(new Map());
  const [toast, setToast] = useState<LynxTaskCompletionToast | null>(null);
  const [runtimeStartedAtMs] = useState(() => Date.now());
  const [dismissedTerminalVersion, setDismissedTerminalVersion] = useState(0);
  const terminalEventQuery = useQuery(
    {
      queryKey: TERMINAL_EVENT_QUERY_KEY,
      queryFn: async (): Promise<TerminalEventSnapshot> => ({
        toast: null,
        version: 0,
      }),
      enabled: false,
      initialData: {
        toast: null,
        version: 0,
      },
    },
    queryClient,
  );
  const terminalToast =
    terminalEventQuery.data.version === dismissedTerminalVersion
      ? null
      : terminalEventQuery.data.toast;

  useEffect(() => {
    return () => {
      mountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    "background only";
    const previous = previousRef.current;
    previousRef.current = props.threads;
    if (previous === null) return;
    const settings = readSettingsNotificationsProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    );
    const notifications = detectLynxTaskCompletionToasts({
      activeThreadId: props.activeThreadId,
      previous,
      current: props.threads,
      includeActiveThread: true,
      runtimeStartedAtMs,
    });
    if (notifications.length === 0) return;
    const completionRun = completionRunRef.current + 1;
    completionRunRef.current = completionRun;
    const offscreenNotifications = notifications.filter(
      (notification) => notification.threadId !== activeThreadIdRef.current,
    );
    const latestOffscreenNotification = offscreenNotifications.at(-1) ?? null;
    if (settings.enableTaskCompletionToasts) {
      setToast(latestOffscreenNotification);
    }
    if (settings.enableSystemTaskCompletionNotifications) {
      deliverSystemNotifications(
        notifications.filter((notification) => notification.kind !== "thread-completion"),
      );
    }
    const completionNotifications = notifications.filter(
      (notification) => notification.kind === "thread-completion",
    );
    if (completionNotifications.length === 0) return;
    void resolveLynxTaskCompletionSummaries({
      toasts: completionNotifications,
      loadAssistantSummary: fetchThreadCompletionAssistantSummary,
    }).then((resolvedNotifications) => {
      if (!mountedRef.current) return;
      const currentSettings = readSettingsNotificationsProjection(
        webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      );
      if (
        currentSettings.enableTaskCompletionToasts &&
        completionRun === completionRunRef.current &&
        latestOffscreenNotification?.kind === "thread-completion"
      ) {
        const resolvedLatest = resolvedNotifications.find(
          (notification) => notification.threadId === latestOffscreenNotification.threadId,
        );
        setToast(
          resolvedLatest && resolvedLatest.threadId !== activeThreadIdRef.current
            ? resolvedLatest
            : null,
        );
      }
      if (currentSettings.enableSystemTaskCompletionNotifications) {
        deliverSystemNotifications(resolvedNotifications);
      }
    });
  }, [props.activeThreadId, props.threads, runtimeStartedAtMs]);

  useEffect(() => {
    "background only";
    // The shared facade owns the one `terminal.events` stream of this socket.
    return ensureNativeApi().terminal.onEvent((terminalEvent: TerminalEvent) => {
      const result = applyLynxTerminalActivityEvent({
        activeThreadId: activeThreadIdRef.current,
        current: terminalActivityRef.current,
        event: terminalEvent,
        includeActiveThread: true,
      });
      terminalActivityRef.current = result.next;
      if (terminalEvent.type !== "activity") return;
      const settings = readSettingsNotificationsProjection(
        webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      );
      if (settings.enableSystemTaskCompletionNotifications && result.toast) {
        deliverSystemNotifications([result.toast]);
      }
      queryClient.setQueryData<TerminalEventSnapshot>(TERMINAL_EVENT_QUERY_KEY, (current) => ({
        toast:
          settings.enableTaskCompletionToasts &&
          result.toast &&
          terminalEvent.threadId !== activeThreadIdRef.current
            ? result.toast
            : null,
        version: (current?.version ?? 0) + 1,
      }));
    });
  }, []);

  useEffect(() => {
    "background only";
    if (!terminalToast) return;
    const version = terminalEventQuery.data.version;
    const timer = setTimeout(() => setDismissedTerminalVersion(version), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [terminalEventQuery.data.version, terminalToast]);

  useEffect(() => {
    "background only";
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  const visibleToast = toast ?? terminalToast;
  if (!visibleToast) return null;
  return (
    <view
      className={`TaskCompletionToast TaskCompletionToast--${visibleToast.tone}`}
      accessibility-element
      accessibility-label={`${visibleToast.title}. ${visibleToast.body}`}
    >
      <view className="TaskCompletionToastCopy">
        <text className="TaskCompletionToastTitle">{visibleToast.title}</text>
        <text className="TaskCompletionToastBody">{visibleToast.body}</text>
      </view>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          setToast(null);
          setDismissedTerminalVersion(terminalEventQuery.data.version);
          props.onOpenThread(visibleToast.threadId);
        }}
      >
        Open
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss activity notification"
        onClick={() => {
          setToast(null);
          setDismissedTerminalVersion(terminalEventQuery.data.version);
        }}
      >
        <NotificationDismissIcon />
      </Button>
    </view>
  );
}
