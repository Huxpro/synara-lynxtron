// Browser host elements for the portable pull-request code composition.

import type { ReactNode } from "react";

import { DisclosureChevron } from "~/components/ui/DisclosureChevron";
import { DisclosureRegion } from "~/components/ui/DisclosureRegion";
import { FileEntryIcon } from "~/components/chat/FileEntryIcon";
import { cn } from "~/lib/utils";
import {
  formatGitPathForDisplay,
  type PullRequestCodeSyntaxToken,
  type PullRequestDiffLineKind,
} from "./pullRequestCode.logic";

type ChildrenProps = { readonly children?: ReactNode };

export function PullRequestCodeRootElement(props: ChildrenProps) {
  return <div className="flex flex-col gap-3 p-3">{props.children}</div>;
}

export function PullRequestCodeNoticeElement(
  props: ChildrenProps & { readonly intent?: "warning" | "muted" },
) {
  return (
    <p
      className={cn(
        "text-xs",
        props.intent === "warning" ? "text-amber-700 dark:text-amber-300" : "text-muted-foreground",
      )}
    >
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
      <span>
        {props.fileCount} {props.fileCount === 1 ? "file" : "files"}
      </span>
      <span className="text-success">+{props.additions}</span>
      <span className="text-destructive">-{props.deletions}</span>
    </div>
  );
}

export function PullRequestCodeFileElement(props: ChildrenProps & { readonly id?: string }) {
  return (
    <section id={props.id} className="overflow-hidden rounded-md border border-border">
      {props.children}
    </section>
  );
}

export function PullRequestCodeFileHeaderElement(props: {
  readonly path: string;
  readonly previousPath: string | null;
  readonly relation: "copied" | "renamed" | null;
  readonly additions: number;
  readonly deletions: number;
  readonly expanded: boolean;
  readonly pathPresentation?: "full" | "basename-first";
  readonly trailingActions?: ReactNode;
  readonly onActivate: () => void;
}) {
  const path = formatGitPathForDisplay(props.path);
  const slash = path.lastIndexOf("/");
  const basename = slash === -1 ? path : path.slice(slash + 1);
  const directory = slash === -1 ? "" : path.slice(0, slash + 1);
  const previousPath = props.previousPath ? formatGitPathForDisplay(props.previousPath) : null;
  return (
    <button
      type="button"
      className="flex w-full items-center gap-2 bg-muted/35 px-3 py-2 text-left text-xs"
      aria-expanded={props.expanded}
      aria-label={`${props.expanded ? "Collapse" : "Expand"} ${path}`}
      onClick={props.onActivate}
    >
      {props.pathPresentation === "basename-first" ? (
        <FileEntryIcon pathValue={path} kind="file" className="size-3.5 shrink-0" />
      ) : null}
      <span className="flex min-w-0 flex-1 items-baseline gap-1.5 overflow-hidden">
        <span className="shrink-0 truncate font-mono">
          {props.pathPresentation === "basename-first" ? basename : path}
        </span>
        {props.pathPresentation === "basename-first" && directory ? (
          <span className="min-w-0 truncate text-muted-foreground">{directory}</span>
        ) : null}
      </span>
      {previousPath ? (
        <span className="truncate text-muted-foreground">
          {props.relation === "copied"
            ? "copied from"
            : props.relation === "renamed"
              ? "renamed from"
              : "from"}{" "}
          {previousPath}
        </span>
      ) : null}
      <span className="text-success">+{props.additions}</span>
      <span className="text-destructive">-{props.deletions}</span>
      {props.trailingActions ? (
        <span className="inline-flex" onClick={(event) => event.stopPropagation()}>
          {props.trailingActions}
        </span>
      ) : null}
      <DisclosureChevron
        open={props.expanded}
        className="size-2.5 shrink-0 text-muted-foreground"
      />
    </button>
  );
}

