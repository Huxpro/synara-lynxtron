import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import {
  PULL_REQUEST_DIFF_INITIAL_LINE_COUNT,
  PULL_REQUEST_DIFF_MORE_LINE_COUNT,
  PullRequestCodeComposition,
} from '@synara-web/components/pullRequest/PullRequestCodeComposition';
import { buildPullRequestCodeView } from '@synara-web/components/pullRequest/pullRequestCode.logic';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
} from '@synara-web/appSettingsStorageProjection.logic';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { RefreshCwIcon, XIcon } from '../lib/icons.lynx';
import { fetchWorkingTreeDiff } from '../data/synaraClient.lynx';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { webStorage } from '../platform/storage';
import type { GitReadWorkingTreeDiffResult } from '@synara/contracts';

import './diff-dock.css';

export function DiffDock(props: {
  readonly availableWidth: number;
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly workspaceRoot: string | null;
}) {
  if (!props.open || !props.workspaceRoot) return null;

  return (
    <OpenDiffDock
      availableWidth={props.availableWidth}
      initialDiff={props.initialDiff}
      onClose={props.onClose}
      onWidthChange={props.onWidthChange}
      workspaceRoot={props.workspaceRoot}
    />
  );
}

function OpenDiffDock(props: {
  readonly availableWidth: number;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly workspaceRoot: string;
}) {
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [expandedFileKeys, setExpandedFileKeys] = useState<string[]>([]);
  const [visibleLineCounts, setVisibleLineCounts] = useState<
    Record<string, number>
  >({});
  const [rawVisibleLineCount, setRawVisibleLineCount] = useState(
    PULL_REQUEST_DIFF_INITIAL_LINE_COUNT
  );
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
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });

  const view = buildPullRequestCodeView(
    diff.data?.patch,
    `working-tree:${props.workspaceRoot ?? 'none'}`
  );
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
      resizable
    >
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
          className={closeInteraction.className}
          {...closeInteraction.eventProps}
        >
          <XIcon
            size={14}
            color="var(--muted-foreground)"
          />
        </view>
      </view>
      <scroll-view className="DiffDockScroller" scroll-y enable-scroll-bar>
        {diff.isPending ? (
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
            wordWrap={diffWordWrap}
            view={view}
            truncated={false}
            expandedFileKeys={expandedFileKeys}
            visibleLineCounts={visibleLineCounts}
            rawVisibleLineCount={rawVisibleLineCount}
            onToggleFile={(fileKey) =>
              setExpandedFileKeys((current) =>
                current.includes(fileKey)
                  ? current.filter((key) => key !== fileKey)
                  : [...current, fileKey]
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
    </ResizableRightPanel>
  );
}
