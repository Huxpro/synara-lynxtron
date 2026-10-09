import { useMemo, useState } from "@lynx-js/react";
import { useMutation, useQuery } from "@tanstack/react-query";
import {
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
} from "@synara-web/components/pullRequest/PullRequestCodeComposition";
import {
  buildPullRequestCodeView,
  type PullRequestCodeView,
  type PullRequestDiffFileView,
} from "@synara-web/components/pullRequest/pullRequestCode.logic";

import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { Button } from "../components/ui/button.lynx";
import { IconButton } from "../components/ui/icon-button.lynx";
import { DockPaneHeader } from "./DockPaneHeader.lynx";
import { RefreshCwIcon } from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import {
  gitStageFilesMutationOptions,
  gitUnstageFilesMutationOptions,
  gitWorkingTreeDiffQueryOptions,
} from "@synara-web/lib/gitReactQuery";
import { queryClient } from "./queries";
import "./git-dock-pane.css";

type GitSection = "staged" | "unstaged";

interface SelectedGitFile {
  readonly path: string;
  readonly section: GitSection;
}

function filesFromView(view: PullRequestCodeView): readonly PullRequestDiffFileView[] {
  return view.kind === "files" ? view.files : [];
}

function selectedFileView(file: PullRequestDiffFileView | null): PullRequestCodeView {
  return file
    ? {
        kind: "files",
        additions: file.additions,
        deletions: file.deletions,
        files: [file],
      }
    : { kind: "empty" };
}

function GitFileRow(props: {
  readonly actionDisabled: boolean;
  readonly actionLabel: string;
  readonly file: PullRequestDiffFileView;
  readonly selected: boolean;
  readonly onAction: () => void;
  readonly onSelect: () => void;
}) {
  const row = useLynxInteractiveState({
    baseClassName: `GitDockFileRow${props.selected ? " GitDockFileRow--selected" : ""}`,
    accessibleLabel: `Open ${props.file.path}`,
    onActivate: props.onSelect,
  });
  return (
    <view className={row.className} {...row.eventProps}>
      <FileEntryIcon className="GitDockFileIcon" pathValue={props.file.path} />
      <text className="GitDockFilePath">{props.file.path}</text>
      <text className="GitDockFileAdditions">+{props.file.additions}</text>
      <text className="GitDockFileDeletions">-{props.file.deletions}</text>
      <Button
        aria-label={`${props.actionLabel} ${props.file.path}`}
        className="GitDockFileAction"
        disabled={props.actionDisabled}
        size="xs"
        variant="ghost"
        onClick={(event) => {
          event.stopPropagation();
          props.onAction();
        }}
      >
        {props.actionLabel}
      </Button>
    </view>
  );
}

function GitFileSection(props: {
  readonly actionDisabled: boolean;
  readonly actionLabel: string;
  readonly emptyLabel: string;
  readonly files: readonly PullRequestDiffFileView[];
  readonly selectedPath: string | null;
  readonly title: string;
  readonly onAction: (paths: readonly string[]) => void;
  readonly onSelect: (file: PullRequestDiffFileView) => void;
}) {
  return (
    <view className="GitDockSection">
      <view className="GitDockSectionHeader">
        <text className="GitDockSectionTitle">{props.title}</text>
        <text className="GitDockSectionCount">{props.files.length}</text>
        {props.files.length > 0 ? (
          <Button
            className="GitDockSectionAction"
            disabled={props.actionDisabled}
            size="xs"
            variant="ghost"
            onClick={() => props.onAction(props.files.map((file) => file.path))}
          >
            {props.actionLabel} all
          </Button>
        ) : null}
      </view>
      {props.files.length > 0 ? (
        <view className="GitDockFileRows">
          {props.files.map((file) => (
            <GitFileRow
              key={file.key}
              actionDisabled={props.actionDisabled}
              actionLabel={props.actionLabel}
              file={file}
              selected={file.path === props.selectedPath}
              onAction={() => props.onAction([file.path])}
              onSelect={() => props.onSelect(file)}
            />
          ))}
        </view>
      ) : (
        <text className="GitDockSectionEmpty">{props.emptyLabel}</text>
      )}
    </view>
  );
}