export function PullRequestCodeDisclosureElement(
  props: ChildrenProps & { readonly expanded: boolean },
) {
  return <DisclosureRegion open={props.expanded}>{props.children}</DisclosureRegion>;
}

export function PullRequestCodeLinesElement(props: ChildrenProps & { readonly wordWrap: boolean }) {
  return (
    <div
      className={cn(
        "bg-background font-mono text-[11px] leading-5",
        props.wordWrap ? "overflow-x-hidden" : "overflow-x-auto",
      )}
    >
      {props.children}
    </div>
  );
}

export function PullRequestCodeLineElement(props: {
  readonly kind: PullRequestDiffLineKind;
  readonly oldLine: number | null;
  readonly newLine: number | null;
  readonly side?: "left" | "right";
  readonly syntaxTokens?: readonly PullRequestCodeSyntaxToken[];
  readonly text: string;
  readonly wordWrap: boolean;
}) {
  const prefix =
    props.kind === "addition"
      ? "+"
      : props.kind === "deletion"
        ? "-"
        : props.kind === "hunk"
          ? "@"
          : props.kind.startsWith("no-newline-")
            ? "\\"
            : " ";
  return (
    <div
      className={cn(
        "flex",
        props.wordWrap ? "min-w-0" : "min-w-max",
        props.kind === "addition" && "bg-success/10",
        props.kind === "deletion" && "bg-destructive/10",
        props.kind === "hunk" && "bg-muted/60 text-muted-foreground",
        props.kind.startsWith("no-newline-") && "italic text-muted-foreground",
      )}
    >
      {props.side === "right" ? null : (
        <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">
          {props.oldLine ?? ""}
        </span>
      )}
      {props.side === "left" ? null : (
        <span className="w-10 shrink-0 select-none px-1 text-right text-muted-foreground">
          {props.newLine ?? ""}
        </span>
      )}
      <span className="w-5 shrink-0 select-none text-center">{prefix}</span>
      <span
        className={cn(
          "min-w-0 pr-3",
          props.wordWrap ? "whitespace-pre-wrap wrap-break-word" : "whitespace-pre",
        )}
      >
        {props.syntaxTokens?.length
          ? props.syntaxTokens.map((token, index) => (
              <span
                key={`${index}:${token.content}`}
                style={{
                  color: token.color,
                  ...(token.emphasized
                    ? {
                        backgroundColor:
                          props.kind === "addition"
                            ? "var(--diffs-bg-addition-emphasis, rgba(0, 162, 64, 0.2))"
                            : "var(--diffs-bg-deletion-emphasis, rgba(224, 46, 42, 0.2))",
                        borderRadius: 3,
                      }
                    : {}),
                  ...(token.fontStyle & 1 ? { fontStyle: "italic" } : {}),
                  ...(token.fontStyle & 2 ? { fontWeight: 700 } : {}),
                  ...(token.fontStyle & 4 ? { textDecoration: "underline" } : {}),
                }}
              >
                {token.content}
              </span>
            ))
          : props.text}
      </span>
    </div>
  );
}

export function PullRequestCodeSplitRowElement(props: {
  readonly left?: ReactNode;
  readonly right?: ReactNode;
}) {
  return (
    <div className="grid min-w-full grid-cols-2">
      <div
        className={cn(
          "min-w-0 overflow-hidden border-r border-border/50",
          !props.left && "bg-muted/20",
        )}
      >
        {props.left}
      </div>
      <div className={cn("min-w-0 overflow-hidden", !props.right && "bg-muted/20")}>
        {props.right}
      </div>
    </div>
  );
}

export function PullRequestCodeMoreElement(props: {
  readonly disabled?: boolean;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <button
      type="button"
      disabled={props.disabled}
      className="w-full border-t border-border px-3 py-2 text-xs text-muted-foreground hover:text-foreground disabled:opacity-64"
      onClick={props.onActivate}
    >
      {props.label}
    </button>
  );
}
