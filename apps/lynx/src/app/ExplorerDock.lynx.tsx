import { useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type {
  ProjectListDirectoriesInput,
  ProjectListDirectoriesResult,
  ProjectReadFileInput,
  ProjectReadFileResult,
  ProjectSearchEntriesInput,
  ProjectSearchEntriesResult,
} from '@synara/contracts';

import { ChatMarkdown } from '../components/markdown/ChatMarkdown';
import { Input } from '../components/ui/input';
import { FolderIcon, SearchIcon, XIcon } from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import './explorer-dock.css';

async function loadProjectDirectories(
  input: ProjectListDirectoriesInput
): Promise<ProjectListDirectoriesResult> {
  'background only';
  const { listProjectDirectories } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient.lynx'
  );
  return listProjectDirectories(input);
}

async function loadProjectSearchEntries(
  input: ProjectSearchEntriesInput
): Promise<ProjectSearchEntriesResult> {
  'background only';
  const { searchProjectEntries } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient.lynx'
  );
  return searchProjectEntries(input);
}

async function loadProjectFile(
  input: ProjectReadFileInput
): Promise<ProjectReadFileResult> {
  'background only';
  const { readProjectFile } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient.lynx'
  );
  return readProjectFile(input);
}

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
  readonly onClose: () => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly workspaceRoot: string | null;
}) {
  const [query, setQuery] = useState('');
  const [selectedPath, setSelectedPath] = useState<string | null>(null);
  const trimmedQuery = query.trim();
  const entriesQuery = useQuery({
    queryKey: ['explorer-entries', props.workspaceRoot, trimmedQuery],
    queryFn: () =>
      trimmedQuery
        ? loadProjectSearchEntries({
            cwd: props.workspaceRoot!,
            query: trimmedQuery,
            kind: 'file',
            limit: 80,
          })
        : loadProjectDirectories({
            cwd: props.workspaceRoot!,
            includeFiles: true,
            depth: 1,
          }),
    enabled: props.open && Boolean(props.workspaceRoot),
    retry: false,
  });
  const fileQuery = useQuery({
    queryKey: ['explorer-file', props.workspaceRoot, selectedPath],
    queryFn: () =>
      loadProjectFile({
        cwd: props.workspaceRoot!,
        relativePath: selectedPath!,
      }),
    enabled:
      props.open && Boolean(props.workspaceRoot) && selectedPath !== null,
    retry: false,
  });
  const close = useLynxInteractiveState({
    baseClassName: 'ExplorerDockClose',
    accessibleLabel: 'Close files',
    onActivate: props.onClose,
  });
  if (!props.open) return null;
  const entries =
    'entries' in (entriesQuery.data ?? {})
      ? (entriesQuery.data?.entries ?? [])
      : [];

  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className="ExplorerDock"
      defaultWidth={
        props.availableWidth > 0
          ? Math.round(props.availableWidth / 2)
          : 640
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
              defaultValue=""
              placeholder="Search files..."
              aria-label="Search files"
              onChange={(event) => setQuery(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Escape') setQuery('');
              }}
            />
          </view>
          <scroll-view className="ExplorerDockEntries" scroll-orientation="vertical">
            {!props.workspaceRoot ? (
              <text className="ExplorerDockState">No workspace.</text>
            ) : entriesQuery.isPending ? (
              <text className="ExplorerDockState">Loading files…</text>
            ) : entriesQuery.error ? (
              <text className="ExplorerDockState ExplorerDockState--error">
                Could not load files.
              </text>
            ) : entries.length === 0 ? (
              <text className="ExplorerDockState">
                {trimmedQuery ? 'No matching files.' : 'No files found.'}
              </text>
            ) : (
              entries.map((entry) => (
                <ExplorerEntryRow
                  key={entry.path}
                  entry={entry}
                  selected={entry.path === selectedPath}
                  onSelect={setSelectedPath}
                />
              ))
            )}
          </scroll-view>
        </view>
        <view className="ExplorerDockPreview">
          {!selectedPath ? (
            <text className="ExplorerDockState">
              Select a file from the list to view it.
            </text>
          ) : fileQuery.isPending ? (
            <text className="ExplorerDockState">Loading file…</text>
          ) : fileQuery.error ? (
            <text className="ExplorerDockState ExplorerDockState--error">
              Could not read this file.
            </text>
          ) : isMarkdownPath(selectedPath) ? (
            <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
              <ChatMarkdown text={fileQuery.data?.contents ?? ''} />
            </scroll-view>
          ) : (
            <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
              <text className="ExplorerDockCode">{fileQuery.data?.contents ?? ''}</text>
              {fileQuery.data?.truncated ? (
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
