import type { ReactNode } from "react";

import { cn } from "~/lib/utils";
import { PR_BODY_TEXT_CLASS_NAME, PR_META_TEXT_CLASS_NAME } from "./pullRequestText";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestTimelineRootElement(props: ChildrenProps) {
  return <div className="h-full overflow-y-auto px-5 py-5">{props.children}</div>;
}

export function PullRequestTimelineRailElement(props: ChildrenProps) {
  return <div className="relative ml-2 border-l border-border/70 pl-5">{props.children}</div>;
}

export function PullRequestTimelineEventElement(props: ChildrenProps) {
  return (
    <article className={cn(PR_BODY_TEXT_CLASS_NAME, "relative pb-5")}>{props.children}</article>
  );
}

export function PullRequestTimelineMarkerElement() {
  return (
    <span className="absolute -left-[1.55rem] top-1 size-2 rounded-full border border-border bg-background" />
  );
}

export function PullRequestTimelineTitleElement(props: ChildrenProps) {
  return <div className="font-medium">{props.children}</div>;
}

export function PullRequestTimelineMetaElement(props: ChildrenProps) {
  return (
    <div className={cn(PR_META_TEXT_CLASS_NAME, "text-muted-foreground")}>{props.children}</div>
  );
}

export function PullRequestTimelineBodyElement(props: ChildrenProps) {
  return (
    <p
      className={cn(
        PR_META_TEXT_CLASS_NAME,
        "mt-1 line-clamp-3 whitespace-pre-wrap text-muted-foreground",
      )}
    >
      {props.children}
    </p>
  );
}
