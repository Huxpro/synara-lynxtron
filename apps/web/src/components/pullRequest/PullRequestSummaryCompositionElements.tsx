import type { PullRequestActor, PullRequestCheck, PullRequestDetail } from "@synara/contracts";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useState, type ReactNode } from "react";

import { Collapsible, CollapsiblePanel, CollapsibleTrigger } from "~/components/ui/collapsible";
import { DisclosureChevron } from "~/components/ui/DisclosureChevron";
import { ChatBubbleIcon, GitBranchIcon, UsersIcon } from "~/lib/icons";
import { cn } from "~/lib/utils";
import { pullRequestCommentMutationOptions } from "~/lib/pullRequestMutationOptions";
import { ensureNativeApi } from "~/nativeApi";
import { PullRequestActorLabel } from "./PullRequestActorLabel";
import { PullRequestCheckStatusIcon } from "./PullRequestCheckStatusIcon";
import { PullRequestChecksRing } from "./PullRequestChecksRing";
import { PullRequestCommentCard } from "./PullRequestCommentCard";
import { PullRequestCommentComposer } from "./PullRequestCommentComposer";
import { PullRequestDiffStat } from "./PullRequestDiffStat";
import { PullRequestMarkdown } from "./PullRequestMarkdown";
import { PullRequestConflictIcon } from "./pullRequestStatePresentation";
import { PULL_REQUEST_CHECK_STATUS_LABELS, withStableCheckKeys } from "./pullRequestSummary.logic";
import { PullRequestWarningNote } from "./PullRequestWarningNote";
import {
  PR_BODY_TEXT_CLASS_NAME,
  PR_FINE_TEXT_CLASS_NAME,
  PR_META_TEXT_CLASS_NAME,
  PR_SECTION_TITLE_TEXT_CLASS_NAME,
} from "./pullRequestText";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function PullRequestSummaryRootElement(props: ChildrenProps) {
  return <div className="h-full overflow-y-auto">{props.children}</div>;
}

export function PullRequestSummaryOverviewElement(props: ChildrenProps) {
  return <section className="space-y-4 px-5 py-5">{props.children}</section>;
}

export function PullRequestSummaryIntroElement(props: {
  readonly title: string;
  readonly author: PullRequestActor | null;
  readonly updatedAtLabel: string;
  readonly stateLabel: string;
}) {
  return (
    <div className="min-w-0">
      <h1 className="text-lg font-semibold leading-snug">{props.title}</h1>
      <div
        className={cn(
          PR_META_TEXT_CLASS_NAME,
          "mt-1.5 flex flex-wrap items-center gap-1.5 text-muted-foreground",
        )}
      >
        <PullRequestActorLabel actor={props.author} className="font-medium text-foreground" />
        <span>·</span>
        <span>{props.updatedAtLabel}</span>
        <span>·</span>
        <span>{props.stateLabel}</span>
      </div>
    </div>
  );
}

export function PullRequestSummaryMetaRowsElement(props: ChildrenProps) {
  return <div>{props.children}</div>;
}

function BranchName({ name }: { name: string }) {
  return (
    <span className="min-w-0 truncate" title={name}>
      {name}
    </span>
  );
}

function MetaRow(props: ChildrenProps & { readonly icon: ReactNode; readonly label: string }) {
  return (
    <div className={cn(PR_META_TEXT_CLASS_NAME, "flex items-center gap-2 py-1.5")}>
      <span className="flex w-24 shrink-0 items-center gap-1.5 text-muted-foreground">
        {props.icon}
        {props.label}
      </span>
      <span className="min-w-0 flex-1 text-foreground">{props.children}</span>
    </div>
  );
}

type PullRequestSummaryMetaRowProps =
  | {
      readonly kind: "branch";
      readonly label: string;
      readonly headBranch: string;
      readonly baseBranch: string;
      readonly additions: number;
      readonly deletions: number;
    }
  | {
      readonly kind: "merge" | "comments";
      readonly label: string;
      readonly value: string;
    }
  | {
      readonly kind: "reviewers";
      readonly label: string;
      readonly reviewers: ReadonlyArray<PullRequestActor>;
    }
  | {
      readonly kind: "checks";
      readonly label: string;
      readonly value: string;
      readonly checks: ReadonlyArray<PullRequestCheck>;
    };

