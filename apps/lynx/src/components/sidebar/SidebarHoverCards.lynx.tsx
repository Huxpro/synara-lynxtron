import type { ThreadSummary } from "../../app/queries";
import { useTheme } from "../../adapters/useTheme.lynx";
import {
  FolderIcon,
  FolderOpenIcon,
  GitBranchIcon,
  MessageCircleIcon,
  SettingsIcon,
} from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";
import { Separator } from "../ui/separator.lynx";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";
import pinSvg from "@synara-central-icons/pin.svg?raw";
import pinFilledSvg from "@synara-central-icons-fill/pin.svg?raw";

export function SidebarThreadHoverCard(props: {
  readonly branch: string | null;
  readonly projectName: string | null;
  readonly sourceProjectName: string | null;
  readonly thread: ThreadSummary;
  readonly worktreeName: string | null;
}) {
  const { svgColors } = useTheme();
  const metadataIconColor = svgColors.mutedForeground;
  return (
    <view className="AppSidebarHoverCardSurface AppSidebarThreadHoverCard">
      <view className="AppSidebarHoverCardHeader">
        <text className="AppSidebarHoverCardTitle">{props.thread.title}</text>
        <text className="AppSidebarHoverCardTime">
          {formatRelativeTime(props.thread.updatedAt ?? props.thread.createdAt ?? "")}
        </text>
      </view>
      {props.projectName ? (
        <view className="AppSidebarHoverCardMetaRow">
          <FolderIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
          <text className="AppSidebarHoverCardMeta">{props.projectName}</text>
        </view>
      ) : null}
      {props.sourceProjectName ? (
        <view className="AppSidebarHoverCardMetaRow">
          <FolderIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
          <text className="AppSidebarHoverCardMeta">{props.sourceProjectName}</text>
        </view>
      ) : null}
      {props.branch ? (
        <view className="AppSidebarHoverCardMetaRow">
          <GitBranchIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
          <text className="AppSidebarHoverCardMeta">{props.branch}</text>
        </view>
      ) : null}
      {props.worktreeName ? (
        <view className="AppSidebarHoverCardMetaRow">
          <svg
            className="AppSidebarHoverCardIcon"
            content={colorizeLynxSvg(worktreeSvg, metadataIconColor)}
          />
          <text className="AppSidebarHoverCardMeta">{props.worktreeName}</text>
        </view>
      ) : null}
    </view>
  );
}

export function SidebarProjectHoverCard(props: {
  readonly chatCount: number;
  readonly isPinned: boolean;
  readonly name: string;
  readonly path: string;
}) {
  const { semanticIconColor, svgColors } = useTheme();
  const metadataIconColor = svgColors.mutedForeground;
  return (
    <view className="AppSidebarHoverCardSurface AppSidebarProjectHoverCard">
      <view className="AppSidebarHoverCardHeader">
        <FolderOpenIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
        <text className="AppSidebarHoverCardTitle">{props.name}</text>
        <svg
          className={`AppSidebarHoverCardPin${
            props.isPinned ? " AppSidebarHoverCardPin--pinned" : ""
          }`}
          content={colorizeLynxSvg(
            props.isPinned ? pinFilledSvg : pinSvg,
            props.isPinned ? semanticIconColor("primary") : metadataIconColor,
          )}
        />
      </view>
      <view className="AppSidebarHoverCardMetaRow">
        <MessageCircleIcon
          className="AppSidebarHoverCardIcon"
          color={metadataIconColor}
          size={14}
        />
        <text className="AppSidebarHoverCardMeta">
          {props.chatCount} {props.chatCount === 1 ? "chat" : "chats"}
        </text>
      </view>
      <Separator className="AppSidebarHoverCardSeparator" />
      <view className="AppSidebarHoverCardMetaRow">
        <FolderIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
        <text className="AppSidebarHoverCardMeta AppSidebarHoverCardPath">{props.path}</text>
      </view>
      <Separator className="AppSidebarHoverCardSeparator" />
      <view className="AppSidebarHoverCardMetaRow">
        <SettingsIcon className="AppSidebarHoverCardIcon" color={metadataIconColor} size={14} />
        <text className="AppSidebarHoverCardMeta">Edit project</text>
      </view>
    </view>
  );
}
