import type { ReactNode } from "@lynx-js/react";
import { MenuItem } from "../components/ui/menu.lynx";
import { MessageCircleIcon } from "../lib/icons.lynx";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "./useTheme.lynx";

export function EditorRailAddMenuChatIconElement() {
  const { semanticIconColor } = useTheme();
  return <MessageCircleIcon color={semanticIconColor("primary")} size={14} />;
}

export function EditorRailAddMenuTerminalIconElement() {
  const { semanticIconColor } = useTheme();
  return (
    <svg
      className="ThreadEditorAddMenuSvgIcon"
      content={colorizeLynxSvg(terminalSvg, semanticIconColor("primary"))}
    />
  );
}

export function EditorRailAddMenuItemElement(props: {
  readonly disabled?: boolean;
  readonly icon: ReactNode;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <MenuItem disabled={props.disabled} onClick={props.onActivate}>
      <view className="ThreadEditorAddMenuContent">
        <view className="ThreadEditorAddMenuIcon">{props.icon}</view>
        <text className="ThreadEditorAddMenuLabel">{props.label}</text>
      </view>
    </MenuItem>
  );
}
