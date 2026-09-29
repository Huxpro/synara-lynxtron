// FILE: CollapsedWorkComposition.tsx
// Purpose: Physical-shared settled-work disclosure label, order, and chrome.

import type { ReactNode } from "react";

import {
  CollapsedWorkChevronElement,
  CollapsedWorkDisclosureElement,
  CollapsedWorkDividerElement,
  CollapsedWorkLabelElement,
  CollapsedWorkPanelElement,
  CollapsedWorkRootElement,
  CollapsedWorkTriggerElement,
} from "~/components/chat/CollapsedWorkCompositionElements";

export function collapsedWorkLabel(elapsed: string | null | undefined): string {
  return elapsed ? `Worked for ${elapsed}` : "Details";
}

export function CollapsedWorkComposition(props: {
  readonly children: ReactNode;
  readonly elapsed?: string | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
}) {
  const label = collapsedWorkLabel(props.elapsed);
  return (
    <CollapsedWorkRootElement>
      <CollapsedWorkDisclosureElement open={props.open} onOpenChange={props.onOpenChange}>
        <CollapsedWorkTriggerElement
          accessibleLabel={`${props.open ? "Collapse" : "Expand"} ${label}`}
          open={props.open}
          onActivate={() => props.onOpenChange(!props.open)}
        >
          <CollapsedWorkLabelElement>{label}</CollapsedWorkLabelElement>
          <CollapsedWorkChevronElement open={props.open} />
        </CollapsedWorkTriggerElement>
        <CollapsedWorkPanelElement open={props.open}>{props.children}</CollapsedWorkPanelElement>
      </CollapsedWorkDisclosureElement>
      <CollapsedWorkDividerElement />
    </CollapsedWorkRootElement>
  );
}
