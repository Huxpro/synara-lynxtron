// FILE: PullRequestDetailPane.lynx.tsx
// Purpose: The pull request detail inside the Code review page's detail column: Summary,
//   Timeline and Code tabs, the primary state action, and comments.
// Data: upstream's query and mutation options (`~/lib/pullRequestReactQuery`), so the
//   detail, the diff and the list share upstream's cache keys and optimistic updates.
// Not ported from upstream's PullRequestDetailPanel page layout: the info column, the
//   stack popover, auto-fix CI, Send to agent and the Ask composer (shown as unavailable).

import { useMemo, useRef, useState } from "@lynx-js/react";
import type { PullRequestActionInput, PullRequestDetailInput } from "@synara/contracts";
import {
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
  PullRequestCodeStateComposition,
} from "@synara-web/components/pullRequest/PullRequestCodeComposition";
import { PullRequestDetailCloseComposition } from "@synara-web/components/pullRequest/PullRequestDetailCloseComposition";
import {
  PullRequestDetailCapabilityComposition,
  PullRequestDetailTabsComposition,
  type PullRequestDetailTab,
} from "@synara-web/components/pullRequest/PullRequestDetailTabsComposition";
import { PullRequestListLoadingComposition } from "@synara-web/components/pullRequest/PullRequestListComposition";
import { PullRequestSummaryComposition } from "@synara-web/components/pullRequest/PullRequestSummaryComposition";
import { PullRequestTimelineComposition } from "@synara-web/components/pullRequest/PullRequestTimelineComposition";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";
import { resolvePullRequestPrimaryAction } from "@synara-web/components/pullRequest/pullRequestDetail.logic";
import {
  pullRequestActionMutationOptions,
  pullRequestDetailQueryOptions,
  pullRequestDiffQueryOptions,
  pullRequestQueryErrorState,
} from "@synara-web/lib/pullRequestReactQuery";
import { useMutation, useQuery } from "@tanstack/react-query";

import { PullRequestDetailExternalButtonElement } from "../adapters/PullRequestDetailCloseCompositionElements.lynx";
import { PullRequestsUnavailableState } from "../adapters/PullRequestsUnavailableState.lynx";
import { PullRequestWarningBanner } from "../adapters/PullRequestWarningBanner.lynx";
import { Button } from "../components/ui/button";
import { createPullRequestActionGate } from "./FeatureListsPage.logic";
import { GitHubItemAgentUnavailable } from "./GitHubItemAgentUnavailable.lynx";
import { queryClient } from "./queries";

const DETAIL_TABS: PullRequestDetailTab[] = ["summary", "timeline", "code"];

