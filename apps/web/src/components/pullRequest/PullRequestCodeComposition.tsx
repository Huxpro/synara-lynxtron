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
  readonly emptyLabel?: string;
  readonly wordWrap?: boolean;
  readonly expandedFileKeys: readonly string[];
  readonly visibleLineCounts: Readonly<Record<string, number>>;
  readonly rawVisibleLineCount: number;
  readonly fileElementId?: (fileKey: string) => string | undefined;
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
          <PullRequestCodeNoticeElement intent="warning">{props.view.reason}</PullRequestCodeNoticeElement>
          <PullRequestCodeFileElement>
            <PullRequestCodeFileHeaderElement
              path="Raw patch"
              previousPath={null}
              relation={null}
              additions={0}
              deletions={0}
              expanded
              onActivate={() => {}}
            />
            <PullRequestCodeDisclosureElement expanded>
              <PullRequestCodeLinesElement wordWrap={props.wordWrap ?? false}>
                {props.view.lines.slice(0, props.rawVisibleLineCount).map((line) => (
                  <PullRequestCodeLineElement
                    key={line.id}
                    {...line}
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
          <PullRequestCodeStatsElement
            fileCount={props.view.files.length}
            additions={props.view.additions}
            deletions={props.view.deletions}
          />
          {props.view.files.map((file) => {
            const isExpanded = expanded.has(file.key);
            const visibleLineCount = props.visibleLineCounts[file.key] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT;
            return (
              <PullRequestCodeFileElement
                key={file.key}
                id={props.fileElementId?.(file.key)}
              >
                <PullRequestCodeFileHeaderElement
                  path={file.path}
                  previousPath={file.previousPath}
                  relation={file.relation}
                  additions={file.additions}
                  deletions={file.deletions}
                  expanded={isExpanded}
                  onActivate={() => props.onToggleFile(file.key)}
                />
                <PullRequestCodeDisclosureElement expanded={isExpanded}>
                    {file.binary ? (
                      <PullRequestCodeNoticeElement>Binary file changed.</PullRequestCodeNoticeElement>
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
                      {file.lines.slice(0, visibleLineCount).map((line) => (
                        <PullRequestCodeLineElement
                          key={line.id}
                          {...line}
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
