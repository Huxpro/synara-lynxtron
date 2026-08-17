import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { GitReadWorkingTreeDiffResult } from '@synara/contracts';
import {
  formatGitPathForDisplay,
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
} from '@synara-web/components/pullRequest/PullRequestCodeComposition';
import {
  buildPullRequestCodeView,
  type PullRequestDiffFileView,
} from '@synara-web/components/pullRequest/pullRequestCode.logic';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { RefreshCwIcon, SearchIcon, XIcon } from '../lib/icons.lynx';
import { fetchWorkingTreeDiff } from '../data/synaraClient.lynx';
import { Button } from '../components/ui/button.lynx';
import { Input } from '../components/ui/input.lynx';
import { scrollLynxElementIntoViewById } from '../components/ui/scrollIntoView.lynx';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { webStorage } from '../platform/storage';

import './diff-dock.css';

export function DiffDock(props: {
  readonly availableWidth: number;
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly initialSelectedFilePath?: string | null;
  readonly unavailableLabel?: string | null;
  readonly presentation?: 'dock' | 'editor';
  readonly workspaceRoot: string | null;
}) {
  if (!props.open || !props.workspaceRoot) return null;

  return (
    <OpenDiffDock
      availableWidth={props.availableWidth}
      initialDiff={props.initialDiff}
      initialSelectedFilePath={props.initialSelectedFilePath}
      onClose={props.onClose}
      onWidthChange={props.onWidthChange}
      presentation={props.presentation ?? 'dock'}
      unavailableLabel={props.unavailableLabel}
      workspaceRoot={props.workspaceRoot}
    />
  );
}

