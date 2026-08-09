import type {
  ProjectReadFileResult,
} from '@synara/contracts';

import { ChatMarkdown } from '../components/markdown/ChatMarkdown';
import { Input } from '../components/ui/input';
import { FolderIcon, SearchIcon, XIcon } from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import type { ExplorerEntriesResult } from './queries';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import './explorer-dock.css';

function isMarkdownPath(path: string): boolean {
  return /\.(?:md|mdx|markdown)$/i.test(path);
}

function fileName(path: string): string {
  return path.replace(/\\/g, '/').split('/').pop() || path;
}

function ExplorerEntryRow(props: {
  readonly entry: {
    readonly kind: 'file' | 'directory';
    readonly path: string;
  };
  readonly onSelect: (path: string) => void;
  readonly selected: boolean;
}) {
  const row = useLynxInteractiveState({
    baseClassName: `ExplorerDockEntry${
      props.selected ? ' ExplorerDockEntry--selected' : ''
    }`,
    accessibleLabel: `Open ${props.entry.path}`,
    disabled: props.entry.kind !== 'file',
    onActivate: () => props.onSelect(props.entry.path),
  });
  return (
    <view className={row.className} {...row.eventProps}>
      {props.entry.kind === 'directory' ? (
        <FolderIcon size={14} color="var(--muted-foreground)" />
      ) : (
        <text className="ExplorerDockFileGlyph">▤</text>
      )}
      <view className="ExplorerDockEntryCopy">
        <text className="ExplorerDockEntryName">
          {fileName(props.entry.path)}
        </text>
        <text className="ExplorerDockEntryPath">{props.entry.path}</text>
      </view>
    </view>
  );
}

export function ExplorerDock(props: {
  readonly availableWidth: number;
  readonly entries: ExplorerEntriesResult['entries'];
  readonly entriesError: boolean;
  readonly entriesPending: boolean;
  readonly initialWidth: number | null;
  readonly file: ProjectReadFileResult | null;
  readonly fileError: boolean;
  readonly filePending: boolean;
  readonly onClose: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelectPath: (path: string) => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly query: string;
  readonly selectedPath: string | null;
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
              props.entries.map((entry) => (
                <ExplorerEntryRow
                  key={entry.path}
                  entry={entry}
                  selected={entry.path === props.selectedPath}
                  onSelect={props.onSelectPath}
                />
              ))
            )}
          </scroll-view>
        </view>
        <view className="ExplorerDockPreview">
          {!props.selectedPath ? (
            <text className="ExplorerDockState">
              Select a file from the list to view it.
            </text>
          ) : props.filePending ? (
            <text className="ExplorerDockState">Loading file…</text>
          ) : props.fileError ? (
            <text className="ExplorerDockState ExplorerDockState--error">
              Could not read this file.
            </text>
          ) : isMarkdownPath(props.selectedPath) ? (
            <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
              <ChatMarkdown text={props.file?.contents ?? ''} />
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
    </ResizableRightPanel>
  );
}
