import type { ProjectReadFileResult } from "@synara/contracts";
import { useRef, useState, type ReactNode } from "@lynx-js/react";
import {
  isSupportedLocalImagePath,
  isSupportedLocalPdfPath,
} from "@synara/shared/localPreviewFiles";
import { RIGHT_DOCK_MIN_WIDTH_PX } from "@synara/shared/rightDock";
import { buildFileContextMenuItems } from "@synara/shared/fileContextMenu";
import {
  defaultFilePreviewMode,
  isMarkdownPreviewablePath,
  resolveFilePreviewMode,
  type FilePreviewMode,
} from "@synara/shared/filePreviewMode";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";

import { ChatMarkdown } from "../components/markdown/ChatMarkdown";
import { WorkspaceFilePreviewErrorState } from "@synara-web/components/WorkspaceFilePreviewErrorState";
import { FileEntryIcon } from "../components/FileEntryIcon.lynx";
import { Input } from "../components/ui/input";
import { ChevronRightIcon, SearchIcon, XIcon } from "../lib/icons.lynx";
import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import {
  disclosureChevronClassName,
  disclosureContentClassName,
  useLynxDisclosurePresence,
} from "../platform/motion.lynx";
import type { ExplorerEntriesResult } from "./queries";
import type { NativeSyntaxHighlightThemes } from "../main/syntaxHighlightingContract.logic";
import { ResizableRightPanel } from "./ResizableRightPanel.lynx";
import { ExplorerPdfFallback } from "./ExplorerPdfFallback.lynx";
import { ExplorerImagePreview } from "./ExplorerImagePreview.lynx";
import { applyExplorerChatAction, applyExplorerFileComment } from "./explorerChatActions.logic";
import { visibleExplorerEntries } from "./explorerTree.logic";
import { ExplorerSyntaxPreview } from "./ExplorerSyntaxPreview.lynx";
import "./explorer-dock.css";
import { ExplorerPreviewHeader } from "./ExplorerPreviewHeader.lynx";
import { ExplorerFileTab } from "./ExplorerFileTab.lynx";
import { resolveSecondaryPointerOffset } from "../components/sidebar/threadContextActions.logic";
import { focusLynxNode } from "../components/ui/focus.lynx";

export const EXPLORER_DOCK_MIN_WIDTH = RIGHT_DOCK_MIN_WIDTH_PX;
const EXPLORER_DOCK_TRANSITION_MS = 300;

export function ExplorerSearchInputHeader(props: {
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  return (
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
          if (event.key === "Escape") props.onQueryChange("");
        }}
      />
    </view>
  );
}

function fileName(path: string): string {
  return path.replace(/\\/g, "/").split("/").pop() || path;
}

function directoryPath(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const separator = normalized.lastIndexOf("/");
  return separator < 0 ? "" : normalized.slice(0, separator + 1);
}

type ExplorerEntry = ExplorerEntriesResult["entries"][number];

