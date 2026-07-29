// FILE: PanelStateMessage.tsx
// Purpose: Centered muted "empty / unavailable / hint" text shared by dock panes
//          (GitPanel, DiffPanel, right-dock placeholders) so the repeated
//          flex-center + muted-foreground block lives in one place.
// Layer: Chat/panel UI primitives
// Note: For skeleton/loading states with aria-live semantics use DiffPanelLoadingState;
//       this is the plain text-only state block.

import { type ReactNode } from "react";

import { PanelStateMessageElement } from "~/components/chat/PanelStateMessageElements";

// `comfortable` matches the larger pane placeholders (text-sm, p-6); `compact`
// matches dense in-panel hints (text-xs, dimmer). `fill` chooses between filling
// a fixed-height parent (`full`) or flexing within a column (`flex`).
export function PanelStateMessage(props: {
  children: ReactNode;
  density?: "comfortable" | "compact";
  fill?: "full" | "flex";
  className?: string;
}) {
  const density = props.density ?? "comfortable";
  const fill = props.fill ?? "full";
  return (
    <PanelStateMessageElement
      density={density}
      fill={fill}
      className={props.className}
    >
      {props.children}
    </PanelStateMessageElement>
  );
}