function OpenDiffDock(props: {
  readonly availableWidth: number;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly initialSelectedFilePath?: string | null;
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly presentation: 'dock' | 'editor';
  readonly unavailableLabel?: string | null;
  readonly workspaceRoot: string;
}) {
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [expandedFileKeys, setExpandedFileKeys] = useState<string[] | null>(
    props.presentation === 'editor' ? null : []
  );
  const [selectedFilePath, setSelectedFilePath] = useState<string | null>(
    props.initialSelectedFilePath ?? null
  );
  const [visibleLineCounts, setVisibleLineCounts] = useState<
    Record<string, number>
  >({});
  const [rawVisibleLineCount, setRawVisibleLineCount] = useState(
    PULL_REQUEST_DIFF_INITIAL_LINE_COUNT
  );
  const [fileJumpOpen, setFileJumpOpen] = useState(false);
  const [fileJumpQuery, setFileJumpQuery] = useState('');
  const closeFileJump = () => {
    setFileJumpOpen(false);
    setFileJumpQuery('');
  };
  const diffWordWrap = readSettingsBehaviorProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  ).diffWordWrap;

  const diff = useQuery({
    queryKey: ['working-tree-diff', props.workspaceRoot, refreshGeneration],
    queryFn: () => {
      'background only';
      return fetchWorkingTreeDiff(props.workspaceRoot);
    },
    initialData: refreshGeneration === 0 ? props.initialDiff : undefined,
    enabled: !props.unavailableLabel,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const view = buildPullRequestCodeView(
    diff.data?.patch,
    `working-tree:${props.workspaceRoot ?? 'none'}`
  );
  const selectedFile =
    view.kind === 'files'
      ? view.files.find((file) => file.path === selectedFilePath) ?? view.files[0]
      : undefined;
  const visibleView =
    props.presentation === 'editor' && view.kind === 'files' && selectedFile
      ? {
          ...view,
          additions: selectedFile.additions,
          deletions: selectedFile.deletions,
          files: [selectedFile],
        }
      : view;
  const visibleExpandedFileKeys =
    expandedFileKeys ??
    (selectedFile ? [selectedFile.key] : []);
  const fileElementId = (fileKey: string) =>
    `diff-dock-file-${view.kind === 'files' ? view.files.findIndex((file) => file.key === fileKey) : -1}`;
  const fileJumpFiles =
    view.kind === 'files'
      ? view.files.filter((file) =>
          file.path.toLowerCase().includes(fileJumpQuery.trim().toLowerCase())
        )
      : [];
  const jumpToFile = (file: PullRequestDiffFileView) => {
    setExpandedFileKeys([file.key]);
    closeFileJump();
    scrollLynxElementIntoViewById(fileElementId(file.key));
  };
  const closeInteraction = useLynxInteractiveState({
    baseClassName: 'DiffDockClose',
    accessibleLabel: 'Close changes',
    onActivate: props.onClose,
  });
  const retryInteraction = useLynxInteractiveState({
    baseClassName: 'DiffDockRetry',
    accessibleLabel: 'Retry loading changes',
    onActivate: () => setRefreshGeneration((current) => current + 1),
  });

  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className="DiffDock"
      defaultWidth={
        props.availableWidth > 0
          ? Math.round(props.availableWidth / 2)
          : 640
      }
      maxWidth={720}
      minimumMainWidth={320}
      minWidth={320}
      onWidthChange={props.onWidthChange}
      resizable={props.presentation === 'dock'}
    >
      {props.presentation === 'dock' ? (
        <view className="DiffDockHeader">
          <view className="DiffDockIdentity">
            <text className="DiffDockTitle">Changes</text>
            {view.kind === 'files' ? (
              <text className="DiffDockStats">
                +{view.additions} −{view.deletions}
              </text>
            ) : null}
          </view>
          <view
            className="DiffDockHeaderActions"
          >
            {view.kind === 'files' && view.files.length > 1 ? (
              <Button
                aria-label="Jump to file"
                className="DiffDockFileJumpTrigger"
                variant="ghost"
                onClick={() => setFileJumpOpen(true)}
              >
                <SearchIcon size={14} color="var(--muted-foreground)" />
              </Button>
            ) : null}
            <view
              className={closeInteraction.className}
              {...closeInteraction.eventProps}
            >
              <XIcon
                size={14}
                color="var(--muted-foreground)"
              />
            </view>
          </view>
        </view>
      ) : null}
      <view className="DiffDockBody">
        {props.presentation === 'editor' && view.kind === 'files' ? (
          <view className="DiffDockFileSidebar">
            <view className="DiffDockFileSidebarHeader">
              <text className="DiffDockFileSidebarTitle">Changed files</text>
              <text className="DiffDockFileSidebarCount">
                {view.files.length}
              </text>
            </view>
            <scroll-view
              className="DiffDockFileSidebarList"
              scroll-orientation="vertical"
            >
              {view.files.map((file) => (
                <EditorDiffFileRow
                  key={file.key}
                  additions={file.additions}
                  deletions={file.deletions}
                  path={file.path}
                  selected={file.key === selectedFile?.key}
                  onActivate={() => {
                    'background only';
                    setSelectedFilePath(file.path);
                    setExpandedFileKeys([file.key]);
                  }}
                />
              ))}
            </scroll-view>
          </view>
        ) : null}
        <scroll-view className="DiffDockScroller" scroll-y enable-scroll-bar>
        {props.unavailableLabel ? (
          <view className="DiffDockState">
            <text className="DiffDockStateText">{props.unavailableLabel}</text>
          </view>
        ) : diff.isPending ? (
          <view className="DiffDockState">
            <RefreshCwIcon
              size={16}
              color="var(--muted-foreground)"
            />
            <text className="DiffDockStateText">Loading changes…</text>
          </view>
        ) : diff.error ? (
          <view className="DiffDockState">
            <text className="DiffDockStateText">Couldn’t load changes.</text>
            <view
              className={retryInteraction.className}
              {...retryInteraction.eventProps}
            >
              <text className="DiffDockRetryText">Retry</text>
            </view>
          </view>
        ) : (
          <PullRequestCodeComposition
            emptyLabel="No working tree changes."
            wordWrap={diffWordWrap}
            fileElementId={fileElementId}
            view={visibleView}
            truncated={false}
            expandedFileKeys={visibleExpandedFileKeys}
            visibleLineCounts={visibleLineCounts}
            rawVisibleLineCount={rawVisibleLineCount}
            onToggleFile={(fileKey) =>
              setExpandedFileKeys(
                visibleExpandedFileKeys.includes(fileKey)
                  ? visibleExpandedFileKeys.filter((key) => key !== fileKey)
                  : [...visibleExpandedFileKeys, fileKey]
              )
            }
            onShowMoreFile={(fileKey) =>
              setVisibleLineCounts((current) => ({
                ...current,
                [fileKey]:
                  (current[fileKey] ?? PULL_REQUEST_DIFF_INITIAL_LINE_COUNT) +
                  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
              }))
            }
            onShowMoreRaw={() =>
              setRawVisibleLineCount(
                (current) => current + PULL_REQUEST_DIFF_MORE_LINE_COUNT
              )
            }
          />
        )}
        </scroll-view>
      </view>
      {fileJumpOpen ? (
        <view
          className="DiffDockFileJumpViewport"
          accessibility-element
          accessibility-label="Jump to file dialog"
          accessibility-traits="dialog"
          bindkeydown={(event: { readonly key?: string }) => {
            'background only';
            if (event.key === 'Escape') closeFileJump();
          }}
          tabindex={0}
        >
          <view
            className="DiffDockFileJumpBackdrop"
            bindtap={closeFileJump}
          />
          <view
            className="DiffDockFileJumpDialog"
            accessibility-element
            accessibility-label="Jump to file"
            accessibility-traits="dialog"
          >
            <Button
              aria-label="Close file picker"
              className="DiffDockFileJumpClose"
              variant="ghost"
              onClick={closeFileJump}
            >
              ×
            </Button>
            <text className="DiffDockFileJumpHeading">Jump to file</text>
            <Input
              nativeInput
              className="DiffDockFileJumpSearch"
              accessibility-label="Search changed files"
              placeholder="Jump to file"
              onInput={setFileJumpQuery}
              onConfirm={() => {
                if (fileJumpFiles.length === 1) {
                  jumpToFile(fileJumpFiles[0]!);
                }
              }}
            />
            <scroll-view
              className="DiffDockFileJumpList"
              scroll-orientation="vertical"
            >
              {fileJumpFiles.length === 0 ? (
                <text className="DiffDockFileJumpEmpty">
                  No matching files.
                </text>
              ) : (
                fileJumpFiles.map((file) => (
                  <Button
                    key={file.key}
                    className={`DiffDockFileJumpItem${
                      visibleExpandedFileKeys.includes(file.key)
                        ? ' DiffDockFileJumpItem--active'
                        : ''
                    }`}
                    variant="ghost"
                    onClick={() => jumpToFile(file)}
                  >
                    <text className="DiffDockFileJumpPath">
                      {formatGitPathForDisplay(file.path)}
                    </text>
                    <text className="SharedPrCodeStatsAddition">
                      +{file.additions}
                    </text>
                    <text className="SharedPrCodeStatsDeletion">
                      -{file.deletions}
                    </text>
                  </Button>
                ))
              )}
            </scroll-view>
          </view>
        </view>
      ) : null}
    </ResizableRightPanel>
  );
}

function EditorDiffFileRow(props: {
  readonly additions: number;
  readonly deletions: number;
  readonly onActivate: () => void;
  readonly path: string;
  readonly selected: boolean;
}) {
  const displayPath = formatGitPathForDisplay(props.path);
  const interaction = useLynxInteractiveState({
    baseClassName: `DiffDockFileRow${
      props.selected ? ' DiffDockFileRow--selected' : ''
    }`,
    accessibleLabel: `Open ${displayPath}`,
    onActivate: props.onActivate,
  });
  const slash = displayPath.lastIndexOf('/');
  const directory =
    slash === -1 ? '' : displayPath.slice(0, slash + 1);
  const name = slash === -1 ? displayPath : displayPath.slice(slash + 1);
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <view className="DiffDockFileIdentity">
        <text className="DiffDockFileName">{name}</text>
        {directory ? (
          <text className="DiffDockFileDirectory">{directory}</text>
        ) : null}
      </view>
      <text className="SharedPrCodeStatsAddition">+{props.additions}</text>
      <text className="SharedPrCodeStatsDeletion">-{props.deletions}</text>
    </view>
  );
}
