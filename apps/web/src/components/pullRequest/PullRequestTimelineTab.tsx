// FILE: PullRequestTimelineTab.tsx
// Purpose: The Timeline tab of the pull request detail surface — renders the chronological
//          event list (opened, commits, comments/reviews, merged/closed) produced by
//          buildPullRequestTimelineEvents as a simple left-rail timeline.
// Layer: Pull request presentation
// Exports: PullRequestTimelineTab

import type { PullRequestDetail } from "@synara/contracts";
import { PullRequestTimelineComposition } from "./PullRequestTimelineComposition";

export function PullRequestTimelineTab({ detail }: { detail: PullRequestDetail }) {
  return <PullRequestTimelineComposition detail={detail} />;
}
