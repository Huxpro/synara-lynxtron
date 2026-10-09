// FILE: KanbanOverviewCompositionElements.tsx
// Purpose: Browser host elements for the physical shared project overview.

import type { ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { ChevronRightIcon, PlusIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function KanbanOverviewEmptyRootElement(props: ChildrenProps) {
  return <div className="flex h-full items-center justify-center px-6">{props.children}</div>;
}

export function KanbanOverviewEmptyCopyElement(props: ChildrenProps) {
  return <div className="max-w-sm text-center">{props.children}</div>;
}

export function KanbanOverviewEmptyTitleElement(props: ChildrenProps) {
  return <div className="text-ui font-medium text-foreground/85">{props.children}</div>;
}

export function KanbanOverviewEmptyBodyElement(props: ChildrenProps) {
  return <div className="mt-1 text-ui text-muted-foreground">{props.children}</div>;
}

export function KanbanOverviewProjectsElement(props: ChildrenProps) {
  return (
    <div className="flex h-full min-h-0 gap-4 overflow-x-auto px-4 pb-4">{props.children}</div>
  );
}

export function KanbanOverviewProjectColumnElement(props: ChildrenProps) {
  return <section className="flex w-72 shrink-0 flex-col">{props.children}</section>;
}

export function KanbanOverviewProjectHeaderRootElement(props: ChildrenProps) {
  return <div className="flex shrink-0 items-center gap-1">{props.children}</div>;
}

export function KanbanOverviewProjectHeaderElement(
  props: ChildrenProps & {
    readonly onActivate: () => void;
  },
) {
  return (
    <button
      type="button"
      onClick={props.onActivate}
      className={cn(
        "group/kanban-project flex min-w-0 flex-1 items-center gap-2 rounded-lg px-2 py-1.5 text-left transition-colors",
        "hover:bg-muted/50 focus-visible:ring-1 focus-visible:ring-ring focus-visible:outline-none",
      )}
    >
      {props.children}
    </button>
  );
}

export function KanbanOverviewProjectTitleElement(props: ChildrenProps) {
  return (
    <h2 className="min-w-0 truncate text-ui-lg font-semibold text-foreground/90">
      {props.children}
    </h2>
  );
}

export function KanbanOverviewProjectCountElement(props: ChildrenProps) {
  return <span className="text-ui text-muted-foreground/70">{props.children}</span>;
}

export function KanbanOverviewProjectChevronElement() {
  return (
    <ChevronRightIcon className="ml-auto size-3.5 shrink-0 text-muted-foreground/50 opacity-0 transition-opacity group-hover/kanban-project:opacity-100 group-focus-visible/kanban-project:opacity-100" />
  );
}

export function KanbanOverviewNewTaskElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <Button
      size="icon-xs"
      variant="ghost"
      className="shrink-0 text-muted-foreground/70 hover:text-foreground"
      aria-label={props.label}
      title={props.label}
      onClick={props.onActivate}
    >
      <PlusIcon className="size-3.5" />
    </Button>
  );
}

export function KanbanOverviewCardListElement(props: ChildrenProps) {
  return (
    <ul className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto p-1">{props.children}</ul>
  );
}

export function KanbanOverviewCardItemElement(props: ChildrenProps) {
  return <li className="list-none">{props.children}</li>;
}

export function KanbanOverviewShowMoreElement(props: {
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <button
      type="button"
      onClick={props.onActivate}
      className="w-full rounded-lg px-3 py-1.5 text-center text-ui text-muted-foreground/80 transition-colors hover:bg-muted/40 hover:text-foreground"
    >
      {props.label}
    </button>
  );
}
