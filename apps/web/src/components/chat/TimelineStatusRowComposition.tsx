// FILE: TimelineStatusRowComposition.tsx
// Purpose: Physical shared source for compact system/tool/status transcript rows.

import type { ReactNode } from "react";

import {
  TimelineStatusRowIconElement,
  TimelineStatusRowLabelElement,
  TimelineStatusRowRootElement,
} from "~/components/chat/TimelineStatusRowCompositionElements";

export type TimelineStatusTone = "thinking" | "tool" | "info" | "error";

export function TimelineStatusRowComposition(props: {
  readonly compact?: boolean;
  readonly displayText: string;
  readonly fontSizePx: number;
  readonly icon?: ReactNode;
  readonly statusOnly?: boolean;
  readonly tone: TimelineStatusTone;
}) {
  const statusOnly = props.statusOnly ?? false;
  return (
    <TimelineStatusRowRootElement compact={props.compact ?? false} tone={props.tone}>
      {!statusOnly && props.icon ? (
        <TimelineStatusRowIconElement compact={props.compact ?? false} tone={props.tone}>
          {props.icon}
        </TimelineStatusRowIconElement>
      ) : null}
      <TimelineStatusRowLabelElement
        compact={props.compact ?? false}
        displayText={props.displayText}
        fontSizePx={props.fontSizePx}
        statusOnly={statusOnly}
        tone={props.tone}
      />
    </TimelineStatusRowRootElement>
  );
}
