// FILE: PullRequestRowCompositionElements.tsx
// Purpose: Browser host elements for the physical shared pull-request row.

import type {
  GitPullRequestMergeability,
  PullRequestActor,
  PullRequestState,
} from "@synara/contracts";
import type { ReactNode } from "react";

import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { PinStatusIcon } from "~/lib/pin";
import { cn } from "~/lib/utils";
import { PullRequestAvatar } from "./PullRequestAvatar";
import { PullRequestDiffStat } from "./PullRequestDiffStat";
import { PullRequestStateGlyph } from "./PullRequestStateGlyph";
import {
  PR_BODY_TEXT_CLASS_NAME,
  PR_FINE_TEXT_CLASS_NAME,
  PR_META_TEXT_CLASS_NAME,
  PR_QUIET_INK_CLASS_NAME,
} from "./pullRequestText";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestRowRootElement(props: ChildrenProps & { readonly selected: boolean }) {
  return (
    <div
      className={cn(
        "group -mx-3 flex w-[calc(100%+1.5rem)] items-stretch rounded-lg text-left transition-colors",
        props.selected
          ? "bg-[var(--color-background-elevated-secondary)]"
          : "hover:bg-[var(--color-background-elevated-secondary)]/70 focus-within:bg-[var(--color-background-elevated-secondary)]/70",
      )}
    >
      {props.children}
    </div>
  );
}

export function PullRequestRowActionElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly projectId: string;
    readonly repository: string;
    readonly number: number;
    readonly selected: boolean;
    readonly onActivate?: (() => void) | undefined;
  },
) {
  return (
    <button
      type="button"
      aria-label={props.accessibleLabel}
      data-pull-request-row
      data-project-id={props.projectId}
      data-repository={props.repository}
      data-pull-request-number={props.number}
      aria-current={props.selected ? "true" : undefined}
      onClick={props.onActivate}
      className="grid min-w-0 flex-1 grid-cols-[auto_minmax(0,1fr)_auto] items-center gap-3 rounded-lg py-1.5 pl-3 pr-1 text-left focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
    >
      {props.children}
    </button>
  );
}

export function PullRequestRowStateElement(props: {
  readonly state: PullRequestState;
  readonly isDraft: boolean;
  readonly mergeability?: GitPullRequestMergeability | undefined;
}) {
  return <PullRequestStateGlyph {...props} size="md" />;
}

export function PullRequestRowCopyElement(props: ChildrenProps) {
  return <span className="min-w-0">{props.children}</span>;
}

export function PullRequestRowTitleElement(props: {
  readonly title: string;
  readonly number: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <Tooltip>
        <TooltipTrigger
          render={
            <span className={cn(PR_BODY_TEXT_CLASS_NAME, "truncate font-medium text-foreground")}>
              {props.title}
            </span>
          }
        />
        <TooltipPopup side="top" className="max-w-80 whitespace-normal leading-tight">
          <p className={PR_META_TEXT_CLASS_NAME}>
            {props.title} <span className="text-muted-foreground">#{props.number}</span>
          </p>
        </TooltipPopup>
      </Tooltip>
    </span>
  );
}

export function PullRequestRowMetaElement(props: ChildrenProps) {
  return (
    <span
      className={cn(
        PR_FINE_TEXT_CLASS_NAME,
        PR_QUIET_INK_CLASS_NAME,
        "mt-0.5 flex min-w-0 items-center gap-1.5",
      )}
    >
      {props.children}
    </span>
  );
}

export function PullRequestRowAuthorElement(props: { readonly actor: PullRequestActor | null }) {
  return <PullRequestAvatar actor={props.actor} size="sm" className="shrink-0" />;
}

export function PullRequestRowMetaSegmentsElement(props: ChildrenProps) {
  return <span className="flex min-w-0 flex-1 items-center gap-1.5">{props.children}</span>;
}

export function PullRequestRowMetaSegmentElement(
  props: ChildrenProps & {
    readonly title?: string | undefined;
    readonly truncateWidth?: string;
    readonly showSeparator: boolean;
  },
) {
  return (
    <>
      {props.showSeparator ? (
        <span aria-hidden className="shrink-0">
          ·
        </span>
      ) : null}
      <span className={cn("truncate", props.truncateWidth)} title={props.title}>
        {props.children}
      </span>
    </>
  );
}

export function PullRequestRowTrailingElement(props: ChildrenProps) {
  return (
    <span
      className={cn(
        PR_FINE_TEXT_CLASS_NAME,
        PR_QUIET_INK_CLASS_NAME,
        "flex shrink-0 flex-col items-end gap-0.5 tabular-nums",
      )}
    >
      {props.children}
    </span>
  );
}

export function PullRequestRowTimeElement(props: ChildrenProps) {
  return <span>{props.children}</span>;
}

export function PullRequestRowDiffElement(props: {
  readonly additions: number;
  readonly deletions: number;
}) {
  return <PullRequestDiffStat additions={props.additions} deletions={props.deletions} />;
}

export function PullRequestRowPinElement(props: {
  readonly label: string;
  readonly pinned: boolean;
  readonly onActivate: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <button
            type="button"
            aria-label={props.label}
            aria-pressed={props.pinned}
            onClick={props.onActivate}
            className={cn(
              "my-auto mr-1 inline-flex size-7 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-[color,opacity] hover:text-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
              props.pinned
                ? "text-foreground opacity-100"
                : "opacity-70 md:opacity-0 md:group-hover:opacity-100 md:group-focus-within:opacity-100",
            )}
          >
            <PinStatusIcon pinned={props.pinned} className="size-3.5" aria-hidden />
          </button>
        }
      />
      <TooltipPopup side="top">{props.label}</TooltipPopup>
    </Tooltip>
  );
}
