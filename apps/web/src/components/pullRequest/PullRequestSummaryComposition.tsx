// Physical shared source for the pull-request detail summary anatomy.

import type { PullRequestDetail } from "@synara/contracts";

import {
  PullRequestSummaryCommentsElement,
  PullRequestSummaryDescriptionElement,
  PullRequestSummaryIntroElement,
  PullRequestSummaryMetaRowElement,
  PullRequestSummaryMetaRowsElement,
  PullRequestSummaryOverviewElement,
  PullRequestSummaryRootElement,
  PullRequestSummarySectionElement,
  PullRequestSummaryChecksElement,
} from "~/components/pullRequest/PullRequestSummaryCompositionElements";
import { formatRelativeTime } from "~/lib/relativeTime";
import { describePullRequestState } from "./pullRequestDetail.logic";
import {
  summarizePullRequestChecks,
  summarizePullRequestComments,
} from "./pullRequestSummary.logic";

export function PullRequestSummaryComposition(props: {
  readonly detail: PullRequestDetail;
  readonly commentingAvailable?: boolean | undefined;
  readonly nowMs?: number | undefined;
}) {
  const { detail } = props;
  return (
    <PullRequestSummaryRootElement>
      <PullRequestSummaryOverviewElement>
        <PullRequestSummaryIntroElement
          title={detail.title}
          author={detail.author}
          updatedAtLabel={formatRelativeTime(detail.updatedAt, props.nowMs)}
          stateLabel={describePullRequestState(detail.state, detail.isDraft)}
        />
        <PullRequestSummaryMetaRowsElement>
          <PullRequestSummaryMetaRowElement
            kind="branch"
            label="Branch"
            headBranch={detail.headBranch}
            baseBranch={detail.baseBranch}
            additions={detail.additions}
            deletions={detail.deletions}
          />
          {detail.state === "open" && detail.mergeability === "conflicting" ? (
            <PullRequestSummaryMetaRowElement
              kind="merge"
              label="Merge"
              value={`Conflicts with ${detail.baseBranch}`}
            />
          ) : null}
          <PullRequestSummaryMetaRowElement
            kind="reviewers"
            label="Reviewers"
            reviewers={detail.reviewers}
          />
          <PullRequestSummaryMetaRowElement
            kind="comments"
            label="Comments"
            value={summarizePullRequestComments(
              detail.comments.length,
              detail.commentsTruncated || detail.commentsIncomplete,
            )}
          />
          <PullRequestSummaryMetaRowElement
            kind="checks"
            label="Checks"
            value={summarizePullRequestChecks(detail.checks).label}
            checks={detail.checks}
          />
        </PullRequestSummaryMetaRowsElement>
      </PullRequestSummaryOverviewElement>
      <PullRequestSummarySectionElement label="Description" defaultOpen>
        <PullRequestSummaryDescriptionElement detail={detail} />
      </PullRequestSummarySectionElement>
      <PullRequestSummarySectionElement label="Checks" count={detail.checks.length} defaultOpen>
        <PullRequestSummaryChecksElement checks={detail.checks} />
      </PullRequestSummarySectionElement>
      <PullRequestSummarySectionElement label="Comments" count={detail.comments.length} defaultOpen>
        <PullRequestSummaryCommentsElement
          detail={detail}
          commentingAvailable={props.commentingAvailable !== false}
        />
      </PullRequestSummarySectionElement>
    </PullRequestSummaryRootElement>
  );
}
