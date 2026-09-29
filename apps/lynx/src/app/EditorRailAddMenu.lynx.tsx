import { useState, type ReactNode } from "@lynx-js/react";
import { EditorRailAddMenuComposition } from "@synara-web/components/chat/EditorRailAddMenuComposition";
import { Menu, MenuPopup, MenuTrigger } from "../components/ui/menu.lynx";
import "./editor-rail-add-menu.css";

export function EditorRailAddMenu(props: {
  readonly defaultOpen?: boolean;
  readonly onNewChat: () => void;
  readonly onNewTerminal: () => void;
  readonly terminalDisabled?: boolean;
  readonly trigger: ReactNode;
}) {
  const [open, setOpen] = useState(props.defaultOpen ?? false);
  return (
    <Menu open={open} onOpenChange={setOpen} autoHighlightFirst={false}>
      <MenuTrigger>{props.trigger}</MenuTrigger>
      <MenuPopup
        className="LxPickerMenuPopup ThreadEditorAddMenuPopup"
        side="bottom"
        align="start"
        sideOffset={6}
      >
        <EditorRailAddMenuComposition
          onNewChat={() => {
            setOpen(false);
            props.onNewChat();
          }}
          onNewTerminal={() => {
            setOpen(false);
            props.onNewTerminal();
          }}
          terminalDisabled={props.terminalDisabled}
        />
      </MenuPopup>
    </Menu>
  );
}
