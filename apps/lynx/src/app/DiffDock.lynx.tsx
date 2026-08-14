import { useEffect, useState } from '@lynx-js/react';
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

import './diff-dock.css';

export function DiffDock(props: {
  readonly availableWidth: number;
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly workspaceRoot: string | null;
}) {
  const [patch, setPatch] = useState<string | undefined>();
  const [pending, setPending] = useState(true);
  const [error, setError] = useState(false);
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

  useEffect(() => {
    'background only';
    if (!props.open || !props.workspaceRoot) return;
    let cancelled = false;
    async function loadDiff() {
      'background only';
      setPending(true);
      setError(false);
      try {
        const result = await fetchWorkingTreeDiff(props.workspaceRoot!);
        if (!cancelled) {
          setPatch(result.patch);
          setPending(false);
        }
      } catch {
        if (!cancelled) {
          setPending(false);
          setError(true);
        }
      }
    }
    void loadDiff();
    return () => {
      cancelled = true;
    };
  }, [props.open, props.workspaceRoot, refreshGeneration]);

  const view = buildPullRequestCodeView(
    patch,
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

  if (!props.open) return null;

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
        {pending ? (
          <view className="DiffDockState">
            <RefreshCwIcon
              size={16}
              color="var(--muted-foreground)"
            />
            <text className="DiffDockStateText">Loading changes…</text>
          </view>
        ) : error ? (
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
