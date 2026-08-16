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
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from '../platform/motion.lynx';
import {
  Menu,
  MenuItem,
  MenuPopup,
  MenuTrigger,
} from '../components/ui/menu.lynx';
import type { ExplorerEntriesResult } from './queries';
import type { NativeSyntaxHighlightThemes } from '../main/syntaxHighlightingContract.logic';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import { ExplorerPdfFallback } from './ExplorerPdfFallback.lynx';
import {
  applyExplorerChatAction,
  applyExplorerFileComment,
} from './explorerChatActions.logic';
import { visibleExplorerEntries } from './explorerTree.logic';
import { ExplorerSyntaxPreview } from './ExplorerSyntaxPreview.lynx';
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
      directory ? ' ExplorerDockEntry--directory' : ''
    }${
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
      style={{ paddingLeft: `${8 + props.depth * 12}px` }}
      aria-expanded={directory ? props.expanded : undefined}
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

type ExplorerDirectoryProps = {
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
};

function ExplorerDirectoryEntry(
  props: Omit<ExplorerDirectoryProps, 'entries'> & {
    readonly entry: ExplorerEntry;
  }
) {
  const expanded =
    props.entry.kind === 'directory' &&
    props.expandedDirectories.has(props.entry.path);
  const childrenPresent = useLynxDisclosurePresence(expanded);
  return (
    <view>
      <ExplorerEntryRow
        depth={props.depth}
        entry={props.entry}
        expanded={expanded}
        selected={props.entry.path === props.selectedPath}
        showPath={props.showPaths}
        onSelect={props.onSelectPath}
        onToggleDirectory={props.onToggleDirectory}
      />
      {props.entry.kind === 'directory' && childrenPresent ? (
        <view
          className={disclosureContentClassName(
            expanded,
            'ExplorerDockDirectoryChildren'
          )}
          aria-hidden={!expanded}
        >
          {props.directoryPending.has(props.entry.path) ? (
            <text
              className="ExplorerDockDirectoryState"
              style={{ paddingLeft: `${8 + (props.depth + 1) * 12}px` }}
            >
              Loading directory…
            </text>
          ) : props.directoryErrors.has(props.entry.path) ? (
            <text
              className="ExplorerDockDirectoryState ExplorerDockState--error"
              style={{ paddingLeft: `${8 + (props.depth + 1) * 12}px` }}
            >
              Could not load directory.
            </text>
          ) : (
            <ExplorerDirectory
              depth={props.depth + 1}
              directoryEntries={props.directoryEntries}
              directoryErrors={props.directoryErrors}
              directoryPending={props.directoryPending}
              entries={props.directoryEntries[props.entry.path] ?? []}
              expandedDirectories={props.expandedDirectories}
              onSelectPath={props.onSelectPath}
              onToggleDirectory={props.onToggleDirectory}
              selectedPath={props.selectedPath}
              showPaths={props.showPaths}
            />
          )}
        </view>
      ) : null}
    </view>
  );
}

function ExplorerDirectory(props: ExplorerDirectoryProps) {
  return (
    <>
      {visibleExplorerEntries(props.entries).map((entry) => (
        <ExplorerDirectoryEntry
          key={entry.path}
          depth={props.depth}
          entry={entry}
          directoryEntries={props.directoryEntries}
          directoryErrors={props.directoryErrors}
          directoryPending={props.directoryPending}
          expandedDirectories={props.expandedDirectories}
          onSelectPath={props.onSelectPath}
          onToggleDirectory={props.onToggleDirectory}
          selectedPath={props.selectedPath}
          showPaths={props.showPaths}
        />
      ))}
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
  readonly initialCommentLine: number | null;
  readonly file: ProjectReadFileResult | null;
  readonly fileError: boolean;
  readonly filePending: boolean;
  readonly fileSyntaxHighlight: NativeSyntaxHighlightThemes | null;
  readonly localPreviewUrl: string | null;
  readonly localPreviewError: boolean;
  readonly localPreviewPending: boolean;
  readonly onClose: () => void;
  readonly onQueryChange: (query: string) => void;
  readonly onSelectPath: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly presentationMode?: 'dock' | 'editor' | 'editor-search';
  readonly pdfMetadataError: boolean;
  readonly pdfMetadataPending: boolean;
  readonly pdfPageCount: number;
  readonly query: string;
  readonly selectedPath: string | null;
  readonly threadId: string;
  readonly theme: 'dark' | 'light';
  readonly workspaceRoot: string | null;
}) {
  const close = useLynxInteractiveState({
    baseClassName: 'ExplorerDockClose',
    accessibleLabel: 'Close files',
    onActivate: props.onClose,
  });
  if (!props.open) return null;

  const content = (
    <>
      <view className="ExplorerDockHeader">
        <text className="ExplorerDockTitle">Files</text>
        {props.presentationMode?.startsWith('editor') ? null : (
          <view className={close.className} {...close.eventProps}>
            <XIcon size={14} color="var(--muted-foreground)" />
          </view>
        )}
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
        <view
          className={`ExplorerDockPreview${
            props.selectedPath &&
            isSupportedLocalPdfPath(props.selectedPath)
              ? ' ExplorerDockPreview--pdf'
              : props.selectedPath &&
                  isSupportedLocalImagePath(props.selectedPath)
                ? ' ExplorerDockPreview--image'
              : ''
          }`}
        >
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
                metadataError={props.pdfMetadataError}
                metadataPending={props.pdfMetadataPending}
                pageCount={props.pdfPageCount}
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
                    accessibility-element={false}
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
              <ExplorerSyntaxPreview
                contents={props.file?.contents ?? ''}
                highlighted={props.fileSyntaxHighlight}
                initialCommentLine={props.initialCommentLine}
                onComment={({ lineNumber, text }) =>
                  applyExplorerFileComment({
                    comment: {
                      path: props.selectedPath!,
                      startLine: lineNumber,
                      endLine: lineNumber,
                      text,
                    },
                    store: useComposerDraftStore.getState(),
                    threadId: props.threadId,
                  })
                }
                path={props.selectedPath}
                theme={props.theme}
                truncated={props.file?.truncated ?? false}
              />
            )}
          </view>
        </view>
      </view>
    </>
  );

  if (props.presentationMode?.startsWith('editor')) {
    return (
      <view
        className={`ExplorerDock ExplorerDock--editor${
          props.presentationMode === 'editor-search'
            ? ' ExplorerDock--editor-search'
            : ''
        }`}
      >
        {content}
      </view>
    );
  }

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
      {content}
    </ResizableRightPanel>
  );
}
