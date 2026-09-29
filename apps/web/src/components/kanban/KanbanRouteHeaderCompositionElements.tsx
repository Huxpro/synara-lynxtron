// FILE: KanbanRouteHeaderCompositionElements.tsx
// Purpose: Browser host elements for the shared Kanban route header.

import type { ReactNode } from "react";

import { SidebarHeaderNavigationControls } from "~/components/SidebarHeaderNavigationControls";
import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "~/components/chat/chatHeaderControls";
import { Button } from "~/components/ui/button";
import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { Tooltip, TooltipPopup, TooltipTrigger } from "~/components/ui/tooltip";
import { ArrowLeftIcon, PlusIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

type ChildrenProps = { readonly children?: ReactNode };

export function KanbanRouteHeaderRootElement(
  props: ChildrenProps & { readonly hostClassName?: string | undefined },
) {
  return (
    <header
      className={cn(
        CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
        CHAT_SURFACE_HEADER_PADDING_X_CLASS,
        "drag-region",
        props.hostClassName,
      )}
    >
      {props.children}
    </header>
  );
}

export function KanbanRouteHeaderRowElement(props: ChildrenProps) {
  return (
    <div className={cn("flex items-center gap-2 sm:gap-3", CHAT_SURFACE_HEADER_HEIGHT_CLASS)}>
      {props.children}
    </div>
  );
}

export function KanbanRouteHeaderNavigationElement() {
  return <SidebarHeaderNavigationControls />;
}

export function KanbanRouteHeaderBackElement(props: { readonly onActivate: () => void }) {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      onClick={props.onActivate}
      aria-label="Back to all projects"
    >
      <ArrowLeftIcon className="size-3.5" />
    </Button>
  );
}

export function KanbanRouteHeaderTitleElement(props: ChildrenProps) {
  return (
    <h2 className="max-w-[clamp(16rem,50vw,40rem)] truncate text-sm font-medium text-foreground">
      {props.children}
    </h2>
  );
}

export function KanbanRouteHeaderCountElement(props: ChildrenProps) {
  return <span className="shrink-0 text-xs text-muted-foreground/70">{props.children}</span>;
}

export function KanbanRouteHeaderSpacerElement() {
  return <div className="min-w-0 flex-1" />;
}

export function KanbanRouteHeaderNewTaskElement(props: {
  readonly disabled: boolean;
  readonly shortcutParts: readonly string[];
  readonly onActivate: () => void;
}) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            size="sm"
            variant="chrome"
            className="shrink-0 gap-1.5"
            disabled={props.disabled}
            onClick={props.onActivate}
          >
            <PlusIcon className="size-3.5" />
            New task
          </Button>
        }
      />
      <TooltipPopup side="bottom">
        <span className="flex items-center gap-2">
          New task
          <KbdGroup>
            {props.shortcutParts.map((part) => (
              <Kbd key={part}>{part}</Kbd>
            ))}
          </KbdGroup>
        </span>
      </TooltipPopup>
    </Tooltip>
  );
}
