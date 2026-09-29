import type { PullRequestComment } from "@synara/contracts";
import { useState } from "@lynx-js/react";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";
import {
  parseFindingComment,
  type PullRequestCommentSeverity,
} from "@synara-web/components/pullRequest/pullRequestComment.logic";

import { ChatMarkdown } from "../components/markdown/ChatMarkdown.lynx";
import { ChevronRightIcon } from "../lib/icons.lynx";
import { openExternalBestEffort } from "../platform/window";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";
import { PullRequestActorLabel } from "./PullRequestActorLabel.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";

function severityClassName(severity: PullRequestCommentSeverity): string {
  if (severity === "High") return " SharedPrSummaryFindingSeverity--high";
  if (severity === "Medium") return " SharedPrSummaryFindingSeverity--medium";
  return " SharedPrSummaryFindingSeverity--low";
}

export function PullRequestSummaryCommentCard(props: {
  readonly comment: PullRequestComment;
  readonly defaultOpen: boolean;
  readonly prUrl: string;
  readonly workspaceRoot: string;
}) {
  const [open, setOpen] = useState(props.defaultOpen);
  const contentPresent = useLynxDisclosurePresence(open);
  const finding = parseFindingComment(props.comment.body);
  const replyUrl = props.comment.url ?? props.prUrl;
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedPrSummaryCommentHeader",
    accessibleLabel: `${props.comment.author?.login ?? "ghost"}, ${
      open ? "expanded" : "collapsed"
    }`,
    accessibilityValue: open ? "Expanded" : "Collapsed",
    onActivate: () => {
      "background only";
      setOpen((current) => !current);
    },
  });
  return (
    <view className="SharedPrSummaryComment">
      <view className={interaction.className} aria-expanded={open} {...interaction.eventProps}>
        <PullRequestActorLabel actor={props.comment.author} variant="comment" />
        <text className="SharedPrSummaryCommentTime">
          {formatRelativeTime(props.comment.createdAt)}
        </text>
        <ChevronRightIcon
          className={disclosureChevronClassName(open, "SharedPrSummaryCommentChevron")}
          size={14}
        />
      </view>
      {contentPresent ? (
        <view
          className={disclosureContentClassName(open, "SharedPrSummaryCommentBody")}
          aria-hidden={!open}
        >
          {props.comment.path ? (
            <text className="SharedPrSummaryCommentPath">{props.comment.path}</text>
          ) : null}
          {finding ? (
            <view className="SharedPrSummaryFinding">
              <text className="SharedPrSummaryFindingTitle">{finding.title}</text>
              <text
                className={`SharedPrSummaryFindingSeverity${severityClassName(finding.severity)}`}
              >
                {finding.severity} Severity
              </text>
            </view>
          ) : null}
          <ChatMarkdown
            cwd={props.workspaceRoot}
            text={(finding ? finding.body : props.comment.body) || "_No review body._"}
          />
          <view className="SharedPrSummaryCommentActions">
            <CommentReplyAction
              onActivate={() => {
                "background only";
                openExternalBestEffort(replyUrl);
              }}
            />
          </view>
        </view>
      ) : null}
    </view>
  );
}

function CommentReplyAction(props: { readonly onActivate: () => void }) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedPrSummaryCommentReply",
    accessibleLabel: "Reply on GitHub",
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="SharedPrSummaryCommentReplyText">Reply</text>
    </view>
  );
}
