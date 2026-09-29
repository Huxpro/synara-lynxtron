// FILE: KanbanCardCompositionElements.tsx
// Purpose: Browser host elements for the physical shared kanban-card anatomy.

import { GoRepoForked } from "react-icons/go";
import type { ProviderKind } from "@synara/contracts";
import type { ReactNode } from "react";

import { ProviderIcon } from "../ProviderIcon";
import { PR_STATE_PRESENTATION_ICONS } from "../pullRequest/pullRequestStatePresentation.icons";
import type { PrStatePresentation } from "../pullRequest/pullRequestStatePresentation.logic";
import { PR_FINE_TEXT_CLASS_NAME } from "../pullRequest/pullRequestText";
import type { SidebarStatusPresentation } from "../SidebarStatus.logic";
import { RAISED_SURFACE_CHROME_CLASS_NAME } from "../chat/composerPickerStyles";
import {
  GitBranchIcon,
  LoaderIcon,
  PaperclipIcon,
  PinFilledIcon,
  TerminalIcon,
  WorktreeIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
import { KanbanStatusIcon } from "./KanbanStatusIcon";
import type { KanbanColumnKey } from "./kanban.logic";
import type { KanbanDragPoint } from "./kanbanDnd.logic";

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanCardRootElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly isOverlay: boolean;
    readonly isDragSource: boolean;
    readonly visualState?: "default" | "hover" | "focus" | "pressed";
    readonly onActivate?: () => void;
    readonly onContextMenu?: (event: React.MouseEvent) => void;
    readonly onDragPointerStart?: (point: KanbanDragPoint) => void;
  },
) {
  return (
    <div
      role="button"
      aria-label={props.accessibleLabel}
      tabIndex={props.isOverlay ? -1 : 0}
      onClick={props.onActivate}
      onKeyDown={(event) => {
        if (event.key !== "Enter" && event.key !== " ") return;
        event.preventDefault();
        props.onActivate?.();
      }}
      onContextMenu={props.onContextMenu}
      className={cn(
        "flex w-full cursor-pointer flex-col gap-1.5 rounded-lg bg-card/70 px-3 py-2.5 text-left transition-colors",
        RAISED_SURFACE_CHROME_CLASS_NAME,
        "dark:border dark:border-white/[0.05]",
        "hover:bg-card focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
        (props.visualState === "hover" || props.visualState === "pressed") && "bg-card",
        props.visualState === "focus" && "ring-1 ring-ring outline-none",
        props.isOverlay && "bg-card shadow-lg dark:shadow-lg",
        props.isDragSource && "opacity-40",
        props.visualState !== "default" && `ui-${props.visualState}`,
      )}
    >
      {props.children}
    </div>
  );
}

export function KanbanCardActionsElement(props: {
  readonly label: string;
  readonly onActivate: (event: React.MouseEvent) => void;
}) {
  return (
    <button
      type="button"
      aria-label={props.label}
      title={props.label}
      className="-mr-1 shrink-0 rounded px-1 text-xs text-muted-foreground/70 hover:bg-muted hover:text-foreground focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none"
      onClick={(event) => {
        event.stopPropagation();
        props.onActivate(event);
      }}
    >
      •••
    </button>
  );
}

export function KanbanCardTitleRowElement(props: ChildrenProps) {
  return <span className="flex min-w-0 items-start gap-1.5">{props.children}</span>;
}

export function KanbanCardTitleElement(props: ChildrenProps) {
  return (
    <span className="line-clamp-2 min-w-0 flex-1 text-[13px] leading-snug font-medium text-foreground/90">
      {props.children}
    </span>
  );
}

export function KanbanCardPinElement() {
  return (
    <span title="Pinned" className="flex shrink-0 items-center pt-0.5">
      <PinFilledIcon className="size-3 text-muted-foreground/60" aria-hidden />
    </span>
  );
}

export function KanbanCardDraftPreviewElement(props: ChildrenProps) {
  return (
    <span className="line-clamp-2 text-xs leading-snug text-muted-foreground">
      {props.children}
    </span>
  );
}