export function PullRequestSummaryMetaRowElement(props: PullRequestSummaryMetaRowProps) {
  if (props.kind === "branch") {
    return (
      <MetaRow icon={<GitBranchIcon className="size-3.5" />} label={props.label}>
        <span className="flex items-center gap-1.5">
          <BranchName name={props.headBranch} />
          <span className="shrink-0 text-muted-foreground">›</span>
          <BranchName name={props.baseBranch} />
          <PullRequestDiffStat
            additions={props.additions}
            deletions={props.deletions}
            tone="diff"
            className="ml-1 shrink-0"
          />
        </span>
      </MetaRow>
    );
  }
  if (props.kind === "merge") {
    return (
      <MetaRow icon={<PullRequestConflictIcon className="size-3.5" />} label={props.label}>
        {props.value}
      </MetaRow>
    );
  }
  if (props.kind === "reviewers") {
    return (
      <MetaRow icon={<UsersIcon className="size-3.5" />} label={props.label}>
        {props.reviewers.length === 0 ? (
          <span className="text-muted-foreground">None</span>
        ) : (
          <span className="flex flex-wrap items-center gap-1.5">
            {props.reviewers.map((actor) => (
              <PullRequestActorLabel
                key={actor.login}
                actor={actor}
                className={cn(PR_FINE_TEXT_CLASS_NAME, "max-w-[8rem]")}
              />
            ))}
          </span>
        )}
      </MetaRow>
    );
  }
  if (props.kind !== "checks") {
    return (
      <MetaRow icon={<ChatBubbleIcon className="size-3.5" />} label={props.label}>
        {props.value}
      </MetaRow>
    );
  }
  return (
    <MetaRow icon={<PullRequestChecksRing checks={props.checks} />} label={props.label}>
      {props.value}
    </MetaRow>
  );
}

export function PullRequestSummarySectionElement(
  props: ChildrenProps & {
    readonly label: string;
    readonly count?: number | undefined;
    readonly defaultOpen: boolean;
  },
) {
  const [open, setOpen] = useState(props.defaultOpen);
  return (
    <Collapsible open={open} onOpenChange={setOpen}>
      <CollapsibleTrigger
        className={cn(
          PR_SECTION_TITLE_TEXT_CLASS_NAME,
          "flex w-full items-center gap-1.5 border-t border-border/60 px-5 py-3 text-left font-medium",
        )}
      >
        <span>{props.label}</span>
        <DisclosureChevron open={open} />
        {props.count === undefined ? null : (
          <span className={cn(PR_META_TEXT_CLASS_NAME, "tabular-nums text-muted-foreground")}>
            {props.count}
          </span>
        )}
      </CollapsibleTrigger>
      <CollapsiblePanel>
        <div className="px-5 pb-4">{props.children}</div>
      </CollapsiblePanel>
    </Collapsible>
  );
}

export function PullRequestSummaryDescriptionElement(props: {
  readonly detail: PullRequestDetail;
}) {
  return (
    <PullRequestMarkdown
      text={props.detail.body}
      fallback="_No description provided._"
      cwd={props.detail.workspaceRoot}
    />
  );
}

export function PullRequestSummaryChecksElement(props: {
  readonly checks: ReadonlyArray<PullRequestCheck>;
}) {
  return (
    <div className="space-y-1">
      {props.checks.length === 0 ? (
        <p className={cn(PR_META_TEXT_CLASS_NAME, "text-muted-foreground")}>No checks reported.</p>
      ) : (
        withStableCheckKeys(props.checks).map(({ key, check }) => (
          <button
            key={key}
            type="button"
            disabled={!check.url}
            onClick={() => check.url && void ensureNativeApi().shell.openExternal(check.url)}
            className={cn(
              PR_META_TEXT_CLASS_NAME,
              "-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 rounded-md px-2 py-1.5 text-left hover:bg-muted/50 disabled:hover:bg-transparent",
            )}
          >
            <PullRequestCheckStatusIcon status={check.status} />
            <span className="min-w-0 flex-1 truncate">{check.name}</span>
            <span className="text-muted-foreground">
              {PULL_REQUEST_CHECK_STATUS_LABELS[check.status]}
            </span>
          </button>
        ))
      )}
    </div>
  );
}

/** Upstream's composer takes its target and mutation from the host; this is the PR host. */
function PullRequestCommentComposerHost({ detail }: { detail: PullRequestDetail }) {
  const queryClient = useQueryClient();
  const mutation = useMutation(pullRequestCommentMutationOptions(queryClient));
  return <PullRequestCommentComposer target={detail} mutation={mutation} />;
}

export function PullRequestSummaryCommentsElement(props: {
  readonly detail: PullRequestDetail;
  readonly commentingAvailable: boolean;
}) {
  const { detail } = props;
  return (
    <div className="space-y-2">
      {detail.commentsTruncated || detail.commentsIncomplete ? (
        <PullRequestWarningNote>
          {detail.commentsIncomplete
            ? "Some unresolved review comments could not be loaded. Check GitHub for the complete review."
            : "More unresolved review comments may be available on GitHub."}
        </PullRequestWarningNote>
      ) : null}
      {detail.comments.length === 0 ? (
        <p className={cn(PR_BODY_TEXT_CLASS_NAME, "py-4 text-center text-muted-foreground")}>
          No comments
        </p>
      ) : (
        <div>
          {detail.comments.map((comment, index) => (
            <PullRequestCommentCard
              key={comment.id}
              comment={comment}
              prUrl={detail.url}
              workspaceRoot={detail.workspaceRoot}
              defaultOpen={index >= detail.comments.length - 2}
            />
          ))}
        </div>
      )}
      {props.commentingAvailable ? <PullRequestCommentComposerHost detail={detail} /> : null}
    </div>
  );
}
