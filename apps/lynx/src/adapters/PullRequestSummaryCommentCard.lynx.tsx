import type { PullRequestComment } from '@synara/contracts';
import { useState } from '@lynx-js/react';
import { formatRelativeTime } from '@synara-web/lib/relativeTime';

import { ChatMarkdown } from '../components/markdown/ChatMarkdown.lynx';
import { ChevronRightIcon } from '../lib/icons.lynx';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import { PullRequestActorLabel } from './PullRequestActorLabel.lynx';
import { useLynxInteractiveState } from './useLynxInteractiveState';

export function PullRequestSummaryCommentCard(props: {
  readonly comment: PullRequestComment;
  readonly defaultOpen: boolean;
  readonly workspaceRoot: string;
}) {
  const [open, setOpen] = useState(props.defaultOpen);
  const contentPresent = useLynxDisclosurePresence(open);
  const interaction = useLynxInteractiveState({
    baseClassName: 'SharedPrSummaryCommentHeader',
    accessibleLabel: `${props.comment.author?.login ?? 'ghost'}, ${
      open ? 'expanded' : 'collapsed'
    }`,
    accessibilityValue: open ? 'Expanded' : 'Collapsed',
    onActivate: () => {
      'background only';
      setOpen((current) => !current);
    },
  });
  return (
    <view className="SharedPrSummaryComment">
      <view
        className={interaction.className}
        aria-expanded={open}
        {...interaction.eventProps}
      >
        <PullRequestActorLabel actor={props.comment.author} variant="comment" />
        <text className="SharedPrSummaryCommentTime">
          {formatRelativeTime(props.comment.createdAt)}
        </text>
        <ChevronRightIcon
          className={disclosureChevronClassName(
            open,
            'SharedPrSummaryCommentChevron'
          )}
          size={14}
        />
      </view>
      {contentPresent ? (
        <view
          className={disclosureContentClassName(
            open,
            'SharedPrSummaryCommentBody'
          )}
          aria-hidden={!open}
        >
          {props.comment.path ? (
            <text className="SharedPrSummaryCommentPath">
              {props.comment.path}
            </text>
          ) : null}
          <ChatMarkdown
            cwd={props.workspaceRoot}
            text={props.comment.body || '_No review body._'}
          />
        </view>
      ) : null}
    </view>
  );
}
