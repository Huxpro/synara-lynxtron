import type { ReactNode } from '@lynx-js/react';

import './pull-request-timeline-composition-elements.css';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestTimelineRootElement(props: ChildrenProps) {
  return <view className="SharedPrTimelineRoot">{props.children}</view>;
}

export function PullRequestTimelineRailElement(props: ChildrenProps) {
  return <view className="SharedPrTimelineRail">{props.children}</view>;
}

export function PullRequestTimelineEventElement(props: ChildrenProps) {
  return <view className="SharedPrTimelineEvent">{props.children}</view>;
}

export function PullRequestTimelineMarkerElement() {
  return <view className="SharedPrTimelineMarker" />;
}

export function PullRequestTimelineTitleElement(props: ChildrenProps) {
  return <text className="SharedPrTimelineTitle">{props.children}</text>;
}

export function PullRequestTimelineMetaElement(props: ChildrenProps) {
  return <text className="SharedPrTimelineMeta">{props.children}</text>;
}

export function PullRequestTimelineBodyElement(props: ChildrenProps) {
  return (
    <text className="SharedPrTimelineBody" text-maxline="3">
      {props.children}
    </text>
  );
}
