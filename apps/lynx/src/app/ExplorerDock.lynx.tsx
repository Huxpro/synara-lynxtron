import type { ProjectReadFileResult } from '@synara/contracts';
import { useInitData, useState } from '@lynx-js/react';
import {
  isSupportedLocalImagePath,
  isSupportedLocalPdfPath,
} from '@synara/shared/localPreviewFiles';

import { ChatMarkdown } from '../components/markdown/ChatMarkdown';
import { FileEntryIcon } from '../components/FileEntryIcon.lynx';
import { Input } from '../components/ui/input';
import {
  ChevronRightIcon,
  EllipsisIcon,
  SearchIcon,
  XIcon,
} from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import { disclosureChevronClassName } from '../platform/motion.lynx';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import type { ExplorerEntriesResult } from './queries';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { ExplorerPdfFallback } from './ExplorerPdfFallback.lynx';
import { applyExplorerChatAction } from './explorerChatActions.logic';
import './explorer-dock.css';

function isMarkdownPath(path: string): boolean {
  return /\.(?:md|mdx|markdown)$/i.test(path);
}

function fileName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() || path;
}

function ExplorerPreviewHeader(props: {
  readonly path: string;
  readonly threadId: string;
}) {
  const initData = useInitData() as {
    readonly initialExplorerActionMenuOpen?: unknown;
  };
  const [menuOpen, setMenuOpen] = useState(
    initData.initialExplorerActionMenuOpen === true
  );
  const runAction = (action: 'ask-why' | 'reference') => {
    'background only';
    applyExplorerChatAction({
      action,
      path: props.path,
      store: useComposerDraftStore.getState(),
      threadId: props.threadId,
    });
  };
  return (
    <view className="ExplorerDockPreviewHeader">
      <text className="ExplorerDockPreviewPath">{props.path}</text>
      <Menu open={menuOpen} onOpenChange={setMenuOpen}>
        <MenuTrigger
          ariaLabel="More actions"
          className="ExplorerDockPreviewActions"
        >
          <EllipsisIcon size={14} color="var(--muted-foreground)" />
        </MenuTrigger>
        <MenuPopup
          align="end"
          side="bottom"
          className="ExplorerDockPreviewActionsPopup"
        >
          <MenuItem onClick={() => runAction('reference')}>
            Reference in chat
          </MenuItem>
          <MenuItem onClick={() => runAction('ask-why')}>
            Ask why this changed
          </MenuItem>
        </MenuPopup>
      </Menu>
    </view>
  );
}

type ExplorerEntry = ExplorerEntriesResult['entries'][number];

function ExplorerEntryRow(props: {
  readonly depth: number;
  readonly entry: ExplorerEntry;
  readonly expanded: boolean;
  readonly onSelect: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly selected: boolean;
  readonly showPath: boolean;
}) {
  const directory = props.entry.kind === 'directory';
  const row = useLynxInteractiveState({
    baseClassName: `ExplorerDockEntry${
      props.selected ? ' ExplorerDockEntry--selected' : ''
    }`,
    accessibleLabel: directory
      ? `${props.expanded ? 'Collapse' : 'Expand'} ${props.entry.path}`
      : `Open ${props.entry.path}`,
    accessibilityValue: directory
      ? props.expanded
        ? 'Expanded'
        : 'Collapsed'
      : undefined,
    onActivate: () =>
      directory
        ? props.onToggleDirectory(props.entry.path)
        : props.onSelect(props.entry.path),
  });
  return (
    <view
      className={row.className}
      style={{ paddingLeft: `${8 + props.depth * 14}px` }}
      {...row.eventProps}
    >
      {directory ? (
        <ChevronRightIcon
          className={disclosureChevronClassName(
            props.expanded,
            'ExplorerDockDirectoryChevron'
          )}
          size={14}
          color="var(--muted-foreground)"
        />
      ) : (
        <FileEntryIcon
          className="ExplorerDockFileIcon"
          pathValue={props.entry.path}
        />
      )}
      <view className="ExplorerDockEntryCopy">
        <text className="ExplorerDockEntryName">
          {fileName(props.entry.path)}
        </text>
        {props.showPath ? (
          <text className="ExplorerDockEntryPath">{props.entry.path}</text>
        ) : null}
      </view>
    </view>
  );
}