/** Keyed by pull request identity by the page, so tab and diff paging reset per item. */
export function PullRequestDetailPane(props: {
  readonly input: PullRequestDetailInput;
  readonly onClose: () => void;
}) {
  const { input } = props;
  const [activeDetailTab, setActiveDetailTab] = useState<PullRequestDetailTab>("summary");
  const [expandedDiffFileKeys, setExpandedDiffFileKeys] = useState<string[]>([]);
  const [visibleDiffLineCounts, setVisibleDiffLineCounts] = useState<Record<string, number>>({});
  const [rawVisibleLineCount, setRawVisibleLineCount] = useState(
    PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  );
  const [lastFailedAction, setLastFailedAction] = useState<PullRequestActionInput | null>(null);
  const actionGateRef = useRef(createPullRequestActionGate());
  const detailQuery = useQuery(pullRequestDetailQueryOptions(input));
  const diffQuery = useQuery({
    ...pullRequestDiffQueryOptions(input),
    enabled: activeDetailTab === "code",
  });
  const actionMutation = useMutation(pullRequestActionMutationOptions(queryClient));
  const selectedDetail = detailQuery.data;
  const { initialError: detailInitialError, backgroundError: detailBackgroundError } =
    pullRequestQueryErrorState(detailQuery);
  const codeView = useMemo(
    () =>
      buildPullRequestCodeView(
        diffQuery.data?.patch,
        `pull-request:${input.projectId}:${input.number}`,
      ),
    [diffQuery.data?.patch, input.number, input.projectId],
  );
  const primaryAction = selectedDetail
    ? resolvePullRequestPrimaryAction(selectedDetail.state, selectedDetail.isDraft)
    : null;
  const runPullRequestAction = (actionInput: PullRequestActionInput) => {
    "background only";
    if (!actionGateRef.current.tryAcquire()) return;
    setLastFailedAction(null);
    void actionMutation
      .mutateAsync(actionInput)
      .then(() => setLastFailedAction(null))
      .catch(() => setLastFailedAction(actionInput))
      .finally(() => {
        actionGateRef.current.release();
      });
  };
  return (
    <view className="SharedPrDetailDock GitHubInboxDetailPane">
      <view className="SharedPrDetailDockHeader">
        <PullRequestDetailTabsComposition
          activeTab={activeDetailTab}
          availableTabs={DETAIL_TABS}
          onSelectTab={setActiveDetailTab}
        />
        <view className="SharedPrDetailDockActions">
          {selectedDetail && primaryAction ? (
            <Button
              size="sm"
              className="SharedPrHeaderPrimaryAction"
              disabled={actionMutation.isPending}
              onClick={() =>
                runPullRequestAction({
                  projectId: selectedDetail.projectId,
                  repository: selectedDetail.repository,
                  number: selectedDetail.number,
                  action: primaryAction.action,
                })
              }
            >
              {actionMutation.isPending ? primaryAction.pendingLabel : primaryAction.label}
            </Button>
          ) : null}
          {selectedDetail ? (
            <PullRequestDetailExternalButtonElement url={selectedDetail.url} />
          ) : null}
          <PullRequestDetailCloseComposition onClose={props.onClose} />
        </view>
      </view>
      <PullRequestDetailCapabilityComposition availableTabs={DETAIL_TABS} />
      <GitHubItemAgentUnavailable noun="pull request" />
      {detailBackgroundError ? (
        <PullRequestWarningBanner>
          Could not refresh pull request details. Showing saved data.
        </PullRequestWarningBanner>
      ) : null}
      {lastFailedAction ? (
        <view className="SharedPrActionRecovery">
          <text className="SharedPrActionError">
            Pull request action failed. The current state was kept.
          </text>
          <Button
            size="sm"
            variant="outline"
            disabled={actionMutation.isPending}
            onClick={() => runPullRequestAction(lastFailedAction)}
          >
            Retry
          </Button>
        </view>
      ) : null}
      <scroll-view className="SharedPrDetailDockScroller" scroll-orientation="vertical">
        {activeDetailTab === "code" ? (
          diffQuery.isPending ? (
            <PullRequestCodeStateComposition kind="loading" />
          ) : diffQuery.isError ? (
            <PullRequestCodeStateComposition
              kind="error"
              retrying={diffQuery.isFetching}
              onRetry={() => void diffQuery.refetch()}
            />
          ) : (
            <PullRequestCodeComposition
              view={codeView}
              truncated={diffQuery.data?.truncated ?? false}
              expandedFileKeys={expandedDiffFileKeys}
              visibleLineCounts={visibleDiffLineCounts}
              rawVisibleLineCount={rawVisibleLineCount}
              onToggleFile={(fileKey) =>
                setExpandedDiffFileKeys((current) =>
                  current.includes(fileKey)
                    ? current.filter((key) => key !== fileKey)
                    : [...current, fileKey],
                )
              }
              onShowMoreFile={(fileKey) =>
                setVisibleDiffLineCounts((current) => ({
                  ...current,
                  [fileKey]:
                    (current[fileKey] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT) +
                    PULL_REQUEST_DIFF_MORE_LINE_COUNT,
                }))
              }
              onShowMoreRaw={() =>
                setRawVisibleLineCount((current) => current + PULL_REQUEST_DIFF_MORE_LINE_COUNT)
              }
            />
          )
        ) : detailQuery.isPending ? (
          <view className="SharedPrDetailLoading">
            <PullRequestListLoadingComposition rowCount={4} label="Loading pull request details…" />
          </view>
        ) : detailInitialError ? (
          <PullRequestsUnavailableState
            error={detailInitialError}
            retrying={detailQuery.isFetching}
            onRetry={() => void detailQuery.refetch()}
          />
        ) : selectedDetail ? (
          activeDetailTab === "timeline" ? (
            <PullRequestTimelineComposition detail={selectedDetail} />
          ) : (
            <PullRequestSummaryComposition detail={selectedDetail} commentingAvailable />
          )
        ) : null}
      </scroll-view>
    </view>
  );
}