function ExplorerEntryRow(props: {
  readonly depth: number;
  readonly entry: ExplorerEntry;
  readonly expanded: boolean;
  readonly onSelect: (path: string) => void;
  readonly onContextMenu: (
    path: string,
    position: { x: number; y: number },
    restoreFocus: () => void,
  ) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly selected: boolean;
  readonly showPath: boolean;
}) {
  const rowRef = useRef<NodesRef>(null);
  const directory = props.entry.kind === "directory";
  const row = useLynxInteractiveState({
    baseClassName: `ExplorerDockEntry${directory ? " ExplorerDockEntry--directory" : ""}${
      props.selected ? " ExplorerDockEntry--selected" : ""
    }`,
    accessibleLabel: directory
      ? `${props.expanded ? "Collapse" : "Expand"} ${props.entry.path}`
      : `Open ${props.entry.path}`,
    accessibilityValue: directory ? (props.expanded ? "Expanded" : "Collapsed") : undefined,
    onActivate: () =>
      directory ? props.onToggleDirectory(props.entry.path) : props.onSelect(props.entry.path),
  });
  return (
    <view
      ref={rowRef}
      className={row.className}
      style={{ paddingLeft: `${8 + props.depth * 12}px` }}
      aria-expanded={directory ? props.expanded : undefined}
      {...row.eventProps}
      bindmousedown={(event: {
        readonly button?: number;
        readonly buttons?: number;
        readonly x?: number;
        readonly y?: number;
      }) => {
        row.eventProps.bindmousedown?.();
        const offset = resolveSecondaryPointerOffset(event);
        if (!offset || directory) return;
        void getRectByRef(rowRef, true)
          .then((rect) =>
            props.onContextMenu(
              props.entry.path,
              { x: rect.left + offset.x, y: rect.top + offset.y },
              () => focusLynxNode(rowRef),
            ),
          )
          .catch(() => undefined);
      }}
    >
      {directory ? (
        <ChevronRightIcon
          className={disclosureChevronClassName(props.expanded, "ExplorerDockDirectoryChevron")}
          size={14}
          color="var(--muted-foreground)"
        />
      ) : (
        <FileEntryIcon className="ExplorerDockFileIcon" pathValue={props.entry.path} />
      )}
      <view className="ExplorerDockEntryCopy">
        <text className="ExplorerDockEntryName">{fileName(props.entry.path)}</text>
        {props.showPath && directoryPath(props.entry.path) ? (
          <text className="ExplorerDockEntryPath">{directoryPath(props.entry.path)}</text>
        ) : null}
      </view>
    </view>
  );
}

type ExplorerDirectoryProps = {
  readonly depth: number;
  readonly directoryEntries: Readonly<Record<string, ExplorerEntriesResult["entries"]>>;
  readonly directoryErrors: ReadonlySet<string>;
  readonly directoryPending: ReadonlySet<string>;
  readonly entries: ExplorerEntriesResult["entries"];
  readonly expandedDirectories: ReadonlySet<string>;
  readonly onSelectPath: (path: string) => void;
  readonly onContextMenu: (
    path: string,
    position: { x: number; y: number },
    restoreFocus: () => void,
  ) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly selectedPath: string | null;
  readonly sidebarVisible?: boolean;
  readonly showPaths: boolean;
};

