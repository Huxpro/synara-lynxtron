// FILE: GitHubIssueDetailPane.lynx.tsx
// Purpose: The issue detail inside the Code review page's detail column: title, byline,
//   description and comments with the comment composer.
// Data: upstream's `githubIssueDetailQueryOptions` and `githubIssueCommentMutationOptions`.
// Not ported from upstream's GitHubIssueDetailPanel: the Timeline tab, the info column
//   (labels, assignees, threads), the pin action, Send to agent and the Ask composer
//   (the last two are shown as unavailable).

import type { GitHubIssueDetailInput } from "@synara/contracts";
import {
  githubIssueCommentMutationOptions,
  githubIssueDetailQueryOptions,
} from "@synara-web/lib/githubInboxQueryOptions";
import { pullRequestQueryErrorState } from "@synara-web/lib/pullRequestReactQuery";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";
import { PullRequestDetailCloseComposition } from "@synara-web/components/pullRequest/PullRequestDetailCloseComposition";
import { PullRequestListLoadingComposition } from "@synara-web/components/pullRequest/PullRequestListComposition";
import { useMutation, useQuery } from "@tanstack/react-query";

import { PullRequestCommentComposer } from "../adapters/PullRequestCommentComposer.lynx";
import { PullRequestDetailExternalButtonElement } from "../adapters/PullRequestDetailCloseCompositionElements.lynx";
import { PullRequestSummaryCommentCard } from "../adapters/PullRequestSummaryCommentCard.lynx";
import {
  PullRequestSummaryIntroElement,
  PullRequestSummaryRootElement,
  PullRequestSummarySectionElement,
} from "../adapters/PullRequestSummaryCompositionElements.lynx";
import { PullRequestsUnavailableState } from "../adapters/PullRequestsUnavailableState.lynx";
import { PullRequestWarningBanner } from "../adapters/PullRequestWarningBanner.lynx";
import { ChatMarkdown } from "../components/markdown/ChatMarkdown.lynx";
import { GitHubItemAgentUnavailable } from "./GitHubItemAgentUnavailable.lynx";
import { queryClient } from "./queries";

const STATE_REASON_LABELS = {
  completed: "Closed as completed",
  "not-planned": "Closed as not planned",
  duplicate: "Closed as duplicate",
} as const;

export function GitHubIssueDetailPane(props: {
  readonly input: GitHubIssueDetailInput;
  readonly onClose: () => void;
}) {
  const detailQuery = useQuery(githubIssueDetailQueryOptions(props.input));
  const commentMutation = useMutation(githubIssueCommentMutationOptions(queryClient));
  const detail = detailQuery.data;
  const { initialError, backgroundError } = pullRequestQueryErrorState(detailQuery);
  return (
    <view className="SharedPrDetailDock GitHubInboxDetailPane">
      <view className="SharedPrDetailDockHeader">
        <text className="GitHubInboxIssueHeading" accessibility-trait="header" text-maxline="1">
          {detail ? `Issue #${detail.number} · ${detail.repository}` : "Issue"}
        </text>
        <view className="SharedPrDetailDockActions">
          {detail ? <PullRequestDetailExternalButtonElement url={detail.url} /> : null}
          <PullRequestDetailCloseComposition onClose={props.onClose} />
        </view>
      </view>
      <GitHubItemAgentUnavailable noun="issue" />
      {backgroundError ? (
        <PullRequestWarningBanner>
          Could not refresh the issue. Showing saved data.
        </PullRequestWarningBanner>
      ) : null}
      <scroll-view className="SharedPrDetailDockScroller" scroll-orientation="vertical">
        {detailQuery.isPending ? (
          <view className="SharedPrDetailLoading">
            <PullRequestListLoadingComposition rowCount={4} label="Loading issue details…" />
          </view>
        ) : initialError ? (
          <PullRequestsUnavailableState
            error={initialError}
            retrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : detail ? (
          <PullRequestSummaryRootElement>
            <PullRequestSummaryIntroElement
              title={detail.title}
              author={detail.author}
              updatedAtLabel={`updated ${formatRelativeTime(detail.updatedAt)}`}
              stateLabel={
                detail.state === "open"
                  ? "Open"
                  : detail.stateReason
                    ? STATE_REASON_LABELS[detail.stateReason]
                    : "Closed"
              }
            />
            <PullRequestSummarySectionElement label="Description" defaultOpen>
              <ChatMarkdown
                cwd={detail.workspaceRoot}
                text={detail.body.trim() ? detail.body : "_No description provided._"}
              />
            </PullRequestSummarySectionElement>
            <PullRequestSummarySectionElement
              label="Comments"
              count={detail.commentCount}
              defaultOpen
            >
              <view className="SharedPrSummaryComments">
                {detail.commentsTruncated ? (
                  <PullRequestWarningBanner shape="note">
                    Some comments are not shown here. Open the issue on GitHub for the full
                    discussion.
                  </PullRequestWarningBanner>
                ) : null}
                {detail.comments.length === 0 ? (
                  <text className="SharedPrSummaryEmptyComments">No comments</text>
                ) : (
                  detail.comments.map((comment, index) => (
                    <PullRequestSummaryCommentCard
                      comment={comment}
                      defaultOpen={index >= detail.comments.length - 2}
                      key={comment.id}
                      prUrl={detail.url}
                      workspaceRoot={detail.workspaceRoot}
                    />
                  ))
                )}
                <PullRequestCommentComposer
                  detail={detail}
                  postComment={(input) => commentMutation.mutateAsync(input)}
                />
              </view>
            </PullRequestSummarySectionElement>
          </PullRequestSummaryRootElement>
        ) : null}
      </scroll-view>
    </view>
  );
}
