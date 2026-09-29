import { type ReactNode } from "@lynx-js/react";

import { formatPastedTextCountLabel, pastedTextTitle } from "@synara-web/lib/composerPastedText";
import { fileAttachmentTypeLabel } from "@synara/shared/fileAttachmentPresentation";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import {
  ChevronRightIcon,
  CircleAlertIcon,
  FileIcon,
  MessageCircleIcon,
  XIcon,
} from "../lib/icons.lynx";
import {
  lynxNestedInteractiveEventProps,
  useLynxInteractiveState,
} from "./useLynxInteractiveState";
import { useTheme } from "./useTheme.lynx";

interface SummaryEntry {
  readonly id?: string;
}

interface FileCommentEntry {
  readonly text: string;
}

interface PastedTextEntry {
  readonly charCount: number;
  readonly id: string;
  readonly lineCount: number;
  readonly text: string;
}

interface FileEntry {
  readonly id: string;
  readonly mimeType: string;
  readonly name: string;
  readonly sizeBytes: number;
}

interface ImageEntry {
  readonly id: string;
  readonly name: string;
  readonly previewUrl: string;
}

function ComposerReferenceRemoveButton(props: {
  readonly label: string;
  readonly onRemove: () => void;
  readonly tone?: "solid" | "ghost";
}) {
  const { semanticIconColor, svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerReferenceRemoveLynx ComposerReferenceRemoveLynx--${
      props.tone ?? "solid"
    }`,
    accessibleLabel: props.label,
    onActivate: props.onRemove,
  });
  const eventProps = lynxNestedInteractiveEventProps(interaction.eventProps);
  return (
    <view className={interaction.className} {...eventProps}>
      <XIcon
        className="ComposerReferenceRemoveIconLynx"
        color={props.tone === "ghost" ? semanticIconColor("tertiary") : svgColors.surface}
        size={12}
      />
    </view>
  );
}

export function ComposerReferenceAttachmentsContainerElement({
  children,
}: {
  readonly children?: ReactNode;
}) {
  return <view className="ComposerReferenceAttachmentsLynx">{children}</view>;
}

export function ComposerAssistantSelectionsAttachmentElement({
  selections,
  onRemove,
}: {
  readonly selections: ReadonlyArray<SummaryEntry>;
  readonly onRemove?: (() => void) | undefined;
}) {
  const { semanticIconColor } = useTheme();
  if (selections.length === 0) return null;
  const label = `${selections.length} selection${selections.length === 1 ? "" : "s"}`;
  return (
    <view className="ComposerReferenceSummaryLynx">
      <MessageCircleIcon
        className="ComposerReferenceGlyphLynx"
        color={semanticIconColor("secondary")}
        size={12}
      />
      <text className="ComposerReferenceLabelLynx">{label}</text>
      {onRemove ? (
        <ComposerReferenceRemoveButton label="Remove selections" onRemove={onRemove} tone="ghost" />
      ) : null}
    </view>
  );
}

export function ComposerFileCommentsAttachmentElement({
  comments,
  onRemove,
}: {
  readonly comments: ReadonlyArray<FileCommentEntry>;
  readonly onRemove?: (() => void) | undefined;
}) {
  const { semanticIconColor } = useTheme();
  if (comments.length === 0) return null;
  const label = `${comments.length} comment${comments.length === 1 ? "" : "s"}`;
  return (
    <view className="ComposerReferenceSummaryLynx">
      <MessageCircleIcon
        className="ComposerReferenceGlyphLynx"
        color={semanticIconColor("secondary")}
        size={12}
      />
      <text className="ComposerReferenceLabelLynx">{label}</text>
      {onRemove ? (
        <ComposerReferenceRemoveButton label="Remove comments" onRemove={onRemove} tone="ghost" />
      ) : null}
    </view>
  );
}

export function ComposerPastedTextAttachmentElement({
  pastedText,
  onShowInTextField,
  onRemove,
}: {
  readonly pastedText: PastedTextEntry;
  readonly onShowInTextField: () => void;
  readonly onRemove: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const title = pastedTextTitle(pastedText.text);
  const showInteraction = useLynxInteractiveState({
    baseClassName: "ComposerReferenceCardActionLynx",
    accessibleLabel: `Show ${title} in text field`,
    onActivate: onShowInTextField,
  });
  return (
    <view className="ComposerReferenceCardLynx ComposerReferencePastedTextLynx">
      <view className="ComposerReferenceTileLynx">
        <FileIcon
          className="ComposerReferenceTileIconLynx"
          color={semanticIconColor("secondary")}
          size={16}
        />
      </view>
      <view className="ComposerReferenceCardCopyLynx">
        <text className="ComposerReferenceCardTitleLynx">{title}</text>
        <view className={showInteraction.className} {...showInteraction.eventProps}>
          <text className="ComposerReferenceCardActionTextLynx">
            Show in text field · {formatPastedTextCountLabel(pastedText)}
          </text>
          <ChevronRightIcon
            className="ComposerReferenceActionChevronLynx"
            color={semanticIconColor("secondary")}
            size={10}
          />
        </view>
      </view>
      <ComposerReferenceRemoveButton
        label={`Remove pasted text (${formatPastedTextCountLabel(pastedText)})`}
        onRemove={onRemove}
      />
    </view>
  );
}

export function ComposerFileAttachmentElement({
  file,
  onRemove,
}: {
  readonly file: FileEntry;
  readonly onRemove: (fileId: string) => void;
}) {
  return (
    <view className="ComposerReferenceCardLynx">
      <view className="ComposerReferenceTileLynx">
        <FileEntryIcon
          className="ComposerReferenceTileIconLynx"
          colorMode="inherit"
          kind="file"
          mimeType={file.mimeType}
          pathValue={file.name}
        />
      </view>
      <view className="ComposerReferenceCardCopyLynx">
        <text className="ComposerReferenceCardTitleLynx">{file.name}</text>
        <text className="ComposerReferenceCardMetaLynx">{fileAttachmentTypeLabel(file)}</text>
      </view>
      <ComposerReferenceRemoveButton
        label={`Remove ${file.name}`}
        onRemove={() => onRemove(file.id)}
      />
    </view>
  );
}

export function ComposerImageAttachmentElement({
  image,
  images,
  nonPersisted,
  onExpandImage,
  onRemoveImage,
}: {
  readonly image: ImageEntry;
  readonly images: ReadonlyArray<ImageEntry>;
  readonly nonPersisted: boolean;
  readonly onExpandImage: (preview: {
    readonly images: ReadonlyArray<{ readonly src: string; readonly name: string }>;
    readonly index: number;
  }) => void;
  readonly onRemoveImage: (imageId: string) => void;
}) {
  const { svgColors } = useTheme();
  function expandImage() {
    "background only";
    const previewableImages = images.filter((entry) => entry.previewUrl.length > 0);
    const index = previewableImages.findIndex((entry) => entry.id === image.id);
    if (index < 0) return;
    onExpandImage({
      images: previewableImages.map((entry) => ({
        src: entry.previewUrl,
        name: entry.name,
      })),
      index,
    });
  }
  const previewInteraction = useLynxInteractiveState({
    baseClassName: "ComposerReferenceImageLynx",
    accessibleLabel: `Preview ${image.name}`,
    onActivate: expandImage,
  });

  return (
    <view className={previewInteraction.className} {...previewInteraction.eventProps}>
      {image.previewUrl ? (
        <image
          className="ComposerReferenceImagePreviewLynx"
          src={image.previewUrl}
          mode="aspectFill"
          accessibility-element={false}
        />
      ) : (
        <text className="ComposerReferenceImageFallbackLynx">IMG</text>
      )}
      {nonPersisted ? (
        <view
          className="ComposerReferenceImageWarningLynx"
          accessibility-element={true}
          accessibility-label="Draft attachment may not persist"
        >
          <CircleAlertIcon
            className="ComposerReferenceImageWarningIconLynx"
            color={svgColors.warning}
            size={12}
          />
        </view>
      ) : null}
      <ComposerReferenceRemoveButton
        label={`Remove ${image.name}`}
        onRemove={() => onRemoveImage(image.id)}
      />
    </view>
  );
}
