// FILE: PullRequestDetailTabsCompositionElements.tsx
// Purpose: Browser host elements for shared pull-request detail tabs and capability copy.

import type { ReactNode } from "react";

import {
  CHAT_SURFACE_CHIP_CLASS_NAME,
  CHAT_SURFACE_CONTROL_ACTIVE_CLASS_NAME,
} from "~/components/chat/chatHeaderControls";
import { cn } from "~/lib/utils";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestDetailTabsRootElement(props: ChildrenProps) {
  return (
    <nav className="flex min-w-0 items-center gap-0.5" aria-label="Pull request detail tabs">
      {props.children}
    </nav>
  );
}

export function PullRequestDetailTabElement(props: {
  readonly active: boolean;
  readonly available: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={props.active}
      aria-disabled={!props.available}
      disabled={!props.available}
      onClick={props.onActivate}
      className={cn(
        CHAT_SURFACE_CHIP_CLASS_NAME,
        "inline-flex items-center px-2.5",
        props.active && CHAT_SURFACE_CONTROL_ACTIVE_CLASS_NAME,
      )}
    >
      {props.label}
    </button>
  );
}

export function PullRequestDetailCapabilityElement(props: ChildrenProps) {
  return <p className="text-xs text-muted-foreground">{props.children}</p>;
}
