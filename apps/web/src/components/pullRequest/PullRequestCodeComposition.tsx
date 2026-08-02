// Physical shared source for portable PR diff status, file order, headers and line anatomy.

import {
  PullRequestCodeFileElement,
  PullRequestCodeFileHeaderElement,
  PullRequestCodeLineElement,
  PullRequestCodeLinesElement,
  PullRequestCodeMoreElement,
  PullRequestCodeNoticeElement,
  PullRequestCodeRootElement,
  PullRequestCodeStatsElement,
} from "~/components/pullRequest/PullRequestCodeCompositionElements";
import type { PullRequestCodeView } from "./pullRequestCode.logic";

export const PULL_REQUEST_DIFF_INITIAL_LINE_COUNT = 120;
export const PULL_REQUEST_DIFF_MORE_LINE_COUNT = 160;

export function PullRequestCodeStateComposition(props: {
  readonly kind: "loading" | "error";
  readonly retrying?: boolean;
  readonly onRetry?: () => void;
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
          label={props.retrying ? "Retrying…" : "Retry"}
          onActivate={props.retrying ? () => {} : props.onRetry}
        />
      ) : null}
    </PullRequestCodeRootElement>
  );
}

export function PullRequestCodeComposition(props: {
  readonly view: PullRequestCodeView;
  readonly truncated: boolean;
  readonly expandedFileKeys: readonly string[];
  readonly visibleLineCounts: Readonly<Record<string, number>>;
  readonly rawVisibleLineCount: number;
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
        <PullRequestCodeNoticeElement>This pull request has no file changes.</PullRequestCodeNoticeElement>
      ) : props.view.kind === "raw" ? (
        <>
          <PullRequestCodeNoticeElement intent="warning">{props.view.reason}</PullRequestCodeNoticeElement>
          <PullRequestCodeFileElement>
            <PullRequestCodeFileHeaderElement
              path="Raw patch"
              previousPath={null}
              additions={0}
              deletions={0}
              expanded
              onActivate={() => {}}
            />
            <PullRequestCodeLinesElement>
              {props.view.lines.slice(0, props.rawVisibleLineCount).map((line) => (
                <PullRequestCodeLineElement key={line.id} {...line} />
              ))}
            </PullRequestCodeLinesElement>
            {props.rawVisibleLineCount < props.view.lines.length ? (
              <PullRequestCodeMoreElement
                label={`Show ${Math.min(PULL_REQUEST_DIFF_MORE_LINE_COUNT, props.view.lines.length - props.rawVisibleLineCount)} more lines`}
                onActivate={props.onShowMoreRaw}
              />
            ) : null}
          </PullRequestCodeFileElement>
        </>
      ) : (
        <>
          <PullRequestCodeStatsElement
            fileCount={props.view.files.length}
            additions={props.view.additions}
            deletions={props.view.deletions}
          />
          {props.view.files.map((file) => {
            const isExpanded = expanded.has(file.key);
            const visibleLineCount = props.visibleLineCounts[file.key] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT;
            return (
              <PullRequestCodeFileElement key={file.key}>
                <PullRequestCodeFileHeaderElement
                  path={file.path}
                  previousPath={file.previousPath}
                  additions={file.additions}
                  deletions={file.deletions}
                  expanded={isExpanded}
                  onActivate={() => props.onToggleFile(file.key)}
                />
                {isExpanded ? (
                  <>
                    <PullRequestCodeLinesElement>
                      {file.lines.slice(0, visibleLineCount).map((line) => (
                        <PullRequestCodeLineElement key={line.id} {...line} />
                      ))}
                    </PullRequestCodeLinesElement>
                    {visibleLineCount < file.lines.length ? (
                      <PullRequestCodeMoreElement
                        label={`Show ${Math.min(PULL_REQUEST_DIFF_MORE_LINE_COUNT, file.lines.length - visibleLineCount)} more lines`}
                        onActivate={() => props.onShowMoreFile(file.key)}
                      />
                    ) : null}
                  </>
                ) : null}
              </PullRequestCodeFileElement>
            );
          })}
        </>
      )}
    </PullRequestCodeRootElement>
  );
}
