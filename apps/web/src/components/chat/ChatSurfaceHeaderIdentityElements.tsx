// FILE: ChatSurfaceHeaderIdentityElements.tsx
// Purpose: Web host elements beneath the shared chat-header identity.

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";

export function ChatSurfaceHeaderIdentityRootElement(props: {
  readonly highlighted: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2",
        props.highlighted && "rounded-lg bg-secondary py-1 pl-2 pr-1 text-secondary-foreground",
      )}
    >
      {props.children}
    </div>
  );
}

export function ChatSurfaceHeaderIdentityIconElement(props: {
  readonly title?: string;
  readonly children?: ReactNode;
}) {
  return (
    <span className="inline-flex size-3.5 shrink-0 items-center justify-center" title={props.title}>
      {props.children}
    </span>
  );
}

export function ChatSurfaceHeaderIdentityTitleElement(props: {
  readonly title: string;
  readonly displayTitle?: string;
  readonly onRename?: () => void;
}) {
  return (
    <h2
      className="max-w-[clamp(12rem,42vw,36rem)] truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal text-foreground"
      title={props.title}
      onDoubleClick={props.onRename}
    >
      {props.displayTitle ?? props.title}
    </h2>
  );
}
