import {
  EditorRailAddMenuChatIconElement,
  EditorRailAddMenuItemElement,
  EditorRailAddMenuTerminalIconElement,
} from "~/components/chat/EditorRailAddMenuCompositionElements";

export function EditorRailAddMenuComposition(props: {
  readonly onNewChat: () => void;
  readonly onNewTerminal: () => void;
  readonly terminalDisabled?: boolean;
}) {
  return (
    <>
      <EditorRailAddMenuItemElement icon={<EditorRailAddMenuChatIconElement />} label="New chat" onActivate={props.onNewChat} />
      <EditorRailAddMenuItemElement icon={<EditorRailAddMenuTerminalIconElement />} label="New terminal" disabled={props.terminalDisabled} onActivate={props.onNewTerminal} />
    </>
  );
}
