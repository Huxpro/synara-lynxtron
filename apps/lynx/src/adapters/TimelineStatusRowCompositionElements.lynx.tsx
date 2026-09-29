import type { ReactNode } from "@lynx-js/react";

import type { TimelineStatusTone } from "@synara-web/components/chat/TimelineStatusRowComposition";
import "./timeline-status-row-composition-elements.css";

function toneClass(tone: TimelineStatusTone): string {
  return ` SharedTimelineStatusRow--${tone}`;
}

export function TimelineStatusRowRootElement(props: {
  readonly compact: boolean;
  readonly children?: ReactNode;
  readonly tone: TimelineStatusTone;
}) {
  return (
    <view
      className={`SharedTimelineStatusRow${
        props.compact ? " SharedTimelineStatusRow--compact" : ""
      }${toneClass(props.tone)}`}
    >
      {props.children}
    </view>
  );
}

export function TimelineStatusRowIconElement(props: {
  readonly compact: boolean;
  readonly children?: ReactNode;
  readonly tone: TimelineStatusTone;
}) {
  return <view className="SharedTimelineStatusRowIcon">{props.children}</view>;
}

export function TimelineStatusRowLabelElement(props: {
  readonly compact: boolean;
  readonly displayText: string;
  readonly fontSizePx: number;
  readonly statusOnly: boolean;
  readonly tone: TimelineStatusTone;
}) {
  return (
    <text
      className={`SharedTimelineStatusRowLabel${toneClass(props.tone)}`}
      maxlines={1}
      style={{ fontSize: `${props.fontSizePx}px` }}
    >
      {props.displayText}
    </text>
  );
}
