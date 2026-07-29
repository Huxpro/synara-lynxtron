// FILE: TimelineStatusRowCompositionElements.tsx
// Purpose: Web host elements for shared system/tool/status transcript rows.

import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import type { TimelineStatusTone } from "./TimelineStatusRowComposition";

const TONE_CLASS: Record<TimelineStatusTone, string> = {
  thinking: "text-muted-foreground/45",
  tool: "text-muted-foreground/55",
  info: "text-muted-foreground/60",
  error: "text-destructive/80",
};

export function TimelineStatusRowRootElement(props: {
  readonly compact: boolean;
  readonly children?: ReactNode;
  readonly tone: TimelineStatusTone;
}) {
  return (
    <div
      className={cn(
        "flex min-w-0 w-full items-center text-left",
        props.compact ? "gap-1.5" : "gap-2",
        TONE_CLASS[props.tone],
      )}
    >
      {props.children}
    </div>
  );
}

export function TimelineStatusRowIconElement(props: {
  readonly compact: boolean;
  readonly children?: ReactNode;
  readonly tone: TimelineStatusTone;
}) {
  return (
    <span
      className={cn(
        "flex shrink-0 items-center justify-center",
        props.compact ? "size-4" : "size-5",
        TONE_CLASS[props.tone],
      )}
    >
      {props.children}
    </span>
  );
}

export function TimelineStatusRowLabelElement(props: {
  readonly compact: boolean;
  readonly displayText: string;
  readonly fontSizePx: number;
  readonly statusOnly: boolean;
  readonly tone: TimelineStatusTone;
}) {
  return (
    <p
      className={cn(
        "min-w-0 truncate",
        props.compact ? "leading-5" : "leading-6",
        props.statusOnly ? "font-normal" : "font-medium",
        TONE_CLASS[props.tone],
      )}
      data-codex-status-row={props.statusOnly ? "true" : undefined}
      style={{ fontSize: `${props.fontSizePx}px` }}
    >
      <span data-work-entry-display-text="true">{props.displayText}</span>
    </p>
  );
}
