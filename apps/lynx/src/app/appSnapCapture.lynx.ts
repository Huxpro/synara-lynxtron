import "background-only";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import type { LynxAppSnapCapture } from "../platform/appSnap";
import { resolvePickedComposerFiles } from "../components/composer/composerAttachments.lynx";

type AddImages = ReturnType<typeof useComposerDraftStore.getState>["addImages"];

export async function attachAppSnapCapture(
  threadId: string,
  capture: LynxAppSnapCapture,
  dependencies?: {
    readonly addImages: AddImages;
    readonly existingAttachmentCount: number;
    readonly resolvePickedFiles: typeof resolvePickedComposerFiles;
  },
): Promise<boolean> {
  "background only";
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
  resolvedDependencies.addImages(threadId, [{ ...image, appSnapCaptureId: capture.captureId }]);
  return true;
}
