// FILE: PullRequestListCompositionElements.tsx
// Purpose: Browser host elements for shared pull-request list and state anatomy.

import type { ReactNode } from "react";

import { Empty, EmptyDescription, EmptyHeader, EmptyTitle } from "~/components/ui/empty";
import { Skeleton } from "~/components/ui/skeleton";
import { resolveSystemStateSemantics } from "~/components/systemStateSemantics";
import { cn } from "~/lib/utils";
import { PR_FINE_TEXT_CLASS_NAME, PR_QUIET_INK_CLASS_NAME } from "./pullRequestText";

type ChildrenProps = { readonly children?: ReactNode | undefined };

export function PullRequestListRootElement(props: ChildrenProps) {
  return <div className="space-y-0.5">{props.children}</div>;
}

export function PullRequestListGroupTitleElement(
  props: ChildrenProps & { readonly separated: boolean },
) {
  return (
    <h2
      className={cn(
        PR_FINE_TEXT_CLASS_NAME,
        PR_QUIET_INK_CLASS_NAME,
        "pb-0.5 font-medium",
        props.separated && "pt-2.5",
      )}
    >
      {props.children}
    </h2>
  );
}

export function PullRequestListLoadingElement(props: {
  readonly rowCount: number;
  readonly label: string;
}) {
  const semantics = resolveSystemStateSemantics("status");
  return (
    <div
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      aria-label={props.label}
      className="space-y-0.5"
    >
      {Array.from({ length: props.rowCount }, (_, index) => (
        <Skeleton key={index} className="h-13 w-full rounded-lg" />
      ))}
    </div>
  );
}

export function PullRequestListEmptyElement(props: {
  readonly title: string;
  readonly description: string;
  readonly intent: "empty" | "alert";
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <Empty
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      className="SharedPrEmpty py-16"
    >
      <EmptyHeader>
        <EmptyTitle>{props.title}</EmptyTitle>
        <EmptyDescription>{props.description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}