export function KanbanCardMetaRowElement(props: ChildrenProps) {
  return <span className="flex min-w-0 items-center gap-2 pt-0.5">{props.children}</span>;
}

export function KanbanCardProviderElement(props: { readonly provider: ProviderKind | null }) {
  return (
    <ProviderIcon
      provider={props.provider}
      className="size-3.5 shrink-0 opacity-80"
      fallback={
        <span className="size-3.5 shrink-0 rounded-full border border-dashed border-muted-foreground/40" />
      }
    />
  );
}

export function KanbanCardBranchElement(props: { readonly label: string }) {
  return (
    <span className="flex min-w-0 items-center gap-1 text-[11px] text-muted-foreground/70">
      <GitBranchIcon className="size-3 shrink-0" aria-hidden />
      <span className="max-w-32 truncate">{props.label}</span>
    </span>
  );
}

export function KanbanCardWorktreeElement(props: { readonly label: string }) {
  return (
    <span title={props.label} className="flex shrink-0 items-center">
      <WorktreeIcon className="size-3 text-muted-foreground/70" aria-hidden />
    </span>
  );
}

export function KanbanCardForkElement() {
  return (
    <span title="Forked thread" className="flex shrink-0 items-center">
      <GoRepoForked className="size-3 text-emerald-600 dark:text-emerald-300/90" aria-hidden />
    </span>
  );
}

export function KanbanCardPullRequestElement(props: {
  readonly number: number;
  readonly title: string;
  readonly presentation: PrStatePresentation;
}) {
  const PrIcon = PR_STATE_PRESENTATION_ICONS[props.presentation.iconKind];
  return (
    <span
      title={`#${props.number} ${props.presentation.label}: ${props.title}`}
      className={cn(
        PR_FINE_TEXT_CLASS_NAME,
        "flex shrink-0 items-center gap-0.5",
        props.presentation.colorClass,
      )}
    >
      <PrIcon className="size-3 shrink-0" aria-hidden />#{props.number}
    </span>
  );
}

export function KanbanCardAttachmentElement() {
  return <PaperclipIcon className="size-3 shrink-0 text-muted-foreground/70" aria-hidden />;
}

export function KanbanCardTrailingElement(props: ChildrenProps) {
  return <span className="ml-auto flex min-w-0 shrink-0 items-center gap-2">{props.children}</span>;
}

export function KanbanCardOptimisticStatusElement(props: { readonly elapsed: string | null }) {
  return (
    <>
      <span className="flex shrink-0 items-center gap-1.5 text-[11px] text-sky-600 dark:text-sky-300/90">
        <LoaderIcon className="size-3 shrink-0 animate-spin" aria-hidden />
        Starting…
      </span>
      {props.elapsed ? (
        <span className="shrink-0 text-[11px] text-muted-foreground/70">
          Worked for {props.elapsed}
        </span>
      ) : null}
    </>
  );
}

export function KanbanCardStatusPillElement(props: { readonly pill: SidebarStatusPresentation }) {
  return (
    <span className={cn("flex min-w-0 items-center gap-1.5 text-[11px]", props.pill.colorClass)}>
      <span
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          props.pill.dotClass,
          props.pill.pulse ? "animate-pulse" : "",
        )}
      />
      <span className="truncate">{props.pill.label}</span>
    </span>
  );
}

export function KanbanCardTimestampElement(props: { readonly label: string }) {
  return <span className="shrink-0 text-[11px] text-muted-foreground/70">{props.label}</span>;
}

export function KanbanCardColumnStatusElement(props: {
  readonly column: KanbanColumnKey;
  readonly label: string;
  readonly isTerminal: boolean;
}) {
  return (
    <span className="flex shrink-0 items-center gap-1 text-[11px] text-muted-foreground/80">
      {props.isTerminal ? (
        <TerminalIcon className="size-3 shrink-0" aria-hidden />
      ) : (
        <KanbanStatusIcon column={props.column} className="size-3" />
      )}
      {props.label}
    </span>
  );
}
