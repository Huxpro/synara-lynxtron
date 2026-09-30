// Physical shared source for portable PR diff status, file order, headers and line anatomy.

import {
  PullRequestCodeDisclosureElement,
  PullRequestCodeFileElement,
  PullRequestCodeFileHeaderElement,
  PullRequestCodeLineElement,
  PullRequestCodeLinesElement,
  PullRequestCodeMoreElement,
  PullRequestCodeNoticeElement,
  PullRequestCodeRootElement,
  PullRequestCodeSplitRowElement,
  PullRequestCodeStatsElement,
} from "~/components/pullRequest/PullRequestCodeCompositionElements";
import {
  formatGitPathForDisplay,
  type PullRequestCodeSyntaxToken,
  type PullRequestDiffLineView,
  type PullRequestCodeView,
} from "./pullRequestCode.logic";
import type { ReactNode } from "react";
import { emphasizePairedDiffTokens } from "./diffLineEmphasis.logic";

export { formatGitPathForDisplay };

export const PULL_REQUEST_DIFF_INITIAL_LINE_COUNT = 120;
export const PULL_REQUEST_DIFF_MORE_LINE_COUNT = 160;

type PullRequestCodeSplitRow =
  | {
      readonly kind: "paired";
      readonly left: PullRequestDiffLineView | null;
      readonly right: PullRequestDiffLineView | null;
    }
  | {
      readonly kind: "shared";
      readonly line: PullRequestDiffLineView;
    };

export function pairPullRequestCodeLines(
  lines: readonly PullRequestDiffLineView[],
): PullRequestCodeSplitRow[] {
  const rows: PullRequestCodeSplitRow[] = [];
  let index = 0;
  while (index < lines.length) {
    const line = lines[index]!;
    if (line.kind === "hunk") {
      // Pierre treats hunk metadata as separator input rather than a visible
      // code row. The portable split renderer does not implement expandable
      // context yet, so keep the metadata in the parsed model but omit the raw
      // `@@` row from the rendered split grid.
      index += 1;
      continue;
    }
    if (line.kind === "context" || line.kind === "no-newline-context") {
      rows.push({ kind: "paired", left: line, right: line });
      index += 1;
      continue;
    }
    const deletions: PullRequestDiffLineView[] = [];
    const additions: PullRequestDiffLineView[] = [];
    while (index < lines.length) {
      const change = lines[index]!;
      if (change.kind === "deletion" || change.kind === "no-newline-deletion") {
        deletions.push(change);
        index += 1;
        continue;
      }
      if (change.kind === "addition" || change.kind === "no-newline-addition") {
        additions.push(change);
        index += 1;
        continue;
      }
      break;
    }
    if (deletions.length === 0 && additions.length === 0) {
      rows.push({ kind: "shared", line });
      index += 1;
      continue;
    }
    const rowCount = Math.max(deletions.length, additions.length);
    for (let rowIndex = 0; rowIndex < rowCount; rowIndex += 1) {
      rows.push({
        kind: "paired",
        left: deletions[rowIndex] ?? null,
        right: additions[rowIndex] ?? null,
      });
    }
  }
  return rows;
}

function PullRequestCodeSplitLineRow(props: {
  readonly row: Extract<PullRequestCodeSplitRow, { readonly kind: "paired" }>;
  readonly syntaxTokensByLineId?:
    | Readonly<Record<string, readonly PullRequestCodeSyntaxToken[]>>
    | undefined;
  readonly wordWrap: boolean;
}) {
  const leftTokens = props.row.left ? (props.syntaxTokensByLineId?.[props.row.left.id] ?? []) : [];
  const rightTokens = props.row.right
    ? (props.syntaxTokensByLineId?.[props.row.right.id] ?? [])
    : [];
  const emphasized =
    props.row.left && props.row.right && leftTokens.length > 0 && rightTokens.length > 0
      ? emphasizePairedDiffTokens({
          deletion: { text: props.row.left.text, tokens: leftTokens },
          addition: { text: props.row.right.text, tokens: rightTokens },
        })
      : null;
  return (
    <PullRequestCodeSplitRowElement
      left={
        props.row.left ? (
          <PullRequestCodeLineElement
            {...props.row.left}
            side="left"
            syntaxTokens={emphasized?.deletion ?? leftTokens}
            wordWrap={props.wordWrap}
          />
        ) : null
      }
      right={
        props.row.right ? (
          <PullRequestCodeLineElement
            {...props.row.right}
            side="right"
            syntaxTokens={emphasized?.addition ?? rightTokens}
            wordWrap={props.wordWrap}
          />
        ) : null
      }
    />
  );
}