function ExplorerDirectory(props: {
  readonly depth: number;
  readonly directoryEntries: Readonly<
    Record<string, ExplorerEntriesResult['entries']>
  >;
  readonly directoryErrors: ReadonlySet<string>;
  readonly directoryPending: ReadonlySet<string>;
  readonly entries: ExplorerEntriesResult['entries'];
  readonly expandedDirectories: ReadonlySet<string>;
  readonly onSelectPath: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly selectedPath: string | null;
  readonly showPaths: boolean;
}) {
  return (
    <>
      {props.entries.map((entry) => {
        const expanded =
          entry.kind === 'directory' &&
          props.expandedDirectories.has(entry.path);
        return (
          <view key={entry.path}>
            <ExplorerEntryRow
              depth={props.depth}
              entry={entry}
              expanded={expanded}
              selected={entry.path === props.selectedPath}
              showPath={props.showPaths}
              onSelect={props.onSelectPath}
              onToggleDirectory={props.onToggleDirectory}
            />
            {expanded ? (
              props.directoryPending.has(entry.path) ? (
                <text
                  className="ExplorerDockDirectoryState"
                  style={{ paddingLeft: `${22 + (props.depth + 1) * 14}px` }}
                >
                  Loading directory…
                </text>
              ) : props.directoryErrors.has(entry.path) ? (
                <text
                  className="ExplorerDockDirectoryState ExplorerDockState--error"
                  style={{ paddingLeft: `${22 + (props.depth + 1) * 14}px` }}
                >
                  Could not load directory.
                </text>
              ) : (
                <ExplorerDirectory
                  depth={props.depth + 1}
                  directoryEntries={props.directoryEntries}
                  directoryErrors={props.directoryErrors}
                  directoryPending={props.directoryPending}
                  entries={props.directoryEntries[entry.path] ?? []}
                  expandedDirectories={props.expandedDirectories}
                  onSelectPath={props.onSelectPath}
                  onToggleDirectory={props.onToggleDirectory}
                  selectedPath={props.selectedPath}
                  showPaths={props.showPaths}
                />
              )
            ) : null}
          </view>
        );
      })}
    </>
  );
}

