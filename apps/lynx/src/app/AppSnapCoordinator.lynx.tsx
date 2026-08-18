import { useEffect, useRef } from '@lynx-js/react';

import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsAppSnapProjection,
  readSettingsGeneralProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import { resolveAppSnapTarget } from '@synara-web/appSnap.logic';

import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import { fetchSynaraSidebarShellSnapshot } from '../data/synaraClient.lynx';
import { appSnap, type LynxAppSnapCapture } from '../platform/appSnap';
import { webStorage } from '../platform/storage';
import { loadLandingBootstrap } from '../components/composer/LandingComposer.lynx';
import { attachAppSnapCapture } from './appSnapCapture.lynx';
import {
  appSnapCaptureTimestampMs,
  createFreshAppSnapTask,
  findAppSnapCaptureThreadId,
} from './appSnapRouting.lynx';

export function AppSnapCoordinator(props: {
  readonly activeThreadId: string | null;
  readonly onOpenThread: (threadId: string) => void;
}) {
  const onOpenThreadRef = useRef(props.onOpenThread);
  onOpenThreadRef.current = props.onOpenThread;
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const seenCaptureIdsRef = useRef(new Set<string>());
  const lastInteractionRef = useRef<{
    readonly threadId: string;
    readonly atMs: number;
  } | null>(
    props.activeThreadId
      ? { threadId: props.activeThreadId, atMs: Date.now() }
      : null
  );
  const lastAppSnapRef = useRef<{
    readonly threadId: string;
    readonly atMs: number;
  } | null>(null);

  useEffect(() => {
    'background only';
    if (!props.activeThreadId) return;
    lastInteractionRef.current = {
      threadId: props.activeThreadId,
      atMs: Date.now(),
    };
  }, [props.activeThreadId]);

  useEffect(() => {
    'background only';
    const enqueue = (capture: LynxAppSnapCapture) => {
      if (seenCaptureIdsRef.current.has(capture.captureId)) return;
      seenCaptureIdsRef.current.add(capture.captureId);
      queueRef.current = queueRef.current
        .then(async () => {
          const snapshot = await fetchSynaraSidebarShellSnapshot();
          const availableThreadIds = new Set(
            snapshot.threads.map((thread) => thread.id)
          );
          const draftsByThreadId =
            useComposerDraftStore.getState().draftsByThreadId;
          const restoredThreadId = findAppSnapCaptureThreadId(
            draftsByThreadId,
            capture.captureId
          );
          const captureAtMs = appSnapCaptureTimestampMs(capture, Date.now());
          const resolvedTarget = restoredThreadId &&
            availableThreadIds.has(restoredThreadId)
            ? {
                kind: 'existing' as const,
                target: { threadId: restoredThreadId },
              }
            : resolveAppSnapTarget({
                captureAtMs,
                lastInteraction: lastInteractionRef.current as never,
                lastAppSnap: lastAppSnapRef.current as never,
                isThreadAvailable: (threadId) =>
                  availableThreadIds.has(threadId),
              });
          let threadId: string;
          if (resolvedTarget.kind === 'existing') {
            threadId = resolvedTarget.target.threadId;
          } else {
            const generalSettings = readSettingsGeneralProjection(
              webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
            );
            threadId = await createFreshAppSnapTask({
              defaultProvider: generalSettings.defaultProvider,
              loadBootstrap: loadLandingBootstrap,
            });
          }
          onOpenThreadRef.current(threadId);
          if (!(await attachAppSnapCapture(threadId, capture))) {
            seenCaptureIdsRef.current.delete(capture.captureId);
            return;
          }
          lastAppSnapRef.current = { threadId, atMs: captureAtMs };
        })
        .catch(() => {
          seenCaptureIdsRef.current.delete(capture.captureId);
        });
    };
    const disposeCaptured = appSnap.onCaptured(enqueue);
    const disposeError = appSnap.onError((error) => {
      console.warn('[appsnap]', error.message);
    });
    const settings = readSettingsAppSnapProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
    );
    void appSnap
      .setPlayCaptureSound(settings.appSnapPlaySound)
      .then(() => appSnap.setEnabled(settings.enableAppSnap))
      .then(() => appSnap.listPendingCaptures())
      .then((captures) => captures.forEach(enqueue))
      .catch(() => undefined);
    return () => {
      disposeCaptured();
      disposeError();
    };
  }, []);

  return null;
}
