// FILE: ComposerReferenceAttachmentsCompositionElements.tsx
// Purpose: DOM host elements for the shared composer reference-attachment composition.

import { type ReactNode } from "react";

import {
  type ComposerFileAttachment,
  type ComposerImageAttachment,
} from "../../composerDraftStore";
import { type PastedTextDraft } from "../../lib/composerPastedText";
import { type FileCommentDraft } from "../../lib/fileComments";
import { type ChatAssistantSelectionAttachment } from "../../types";
import { AssistantSelectionsSummaryChip } from "./AssistantSelectionsSummaryChip";
import { ComposerImageAttachmentChip } from "./ComposerImageAttachmentChip";
import { type ExpandedImagePreview } from "./ExpandedImagePreview";
import { FileAttachmentChip } from "./FileAttachmentChip";
import { FileCommentsSummaryChip } from "./FileCommentsSummaryChip";
import { ComposerPastedTextCard } from "./PastedTextChip";

export function ComposerReferenceAttachmentsContainerElement({
  children,
}: {
  children?: ReactNode;
}) {
  return <div className="-mx-1.5 -mt-1 mb-2 flex flex-wrap items-start gap-1.5">{children}</div>;
}

export function ComposerAssistantSelectionsAttachmentElement({
  selections,
  onRemove,
}: {
  selections: ReadonlyArray<ChatAssistantSelectionAttachment>;
  onRemove?: (() => void) | undefined;
}) {
  return <AssistantSelectionsSummaryChip selections={selections} onRemove={onRemove} />;
}

export function ComposerFileCommentsAttachmentElement({
  comments,
  onRemove,
}: {
  comments: ReadonlyArray<FileCommentDraft>;
  onRemove?: (() => void) | undefined;
}) {
  return <FileCommentsSummaryChip comments={comments} onRemove={onRemove} />;
}

export function ComposerPastedTextAttachmentElement({
  pastedText,
  onShowInTextField,
  onRemove,
}: {
  pastedText: PastedTextDraft;
  onShowInTextField: () => void;
  onRemove: () => void;
}) {
  return (
    <ComposerPastedTextCard
      text={pastedText.text}
      metrics={{ lineCount: pastedText.lineCount, charCount: pastedText.charCount }}
      onShowInTextField={onShowInTextField}
      onRemove={onRemove}
    />
  );
}

export function ComposerFileAttachmentElement({
  file,
  onRemove,
}: {
  file: ComposerFileAttachment;
  onRemove: (fileId: string) => void;
}) {
  return <FileAttachmentChip file={file} variant="card" onRemove={onRemove} />;
}

export function ComposerImageAttachmentElement({
  image,
  images,
  nonPersisted,
  onExpandImage,
  onRemoveImage,
}: {
  image: ComposerImageAttachment;
  images: readonly ComposerImageAttachment[];
  nonPersisted: boolean;
  onExpandImage: (preview: ExpandedImagePreview) => void;
  onRemoveImage: (imageId: string) => void;
}) {
  return (
    <ComposerImageAttachmentChip
      image={image}
      images={images}
      nonPersisted={nonPersisted}
      onExpandImage={onExpandImage}
      onRemoveImage={onRemoveImage}
    />
  );
}