export function ExplorerDock(props: {
  readonly availableWidth: number;
  readonly entries: ExplorerEntriesResult['entries'];
  readonly entriesError: boolean;
  readonly entriesPending: boolean;
  readonly directoryEntries: Readonly<
    Record<string, ExplorerEntriesResult['entries']>
  >;
  readonly directoryErrors: ReadonlySet<string>;
  readonly directoryPending: ReadonlySet<string>;
  readonly expandedDirectories: ReadonlySet<string>;
  readonly initialWidth: number | null;
  readonly file: ProjectReadFileResult | null;
  readonly fileError: boolean;
  readonly filePending: boolean;
  readonly localPreviewUrl: string | null;
  readonly localPreviewError: boolean;
  readonly localPreviewPending: boolean;
  readonly onClose: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelectPath: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly query: string;
  readonly selectedPath: string | null;
  readonly threadId: string;
  readonly workspaceRoot: string | null;
}) {
  const close = useLynxInteractiveState({
    baseClassName: 'ExplorerDockClose',
    accessibleLabel: 'Close files',
    onActivate: props.onClose,
  });
  if (!props.open) return null;

  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className="ExplorerDock"
      defaultWidth={
        props.initialWidth ??
        (props.availableWidth > 0
          ? Math.round(props.availableWidth / 2)
          : 640)
      }
      maxWidth={960}
      minimumMainWidth={320}
      minWidth={480}
      onWidthChange={props.onWidthChange}
      resizable
    >
      <view className="ExplorerDockHeader">
        <text className="ExplorerDockTitle">Files</text>
        <view className={close.className} {...close.eventProps}>
          <XIcon size={14} color="var(--muted-foreground)" />
        </view>
      </view>
      <view className="ExplorerDockBody">
        <view className="ExplorerDockSidebar">
          <view className="ExplorerDockSearch">
            <view className="ExplorerDockSearchIcon">
              <SearchIcon size={14} color="var(--muted-foreground)" />
            </view>
            <Input
              className="ExplorerDockSearchInput"
              size="sm"
              variant="soft"
              type="search"
              defaultValue={props.query}
              placeholder="Search files..."
              aria-label="Search files"
              onChange={(event) => props.onQueryChange(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') props.onQueryChange('');
              }}
            />
          </view>
          <scroll-view className="ExplorerDockEntries" scroll-orientation="vertical">
            {!props.workspaceRoot ? (
              <text className="ExplorerDockState">No workspace.</text>
            ) : props.entriesPending ? (
              <text className="ExplorerDockState">Loading files…</text>
            ) : props.entriesError ? (
              <text className="ExplorerDockState ExplorerDockState--error">
                Could not load files.
              </text>
            ) : props.entries.length === 0 ? (
              <text className="ExplorerDockState">
                {props.query.trim() ? 'No matching files.' : 'No files found.'}
              </text>
            ) : (
              <ExplorerDirectory
                depth={0}
                directoryEntries={props.directoryEntries}
                directoryErrors={props.directoryErrors}
                directoryPending={props.directoryPending}
                entries={props.entries}
                expandedDirectories={props.expandedDirectories}
                onSelectPath={props.onSelectPath}
                onToggleDirectory={props.onToggleDirectory}
                selectedPath={props.selectedPath}
                showPaths={Boolean(props.query.trim())}
              />
            )}
          </scroll-view>
        </view>
        <view className="ExplorerDockPreview">
          {props.selectedPath ? (
            <ExplorerPreviewHeader
              path={props.selectedPath}
              threadId={props.threadId}
            />
          ) : null}
          <view className="ExplorerDockPreviewContent">
            {!props.selectedPath ? (
              <text className="ExplorerDockState">
                Select a file from the list to view it.
              </text>
            ) : isSupportedLocalPdfPath(props.selectedPath) &&
              props.workspaceRoot ? (
              <ExplorerPdfFallback
                path={props.selectedPath}
                previewError={props.localPreviewError}
                previewPending={props.localPreviewPending}
                previewUrl={props.localPreviewUrl}
                workspaceRoot={props.workspaceRoot}
              />
            ) : isSupportedLocalImagePath(props.selectedPath) ? (
              props.localPreviewPending ? (
                <text className="ExplorerDockState">Loading image…</text>
              ) : props.localPreviewError ? (
                <text className="ExplorerDockState ExplorerDockState--error">
                  Could not load this image.
                </text>
              ) : props.localPreviewUrl ? (
                <view className="ExplorerDockImageFrame">
                  <image
                    className="ExplorerDockImage"
                    src={props.localPreviewUrl}
                    mode="aspectFit"
                  />
                  <text className="ExplorerDockImageName">
                    {fileName(props.selectedPath)}
                  </text>
                </view>
              ) : null
            ) : props.filePending ? (
              <text className="ExplorerDockState">Loading file…</text>
            ) : props.fileError ? (
              <text className="ExplorerDockState ExplorerDockState--error">
                Could not read this file.
              </text>
            ) : isMarkdownPath(props.selectedPath) ? (
              <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
                <ChatMarkdown
                  cwd={props.workspaceRoot}
                  onOpenFileReference={props.onSelectPath}
                  text={props.file?.contents ?? ''}
                />
              </scroll-view>
            ) : (
              <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
                <text className="ExplorerDockCode">{props.file?.contents ?? ''}</text>
                {props.file?.truncated ? (
                  <text className="ExplorerDockTruncated">
                    Preview truncated at 1 MB.
                  </text>
                ) : null}
              </scroll-view>
            )}
          </view>
        </view>
      </view>
    </ResizableRightPanel>
  );
}