export function PullRequestCodeStateComposition(props: {
  readonly kind: "loading" | "error";
  readonly retrying?: boolean | undefined;
  readonly onRetry?: (() => void) | undefined;
}) {
  return (
    <PullRequestCodeRootElement>
      <PullRequestCodeNoticeElement intent={props.kind === "error" ? "warning" : "muted"}>
        {props.kind === "loading"
          ? "Loading pull request diff…"
          : "The pull request diff could not be loaded."}
      </PullRequestCodeNoticeElement>
      {props.kind === "error" && props.onRetry ? (
        <PullRequestCodeMoreElement
          disabled={props.retrying}
          label={props.retrying ? "Retrying…" : "Retry"}
          onActivate={props.onRetry}
        />
      ) : null}
    </PullRequestCodeRootElement>
  );
}

export function PullRequestCodeComposition(props: {
  readonly view: PullRequestCodeView;
  readonly truncated: boolean;
  readonly emptyLabel?: string | undefined;
  readonly filePathPresentation?: "full" | "basename-first" | undefined;
  readonly renderMode?: "stacked" | "split" | undefined;
  readonly showSummary?: boolean | undefined;
  readonly wordWrap?: boolean | undefined;
  readonly expandedFileKeys: readonly string[];
  readonly visibleLineCounts: Readonly<Record<string, number>>;
  readonly rawVisibleLineCount: number;
  readonly fileElementId?: (fileKey: string) => string | undefined;
  readonly renderFileActions?: ((filePath: string) => ReactNode) | undefined;
  readonly syntaxTokensByLineId?:
    | Readonly<Record<string, readonly PullRequestCodeSyntaxToken[]>>
    | undefined;
  readonly onToggleFile: (fileKey: string) => void;
  readonly onShowMoreFile: (fileKey: string) => void;
  readonly onShowMoreRaw: () => void;
}) {
  const expanded = new Set(props.expandedFileKeys);
  return (
    <PullRequestCodeRootElement>
      {props.truncated ? (
        <PullRequestCodeNoticeElement intent="warning">
          Diff exceeded 8 MiB and was truncated by the server.
        </PullRequestCodeNoticeElement>
      ) : null}
      {props.view.kind === "empty" ? (
        <PullRequestCodeNoticeElement>
          {props.emptyLabel ?? "This pull request has no file changes."}
        </PullRequestCodeNoticeElement>
      ) : props.view.kind === "raw" ? (
        <>
          <PullRequestCodeNoticeElement intent="warning">
            {props.view.reason}
          </PullRequestCodeNoticeElement>
          <PullRequestCodeFileElement>
            <PullRequestCodeFileHeaderElement
              path="Raw patch"
              previousPath={null}
              relation={null}
              additions={0}
              deletions={0}
              expanded
              pathPresentation={props.filePathPresentation}
              onActivate={() => {}}
            />
            <PullRequestCodeDisclosureElement expanded>
              <PullRequestCodeLinesElement wordWrap={props.wordWrap ?? false}>
                {props.view.lines.slice(0, props.rawVisibleLineCount).map((line) => (
                  <PullRequestCodeLineElement
                    key={line.id}
                    {...line}
                    syntaxTokens={props.syntaxTokensByLineId?.[line.id]}
                    wordWrap={props.wordWrap ?? false}
                  />
                ))}
              </PullRequestCodeLinesElement>
              {props.rawVisibleLineCount < props.view.lines.length ? (
                <PullRequestCodeMoreElement
                  label={`Show ${Math.min(PULL_REQUEST_DIFF_MORE_LINE_COUNT, props.view.lines.length - props.rawVisibleLineCount)} more lines`}
                  onActivate={props.onShowMoreRaw}
                />
              ) : null}
            </PullRequestCodeDisclosureElement>
          </PullRequestCodeFileElement>
        </>
      ) : (
        <>
          {props.showSummary === false ? null : (
            <PullRequestCodeStatsElement
              fileCount={props.view.files.length}
              additions={props.view.additions}
              deletions={props.view.deletions}
            />
          )}
          {props.view.files.map((file) => {
            const isExpanded = expanded.has(file.key);
            const visibleLineCount =
              props.visibleLineCounts[file.key] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT;
            return (
              <PullRequestCodeFileElement key={file.key} id={props.fileElementId?.(file.key)}>
                <PullRequestCodeFileHeaderElement
                  path={file.path}
                  previousPath={file.previousPath}
                  relation={file.relation}
                  additions={file.additions}
                  deletions={file.deletions}
                  expanded={isExpanded}
                  pathPresentation={props.filePathPresentation}
                  trailingActions={props.renderFileActions?.(file.path)}
                  onActivate={() => props.onToggleFile(file.key)}
                />
                <PullRequestCodeDisclosureElement expanded={isExpanded}>
                  {file.binary ? (
                    <PullRequestCodeNoticeElement>
                      Binary file changed.
                    </PullRequestCodeNoticeElement>
                  ) : null}
                  {file.modeChange ? (
                    <PullRequestCodeNoticeElement>
                      File mode changed from {file.modeChange.previous} to {file.modeChange.next}.
                    </PullRequestCodeNoticeElement>
                  ) : null}
                  {file.lifecycle ? (
                    <PullRequestCodeNoticeElement>
                      {file.lifecycle === "added" ? "File added." : "File deleted."}
                    </PullRequestCodeNoticeElement>
                  ) : null}
                  <PullRequestCodeLinesElement wordWrap={props.wordWrap ?? false}>
                    {props.renderMode === "split"
                      ? pairPullRequestCodeLines(file.lines.slice(0, visibleLineCount)).map(
                          (row, rowIndex) =>
                            row.kind === "shared" ? (
                              <PullRequestCodeLineElement
                                key={row.line.id}
                                {...row.line}
                                syntaxTokens={props.syntaxTokensByLineId?.[row.line.id]}
                                wordWrap={props.wordWrap ?? false}
                              />
                            ) : (
                              <PullRequestCodeSplitLineRow
                                key={`split:${rowIndex}:${row.left?.id ?? ""}:${row.right?.id ?? ""}`}
                                row={row}
                                syntaxTokensByLineId={props.syntaxTokensByLineId}
                                wordWrap={props.wordWrap ?? false}
                              />
                            ),
                        )
                      : file.lines
                          .slice(0, visibleLineCount)
                          .map((line) => (
                            <PullRequestCodeLineElement
                              key={line.id}
                              {...line}
                              syntaxTokens={props.syntaxTokensByLineId?.[line.id]}
                              wordWrap={props.wordWrap ?? false}
                            />
                          ))}
                  </PullRequestCodeLinesElement>
                  {visibleLineCount < file.lines.length ? (
                    <PullRequestCodeMoreElement
                      label={`Show ${Math.min(PULL_REQUEST_DIFF_MORE_LINE_COUNT, file.lines.length - visibleLineCount)} more lines`}
                      onActivate={() => props.onShowMoreFile(file.key)}
                    />
                  ) : null}
                </PullRequestCodeDisclosureElement>
              </PullRequestCodeFileElement>
            );
          })}
        </>
      )}
    </PullRequestCodeRootElement>
  );
}
