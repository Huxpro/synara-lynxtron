import { useState, type ReactNode } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  GitReadWorkingTreeDiffResult,
  OrchestrationCheckpointSummary,
} from '@synara/contracts';
import { RIGHT_DOCK_MIN_WIDTH_PX } from '@synara/shared/rightDock';
import {
  buildPathTree,
  filterPathsForSearch,
  type PathTreeNode,
} from '@synara/shared/pathTree';
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
import differenceSvg from '@synara-central-icons/difference-modified.svg?raw';
import {
  AdjustmentsHorizontalIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  CopyIcon,
  EllipsisIcon,
  FolderOpenIcon,
  FoldersIcon,
  PanelRightCloseIcon,
  PlusIcon,
  RefreshCwIcon,
  SearchIcon,
  TextWrapIcon,
  XIcon,
} from '../lib/icons.lynx';
import {
  fetchWorkingTreeDiff,
  fetchGitStatus,
  fetchFullThreadDiff,
  fetchTurnDiff,
  highlightExplorerCode,
} from '../data/synaraClient.lynx';
import { Button } from '../components/ui/button.lynx';
import { FileEntryIcon } from '../components/FileEntryIcon.lynx';
import { Input } from '../components/ui/input.lynx';
import {
  Menu,
  MenuCheckboxItem,
  MenuGroup,
  MenuGroupLabel,
  MenuItem,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import { scrollLynxElementIntoViewById } from '../components/ui/scrollIntoView.lynx';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { EditorSurfaceTab } from './EditorSurfaceTab.lynx';
import { webStorage } from '../platform/storage';
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import { ExplorerFileActionsMenu } from './ExplorerPreviewHeader.lynx';
import { EnvironmentGitAction } from './EnvironmentPanel.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import {
  buildDiffSyntaxHighlightRequests,
  mergeDiffSyntaxHighlightResults,
} from './diffSyntaxHighlighting.logic';
import {
  resolveEditorDiffRequest,
  sortEditorDiffCheckpoints,
  type EditorDiffSource as DiffSource,
} from './editorDiffSource.logic';

import './diff-dock.css';

function DockHeaderIconButton(props: {
  readonly children: ReactNode;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'DiffDockHeaderIconButton',
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {props.children}
    </view>
  );
}

export function DiffDock(props: {
  readonly availableWidth: number;
  readonly onClose: () => void;
  readonly onAddExplorer?: () => void;
  readonly dockTabHeader?: ReactNode;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly initialDiffSource?: DiffSource;
  readonly initialFileTreeOpen?: boolean;
  readonly onFileTreeOpenChange?: (open: boolean) => void;
  readonly initialActionMenuOpen?: boolean;
  readonly initialSelectedFilePath?: string | null;
  readonly checkpoints?: readonly OrchestrationCheckpointSummary[];
  readonly unavailableLabel?: string | null;
  readonly presentation?: 'dock' | 'editor' | 'hosted';
  readonly sidebarVisible?: boolean;
  readonly threadId: string;
  readonly workspaceRoot: string | null;
}) {
  const present = useLynxDisclosurePresence(
    props.open && Boolean(props.workspaceRoot),
    { transitionMs: 300 }
  );
  if (!present || !props.workspaceRoot) return null;

  return (
    <OpenDiffDock
      availableWidth={props.availableWidth}
      initialDiff={props.initialDiff}
      initialDiffSource={props.initialDiffSource}
      initialFileTreeOpen={props.initialFileTreeOpen}
      onFileTreeOpenChange={props.onFileTreeOpenChange}
      initialActionMenuOpen={props.initialActionMenuOpen}
      initialSelectedFilePath={props.initialSelectedFilePath}
      checkpoints={props.checkpoints ?? []}
      onClose={props.onClose}
      onAddExplorer={props.onAddExplorer}
      dockTabHeader={props.dockTabHeader}
      onWidthChange={props.onWidthChange}
      open={props.open}
      presentation={props.presentation ?? 'dock'}
      sidebarVisible={props.sidebarVisible}
      threadId={props.threadId}
      unavailableLabel={props.unavailableLabel}
      workspaceRoot={props.workspaceRoot}
    />
  );
}

