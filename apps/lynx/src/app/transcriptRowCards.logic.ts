// What the transcript's card rows show: the proposed plan card, a sent
// message's attachments, and a turn's changed files. The row derivations are
// upstream's; these functions hold the presentation rules upstream keeps inside
// its DOM components (`ProposedPlanCard.tsx`, `MessagesTimeline.tsx`).

import {
  buildCollapsedProposedPlanPreviewMarkdown,
  proposedPlanTitle,
  stripDisplayedPlanMarkdown,
} from "@synara-web/proposedPlan";
import { formatBytes } from "@synara/shared/formatBytes";

import { buildRuntimeHttpUrl } from "./localPreview.logic";

const PLAN_COLLAPSE_MIN_CHARS = 900;
const PLAN_COLLAPSE_MIN_LINES = 20;
const PLAN_COLLAPSED_PREVIEW_LINES = 10;

export interface ProposedPlanCardPresentation {
  readonly title: string;
  /** The plan without its title heading (the card header shows that). */
  readonly displayedMarkdown: string;
  /** Long plans start collapsed to this preview; `null` when the plan is short. */
  readonly collapsedPreviewMarkdown: string | null;
}

/** `ProposedPlanCard`'s rules: title, body, and when a plan is long enough to collapse. */
export function resolveProposedPlanCardPresentation(
  planMarkdown: string,
): ProposedPlanCardPresentation {
  const canCollapse =
    planMarkdown.length > PLAN_COLLAPSE_MIN_CHARS ||
    planMarkdown.split("\n").length > PLAN_COLLAPSE_MIN_LINES;
  return {
    title: proposedPlanTitle(planMarkdown) ?? "Proposed plan",
    displayedMarkdown: stripDisplayedPlanMarkdown(planMarkdown),
    collapsedPreviewMarkdown: canCollapse
      ? buildCollapsedProposedPlanPreviewMarkdown(planMarkdown, {
          maxLines: PLAN_COLLAPSED_PREVIEW_LINES,
        })
      : null,
  };
}

interface MessageAttachmentLike {
  readonly type: string;
  readonly id: string;
  readonly name?: string;
  readonly sizeBytes?: number;
}

export interface UserMessageAttachmentsPresentation {
  readonly files: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    readonly sizeLabel: string;
  }>;
  readonly images: ReadonlyArray<{
    readonly id: string;
    readonly name: string;
    /** `null` when the runtime endpoint is unknown; the thumbnail shows a file icon. */
    readonly previewUrl: string | null;
  }>;
}

/**
 * The file pills and image thumbnails above a sent message's bubble. The image
 * address is the server's `/attachments/<id>` route on the runtime endpoint
 * (upstream's `attachmentPreviewRoutePath`); the Web store resolves it against
 * `window.location`, which Lynx does not have.
 */
export function resolveUserMessageAttachments(input: {
  readonly attachments: ReadonlyArray<MessageAttachmentLike> | undefined;
  readonly runtimeSocketUrl: string | null;
}): UserMessageAttachmentsPresentation {
  const attachments = input.attachments ?? [];
  const previewUrl = (attachmentId: string): string | null => {
    if (!input.runtimeSocketUrl) return null;
    try {
      return buildRuntimeHttpUrl({
        wsUrl: input.runtimeSocketUrl,
        path: `/attachments/${encodeURIComponent(attachmentId)}`,
      });
    } catch {
      return null;
    }
  };
  return {
    files: attachments
      .filter((attachment) => attachment.type === "file")
      .map((attachment) => ({
        id: attachment.id,
        name: attachment.name ?? "File",
        sizeLabel: formatBytes(attachment.sizeBytes ?? 0),
      })),
    images: attachments
      .filter((attachment) => attachment.type === "image")
      .map((attachment) => ({
        id: attachment.id,
        name: attachment.name ?? "Image",
        previewUrl: previewUrl(attachment.id),
      })),
  };
}

export interface TurnChangedFilesPresentation {
  readonly label: string;
  readonly additions: number;
  readonly deletions: number;
  readonly files: ReadonlyArray<{
    readonly path: string;
    readonly additions: number;
    readonly deletions: number;
  }>;
}

/** The end-of-turn "Edited N files" card: totals and one row per file, in summary order. */
export function resolveTurnChangedFiles(
  files: ReadonlyArray<{
    readonly path: string;
    readonly additions?: number | undefined;
    readonly deletions?: number | undefined;
  }>,
): TurnChangedFilesPresentation {
  const rows = files.map((file) => ({
    path: file.path,
    additions: file.additions ?? 0,
    deletions: file.deletions ?? 0,
  }));
  return {
    label: `Edited ${rows.length} ${rows.length === 1 ? "file" : "files"}`,
    additions: rows.reduce((sum, file) => sum + file.additions, 0),
    deletions: rows.reduce((sum, file) => sum + file.deletions, 0),
    files: rows,
  };
}
