import { EditorOpenControls } from "./EditorOpenControls.lynx";
import { useEffect, useState } from "@lynx-js/react";
import { deriveFilePreviewBreadcrumb } from "@synara/shared/filePreviewBreadcrumb";

import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import {
  ChevronRightIcon,
  CodeIcon,
  EllipsisIcon,
  EyeIcon,
  FileIcon,
  MessageCircleIcon,
  CopyIcon,
} from "../lib/icons.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { Button } from "../components/ui/button.lynx";
import { Menu, MenuItem, MenuPopup, MenuTrigger } from "../components/ui/menu.lynx";

import { applyExplorerChatAction } from "./explorerChatActions.logic";

export function ExplorerFileActionsMenu(props: {
  readonly defaultOpen?: boolean;
  readonly includeCopyPath?: boolean;
  readonly path: string;
  readonly popupClassName?: string;
  readonly showActionIcons?: boolean;
  readonly threadId: string;
  readonly triggerClassName: string;
  readonly triggerLabel?: string;
}) {
  const { semanticIconColor, svgColors } = useTheme();
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (props.defaultOpen) {
      setOpen(true);
    }
  }, [props.defaultOpen]);
  const runAction = (action: "ask-why" | "reference") => {
    applyExplorerChatAction({
      action,
      path: props.path,
      store: useComposerDraftStore.getState(),
      threadId: props.threadId,
    });
  };
  const copyPath = async () => {
    "background only";
    const { clipboard } = await import(/* webpackMode: "eager" */ "../platform/clipboard");
    await clipboard.writeText(props.path);
  };
  const actionContent = (label: string, icon: "chat" | "copy") =>
    props.showActionIcons ? (
      <view className="ExplorerFileActionItemContent">
        {icon === "chat" ? (
          <MessageCircleIcon
            className="ExplorerFileActionItemIcon"
            color={semanticIconColor("secondary")}
            size={14}
          />
        ) : (
          <CopyIcon
            className="ExplorerFileActionItemIcon"
            color={semanticIconColor("secondary")}
            size={14}
          />
        )}
        <text className="LxMenuItem__text">{label}</text>
      </view>
    ) : (
      label
    );
  return (
    <Menu open={open} onOpenChange={setOpen}>
      <MenuTrigger
        ariaLabel={props.triggerLabel ?? "More actions"}
        className={props.triggerClassName}
      >
        <EllipsisIcon size={14} color={svgColors.foreground} />
      </MenuTrigger>
      <MenuPopup
        align="end"
        side="bottom"
        className={`ExplorerDockPreviewActionsPopup${
          props.popupClassName ? ` ${props.popupClassName}` : ""
        }`}
      >
        <MenuItem onClick={() => runAction("reference")}>
          {actionContent("Reference in chat", "chat")}
        </MenuItem>
        <MenuItem onClick={() => runAction("ask-why")}>
          {actionContent("Ask why this changed", "chat")}
        </MenuItem>
        {props.includeCopyPath ? (
          <MenuItem onClick={() => void copyPath()}>{actionContent("Copy path", "copy")}</MenuItem>
        ) : null}
      </MenuPopup>
    </Menu>
  );
}

export function ExplorerPreviewHeader(props: {
  readonly actionMenuDefaultOpen?: boolean;
  readonly isMarkdown: boolean;
  readonly markdownPreviewEnabled: boolean;
  readonly onMarkdownPreviewChange: (rendered: boolean) => void;
  readonly path: string;
  readonly threadId: string;
  readonly truncated: boolean;
  readonly workspaceRoot: string | null;
}) {
  const { semanticIconColor, svgColors } = useTheme();
  const { fileSegment, openTarget, prefixSegments } = deriveFilePreviewBreadcrumb({
    filePath: props.path,
    workspaceRoot: props.workspaceRoot,
  });

  return (
    <view className="ExplorerDockPreviewHeader chat-surface-divider">
      <view
        className="ExplorerDockBreadcrumb"
        accessibility-element
        accessibility-label={`File path ${props.path}`}
      >
        <view className="ExplorerDockBreadcrumbPrefix">
          {prefixSegments.map((segment) => (
            <view className="ExplorerDockBreadcrumbPart" key={segment.key}>
              <text className="ExplorerDockBreadcrumbDirectory">{segment.name}</text>
              <ChevronRightIcon
                className="ExplorerDockBreadcrumbChevron"
                color={semanticIconColor("secondary")}
                size={12}
              />
            </view>
          ))}
        </view>
        <text className="ExplorerDockBreadcrumbFile">{fileSegment}</text>
      </view>
      {props.truncated ? (
        <text
          className="ExplorerDockPreviewTruncated"
          accessibility-label="Preview truncated at 1 MB."
        >
          Partial
        </text>
      ) : null}
      <view className="ExplorerDockPreviewHeaderActions">
        {props.isMarkdown ? (
          <view
            className="ExplorerDockMarkdownModes"
            accessibility-element
            accessibility-label="Markdown view"
          >
            <Button
              aria-label="Source view"
              className={`ExplorerDockMarkdownMode${
                props.markdownPreviewEnabled ? "" : " ExplorerDockMarkdownMode--active"
              }`}
              size="icon-xs"
              variant="chrome"
              onClick={() => props.onMarkdownPreviewChange(false)}
            >
              <FileIcon
                color={
                  props.markdownPreviewEnabled
                    ? semanticIconColor("secondary")
                    : svgColors.foreground
                }
                size={14}
              />
            </Button>
            <Button
              aria-label="Preview markdown"
              className={`ExplorerDockMarkdownMode${
                props.markdownPreviewEnabled ? " ExplorerDockMarkdownMode--active" : ""
              }`}
              size="icon-xs"
              variant="chrome"
              onClick={() => props.onMarkdownPreviewChange(true)}
            >
              <EyeIcon
                color={
                  props.markdownPreviewEnabled
                    ? svgColors.foreground
                    : semanticIconColor("secondary")
                }
                size={14}
              />
            </Button>
          </view>
        ) : null}
        <ExplorerFileActionsMenu
          defaultOpen={props.actionMenuDefaultOpen}
          path={props.path}
          threadId={props.threadId}
          triggerClassName="ExplorerDockPreviewActions"
        />
        <EditorOpenControls openTarget={openTarget} />
      </view>
    </view>
  );
}
