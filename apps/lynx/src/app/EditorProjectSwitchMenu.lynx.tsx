import type { SpaceIconName } from "@synara/contracts";
import type { InputRef } from "@lynx-js/lynx-ui";
import { useEffect, useRef } from "@lynx-js/react";

import {
  ComposerProjectPickerGroupElement,
  ComposerProjectPickerGroupLabelElement,
} from "../adapters/ComposerProjectPickerCompositionElements.lynx";
import {
  Menu,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { ChevronDownIcon } from "../lib/icons.lynx";
import { Input } from "../components/ui/input.lynx";
import type { EditorProjectSwitchOption } from "./editorProjectSwitch.logic";
import { resolveEditorProjectSwitchListHeight } from "./editorProjectSwitch.logic";

export interface EditorProjectSwitchGroup {
  readonly key: string;
  readonly label: string;
  readonly icon: SpaceIconName | "black-hole";
  readonly items: readonly EditorProjectSwitchOption[];
}

export function EditorProjectSwitchSearchHeader(props: {
  readonly autoFocus?: boolean;
  readonly disabled?: boolean;
  readonly query: string;
  readonly onQueryChange: (query: string) => void;
}) {
  const searchInputRef = useRef<InputRef>(null);
  useEffect(() => {
    if (!props.autoFocus || props.disabled) return;
    const input = searchInputRef.current;
    if (!input) return;
    void input
      .focus()
      .then(() => input.setSelectionRange(0, props.query.length))
      .catch(() => undefined);
  }, [props.autoFocus, props.disabled]);
  return (
    <view className="ThreadEditorProjectSwitchSearch">
      <Input
        ref={searchInputRef}
        aria-label="Search projects"
        className="ThreadEditorProjectSwitchSearchInput"
        disabled={props.disabled}
        nativeInput
        placeholder="Search projects"
        size="sm"
        type="search"
        value={props.query}
        onChange={(event) => props.onQueryChange(event.target.value)}
      />
    </view>
  );
}

export function EditorProjectSwitchMenu(props: {
  readonly currentProjectId: string | null;
  readonly groups: readonly EditorProjectSwitchGroup[];
  readonly open: boolean;
  readonly query: string;
  readonly onOpenChange: (open: boolean) => void;
  readonly onProjectIdChange: (projectId: string) => void;
  readonly onQueryChange: (query: string) => void;
}) {
  const listHeight = resolveEditorProjectSwitchListHeight(props.groups);
  return (
    <Menu autoHighlightFirst={false} open={props.open} onOpenChange={props.onOpenChange}>
      <MenuTrigger
        ariaLabel="Switch project"
        className={`ThreadEditorProjectSwitchTrigger${
          props.open ? " ThreadEditorProjectSwitchTrigger--open" : ""
        }`}
      >
        <ChevronDownIcon size={14} color="var(--muted-foreground)" />
      </MenuTrigger>
      <MenuPopup
        align="start"
        className="ThreadEditorProjectSwitchPopup"
        side="bottom"
        sideOffset={4}
        style={{ height: `${listHeight + 41}px` }}
      >
        <EditorProjectSwitchSearchHeader
          autoFocus={props.open}
          query={props.query}
          onQueryChange={props.onQueryChange}
        />
        <scroll-view
          className="ThreadEditorProjectSwitchList"
          scroll-orientation="vertical"
          style={{ height: `${listHeight}px` }}
        >
          {props.groups.length > 0 ? (
            <MenuRadioGroup
              value={props.currentProjectId ?? ""}
              onValueChange={props.onProjectIdChange}
            >
              {props.groups.map((group, index) => (
                <ComposerProjectPickerGroupElement key={group.key} separatorBefore={index > 0}>
                  <ComposerProjectPickerGroupLabelElement icon={group.icon}>
                    {group.label}
                  </ComposerProjectPickerGroupLabelElement>
                  {group.items.map((option) => (
                    <MenuRadioItem key={option.id} value={option.id}>
                      {option.title}
                    </MenuRadioItem>
                  ))}
                </ComposerProjectPickerGroupElement>
              ))}
            </MenuRadioGroup>
          ) : (
            <text className="ThreadEditorProjectSwitchEmpty">No matching projects</text>
          )}
        </scroll-view>
      </MenuPopup>
    </Menu>
  );
}
