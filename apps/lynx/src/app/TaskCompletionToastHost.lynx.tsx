import { useEffect, useRef, useState } from '@lynx-js/react';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsNotificationsProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { Button } from '../components/ui/button';
import { XIcon } from '../lib/icons.lynx';
import { webStorage } from '../platform/storage';
import type { ThreadSummary } from './queries';
import {
  detectLynxTaskCompletionToasts,
  type LynxTaskCompletionToast,
} from './taskCompletionToast.logic';

const TOAST_VISIBLE_MS = 8_000;

export function TaskCompletionToastHost(props: {
  readonly activeThreadId: string | null;
  readonly threads: readonly ThreadSummary[];
  readonly onOpenThread: (threadId: string) => void;
}) {
  const previousRef = useRef<readonly ThreadSummary[] | null>(null);
  const [toast, setToast] = useState<LynxTaskCompletionToast | null>(null);

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
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), TOAST_VISIBLE_MS);
    return () => clearTimeout(timer);
  }, [toast]);

  if (!toast) return null;
  return (
    <view
      className={`TaskCompletionToast TaskCompletionToast--${toast.tone}`}
      accessibility-element
      accessibility-label={`${toast.title}. ${toast.body}`}
    >
      <view className="TaskCompletionToastCopy">
        <text className="TaskCompletionToastTitle">{toast.title}</text>
        <text className="TaskCompletionToastBody">{toast.body}</text>
      </view>
      <Button
        variant="ghost"
        size="xs"
        onClick={() => {
          setToast(null);
          props.onOpenThread(toast.threadId);
        }}
      >
        Open
      </Button>
      <Button
        variant="ghost"
        size="icon-xs"
        aria-label="Dismiss activity notification"
        onClick={() => setToast(null)}
      >
        <XIcon size={12} />
      </Button>
    </view>
  );
}
