import { useEffect, useRef } from '@lynx-js/react';

import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsAppSnapProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import { appSnap, type LynxAppSnapCapture } from '../platform/appSnap';
import { webStorage } from '../platform/storage';
import { resolvePickedComposerFiles } from '../components/composer/composerAttachments.lynx';

type AddImages = ReturnType<
  typeof useComposerDraftStore.getState
>['addImages'];

export async function attachAppSnapCapture(
  threadId: string,
  capture: LynxAppSnapCapture,
  dependencies?: {
    readonly addImages: AddImages;
    readonly existingAttachmentCount: number;
    readonly resolvePickedFiles: typeof resolvePickedComposerFiles;
  }
): Promise<boolean> {
  'background only';
  const store = useComposerDraftStore.getState();
  const draft = store.draftsByThreadId[threadId];
  const resolvedDependencies = dependencies ?? {
    addImages: store.addImages,
    existingAttachmentCount:
      (draft?.files.length ?? 0) +
      (draft?.images.length ?? 0) +
      (draft?.assistantSelections.length ?? 0),
    resolvePickedFiles: resolvePickedComposerFiles,
  };
  const resolved = await resolvedDependencies.resolvePickedFiles({
    files: [capture.file],
    existingAttachmentCount: resolvedDependencies.existingAttachmentCount,
  });
  const image = resolved.images[0];
  if (!image) return false;
  resolvedDependencies.addImages(threadId, [
    { ...image, appSnapCaptureId: capture.captureId },
  ]);
  return true;
}

export function AppSnapCoordinator(props: {
  readonly activeThreadId: string | null;
}) {
  const activeThreadIdRef = useRef(props.activeThreadId);
  activeThreadIdRef.current = props.activeThreadId;
  const queueRef = useRef<Promise<void>>(Promise.resolve());
  const seenCaptureIdsRef = useRef(new Set<string>());

  useEffect(() => {
    'background only';
    const enqueue = (capture: LynxAppSnapCapture) => {
      if (seenCaptureIdsRef.current.has(capture.captureId)) return;
      seenCaptureIdsRef.current.add(capture.captureId);
      queueRef.current = queueRef.current
        .then(async () => {
          const threadId = activeThreadIdRef.current;
          if (!threadId) {
            seenCaptureIdsRef.current.delete(capture.captureId);
            return;
          }
          if (!(await attachAppSnapCapture(threadId, capture))) {
            seenCaptureIdsRef.current.delete(capture.captureId);
          }
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
      .setEnabled(settings.enableAppSnap)
      .then(() => appSnap.listPendingCaptures())
      .then((captures) => captures.forEach(enqueue))
      .catch(() => undefined);
    return () => {
      disposeCaptured();
      disposeError();
    };
  }, []);

  useEffect(() => {
    'background only';
    if (!props.activeThreadId) return;
    void appSnap
      .listPendingCaptures()
      .then((captures) => {
        for (const capture of captures) {
          if (seenCaptureIdsRef.current.has(capture.captureId)) continue;
          seenCaptureIdsRef.current.add(capture.captureId);
          queueRef.current = queueRef.current
            .then(async () => {
              if (
                !(await attachAppSnapCapture(
                  props.activeThreadId!,
                  capture
                ))
              ) {
                seenCaptureIdsRef.current.delete(capture.captureId);
              }
            })
            .catch(() => {
              seenCaptureIdsRef.current.delete(capture.captureId);
            });
        }
      })
      .catch(() => undefined);
  }, [props.activeThreadId]);

  return null;
}
