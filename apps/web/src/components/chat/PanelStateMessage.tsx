// FILE: PanelStateMessage.tsx
// Purpose: Centered muted "empty / unavailable / hint" text shared by dock panes
//          (GitPanel, DiffPanel, right-dock placeholders) so the repeated
//          flex-center + muted-foreground block lives in one place.
// Layer: Chat/panel UI primitives
// Note: The default remains a silent plain hint. Callers opt into the shared
//       status/alert/empty contract only for meaningful state transitions.

import { type ReactNode } from "react";

import { PanelStateMessageElement } from "~/components/chat/PanelStateMessageElements";
import type { SystemStateIntent } from "~/components/systemStateSemantics";

// `comfortable` matches the larger pane placeholders (text-sm, p-6); `compact`
// matches dense in-panel hints (text-xs, dimmer). `fill` chooses between filling
// a fixed-height parent (`full`) or flexing within a column (`flex`).
export function PanelStateMessage(props: {
  children: ReactNode;
  density?: "comfortable" | "compact";
  fill?: "full" | "flex";
  className?: string;
  intent?: SystemStateIntent;
  announcement?: string;
}) {
  const density = props.density ?? "comfortable";
  const fill = props.fill ?? "full";
  return (
    <PanelStateMessageElement
      density={density}
      fill={fill}
      className={props.className}
      intent={props.intent ?? "plain"}
      announcement={props.announcement}
    >
      {props.children}
    </PanelStateMessageElement>
  );
}
