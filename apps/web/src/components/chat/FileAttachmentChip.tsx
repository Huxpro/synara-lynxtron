// FILE: FileAttachmentChip.tsx
// Purpose: Renders generic file attachments as compact pills or composer cards.
// Layer: Chat attachment presentation
// Depends on: shared byte formatting, chat attachment types, and compact chip styles.

import { formatBytes } from "@synara/shared/formatBytes";
import { fileAttachmentTypeLabel } from "@synara/shared/fileAttachmentPresentation";

import { FileIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { type ChatFileAttachment } from "../../types";
import { COMPOSER_ATTACHMENT_CHIP_CLASS_NAME } from "../composerInlineChip";
import { Tooltip, TooltipPopup, TooltipTrigger } from "../ui/tooltip";
import { AttachmentCard } from "./AttachmentCard";
import { AttachmentRemoveButton } from "./AttachmentRemoveButton";
import {
  DRAFT_ATTACHMENT_WARNING_DESCRIPTION,
  DraftAttachmentWarningIcon,
} from "./DraftAttachmentWarning";
import { FileEntryIcon } from "./FileEntryIcon";

type FileAttachmentChipVariant = "pill" | "card";

interface FileAttachmentChipProps {
  file: ChatFileAttachment;
  onRemove?: ((fileId: string) => void) | undefined;
  className?: string;
  nonPersisted?: boolean;
  variant?: FileAttachmentChipVariant;
}

function fileAttachmentDetail(file: ChatFileAttachment): string {
  const mimeType = file.mimeType.trim() || "Unknown type";
  return `${mimeType} - ${formatBytes(file.sizeBytes)}`;
}

function FileAttachmentPillTrigger({
  file,
  onRemove,
  className,
  nonPersisted,
}: {
  file: ChatFileAttachment;
  onRemove?: ((fileId: string) => void) | undefined;
  className?: string | undefined;
  nonPersisted: boolean;
}) {
  return (
    <span
      className={cn(
        "group relative",
        COMPOSER_ATTACHMENT_CHIP_CLASS_NAME,
        onRemove ? "pr-6" : "",
        className,
      )}
    >
      <span className="inline-flex h-7 min-w-0 max-w-[16rem] items-center gap-1.5 rounded-full pl-2 pr-2">
        <FileIcon className="size-3.5 shrink-0 text-muted-foreground/90" />
        <span className="min-w-0 truncate">{file.name}</span>
        <span className="shrink-0 text-muted-foreground/70">{formatBytes(file.sizeBytes)}</span>
        {nonPersisted ? <DraftAttachmentWarningIcon /> : null}
      </span>
      {onRemove ? (
        <AttachmentRemoveButton
          size="sm"
          placement="center-right"
          label={`Remove ${file.name}`}
          onRemove={() => onRemove(file.id)}
        />
      ) : null}
    </span>
  );
}

export function FileAttachmentChip({
  file,
  onRemove,
  className,
  nonPersisted = false,
  variant = "pill",
}: FileAttachmentChipProps) {
  const detail = fileAttachmentDetail(file);
  const typeLabel = fileAttachmentTypeLabel(file);
  const trigger =
    variant === "card" ? (
      <AttachmentCard
        className={className}
        icon={
          <FileEntryIcon
            pathValue={file.name}
            mimeType={file.mimeType}
            kind="file"
            // Attachment cards keep a calm, uniform glyph: the shared icon tint,
            // not the per-type colors used in the diff/editor file lists.
            colorMode="inherit"
            className="size-5"
          />
        }
        title={file.name}
        subtitle={
          <>
            <span className="truncate uppercase">{typeLabel}</span>
            {nonPersisted ? <DraftAttachmentWarningIcon /> : null}
          </>
        }
        onRemove={onRemove ? () => onRemove(file.id) : undefined}
        removeLabel={`Remove ${file.name}`}
      />
    ) : (
      <FileAttachmentPillTrigger
        file={file}
        onRemove={onRemove}
        className={className}
        nonPersisted={nonPersisted}
      />
    );

  return (
    <Tooltip>
      <TooltipTrigger render={trigger} />
      <TooltipPopup side="top" className="max-w-80 whitespace-normal leading-tight">
        <div className="space-y-1">
          <p className="text-xs font-medium text-foreground">{file.name}</p>
          <p className="text-[0.6875rem] text-muted-foreground">{detail}</p>
          {nonPersisted ? (
            <p className="text-[0.6875rem] text-amber-600">
              {DRAFT_ATTACHMENT_WARNING_DESCRIPTION}
            </p>
          ) : null}
        </div>
      </TooltipPopup>
    </Tooltip>
  );
}