function ExplorerDirectoryEntry(
  props: Omit<ExplorerDirectoryProps, "entries"> & {
    readonly entry: ExplorerEntry;
  },
) {
  const expanded =
    props.entry.kind === "directory" && props.expandedDirectories.has(props.entry.path);
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
        onContextMenu={props.onContextMenu}
        onToggleDirectory={props.onToggleDirectory}
      />
      {props.entry.kind === "directory" && childrenPresent ? (
        <view
          className={disclosureContentClassName(expanded, "ExplorerDockDirectoryChildren")}
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
              onContextMenu={props.onContextMenu}
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
          onContextMenu={props.onContextMenu}
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
  readonly entries: ExplorerEntriesResult["entries"];
  readonly entriesError: boolean;
  readonly entriesPending: boolean;
  readonly entriesTruncated: boolean;
  readonly directoryEntries: Readonly<Record<string, ExplorerEntriesResult["entries"]>>;
  readonly directoryErrors: ReadonlySet<string>;
  readonly directoryPending: ReadonlySet<string>;
  readonly expandedDirectories: ReadonlySet<string>;
  readonly initialWidth: number | null;
  readonly initialCommentLine: number | null;
  readonly initialActionMenuOpen?: boolean;
  readonly file: ProjectReadFileResult | null;
  readonly fileError: boolean;
  readonly filePending: boolean;
  readonly fileRetrying: boolean;
  readonly fileSyntaxHighlight: NativeSyntaxHighlightThemes | null;
  readonly localPreviewUrl: string | null;
  readonly localPreviewError: boolean;
  readonly localPreviewPending: boolean;
  readonly onClose: () => void;
  readonly dockTabHeader?: ReactNode;
  readonly hosted?: boolean;
  readonly onQueryChange: (query: string) => void;
  readonly onRetryFile: () => void;
  readonly onSelectPath: (path: string) => void;
  readonly onToggleDirectory: (path: string) => void;
  readonly onWidthChange: (width: number) => void;
  readonly open: boolean;
  readonly presentationMode?: "dock" | "single-file" | "editor" | "editor-search";
  readonly pdfMetadataError: boolean;
  readonly pdfMetadataPending: boolean;
  readonly pdfPageCount: number;
  readonly pdfPageHeight: number;
  readonly pdfPageWidth: number;
  readonly query: string;
  readonly selectedPath: string | null;
  readonly sidebarVisible?: boolean;
  readonly threadId: string;
  readonly theme: "dark" | "light";
  readonly workspaceRoot: string | null;
}) {
  const singleFile = props.presentationMode === "single-file";
  const selectedPath = props.selectedPath ?? "";
  const fileIsMarkdown = isMarkdownPreviewablePath(selectedPath);
  const defaultMarkdownMode = defaultFilePreviewMode({
    filePath: selectedPath,
    presentation: props.presentationMode?.startsWith("editor") ? "editor" : "dock",
  });
  const [markdownModeOverride, setMarkdownModeOverride] = useState<{
    readonly filePath: string;
    readonly mode: FilePreviewMode;
  } | null>(null);
  const markdownMode = resolveFilePreviewMode({
    defaultMode: defaultMarkdownMode,
    filePath: selectedPath,
    override: markdownModeOverride,
  });
  const close = useLynxInteractiveState({
    baseClassName: "ExplorerDockClose",
    accessibleLabel:
      singleFile && props.selectedPath ? `Close ${fileName(props.selectedPath)}` : "Close files",
    onActivate: props.onClose,
  });
  const present = useLynxDisclosurePresence(props.open, {
    transitionMs: EXPLORER_DOCK_TRANSITION_MS,
  });
  const openFileContextMenu = async (
    path: string,
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => {
    "background only";
    const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
    const action = await showContextMenu(
      buildFileContextMenuItems({
        referenceAvailable: true,
        askWhyAvailable: true,
      }),
      position,
      { restoreFocus },
    );
    if (action === "reference-in-chat" || action === "ask-why-in-chat") {
      applyExplorerChatAction({
        action: action === "reference-in-chat" ? "reference" : "ask-why",
        path,
        store: useComposerDraftStore.getState(),
        threadId: props.threadId,
      });
      return;
    }
    if (action === "copy-path") {
      const { clipboard } = await import(/* webpackMode: "eager" */ "../platform/clipboard");
      await clipboard.writeText(path);
    }
  };
  if (!present) return null;
  const content = (
    <>
      {props.hosted
        ? null
        : (props.dockTabHeader ?? (
            <view className="ExplorerDockHeader">
              {singleFile && props.selectedPath ? (
                <ExplorerFileTab path={props.selectedPath} onClose={props.onClose} />
              ) : (
                <text className="ExplorerDockTitle">Files</text>
              )}
              {props.presentationMode?.startsWith("editor") || singleFile ? null : (
                <view className={close.className} {...close.eventProps}>
                  <XIcon size={14} color="var(--muted-foreground)" />
                </view>
              )}
            </view>
          ))}
      <view className="ExplorerDockBody">
        {props.sidebarVisible === false ? null : (
          <view className="ExplorerDockSidebar">
            <ExplorerSearchInputHeader query={props.query} onQueryChange={props.onQueryChange} />
            <scroll-view
              className={`ExplorerDockEntries${
                props.query.trim() && props.entries.length > 0 && props.entriesTruncated
                  ? " ExplorerDockEntries--truncated"
                  : ""
              }`}
              scroll-orientation="vertical"
            >
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
                  {props.query.trim() ? "No matching files." : "No files found."}
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
                  onContextMenu={(path, position, restoreFocus) =>
                    void openFileContextMenu(path, position, restoreFocus)
                  }
                  onToggleDirectory={props.onToggleDirectory}
                  selectedPath={props.selectedPath}
                  showPaths={Boolean(props.query.trim())}
                />
              )}
            </scroll-view>
            {props.query.trim() && props.entries.length > 0 && props.entriesTruncated ? (
              <text className="ExplorerDockSearchTruncated">
                Showing top matches. Refine search.
              </text>
            ) : null}
          </view>
        )}
        <view
          className={`ExplorerDockPreview${
            props.selectedPath && isSupportedLocalPdfPath(props.selectedPath)
              ? " ExplorerDockPreview--pdf"
              : props.selectedPath && isSupportedLocalImagePath(props.selectedPath)
                ? " ExplorerDockPreview--image"
                : props.selectedPath && isMarkdownPreviewablePath(props.selectedPath)
                  ? " ExplorerDockPreview--markdown"
                  : ""
          }${props.file?.truncated ? " ExplorerDockPreview--truncated" : ""}`}
        >
          {props.selectedPath ? (
            <ExplorerPreviewHeader
              actionMenuDefaultOpen={props.initialActionMenuOpen}
              path={props.selectedPath}
              isMarkdown={fileIsMarkdown}
              markdownPreviewEnabled={markdownMode === "preview"}
              onMarkdownPreviewChange={(rendered) =>
                setMarkdownModeOverride({
                  filePath: props.selectedPath!,
                  mode: rendered ? "preview" : "source",
                })
              }
              threadId={props.threadId}
              truncated={props.file?.truncated ?? false}
              workspaceRoot={props.workspaceRoot}
            />
          ) : null}
          <view className="ExplorerDockPreviewContent">
            {!props.selectedPath ? (
              <text className="ExplorerDockState">Select a file from the list to view it.</text>
            ) : isSupportedLocalPdfPath(props.selectedPath) && props.workspaceRoot ? (
              <ExplorerPdfFallback
                path={props.selectedPath}
                previewError={props.localPreviewError}
                previewPending={props.localPreviewPending}
                previewUrl={props.localPreviewUrl}
                metadataError={props.pdfMetadataError}
                metadataPending={props.pdfMetadataPending}
                pageCount={props.pdfPageCount}
                pageHeight={props.pdfPageHeight}
                pageWidth={props.pdfPageWidth}
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
                <ExplorerImagePreview
                  key={props.localPreviewUrl}
                  path={props.selectedPath}
                  previewUrl={props.localPreviewUrl}
                />
              ) : null
            ) : props.filePending ? (
              <text className="ExplorerDockState">Loading file…</text>
            ) : props.fileError ? (
              <WorkspaceFilePreviewErrorState
                detail={null}
                retrying={props.fileRetrying}
                onRetry={props.onRetryFile}
                onClose={props.onClose}
              />
            ) : props.file?.contents.length === 0 ? (
              <text className="ExplorerDockState">Empty file.</text>
            ) : fileIsMarkdown && markdownMode === "preview" ? (
              <scroll-view className="ExplorerDockPreviewScroll" scroll-orientation="vertical">
                <ChatMarkdown
                  cwd={props.workspaceRoot}
                  onOpenFileReference={props.onSelectPath}
                  text={props.file?.contents ?? ""}
                />
              </scroll-view>
            ) : (
              <ExplorerSyntaxPreview
                contents={props.file?.contents ?? ""}
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
              />
            )}
          </view>
        </view>
      </view>
    </>
  );

  if (props.presentationMode?.startsWith("editor")) {
    return (
      <view
        className={`ExplorerDock ExplorerDock--editor${
          props.presentationMode === "editor-search" ? " ExplorerDock--editor-search" : ""
        }${props.open ? " ExplorerDock--open" : " ExplorerDock--closed"}`}
        aria-hidden={!props.open}
      >
        {content}
      </view>
    );
  }

  return (
    <ResizableRightPanel
      availableWidth={props.availableWidth}
      className={`ExplorerDock${props.hosted ? " ExplorerDock--hosted" : ""}${
        singleFile ? " ExplorerDock--single-file" : ""
      }${props.open ? " ExplorerDock--open" : " ExplorerDock--closed"}`}
      defaultWidth={
        props.initialWidth ??
        (props.availableWidth > 0 ? Math.round(props.availableWidth / 2) : 640)
      }
      maxWidth={960}
      minimumMainWidth={320}
      minWidth={EXPLORER_DOCK_MIN_WIDTH}
      onWidthChange={props.onWidthChange}
      hosted={props.hosted}
      resizable={!props.hosted}
    >
      {content}
    </ResizableRightPanel>
  );
}
