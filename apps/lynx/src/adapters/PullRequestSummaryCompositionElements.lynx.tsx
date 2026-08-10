import type {
  PullRequestActor,
  PullRequestCheck,
  PullRequestDetail,
} from '@synara/contracts';
import { useState, type ReactNode } from '@lynx-js/react';

import { ChatMarkdown } from '../components/markdown/ChatMarkdown.lynx';
import { ChevronRightIcon } from '../lib/icons.lynx';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import { PULL_REQUEST_CHECK_STATUS_LABELS } from '@synara-web/components/pullRequest/pullRequestSummary.logic';
import { PullRequestCommentComposer } from './PullRequestCommentComposer.lynx';
import { PullRequestActorLabel } from './PullRequestActorLabel.lynx';
import { PullRequestSummaryBranchRow } from './PullRequestSummaryBranchRow.lynx';
import { PullRequestSummaryMetaIcon } from './PullRequestSummaryMetaIcon.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';
import './pull-request-summary-composition-elements.css';

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestSummaryRootElement(props: ChildrenProps) {
  return <view className="SharedPrSummary">{props.children}</view>;
}

export function PullRequestSummaryOverviewElement(props: ChildrenProps) {
  return <view className="SharedPrSummaryOverview">{props.children}</view>;
}

export function PullRequestSummaryIntroElement(props: {
  readonly title: string;
  readonly author: PullRequestActor | null;
  readonly updatedAtLabel: string;
  readonly stateLabel: string;
}) {
  return (
    <view className="SharedPrSummaryIntro">
      <text className="SharedPrSummaryTitle">{props.title}</text>
      <view className="SharedPrSummaryByline">
        <PullRequestActorLabel actor={props.author} variant="author" />
        <text className="SharedPrSummaryBylineText">·</text>
        <text className="SharedPrSummaryBylineText">
          {props.updatedAtLabel}
        </text>
        <text className="SharedPrSummaryBylineText">·</text>
        <text className="SharedPrSummaryBylineText">{props.stateLabel}</text>
      </view>
    </view>
  );
}

export function PullRequestSummaryMetaRowsElement(props: ChildrenProps) {
  return <view className="SharedPrSummaryMetaRows">{props.children}</view>;
}

type PullRequestSummaryMetaRowProps =
  | {
      readonly kind: 'branch';
      readonly label: string;
      readonly headBranch: string;
      readonly baseBranch: string;
      readonly additions: number;
      readonly deletions: number;
    }
  | {
      readonly kind: 'merge' | 'comments';
      readonly label: string;
      readonly value: string;
    }
  | {
      readonly kind: 'reviewers';
      readonly label: string;
      readonly reviewers: ReadonlyArray<PullRequestActor>;
    }
  | {
      readonly kind: 'checks';
      readonly label: string;
      readonly value: string;
      readonly checks: ReadonlyArray<PullRequestCheck>;
    };

export function PullRequestSummaryMetaRowElement(
  props: PullRequestSummaryMetaRowProps
) {
  if (props.kind === 'branch') {
    return (
      <PullRequestSummaryBranchRow
        additions={props.additions}
        baseBranch={props.baseBranch}
        deletions={props.deletions}
        headBranch={props.headBranch}
        label={props.label}
      />
    );
  }
  if (props.kind === 'reviewers') {
    return (
      <view className="SharedPrSummaryMetaRow">
        <view className="SharedPrSummaryMetaLabel SharedPrSummaryMetaLabel--icon">
          <PullRequestSummaryMetaIcon kind="reviewers" />
          <text className="SharedPrSummaryMetaLabelText">{props.label}</text>
        </view>
        {props.reviewers.length === 0 ? (
          <text className="SharedPrSummaryMetaValue SharedPrSummaryMetaValue--muted">
            None
          </text>
        ) : (
          <view className="SharedPrSummaryReviewers">
            {props.reviewers.map((actor) => (
              <PullRequestActorLabel
                actor={actor}
                key={actor.login}
                variant="reviewer"
              />
            ))}
          </view>
        )}
      </view>
    );
  }
  return (
    <view className="SharedPrSummaryMetaRow">
      <view className="SharedPrSummaryMetaLabel SharedPrSummaryMetaLabel--icon">
        <PullRequestSummaryMetaIcon
          kind={props.kind}
          checks={props.kind === 'checks' ? props.checks : undefined}
        />
        <text className="SharedPrSummaryMetaLabelText">{props.label}</text>
      </view>
      <text
        className={`SharedPrSummaryMetaValue${
          props.kind === 'merge' ? ' SharedPrSummaryMetaValue--warning' : ''
        }`}
      >
        {props.value}
      </text>
    </view>
  );
}

