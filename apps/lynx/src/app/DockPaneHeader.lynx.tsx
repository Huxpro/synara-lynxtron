// Title bar for lightweight right-dock panes (source control, …): the Native
// counterpart of apps/web/src/components/chat/DockPaneHeader.tsx. It shares the
// chat-surface header row (46px, layout-neutral bottom hairline) and the 28px
// chrome icon-button footprint with the tab strip, so every dock surface lines up.
import type { ReactNode } from "@lynx-js/react";

import { XIcon } from "../lib/icons.lynx";
import { IconButton } from "../components/ui/icon-button.lynx";
import { useTheme } from "../adapters/useTheme.lynx";

import "./dock-pane-header.css";

export function DockPaneHeader(props: {
  readonly title: string;
  readonly actions?: ReactNode;
  readonly onClose?: (() => void) | undefined;
  readonly closeLabel?: string;
}) {
  const { semanticIconColor } = useTheme();
  return (
    <view className="DockPaneHeader chat-surface-divider">
      <text className="DockPaneHeaderTitle">{props.title}</text>
      <view className="DockPaneHeaderActions">
        {props.actions}
        {props.onClose ? (
          <IconButton
            className="DockPaneHeaderIconButton"
            label={props.closeLabel ?? "Close panel"}
            variant="chrome"
            onClick={props.onClose}
          >
            <XIcon color={semanticIconColor("secondary")} size={14} />
          </IconButton>
        ) : null}
      </view>
    </view>
  );
}
