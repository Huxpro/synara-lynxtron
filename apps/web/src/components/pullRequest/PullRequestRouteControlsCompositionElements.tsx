// FILE: PullRequestRouteControlsCompositionElements.tsx
// Purpose: Browser host elements for the shared pull-request header and filters.

import type { ProjectId } from "@synara/contracts";
import type { ReactNode } from "react";

import {
  CHAT_SURFACE_HEADER_DIVIDER_CLASS_NAME,
  CHAT_SURFACE_HEADER_HEIGHT_CLASS,
  CHAT_SURFACE_HEADER_PADDING_X_CLASS,
} from "~/components/chat/chatHeaderControls";
import { PullRequestFilterPillGroup, PullRequestProjectFilterPopover } from "./PullRequestListFilters";
import { SidebarHeaderNavigationControls } from "~/components/SidebarHeaderNavigationControls";
import { Button } from "~/components/ui/button";
import { SearchInput } from "~/components/ui/search-input";
import { RefreshCwIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestRouteHeaderRootElement(
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

export function PullRequestRouteHeaderRowElement(props: ChildrenProps) {
  return <div className={cn("flex items-center gap-2", CHAT_SURFACE_HEADER_HEIGHT_CLASS)}>{props.children}</div>;
}

export function PullRequestRouteHeaderNavigationElement() {
  return <SidebarHeaderNavigationControls />;
}

export function PullRequestRouteHeaderTitleElement(props: ChildrenProps) {
  return <h1 className="truncate font-heading text-sm font-medium">{props.children}</h1>;
}

export function PullRequestRouteHeaderScopeElement(props: ChildrenProps) {
  return (
    <>
      <span aria-hidden className="text-muted-foreground/50">
        ·
      </span>
      <span className="truncate text-xs text-muted-foreground">{props.children}</span>
    </>
  );
}

export function PullRequestRouteHeaderSpacerElement() {
  return <div className="min-w-0 flex-1" />;
}

export function PullRequestRouteHeaderRefreshElement(props: {
  readonly disabled: boolean;
  readonly refreshing: boolean;
  readonly title: string;
  readonly onActivate: () => void;
}) {
  return (
    <Button
      size="icon-sm"
      variant="ghost"
      aria-label="Refresh pull requests"
      title={props.title}
      disabled={props.disabled}
      onClick={props.onActivate}
    >
      <RefreshCwIcon className={cn("size-4", props.refreshing && "animate-spin")} />
    </Button>
  );
}

export function PullRequestFiltersRootElement(props: ChildrenProps) {
  return <div className="flex flex-col gap-3">{props.children}</div>;
}

export function PullRequestFiltersPillRowElement(props: ChildrenProps) {
  return <div className="flex flex-wrap items-center gap-2">{props.children}</div>;
}

export function PullRequestFilterPillGroupElement<T extends string>(props: {
  readonly value: T;
  readonly options: ReadonlyArray<{ readonly value: T; readonly label: string }>;
  readonly onChange: (value: T) => void;
  readonly onIntent?: ((value: T) => void) | undefined;
}) {
  return <PullRequestFilterPillGroup {...props} />;
}

export function PullRequestFiltersSearchRowElement(props: ChildrenProps) {
  return <div className="flex items-center gap-2">{props.children}</div>;
}

export function PullRequestSearchElement(props: {
  readonly value: string;
  readonly placeholder: string;
  readonly onChange: (value: string) => void;
}) {
  return (
    <div className="min-w-0 flex-1">
      <SearchInput
        placeholder={props.placeholder}
        value={props.value}
        onChange={(event) => props.onChange(event.target.value)}
      />
    </div>
  );
}

export function PullRequestSearchUnavailableElement(props: ChildrenProps) {
  return <div className="min-w-0 flex-1 text-xs text-muted-foreground">{props.children}</div>;
}

export function PullRequestProjectFilterElement(props: {
  readonly projects: ReadonlyArray<readonly [ProjectId, string]>;
  readonly value: ProjectId | undefined;
  readonly onChange: (value: ProjectId | undefined) => void;
}) {
  return <PullRequestProjectFilterPopover {...props} />;
}