function OpenDiffDock(props: {
  readonly availableWidth: number;
  readonly initialDiff?: GitReadWorkingTreeDiffResult;
  readonly initialDiffSource?: DiffSource;
  readonly initialFileTreeOpen?: boolean;
  readonly onFileTreeOpenChange?: (open: boolean) => void;
  readonly initialActionMenuOpen?: boolean;
  readonly initialSelectedFilePath?: string | null;
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
  readonly onClose: () => void;
  readonly onAddExplorer?: () => void;
  readonly dockTabHeader?: ReactNode;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly presentation: 'dock' | 'editor' | 'hosted';
  readonly sidebarVisible?: boolean;
  readonly threadId: string;
  readonly unavailableLabel?: string | null;
  readonly workspaceRoot: string;
}) {
  const { resolvedTheme, svgColors } = useTheme();
  const [refreshGeneration, setRefreshGeneration] = useState(0);
  const [expandedFileKeys, setExpandedFileKeys] = useState<string[] | null>(
    null
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
  const [fileTreeOpen, setFileTreeOpen] = useState(
    props.initialFileTreeOpen === true
  );
  const [fileTreeInteracted, setFileTreeInteracted] = useState(false);
  const updateFileTreeOpen = (open: boolean) => {
    setFileTreeInteracted(true);
    setFileTreeOpen(open);
    props.onFileTreeOpenChange?.(open);
  };
  const [fileTreeQuery, setFileTreeQuery] = useState('');
  const [collapsedTreePaths, setCollapsedTreePaths] = useState<ReadonlySet<string>>(
    new Set()
  );
  const fileTreePresent = useLynxDisclosurePresence(fileTreeOpen);
  const fileTreeVisible =
    fileTreeOpen ||
    (!fileTreeInteracted && props.initialFileTreeOpen === true);
  const closeFileJump = () => {
    setFileJumpOpen(false);
    setFileJumpQuery('');
  };
  const [diffWordWrap, setDiffWordWrap] = useState(
    () =>
      readSettingsBehaviorProjection(
        webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
      ).diffWordWrap
  );
  const [diffRenderMode, setDiffRenderMode] = useState<'stacked' | 'split'>(
    'split'
  );
  const [diffIgnoreWhitespace, setDiffIgnoreWhitespace] = useState(true);
  const [diffSource, setDiffSource] = useState<DiffSource>(
    props.initialDiffSource ?? 'workingTree'
  );
  const [diffCopied, setDiffCopied] = useState(false);
  const orderedCheckpoints = sortEditorDiffCheckpoints(props.checkpoints);
  const diffRequest = resolveEditorDiffRequest(diffSource, orderedCheckpoints);

  const diff = useQuery({
    queryKey: [
      'working-tree-diff',
      props.workspaceRoot,
      diffSource,
      diffIgnoreWhitespace,
      refreshGeneration,
    ],
    queryFn: () => {
      'background only';
      if (diffRequest.kind === 'empty') return Promise.resolve({ patch: '' });
      if (diffRequest.kind === 'full-thread') {
        return fetchFullThreadDiff({
          threadId: props.threadId,
          toTurnCount: diffRequest.toTurnCount,
          ignoreWhitespace: diffIgnoreWhitespace,
        }).then((result) => ({ patch: result.diff }));
      }
      if (diffRequest.kind === 'turn') {
        return fetchTurnDiff({
          threadId: props.threadId,
          fromTurnCount: diffRequest.fromTurnCount,
          toTurnCount: diffRequest.toTurnCount,
          ignoreWhitespace: diffIgnoreWhitespace,
        }).then((result) => ({ patch: result.diff }));
      }
      return fetchWorkingTreeDiff(props.workspaceRoot, diffRequest.scope);
    },
    initialData:
      refreshGeneration === 0 && diffSource === 'workingTree'
        ? props.initialDiff
        : undefined,
    enabled: !props.unavailableLabel,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const gitStatus = useQuery({
    queryKey: ['diff-dock-git-status', props.workspaceRoot, refreshGeneration],
    queryFn: () => {
      'background only';
      return fetchGitStatus(props.workspaceRoot);
    },
    enabled: !props.unavailableLabel,
    retry: false,
    staleTime: 15_000,
  });

  const view = buildPullRequestCodeView(
    diff.data?.patch,
    `working-tree:${props.workspaceRoot ?? 'none'}`
  );
  const copyDiff = async () => {
    'background only';
    const patch = diff.data?.patch;
    if (!patch) return;
    const { clipboard } = await import(
      /* webpackMode: "eager" */ '../platform/clipboard'
    );
    await clipboard.writeText(patch);
    setDiffCopied(true);
  };
  const selectedFile =
    view.kind === 'files'
      ? view.files.find((file) => file.path === selectedFilePath) ?? view.files[0]
      : undefined;
  // The file sidebar is a navigator for the complete diff, never a filter.
  // Preserve hunk metadata in Editor mode too: Web's diff renderer keeps these
  // rows in both dock and workspace presentations to anchor the two line grids.
  const visibleView = view;
  const syntaxHighlightRequests =
    visibleView.kind === 'files'
      ? buildDiffSyntaxHighlightRequests(visibleView.files)
      : [];
  const syntaxHighlights = useQuery({
    queryKey: [
      'working-tree-diff-syntax',
      props.workspaceRoot,
      refreshGeneration,
      diff.data?.patch ?? '',
    ],
    queryFn: () => {
      'background only';
      return Promise.all(
        syntaxHighlightRequests.map(({ code, path }) =>
          highlightExplorerCode({ code, path })
        )
      );
    },
    enabled: syntaxHighlightRequests.length > 0,
    retry: false,
    staleTime: Number.POSITIVE_INFINITY,
  });
  const syntaxTokensByLineId = mergeDiffSyntaxHighlightResults({
    requests: syntaxHighlightRequests,
    results: syntaxHighlights.data ?? [],
    theme: resolvedTheme,
  });
  const visibleExpandedFileKeys =
    expandedFileKeys ??
    (view.kind === 'files' ? view.files.map((file) => file.key) : []);
  const allFilesCollapsed =
    view.kind === 'files' && visibleExpandedFileKeys.length === 0;
  const toggleCollapseAll = () => {
    if (view.kind !== 'files') return;
    setExpandedFileKeys(
      allFilesCollapsed ? view.files.map((file) => file.key) : []
    );
  };
  const fileElementId = (fileKey: string) =>
    `diff-dock-file-${view.kind === 'files' ? view.files.findIndex((file) => file.key === fileKey) : -1}`;
  const fileJumpFiles =
    view.kind === 'files'
      ? view.files.filter((file) =>
          file.path.toLowerCase().includes(fileJumpQuery.trim().toLowerCase())
        )
      : [];
  const fileTreePaths =
    view.kind === 'files' ? view.files.map((file) => file.path) : [];
  const fileTree = buildPathTree(
    filterPathsForSearch(fileTreePaths, fileTreeQuery)
  );
  const fileTreeSearching = fileTreeQuery.trim().length > 0;
  const toggleTreeDirectory = (path: string) => {
    setCollapsedTreePaths((current) => {
      const next = new Set(current);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  };
  const selectTreeFile = (path: string) => {
    const file = view.kind === 'files'
      ? view.files.find((candidate) => candidate.path === path)
      : undefined;
    if (file) jumpToFile(file);
  };
  const jumpToFile = (file: PullRequestDiffFileView) => {
    setSelectedFilePath(file.path);
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
      className={`DiffDock${
        props.presentation === 'hosted' ? ' DiffDock--hosted' : ''
      }${props.open ? ' DiffDock--open' : ' DiffDock--closed'}`}
      defaultWidth={
        props.availableWidth > 0
          ? Math.max(
              RIGHT_DOCK_MIN_WIDTH_PX,
              Math.round(props.availableWidth / 2)
            )
          : RIGHT_DOCK_MIN_WIDTH_PX
      }
      maxWidth={720}
      minimumMainWidth={320}
      minWidth={RIGHT_DOCK_MIN_WIDTH_PX}
      onWidthChange={props.onWidthChange}
      hosted={props.presentation === 'hosted'}
      resizable={props.presentation === 'dock'}
    >
      {props.presentation === 'dock' ? (
        <>
          {props.dockTabHeader ?? <view className="DiffDockTabHeader">
            <view className="DiffDockTabList">
              <EditorSurfaceTab
                active
                className="DiffDockTab"
                closeLabel="Close Diff"
                icon={
                  <svg
                    className="DiffDockTabIcon"
                    content={colorizeLynxSvg(
                      differenceSvg,
                      svgColors.mutedForeground
                    )}
                  />
                }
                label="Diff"
                labelClassName="DiffDockTabTitle"
                onClose={props.onClose}
              />
            </view>
            <view className="DiffDockTabActions">
              {props.onAddExplorer ? (
                <Menu>
                  <MenuTrigger
                    ariaLabel="Add panel"
                    className="DiffDockHeaderIconButton"
                  >
                    <PlusIcon size={14} />
                  </MenuTrigger>
                  <MenuPopup
                    side="bottom"
                    align="end"
                    className="DiffDockAddPanelMenu"
                  >
                    <MenuGroup>
                      <MenuGroupLabel>Panel</MenuGroupLabel>
                      <MenuItem onClick={props.onAddExplorer}>
                        <FolderOpenIcon size={14} />
                        <text>Explorer</text>
                      </MenuItem>
                    </MenuGroup>
                  </MenuPopup>
                </Menu>
              ) : null}
              <DockHeaderIconButton
                label="Collapse panel"
                onActivate={props.onClose}
              >
                <PanelRightCloseIcon size={14} />
              </DockHeaderIconButton>
            </view>
          </view>}
        </>
      ) : null}
      {props.presentation !== 'editor' ? (
          <view className="DiffDockHeader">
            <view className="DiffDockIdentity">
              <DiffSourcePicker
                checkpoints={orderedCheckpoints}
                diffSource={diffSource}
                fileCount={view.kind === 'files' ? view.files.length : 0}
                onDiffSourceChange={setDiffSource}
              />
              {view.kind === 'files' ? (
                <text className="DiffDockStats DiffDockActiveStats">
                  +{view.additions} −{view.deletions}
                </text>
              ) : null}
            </view>
            <view className="DiffDockHeaderActions">
              <DiffOptionsMenu
                allFilesCollapsed={allFilesCollapsed}
                diffCopied={diffCopied}
                diffIgnoreWhitespace={diffIgnoreWhitespace}
                diffRenderMode={diffRenderMode}
                diffSource={diffSource}
                diffWordWrap={diffWordWrap}
                hasCopyText={Boolean(diff.data?.patch)}
                hasFiles={view.kind === 'files'}
                label="Diff view options"
                onCopyDiff={() => void copyDiff()}
                onDiffIgnoreWhitespaceChange={setDiffIgnoreWhitespace}
                onDiffRenderModeChange={setDiffRenderMode}
                onDiffSourceChange={setDiffSource}
                checkpoints={orderedCheckpoints}
                onDiffWordWrapChange={setDiffWordWrap}
                onToggleCollapseAll={toggleCollapseAll}
                triggerClassName="DiffDockToolbarMenuTrigger"
                showSource={false}
              />
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
              {view.kind === 'files' ? (
                <DockHeaderIconButton
                  label={fileTreeOpen ? 'Hide file tree' : 'Show file tree'}
                  onActivate={() => updateFileTreeOpen(!fileTreeOpen)}
                >
                  <FoldersIcon
                    size={14}
                    color={fileTreeOpen ? 'var(--foreground)' : 'var(--muted-foreground)'}
                  />
                </DockHeaderIconButton>
              ) : null}
              <view className="DiffDockToolbarDivider" />
              <EnvironmentGitAction
                branch={gitStatus.data?.branch ?? null}
                gitStatus={gitStatus.data ?? null}
                open={props.open}
                presentation="toolbar"
                threadId={props.threadId}
                workspaceRoot={props.workspaceRoot}
                onCompleted={() => setRefreshGeneration((current) => current + 1)}
              />
              <DiffTurnPicker
                checkpoints={orderedCheckpoints}
                diffSource={diffSource}
                onDiffSourceChange={setDiffSource}
              />
              <view className="DiffDockToolbarDivider" />
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
        {props.presentation === 'editor' &&
        props.sidebarVisible !== false &&
        view.kind === 'files' ? (
          <view className="DiffDockFileSidebar">
            <view className="DiffDockFileSidebarHeader">
              <svg
                className="DiffDockFileSidebarIcon"
                content={colorizeLynxSvg(
                  differenceSvg,
                  svgColors.mutedForeground
                )}
              />
              <text className="DiffDockFileSidebarTitle">Changed files</text>
              <text className="DiffDockFileSidebarCount">
                {view.files.length}
              </text>
              <EditorDiffOptionsMenu
                allFilesCollapsed={allFilesCollapsed}
                diffCopied={diffCopied}
                diffIgnoreWhitespace={diffIgnoreWhitespace}
                diffRenderMode={diffRenderMode}
                diffSource={diffSource}
                diffWordWrap={diffWordWrap}
                hasCopyText={Boolean(diff.data?.patch)}
                onCopyDiff={() => void copyDiff()}
                onDiffIgnoreWhitespaceChange={setDiffIgnoreWhitespace}
                onDiffRenderModeChange={setDiffRenderMode}
                onDiffSourceChange={setDiffSource}
                checkpoints={orderedCheckpoints}
                onDiffWordWrapChange={setDiffWordWrap}
                onToggleCollapseAll={toggleCollapseAll}
              />
            </view>
            <view className="DiffDockFileSidebarStats">
              <text className="DiffDockFileSidebarAddition">
                +{view.additions}
              </text>
              <text className="DiffDockFileSidebarDeletion">
                -{view.deletions}
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
                    setExpandedFileKeys((current) =>
                      current === null || current.includes(file.key)
                        ? current
                        : [...current, file.key]
                    );
                    scrollLynxElementIntoViewById(fileElementId(file.key));
                  }}
                />
              ))}
            </scroll-view>
          </view>
        ) : null}
        <view
          className={`DiffDockPatchViewportFrame${
            props.presentation !== 'editor' && fileTreeVisible
              ? ' DiffDockPatchViewportFrame--with-review-tree'
              : ''
          }`}
        >
        <scroll-view
          className="DiffDockScroller DiffDockPatchViewport"
          scroll-y
          enable-scroll-bar
        >
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
            // Both the editor center and the dock follow the same compact file
            // header anatomy as Web: type glyph, basename, then muted directory.
            filePathPresentation="basename-first"
            renderMode={
              props.presentation !== 'editor' ? diffRenderMode : 'split'
            }
            // The Editor composition owns aggregate stats in its changed-files
            // sidebar; its center is reserved for full file cards. The ordinary
            // diff dock has no sidebar, so it keeps the shared summary inline.
            showSummary={props.presentation !== 'editor'}
            syntaxTokensByLineId={syntaxTokensByLineId}
            wordWrap={diffWordWrap}
            renderFileActions={
              (filePath) => (
                <DiffFileActionsMenu
                  defaultOpen={
                    props.initialActionMenuOpen === true &&
                    filePath === selectedFile?.path
                  }
                  filePath={filePath}
                  threadId={props.threadId}
                />
              )
            }
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
        {props.presentation !== 'editor' &&
        (fileTreePresent || fileTreeVisible) &&
        view.kind === 'files' ? (
          <ReviewFileTree
            className={
              fileTreeInteracted
                ? disclosureContentClassName(
                    fileTreeOpen,
                    'DiffDockReviewTreeMotion'
                  )
                : ''
            }
            nodes={fileTree}
            query={fileTreeQuery}
            searching={fileTreeSearching}
            selectedFilePath={selectedFile?.path ?? null}
            collapsedPaths={collapsedTreePaths}
            onClose={() => updateFileTreeOpen(false)}
            onQueryChange={setFileTreeQuery}
            onSelectFile={selectTreeFile}
            onToggleDirectory={toggleTreeDirectory}
          />
        ) : null}
      </view>
      {fileJumpOpen ? (
        <view
          className="DiffDockFileJumpViewport"
          accessibility-element
          accessibility-label="Jump to file dialog"
          accessibility-trait="dialog"
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
            accessibility-trait="dialog"
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

function EditorDiffOptionsMenu(props: {
  readonly allFilesCollapsed: boolean;
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
  readonly diffCopied: boolean;
  readonly diffIgnoreWhitespace: boolean;
  readonly diffRenderMode: 'stacked' | 'split';
  readonly diffSource: DiffSource;
  readonly diffWordWrap: boolean;
  readonly hasCopyText: boolean;
  readonly onCopyDiff: () => void;
  readonly onDiffIgnoreWhitespaceChange: (enabled: boolean) => void;
  readonly onDiffRenderModeChange: (mode: 'stacked' | 'split') => void;
  readonly onDiffSourceChange: (source: DiffSource) => void;
  readonly onDiffWordWrapChange: (enabled: boolean) => void;
  readonly onToggleCollapseAll: () => void;
}) {
  return (
    <DiffOptionsMenu
      {...props}
      hasFiles
      label="Diff options"
      triggerClassName="DiffDockEditorOptionsTrigger"
      showSource
    />
  );
}

function diffSourceLabel(source: DiffSource): string {
  if (source === 'workingTree') return 'Working tree';
  if (source === 'unstaged') return 'Unstaged changes';
  if (source === 'staged') return 'Staged changes';
  if (source === 'branch') return 'Branch changes';
  if (source === 'allTurns') return 'All turns';
  if (source === 'lastTurn') return 'Last turn';
  return 'Turn';
}

function DiffPickerTrigger(props: {
  readonly label: string;
  readonly count?: number;
  readonly className: string;
}) {
  return (
    <view className={props.className}>
      <AdjustmentsHorizontalIcon size={14} color="var(--foreground)" />
      <text className="DiffDockPickerLabel">{props.label}</text>
      {props.count ? (
        <text className="DiffDockPickerCount">{props.count}</text>
      ) : null}
      <ChevronDownIcon size={12} color="var(--muted-foreground)" />
    </view>
  );
}

function DiffSourcePicker(props: {
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
  readonly diffSource: DiffSource;
  readonly fileCount: number;
  readonly onDiffSourceChange: (source: DiffSource) => void;
}) {
  return (
    <Menu>
      <MenuTrigger ariaLabel="Choose diff source" className="DiffDockPickerTrigger">
        <DiffPickerTrigger
          className="DiffDockPickerContent"
          count={props.fileCount}
          label={diffSourceLabel(props.diffSource)}
        />
      </MenuTrigger>
      <MenuPopup align="start" side="bottom" sideOffset={6} className="DiffDockSourceMenu">
        <MenuGroup>
          <MenuGroupLabel>Diff source</MenuGroupLabel>
          <MenuRadioGroup value={props.diffSource} onValueChange={(value) => {
            if (value === 'workingTree' || value === 'unstaged' || value === 'staged' || value === 'branch' || value === 'allTurns' || value === 'lastTurn') {
              props.onDiffSourceChange(value);
            }
          }}>
            <MenuRadioItem value="workingTree">Working tree</MenuRadioItem>
            <MenuRadioItem value="unstaged">Unstaged changes</MenuRadioItem>
            <MenuRadioItem value="staged">Staged changes</MenuRadioItem>
            <MenuRadioItem value="branch">Branch changes</MenuRadioItem>
            {props.checkpoints.length > 0 ? (
              <>
                <MenuRadioItem value="allTurns">All turns</MenuRadioItem>
                <MenuRadioItem value="lastTurn">Last turn</MenuRadioItem>
              </>
            ) : null}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

function DiffTurnPicker(props: {
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
  readonly diffSource: DiffSource;
  readonly onDiffSourceChange: (source: DiffSource) => void;
}) {
  if (props.checkpoints.length === 0) return null;
  const selectedTurn = props.diffSource.startsWith('turn:')
    ? props.checkpoints.find(
        (checkpoint) => `turn:${checkpoint.turnId}` === props.diffSource
      )
    : null;
  const label = selectedTurn
    ? `Turn ${selectedTurn.checkpointTurnCount}`
    : props.diffSource === 'allTurns'
      ? 'All turns'
      : 'Turns';
  return (
    <Menu>
      <MenuTrigger ariaLabel="Choose turn diff" className="DiffDockTurnTrigger">
        <DiffPickerTrigger className="DiffDockPickerContent" label={label} />
      </MenuTrigger>
      <MenuPopup align="end" side="bottom" sideOffset={6} className="DiffDockTurnsMenu">
        <MenuGroup>
          <MenuGroupLabel>Turns</MenuGroupLabel>
          <MenuRadioGroup value={props.diffSource} onValueChange={(value) => {
            if (value === 'allTurns' || value.startsWith('turn:')) {
              props.onDiffSourceChange(value as DiffSource);
            }
          }}>
            <MenuRadioItem value="allTurns">All turns</MenuRadioItem>
            {props.checkpoints.map((checkpoint) => (
              <MenuRadioItem key={checkpoint.turnId} value={`turn:${checkpoint.turnId}`}>
                {`Turn ${checkpoint.checkpointTurnCount}`}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

function DiffOptionsMenu(props: {
  readonly allFilesCollapsed: boolean;
  readonly checkpoints: readonly OrchestrationCheckpointSummary[];
  readonly diffCopied: boolean;
  readonly diffIgnoreWhitespace: boolean;
  readonly diffRenderMode: 'stacked' | 'split';
  readonly diffSource: DiffSource;
  readonly diffWordWrap: boolean;
  readonly hasCopyText: boolean;
  readonly hasFiles: boolean;
  readonly label: string;
  readonly onCopyDiff: () => void;
  readonly onDiffIgnoreWhitespaceChange: (enabled: boolean) => void;
  readonly onDiffRenderModeChange: (mode: 'stacked' | 'split') => void;
  readonly onDiffSourceChange: (source: DiffSource) => void;
  readonly onDiffWordWrapChange: (enabled: boolean) => void;
  readonly onToggleCollapseAll: () => void;
  readonly triggerClassName: string;
  readonly showSource: boolean;
}) {
  return (
    <Menu>
      <MenuTrigger
        ariaLabel={props.label}
        className={props.triggerClassName}
      >
        <EllipsisIcon size={14} color="var(--muted-foreground)" />
      </MenuTrigger>
      <MenuPopup
        align="end"
        className="DiffDockOptionsMenu"
        side="bottom"
        sideOffset={6}
      >
        {props.showSource ? <MenuGroup>
          <MenuGroupLabel>Source</MenuGroupLabel>
          <MenuRadioGroup
            value={props.diffSource}
            onValueChange={(value) => {
              if (
                value === 'workingTree' ||
                value === 'unstaged' ||
                value === 'staged' ||
                value === 'branch' ||
                value === 'allTurns' ||
                value === 'lastTurn'
              ) {
                props.onDiffSourceChange(value);
              }
            }}
          >
            <MenuRadioItem value="workingTree">Working tree</MenuRadioItem>
            <MenuRadioItem value="unstaged">Unstaged changes</MenuRadioItem>
            <MenuRadioItem value="staged">Staged changes</MenuRadioItem>
            <MenuRadioItem value="branch">Branch changes</MenuRadioItem>
            {props.checkpoints.length > 0 ? (
              <>
                <MenuRadioItem value="allTurns">All turns</MenuRadioItem>
                <MenuRadioItem value="lastTurn">Last turn</MenuRadioItem>
              </>
            ) : null}
          </MenuRadioGroup>
        </MenuGroup> : null}
        {props.showSource && props.checkpoints.length > 0 ? (
          <MenuGroup>
            <MenuGroupLabel>Turns</MenuGroupLabel>
            <MenuRadioGroup
              value={props.diffSource}
              onValueChange={(value) => {
                if (value.startsWith('turn:')) {
                  props.onDiffSourceChange(value as `turn:${string}`);
                }
              }}
            >
              {props.checkpoints.map((checkpoint) => (
                <MenuRadioItem
                  key={checkpoint.turnId}
                  value={`turn:${checkpoint.turnId}`}
                >
                  {`Turn ${checkpoint.checkpointTurnCount}`}
                </MenuRadioItem>
              ))}
            </MenuRadioGroup>
          </MenuGroup>
        ) : null}
        <MenuGroup>
          <MenuGroupLabel>View</MenuGroupLabel>
          <MenuRadioGroup
            value={props.diffRenderMode}
            onValueChange={(value) => {
              if (value === 'stacked' || value === 'split') {
                props.onDiffRenderModeChange(value);
              }
            }}
          >
            <MenuRadioItem value="stacked">Stacked diff</MenuRadioItem>
            <MenuRadioItem value="split">Split diff</MenuRadioItem>
          </MenuRadioGroup>
          <MenuCheckboxItem
            checked={props.diffIgnoreWhitespace}
            variant="switch"
            onCheckedChange={props.onDiffIgnoreWhitespaceChange}
          >
            Ignore whitespace-only changes
          </MenuCheckboxItem>
          <MenuCheckboxItem
            checked={props.diffWordWrap}
            variant="switch"
            onCheckedChange={props.onDiffWordWrapChange}
          >
            <view className="DiffDockOptionLabel">
              <TextWrapIcon size={14} color="var(--muted-foreground)" />
              <text className="LxMenuItem__text">Wrap long lines</text>
            </view>
          </MenuCheckboxItem>
          {props.hasCopyText ? (
            <MenuItem onClick={props.onCopyDiff}>
              <view className="DiffDockOptionLabel">
                <CopyIcon size={14} color="var(--muted-foreground)" />
                <text className="LxMenuItem__text">
                  {props.diffCopied ? 'Copied diff' : 'Copy diff'}
                </text>
              </view>
            </MenuItem>
          ) : null}
          {props.hasFiles ? (
            <MenuItem onClick={props.onToggleCollapseAll}>
              <view className="DiffDockOptionLabel">
                <FolderOpenIcon size={14} color="var(--muted-foreground)" />
                <text className="LxMenuItem__text">
                  {props.allFilesCollapsed
                    ? 'Expand all files'
                    : 'Collapse all files'}
                </text>
              </view>
            </MenuItem>
          ) : null}
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

function DiffFileActionsMenu(props: {
  readonly defaultOpen?: boolean;
  readonly filePath: string;
  readonly threadId: string;
}) {
  return (
    <view className="DiffDockFileActions" catchtap={() => {}}>
      <ExplorerFileActionsMenu
        defaultOpen={props.defaultOpen}
        includeCopyPath
        path={props.filePath}
        popupClassName="DiffDockFileActionsMenu"
        showActionIcons
        threadId={props.threadId}
        triggerClassName="DiffDockFileActionsTrigger"
        triggerLabel={`File actions for ${props.filePath}`}
      />
    </view>
  );
}

function ReviewFileTreeRow(props: {
  readonly depth: number;
  readonly label: string;
  readonly leading: ReactNode;
  readonly onActivate: () => void;
  readonly selected?: boolean;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `DiffDockReviewTreeRow${
      props.selected ? ' DiffDockReviewTreeRow--selected' : ''
    }`,
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      style={{ paddingLeft: `${8 + props.depth * 12}px` }}
      {...interaction.eventProps}
    >
      {props.leading}
      <text className="DiffDockReviewTreeRowLabel">{props.label}</text>
    </view>
  );
}

function ReviewFileTreeNodes(props: {
  readonly collapsedPaths: ReadonlySet<string>;
  readonly depth: number;
  readonly nodes: readonly PathTreeNode[];
  readonly searching: boolean;
  readonly selectedFilePath: string | null;
  readonly onSelectFile: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
}) {
  return (
    <>
      {props.nodes.map((node) => {
        if (node.kind === 'file') {
          return (
            <ReviewFileTreeRow
              key={`file:${node.path}`}
              depth={props.depth}
              label={node.name}
              selected={node.path === props.selectedFilePath}
              leading={
                <FileEntryIcon
                  className="DiffDockReviewTreeFileIcon"
                  pathValue={node.path}
                />
              }
              onActivate={() => props.onSelectFile(node.path)}
            />
          );
        }
        const open = props.searching || !props.collapsedPaths.has(node.path);
        return (
          <view key={`directory:${node.path}`}>
            <ReviewFileTreeRow
              depth={props.depth}
              label={node.name}
              leading={
                <view className={disclosureChevronClassName(open, 'DiffDockReviewTreeChevron')}>
                  <ChevronRightIcon size={12} color="var(--muted-foreground)" />
                </view>
              }
              onActivate={() => props.onToggleDirectory(node.path)}
            />
            {open ? (
              <ReviewFileTreeNodes
                collapsedPaths={props.collapsedPaths}
                depth={props.depth + 1}
                nodes={node.children}
                searching={props.searching}
                selectedFilePath={props.selectedFilePath}
                onSelectFile={props.onSelectFile}
                onToggleDirectory={props.onToggleDirectory}
              />
            ) : null}
          </view>
        );
      })}
    </>
  );
}

function ReviewFileTree(props: {
  readonly className: string;
  readonly collapsedPaths: ReadonlySet<string>;
  readonly nodes: readonly PathTreeNode[];
  readonly query: string;
  readonly searching: boolean;
  readonly selectedFilePath: string | null;
  readonly onClose: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelectFile: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
}) {
  return (
    <view className={`DiffDockReviewTree ${props.className}`}>
      <view className="DiffDockReviewTreeSearch">
        <view className="DiffDockReviewTreeSearchField">
          <SearchIcon size={14} color="var(--muted-foreground)" />
          <Input
            className="DiffDockReviewTreeSearchInput"
            size="sm"
            variant="soft"
            type="search"
            value={props.query}
            placeholder="Filter files..."
            aria-label="Filter files"
            onChange={(event) => props.onQueryChange(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Escape') props.onQueryChange('');
            }}
          />
        </view>
        <DockHeaderIconButton label="Hide file tree" onActivate={props.onClose}>
          <XIcon size={14} color="var(--muted-foreground)" />
        </DockHeaderIconButton>
      </view>
      <scroll-view className="DiffDockReviewTreeList" scroll-y enable-scroll-bar>
        {props.nodes.length > 0 ? (
          <ReviewFileTreeNodes
            collapsedPaths={props.collapsedPaths}
            depth={0}
            nodes={props.nodes}
            searching={props.searching}
            selectedFilePath={props.selectedFilePath}
            onSelectFile={props.onSelectFile}
            onToggleDirectory={props.onToggleDirectory}
          />
        ) : (
          <text className="DiffDockReviewTreeState">
            {props.searching ? 'No matching files.' : 'No files in this diff.'}
          </text>
        )}
      </scroll-view>
    </view>
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
      <FileEntryIcon
        className="DiffDockFileIcon"
        pathValue={displayPath}
      />
      <view className="DiffDockFileIdentity">
        <text className="DiffDockFileName">{name}</text>
        {directory ? (
          <text className="DiffDockFileDirectory">{directory}</text>
        ) : null}
      </view>
      <view className="DiffDockFileStats">
        <text className="DiffDockFileAddition">+{props.additions}</text>
        <text className="DiffDockFileDeletion">-{props.deletions}</text>
      </view>
    </view>
  );
}
