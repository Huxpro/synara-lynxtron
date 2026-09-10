import type { ReactNode } from "react";
import { MenuItem } from "~/components/ui/menu";
import { MessageCircleIcon, TerminalIcon } from "~/lib/icons";

export function EditorRailAddMenuChatIconElement() {
  return <MessageCircleIcon />;
}

export function EditorRailAddMenuTerminalIconElement() {
  return <TerminalIcon />;
}

export function EditorRailAddMenuItemElement(props: { readonly disabled?: boolean; readonly icon: ReactNode; readonly label: string; readonly onActivate: () => void }) {
  return <MenuItem disabled={props.disabled} onClick={props.onActivate}>{props.icon}<span>{props.label}</span></MenuItem>;
}
