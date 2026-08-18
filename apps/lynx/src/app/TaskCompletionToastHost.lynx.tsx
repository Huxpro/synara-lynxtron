import {
  useEffect,
  useRef,
  useState,
} from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { TerminalEvent } from '@synara/contracts';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsNotificationsProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { Button } from '../components/ui/button';
import { subscribeTerminalEvents } from '../data/synaraClient.lynx';
import { XIcon } from '../lib/icons.lynx';
import { onGlobalEvent } from '../platform/bridge';
import { webStorage } from '../platform/storage';
import { queryClient, type ThreadSummary } from './queries';
import {
  applyLynxTerminalActivityEvent,
  detectLynxTaskCompletionToasts,
  type LynxTerminalActivityState,
  type LynxTaskCompletionToast,
} from './taskCompletionToast.logic';

const TOAST_VISIBLE_MS = 8_000;
const TERMINAL_EVENT = 'synara:terminal-event';
const TERMINAL_EVENT_QUERY_KEY = ['terminal-activity-event'] as const;
interface TerminalEventSnapshot {
  readonly toast: LynxTaskCompletionToast | null;
  readonly version: number;
}

export function TaskCompletionToastHost(props: {
  readonly activeThreadId: string | null;
  readonly threads: readonly ThreadSummary[];
  readonly onOpenThread: (threadId: string) => void;
}) {
  const previousRef = useRef<readonly ThreadSummary[] | null>(null);
  const activeThreadIdRef = useRef(props.activeThreadId);
  activeThreadIdRef.current = props.activeThreadId;
  const terminalActivityRef = useRef<
    ReadonlyMap<string, LynxTerminalActivityState>
  >(new Map());
  const [toast, setToast] = useState<LynxTaskCompletionToast | null>(null);
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
    queryClient
  );
  const terminalToast =
    terminalEventQuery.data.version === dismissedTerminalVersion
      ? null
      : terminalEventQuery.data.toast;

  useEffect(() => {
    const previous = previousRef.current;
    previousRef.current = props.threads;
    if (previous === null) return;
    const settings = readSettingsNotificationsProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    );
    if (!settings.enableTaskCompletionToasts) return;
    const next = detectLynxTaskCompletionToasts({
      activeThreadId: props.activeThreadId,
      previous,
      current: props.threads,
    }).at(-1);
    if (next) setToast(next);
  }, [props.activeThreadId, props.threads]);

  useEffect(() => {
    'background only';
    const disposeGlobalEvent = onGlobalEvent(
      TERMINAL_EVENT,
      (event: unknown) => {
        if (!event || typeof event !== 'object' || !('type' in event)) return;
        const terminalEvent = event as TerminalEvent;
        const result = applyLynxTerminalActivityEvent({
          activeThreadId: activeThreadIdRef.current,
          current: terminalActivityRef.current,
          event: terminalEvent,
        });
        terminalActivityRef.current = result.next;
        if (terminalEvent.type !== 'activity') return;
        const settings = readSettingsNotificationsProjection(
          webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
        );
        queryClient.setQueryData<TerminalEventSnapshot>(
          TERMINAL_EVENT_QUERY_KEY,
          (current) => ({
            toast:
              settings.enableTaskCompletionToasts && result.toast
                ? result.toast
                : null,
            version: (current?.version ?? 0) + 1,
          })
        );
      }
    );
    const disposeTerminalEvents = subscribeTerminalEvents(() => {});
    return () => {
      disposeGlobalEvent();
      disposeTerminalEvents();
    };
  }, []);

  useEffect(() => {
    'background only';
    if (!terminalToast) return;
    const version = terminalEventQuery.data.version;
    const timer = setTimeout(
      () => setDismissedTerminalVersion(version),
      TOAST_VISIBLE_MS
    );
    return () => clearTimeout(timer);
  }, [terminalEventQuery.data.version, terminalToast]);

  useEffect(() => {
    'background only';
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
        <XIcon size={12} />
      </Button>
    </view>
  );
}
