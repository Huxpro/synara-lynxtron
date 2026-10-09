// FILE: ComposerReferenceAttachmentsComposition.tsx
// Purpose: Own the cross-platform composer reference-attachment ordering and visibility.

import { type PastedTextDraft } from "../../lib/composerPastedText";
import { type FileCommentDraft } from "../../lib/fileComments";
import { type ChatAssistantSelectionAttachment } from "../../types";
import {
  ComposerAssistantSelectionsAttachmentElement,
  ComposerFileAttachmentElement,
  ComposerFileCommentsAttachmentElement,
  ComposerImageAttachmentElement,
  ComposerPastedTextAttachmentElement,
  ComposerReferenceAttachmentsContainerElement,
} from "~/components/chat/ComposerReferenceAttachmentsCompositionElements";

// Attachment shapes come from the platform elements (the `~` alias resolves to
// the Lynx adapter in the Lynx bundle), so each renderer passes its own drafts.
type ComposerImageAttachmentElementProps = Parameters<typeof ComposerImageAttachmentElement>[0];

export interface ComposerReferenceAttachmentsCompositionProps {
  assistantSelections: ReadonlyArray<ChatAssistantSelectionAttachment>;
  fileComments: ReadonlyArray<FileCommentDraft>;
  pastedTexts?: ReadonlyArray<PastedTextDraft> | undefined;
  files: ReadonlyArray<Parameters<typeof ComposerFileAttachmentElement>[0]["file"]>;
  images: ReadonlyArray<ComposerImageAttachmentElementProps["image"]>;
  nonPersistedImageIdSet: ReadonlySet<string>;
  onExpandImage: ComposerImageAttachmentElementProps["onExpandImage"];
  onRemoveAssistantSelections: () => void;
  onRemoveFileComments: () => void;
  onRemovePastedText?: ((pastedTextId: string) => void) | undefined;
  onShowPastedTextInField?: ((pastedTextId: string) => void) | undefined;
  onRemoveFile: (fileId: string) => void;
  onRemoveImage: (imageId: string) => void;
}

export function ComposerReferenceAttachmentsComposition({
  assistantSelections,
  fileComments,
  pastedTexts = [],
  files,
  images,
  nonPersistedImageIdSet,
  onExpandImage,
  onRemoveAssistantSelections,
  onRemoveFileComments,
  onRemovePastedText,
  onShowPastedTextInField,
  onRemoveFile,
  onRemoveImage,
}: ComposerReferenceAttachmentsCompositionProps) {
  if (
    assistantSelections.length === 0 &&
    fileComments.length === 0 &&
    pastedTexts.length === 0 &&
    files.length === 0 &&
    images.length === 0
  ) {
    return null;
  }

  return (
    <ComposerReferenceAttachmentsContainerElement>
      <ComposerAssistantSelectionsAttachmentElement
        selections={assistantSelections}
        onRemove={assistantSelections.length > 0 ? onRemoveAssistantSelections : undefined}
      />
      <ComposerFileCommentsAttachmentElement
        comments={fileComments}
        onRemove={fileComments.length > 0 ? onRemoveFileComments : undefined}
      />
      {pastedTexts.map((pastedText) => (
        <ComposerPastedTextAttachmentElement
          key={pastedText.id}
          pastedText={pastedText}
          onShowInTextField={() => onShowPastedTextInField?.(pastedText.id)}
          onRemove={() => onRemovePastedText?.(pastedText.id)}
        />
      ))}
      {files.map((file) => (
        <ComposerFileAttachmentElement key={file.id} file={file} onRemove={onRemoveFile} />
      ))}
      {images.map((image) => (
        <ComposerImageAttachmentElement
          key={image.id}
          image={image}
          images={images}
          nonPersisted={nonPersistedImageIdSet.has(image.id)}
          onExpandImage={onExpandImage}
          onRemoveImage={onRemoveImage}
        />
      ))}
    </ComposerReferenceAttachmentsContainerElement>
  );
}
