// FILE: CollapsedWorkCompositionElements.tsx
// Purpose: Browser disclosure primitives for the shared collapsed-work chrome.

import type { ReactNode } from "react";

import { DisclosureChevron } from "../ui/DisclosureChevron";
import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "../ui/collapsible";
import { disclosureContentClassName } from "~/platform/motion";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function CollapsedWorkRootElement(props: ChildrenProps) {
  return <div className="mb-3">{props.children}</div>;
}

export function CollapsedWorkDisclosureElement(
  props: ChildrenProps & {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
  },
) {
  return (
    <Collapsible
      className="group/collapsed-work"
      open={props.open}
      onOpenChange={props.onOpenChange}
    >
      {props.children}
    </Collapsible>
  );
}

export function CollapsedWorkTriggerElement(
  props: ChildrenProps & {
    readonly accessibleLabel: string;
    readonly open: boolean;
    readonly onActivate: () => void;
  },
) {
  return (
    <CollapsibleTrigger
      aria-label={props.accessibleLabel}
      className="-ml-0.5 inline-flex items-center gap-1 pb-2 text-left text-muted-foreground/70 transition-colors duration-200 hover:text-muted-foreground/90"
    >
      {props.children}
    </CollapsibleTrigger>
  );
}

export function CollapsedWorkLabelElement(props: ChildrenProps) {
  return <span>{props.children}</span>;
}

export function CollapsedWorkChevronElement(props: { readonly open: boolean }) {
  return <DisclosureChevron open={props.open} className="text-muted-foreground/55" />;
}

export function CollapsedWorkPanelElement(props: ChildrenProps & { readonly open: boolean }) {
  return (
    <CollapsiblePanel>
      <div className={disclosureContentClassName(props.open, "mb-2.5 space-y-1.5")}>
        {props.children}
      </div>
    </CollapsiblePanel>
  );
}

export function CollapsedWorkDividerElement() {
  return <div className="h-px w-full bg-border" />;
}
