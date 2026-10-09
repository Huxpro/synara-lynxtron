// FILE: PullRequestRowComposition.tsx
// Purpose: Physical shared source for pull-request row visibility, order, anatomy, and copy.

import type { PullRequestListEntry } from "@synara/contracts";
import { pullRequestListProjectContexts } from "@synara/shared/githubRepository";

import { formatRelativeTime } from "~/lib/relativeTime";
import { pinActionLabel } from "~/lib/pin.logic";
import {
  PullRequestRowActionElement,
  PullRequestRowAuthorElement,
  PullRequestRowCopyElement,
  PullRequestRowDiffElement,
  PullRequestRowMetaElement,
  PullRequestRowMetaSegmentElement,
  PullRequestRowMetaSegmentsElement,
  PullRequestRowPinElement,
  PullRequestRowRootElement,
  PullRequestRowStateElement,
  PullRequestRowTimeElement,
  PullRequestRowTitleElement,
  PullRequestRowTrailingElement,
} from "~/components/pullRequest/PullRequestRowCompositionElements";

export function PullRequestRowComposition(props: {
  readonly entry: PullRequestListEntry;
  readonly selected: boolean;
  readonly showProjectTitle?: boolean | undefined;
  readonly onClick?: ((entry: PullRequestListEntry) => void) | undefined;
  readonly onTogglePinned?: ((entry: PullRequestListEntry) => void) | undefined;
  readonly nowMs?: number | undefined;
}) {
  const { entry } = props;
  const isPinned = entry.isPinned === true;
  const projectContexts = pullRequestListProjectContexts(entry);
  const projectLabel =
    projectContexts.length > 1 ? `${projectContexts.length} projects` : entry.projectTitle;
  const projectTitle = projectContexts.map((context) => context.projectTitle).join(", ");
  const pinLabel = pinActionLabel(
    props.showProjectTitle
      ? `pull request #${entry.number} in ${projectLabel}`
      : `pull request #${entry.number}`,
    isPinned,
  );

  return (
    <PullRequestRowRootElement selected={props.selected}>
      <PullRequestRowActionElement
        accessibleLabel={`${entry.title}, pull request #${entry.number}`}
        projectId={entry.projectId}
        repository={entry.repository}
        number={entry.number}
        selected={props.selected}
        {...(props.onClick ? { onActivate: () => props.onClick?.(entry) } : {})}
      >
        <PullRequestRowStateElement
          state={entry.state}
          isDraft={entry.isDraft}
          mergeability={entry.mergeability}
        />
        <PullRequestRowCopyElement>
          <PullRequestRowTitleElement title={entry.title} number={entry.number} />
          <PullRequestRowMetaElement>
            <PullRequestRowAuthorElement actor={entry.author} />
            <PullRequestRowMetaSegmentsElement>
              {props.showProjectTitle ? (
                <PullRequestRowMetaSegmentElement
                  title={projectTitle}
                  truncateWidth="max-w-[12rem]"
                  showSeparator={false}
                >
                  {projectLabel}
                </PullRequestRowMetaSegmentElement>
              ) : null}
              <PullRequestRowMetaSegmentElement showSeparator={props.showProjectTitle === true}>
                {entry.repository}
              </PullRequestRowMetaSegmentElement>
              <PullRequestRowMetaSegmentElement
                title={`${entry.headBranch} → ${entry.baseBranch}`}
                truncateWidth="max-w-[14rem]"
                showSeparator
              >
                {entry.headBranch}
              </PullRequestRowMetaSegmentElement>
            </PullRequestRowMetaSegmentsElement>
          </PullRequestRowMetaElement>
        </PullRequestRowCopyElement>
        <PullRequestRowTrailingElement>
          <PullRequestRowTimeElement>
            {formatRelativeTime(entry.updatedAt, props.nowMs)}
          </PullRequestRowTimeElement>
          <PullRequestRowDiffElement additions={entry.additions} deletions={entry.deletions} />
        </PullRequestRowTrailingElement>
      </PullRequestRowActionElement>
      {props.onTogglePinned ? (
        <PullRequestRowPinElement
          label={pinLabel}
          pinned={isPinned}
          onActivate={() => props.onTogglePinned?.(entry)}
        />
      ) : null}
    </PullRequestRowRootElement>
  );
}
