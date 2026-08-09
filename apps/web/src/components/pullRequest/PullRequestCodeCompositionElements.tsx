// Browser host elements for the portable pull-request code composition.

import type { ReactNode } from "react";

import { DisclosureChevron } from "~/components/ui/DisclosureChevron";
import { DisclosureRegion } from "~/components/ui/DisclosureRegion";
import { cn } from "~/lib/utils";
import type { PullRequestDiffLineKind } from "./pullRequestCode.logic";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestCodeRootElement(props: ChildrenProps) {
  return <div className="flex flex-col gap-3 p-3">{props.children}</div>;
}

export function PullRequestCodeNoticeElement(props: ChildrenProps & { readonly intent?: "warning" | "muted" }) {
  return (
    <p className={cn("text-xs", props.intent === "warning" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground")}>
      {props.children}
    </p>
  );
}

export function PullRequestCodeStatsElement(props: {
  readonly fileCount: number;
  readonly additions: number;
  readonly deletions: number;
}) {
  return (
    <div className="flex items-center gap-2 text-xs text-muted-foreground">
      <span>{props.fileCount} {props.fileCount === 1 ? "file" : "files"}</span>
      <span className="text-success">+{props.additions}</span>
      <span className="text-destructive">-{props.deletions}</span>
    </div>
  );
}

export function PullRequestCodeFileElement(props: ChildrenProps) {
  return <section className="overflow-hidden rounded-md border border-border">{props.children}</section>;
}

export function PullRequestCodeFileHeaderElement(props: {
  readonly path: string;
  readonly previousPath: string | null;
  readonly additions: number;
  readonly deletions: number;
  readonly expanded: boolean;
  readonly onActivate: () => void;
}) {
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 bg-muted/35 px-3 py-2 text-left text-xs"
      aria-expanded={props.expanded}
      aria-label={`${props.expanded ? "Collapse" : "Expand"} ${props.path}`}
      onClick={props.onActivate}
    >
      <DisclosureChevron open={props.expanded} className="size-2.5 shrink-0 text-muted-foreground" />
      <span className="min-w-0 flex-1 truncate font-mono">{props.path}</span>
      {props.previousPath ? <span className="truncate text-muted-foreground">from {props.previousPath}</span> : null}
      <span className="text-success">+{props.additions}</span>
      <span className="text-destructive">-{props.deletions}</span>
    </button>
  );
}

export function PullRequestCodeDisclosureElement(
  props: ChildrenProps & { readonly expanded: boolean },
) {
  return <DisclosureRegion open={props.expanded}>{props.children}</DisclosureRegion>;
}

export function PullRequestCodeLinesElement(props: ChildrenProps) {
  return <div className="overflow-x-auto bg-background font-mono text-[11px] leading-5">{props.children}</div>;
}

export function PullRequestCodeLineElement(props: {
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly text: string;
}) {
  const prefix = props.kind === "addition" ? "+" : props.kind === "deletion" ? "-" : props.kind === "hunk" ? "@" : " ";
  return (
    <div className={cn("flex min-w-max", props.kind === "addition" && "bg-success/10", props.kind === "deletion" && "bg-destructive/10", props.kind === "hunk" && "bg-muted/60 text-muted-foreground")}>
      <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">{props.oldLine ?? ""}</span>
      <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">{props.newLine ?? ""}</span>
      <span className="w-5 shrink-0 select-none text-center">{prefix}</span>
      <span className="whitespace-pre pr-3">{props.text}</span>
    </div>
  );
}

export function PullRequestCodeMoreElement(props: { readonly label: string; readonly onActivate: () => void }) {
  return <button type="button" className="w-full border-t border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground" onClick={props.onActivate}>{props.label}</button>;
}