export function GitDockPane(props: {
  readonly threadId: string;
  readonly workspaceRoot: string;
  readonly onClose?: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const [selected, setSelected] = useState<SelectedGitFile | null>(null);
  const [visibleLineCounts, setVisibleLineCounts] = useState<Record<string, number>>({});
  const [error, setError] = useState<string | null>(null);
  const stagedQuery = useQuery(
    gitWorkingTreeDiffQueryOptions({ cwd: props.workspaceRoot, scope: "staged" }),
  );
  const unstagedQuery = useQuery(
    gitWorkingTreeDiffQueryOptions({ cwd: props.workspaceRoot, scope: "unstaged" }),
  );
  // Upstream's mutations invalidate this workspace's git queries when they settle.
  const stageMutation = useMutation(
    gitStageFilesMutationOptions({ cwd: props.workspaceRoot, queryClient }),
  );
  const unstageMutation = useMutation(
    gitUnstageFilesMutationOptions({ cwd: props.workspaceRoot, queryClient }),
  );
  const stagedView = useMemo(
    () =>
      buildPullRequestCodeView(stagedQuery.data?.patch, `git-dock:staged:${props.workspaceRoot}`),
    [props.workspaceRoot, stagedQuery.data?.patch],
  );
  const unstagedView = useMemo(
    () =>
      buildPullRequestCodeView(
        unstagedQuery.data?.patch,
        `git-dock:unstaged:${props.workspaceRoot}`,
      ),
    [props.workspaceRoot, unstagedQuery.data?.patch],
  );
  const stagedFiles = filesFromView(stagedView);
  const unstagedFiles = filesFromView(unstagedView);
  const mutation = {
    isPending: stageMutation.isPending || unstageMutation.isPending,
    mutate(input: { readonly action: "stage" | "unstage"; readonly paths: readonly string[] }) {
      setError(null);
      (input.action === "stage" ? stageMutation : unstageMutation).mutate(input.paths, {
        onError: (cause) => setError(cause instanceof Error ? cause.message : String(cause)),
      });
    },
  };
  const selectedResolved = selected
    ? (() => {
        const preferredFiles = selected.section === "staged" ? stagedFiles : unstagedFiles;
        const preferred = preferredFiles.find((file) => file.path === selected.path);
        if (preferred) return { file: preferred, section: selected.section };
        const fallbackSection: GitSection = selected.section === "staged" ? "unstaged" : "staged";
        const fallback = (fallbackSection === "staged" ? stagedFiles : unstagedFiles).find(
          (file) => file.path === selected.path,
        );
        return fallback ? { file: fallback, section: fallbackSection } : null;
      })()
    : null;
  const selectedFile = selectedResolved?.file ?? null;
  const selectedView = selectedFileView(selectedFile);
  const pending = stagedQuery.isPending || unstagedQuery.isPending;
  const queryError = stagedQuery.error ?? unstagedQuery.error;
  const hasChanges = stagedFiles.length > 0 || unstagedFiles.length > 0;

  return (
    <view className="GitDockPane">
      <DockPaneHeader
        title="Source control"
        closeLabel="Close source control"
        onClose={props.onClose}
        actions={
          <IconButton
            className="DockPaneHeaderIconButton"
            label="Refresh changes"
            onClick={() => {
              void stagedQuery.refetch();
              void unstagedQuery.refetch();
            }}
          >
            <RefreshCwIcon color={semanticIconColor("secondary")} size={14} />
          </IconButton>
        }
      />
      <scroll-view className="GitDockFileList" scroll-y enable-scroll-bar>
        <view className="GitDockFileListContent">
          {error || queryError ? (
            <text className="GitDockError">
              {error ?? "Could not load source-control changes."}
            </text>
          ) : pending && !hasChanges ? (
            <text className="GitDockState">Loading changes…</text>
          ) : !hasChanges ? (
            <text className="GitDockState">No changes in the working tree.</text>
          ) : (
            <>
              <GitFileSection
                actionDisabled={mutation.isPending}
                actionLabel="Unstage"
                emptyLabel="No staged changes."
                files={stagedFiles}
                selectedPath={
                  selectedResolved?.section === "staged" ? (selected?.path ?? null) : null
                }
                title="Staged"
                onAction={(paths) => {
                  "background only";
                  mutation.mutate({ action: "unstage", paths });
                }}
                onSelect={(file) => setSelected({ section: "staged", path: file.path })}
              />
              <GitFileSection
                actionDisabled={mutation.isPending}
                actionLabel="Stage"
                emptyLabel="No unstaged changes."
                files={unstagedFiles}
                selectedPath={
                  selectedResolved?.section === "unstaged" ? (selected?.path ?? null) : null
                }
                title="Changes"
                onAction={(paths) => {
                  "background only";
                  mutation.mutate({ action: "stage", paths });
                }}
                onSelect={(file) => setSelected({ section: "unstaged", path: file.path })}
              />
            </>
          )}
        </view>
      </scroll-view>
      <scroll-view className="GitDockDiff" scroll-y enable-scroll-bar>
        <PullRequestCodeComposition
          emptyLabel="Select a file to view its diff."
          expandedFileKeys={selectedFile ? [selectedFile.key] : []}
          filePathPresentation="basename-first"
          rawVisibleLineCount={PULL_REQUEST_DIFF_INITIAL_LINE_COUNT}
          showSummary={false}
          truncated={false}
          view={selectedView}
          visibleLineCounts={visibleLineCounts}
          wordWrap
          onShowMoreFile={(fileKey) =>
            setVisibleLineCounts((current) => ({
              ...current,
              [fileKey]:
                (current[fileKey] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT) +
                PULL_REQUEST_DIFF_MORE_LINE_COUNT,
            }))
          }
          onShowMoreRaw={() => {}}
          onToggleFile={() => {}}
        />
      </scroll-view>
    </view>
  );
}
