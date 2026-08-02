// FILE: PanelStateMessageElements.tsx
// Purpose: Web host element for the physically shared centered panel state.

import type { ReactNode } from "react";

import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from "~/components/systemStateSemantics";
import { cn } from "~/lib/utils";

export function PanelStateMessageElement(props: {
  readonly children?: ReactNode;
  readonly density: "comfortable" | "compact";
  readonly fill: "full" | "flex";
  readonly className?: string;
  readonly intent: SystemStateIntent;
  readonly announcement?: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <div
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      aria-label={props.announcement}
      className={cn(
        "flex w-full items-center justify-center text-center",
        props.fill === "full" ? "h-full min-h-0" : "flex-1",
        props.density === "comfortable"
          ? "p-6 text-sm text-muted-foreground"
          : "px-5 text-xs text-muted-foreground/70",
        props.className,
      )}
    >
      {props.children}
    </div>
  );
}
