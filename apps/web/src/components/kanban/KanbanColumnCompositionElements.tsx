// FILE: KanbanColumnCompositionElements.tsx
// Purpose: Browser host elements for the physical shared read-only column.

import type { ReactNode } from "react";

import { Button } from "~/components/ui/button";
import { PlusIcon } from "~/lib/icons";
import type { KanbanColumnKey } from "./kanban.logic";
import { KanbanStatusIcon } from "./KanbanStatusIcon";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function KanbanColumnRootElement(props: ChildrenProps) {
  return <section className="flex min-h-0 min-w-64 flex-1 flex-col">{props.children}</section>;
}

export function KanbanColumnHeaderElement(props: ChildrenProps) {
  return <header className="flex shrink-0 items-center gap-2 px-1.5 pb-2">{props.children}</header>;
}

export function KanbanColumnTitleElement(props: ChildrenProps) {
  return <h3 className="text-ui-lg font-medium text-foreground/90">{props.children}</h3>;
}

export function KanbanColumnCountElement(props: ChildrenProps) {
  return <span className="text-ui text-muted-foreground/70">{props.children}</span>;
}

export function KanbanColumnHeaderActionsElement(props: ChildrenProps) {
  return <span className="ml-auto flex shrink-0 items-center gap-1.5">{props.children}</span>;
}

export function KanbanColumnDispatchTargetElement(props: ChildrenProps) {
  return <span className="text-ui-sm text-sky-600 dark:text-sky-300/90">{props.children}</span>;
}

export function KanbanColumnNewCardElement(props: {
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

export function KanbanColumnStatusElement(props: { readonly column: KanbanColumnKey }) {
  return <KanbanStatusIcon column={props.column} />;
}

export function KanbanColumnCardListElement(props: ChildrenProps) {
  return (
    <ul className="flex min-h-24 flex-1 flex-col gap-2 overflow-y-auto rounded-xl p-1 transition-colors">
      {props.children}
    </ul>
  );
}

export function KanbanColumnCardItemElement(props: ChildrenProps) {
  return <li className="list-none">{props.children}</li>;
}

export function KanbanColumnEmptyElement(props: ChildrenProps) {
  return (
    <li className="list-none rounded-lg border border-dashed border-border/60 px-3 py-4 text-center text-ui text-muted-foreground/60">
      {props.children}
    </li>
  );
}

export function KanbanColumnShowMoreElement(props: {
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