export function PullRequestSummarySectionElement(
  props: ChildrenProps & {
    readonly label: string;
    readonly count?: number | undefined;
    readonly defaultOpen: boolean;
  }
) {
  const [open, setOpen] = useState(props.defaultOpen);
  const contentPresent = useLynxDisclosurePresence(open);
  const toggle = () => {
    'background only';
    setOpen((value) => !value);
  };
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrSummarySectionHeader',
    accessibleLabel: `${props.label}, ${open ? 'expanded' : 'collapsed'}`,
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: toggle,
  });
  return (
    <view className="SharedPrSummarySection">
      <view
        className={interaction.className}
        aria-expanded={open}
        aria-label={`${props.label}, ${open ? 'expanded' : 'collapsed'}`}
        {...interaction.eventProps}
      >
        <text className="SharedPrSummarySectionTitle">{props.label}</text>
        <ChevronRightIcon
          className={disclosureChevronClassName(
            open,
            'SharedPrSummarySectionChevron'
          )}
          size={14}
        />
        {props.count === undefined ? null : (
          <text className="SharedPrSummarySectionCount">{props.count}</text>
        )}
      </view>
      {contentPresent ? (
        <view
          className={disclosureContentClassName(
            open,
            'SharedPrSummarySectionBody'
          )}
          aria-hidden={!open}
        >
          {props.children}
        </view>
      ) : null}
    </view>
  );
}

export function PullRequestSummaryDescriptionElement(props: {
  readonly detail: PullRequestDetail;
}) {
  return (
    <ChatMarkdown
      text={
        props.detail.body.trim()
          ? props.detail.body
          : '_No description provided._'
      }
    />
  );
}

export function PullRequestSummaryChecksElement(props: {
  readonly checks: ReadonlyArray<PullRequestCheck>;
}) {
  return (
    <view className="SharedPrSummaryChecks">
      {props.checks.length === 0 ? (
        <text className="SharedPrSummaryMuted">No checks reported.</text>
      ) : (
        props.checks.map((check, index) => (
          <view
            className="SharedPrSummaryCheckRow"
            key={`${check.name}:${check.url ?? ''}:${index}`}
          >
            <text className="SharedPrSummaryCheckName">{check.name}</text>
            <text className="SharedPrSummaryCheckStatus">
              {PULL_REQUEST_CHECK_STATUS_LABELS[check.status]}
            </text>
          </view>
        ))
      )}
    </view>
  );
}

export function PullRequestSummaryCommentsElement(props: {
  readonly detail: PullRequestDetail;
  readonly commentingAvailable: boolean;
}) {
  return (
    <view className="SharedPrSummaryComments">
      {props.detail.commentsIncomplete || props.detail.commentsTruncated ? (
        <text className="SharedPrSummaryWarning">
          {props.detail.commentsIncomplete
            ? 'Some unresolved review comments could not be loaded. Check GitHub for the complete review.'
            : 'More unresolved review comments may be available on GitHub.'}
        </text>
      ) : null}
      {props.detail.comments.length === 0 ? (
        <text className="SharedPrSummaryMuted SharedPrSummaryEmptyComments">
          No comments
        </text>
      ) : (
        props.detail.comments.map((comment) => (
          <view className="SharedPrSummaryComment" key={comment.id}>
            <view className="SharedPrSummaryCommentHeader">
              <PullRequestActorLabel
                actor={comment.author}
                variant="comment"
              />
              {comment.path ? (
                <text className="SharedPrSummaryCommentPath">
                  {comment.path}
                </text>
              ) : null}
            </view>
            <ChatMarkdown text={comment.body || '_No review body._'} />
          </view>
        ))
      )}
      {props.commentingAvailable ? (
        <PullRequestCommentComposer detail={props.detail} />
      ) : (
        <text className="SharedPrSummaryCapability">
          Commenting is unavailable in this runtime.
        </text>
      )}
    </view>
  );
}
