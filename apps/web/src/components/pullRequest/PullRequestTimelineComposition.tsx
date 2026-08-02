// Physical shared source for canonical PR timeline projection, ordering and row anatomy.

import type { PullRequestDetail } from "@synara/contracts";

import {
  PullRequestTimelineBodyElement,
  PullRequestTimelineEventElement,
  PullRequestTimelineMarkerElement,
  PullRequestTimelineMetaElement,
  PullRequestTimelineRailElement,
  PullRequestTimelineRootElement,
  PullRequestTimelineTitleElement,
} from "~/components/pullRequest/PullRequestTimelineCompositionElements";
import { formatRelativeTime } from "~/lib/relativeTime";
import { buildPullRequestTimelineEvents } from "./pullRequestDetail.logic";

export function PullRequestTimelineComposition(props: {
  readonly detail: PullRequestDetail;
  readonly nowMs?: number;
}) {
  const events = buildPullRequestTimelineEvents(props.detail);
  return (
    <PullRequestTimelineRootElement>
      <PullRequestTimelineRailElement>
        {events.map((event) => (
          <PullRequestTimelineEventElement key={event.id}>
            <PullRequestTimelineMarkerElement />
            <PullRequestTimelineTitleElement>{event.title}</PullRequestTimelineTitleElement>
            <PullRequestTimelineMetaElement>
              {formatRelativeTime(event.at, props.nowMs)}
            </PullRequestTimelineMetaElement>
            {event.body ? (
              <PullRequestTimelineBodyElement>{event.body}</PullRequestTimelineBodyElement>
            ) : null}
          </PullRequestTimelineEventElement>
        ))}
      </PullRequestTimelineRailElement>
    </PullRequestTimelineRootElement>
  );
}
