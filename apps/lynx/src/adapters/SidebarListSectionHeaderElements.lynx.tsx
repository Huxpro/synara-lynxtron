import composePencilSvg from "@synara-central-icons/compose-pencil.svg?raw";
import expandAllSvg from "@synara-central-icons/expand-45.svg?raw";
import filterSvg from "@synara-central-icons/filter-2.svg?raw";
import collapseAllSvg from "@synara-central-icons/minimize-45.svg?raw";
import plusSvg from "@synara-central-icons/plus-medium.svg?raw";
import type { ReactNode } from "@lynx-js/react";

import {
  SIDEBAR_PROJECT_SORT_OPTIONS,
  SIDEBAR_THREAD_SORT_OPTIONS,
} from "@synara-web/components/SidebarProjectSort.logic";
import type {
  SidebarProjectSortOrderValue,
  SidebarThreadSortOrderValue,
} from "@synara-web/sidebarSortDefaults";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuPopup,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "../components/ui/menu.lynx";
import { useLynxInteractiveState } from "./useLynxInteractiveState";
import { useTheme } from "./useTheme.lynx";
import "./sidebar-list-section-header-elements.css";

interface ChildrenProps {
  readonly children?: ReactNode;
}

function SidebarListSectionHeaderActionIcon(props: { readonly content: string }) {
  const { semanticIconColor } = useTheme();
  return (
    <>
      <svg
        className="SharedSidebarListSectionHeaderActionIcon SharedSidebarListSectionHeaderActionIcon--muted"
        content={colorizeLynxSvg(props.content, semanticIconColor("secondary"))}
      />
      <svg
        className="SharedSidebarListSectionHeaderActionIcon SharedSidebarListSectionHeaderActionIcon--foreground"
        content={colorizeLynxSvg(props.content, semanticIconColor("primary"))}
      />
    </>
  );
}

export function SidebarListSectionHeaderContainerElement({ children }: ChildrenProps) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSidebarListSectionHeader LynxWebHoverOwner",
    focusable: false,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      {children}
    </view>
  );
}

export function SidebarListSectionHeaderLabelElement({ children }: ChildrenProps) {
  return (
    <view className="SharedSidebarListSectionHeaderLabel">
      <text className="SharedSidebarListSectionHeaderText">{children}</text>
    </view>
  );
}

export function SidebarListSectionHeaderToolbarElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarListSectionHeaderToolbar">{children}</view>;
}

export function SidebarListSectionHeaderIconActionElement(props: {
  readonly elementId?: string;
  readonly icon: string;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSidebarListSectionHeaderAction",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view id={props.elementId} className={interaction.className} {...interaction.eventProps}>
      <SidebarListSectionHeaderActionIcon content={props.icon} />
    </view>
  );
}

export function SidebarListSectionHeaderAddProjectElement(props: {
  readonly elementId?: string;
  readonly onActivate: () => void;
}) {
  return (
    <SidebarListSectionHeaderIconActionElement
      elementId={props.elementId}
      icon={plusSvg}
      label="Add project"
      onActivate={props.onActivate}
    />
  );
}

// Web Sidebar: Collapse all (keeping the active project) when every project is
// open, else Expand all.
export function SidebarListSectionHeaderToggleProjectsElement(props: {
  readonly allExpanded: boolean;
  readonly hasFocusedProject: boolean;
  readonly onActivate: () => void;
}) {
  return (
    <SidebarListSectionHeaderIconActionElement
      icon={props.allExpanded ? collapseAllSvg : expandAllSvg}
      label={
        props.allExpanded
          ? props.hasFocusedProject
            ? "Collapse all projects except the active project"
            : "Collapse all projects"
          : "Expand all projects"
      }
      onActivate={props.onActivate}
    />
  );
}

function SidebarThreadSortRadioGroup(props: {
  readonly value: SidebarThreadSortOrderValue;
  readonly onValueChange: (value: SidebarThreadSortOrderValue) => void;
}) {
  return (
    <MenuRadioGroup
      value={props.value}
      onValueChange={(value) => props.onValueChange(value as SidebarThreadSortOrderValue)}
    >
      {SIDEBAR_THREAD_SORT_OPTIONS.map((option) => (
        <MenuRadioItem key={option.value} value={option.value}>
          {option.label}
        </MenuRadioItem>
      ))}
    </MenuRadioGroup>
  );
}

// Web ChatSortMenu: the Chats section sorts threads only.
export function SidebarChatSortElement(props: {
  readonly threadSortOrder: SidebarThreadSortOrderValue;
  readonly onThreadSortOrderChange: (value: SidebarThreadSortOrderValue) => void;
}) {
  return (
    <Menu>
      <MenuTrigger className="SharedSidebarListSectionHeaderAction" ariaLabel="Sort chats">
        <SidebarListSectionHeaderActionIcon content={filterSvg} />
      </MenuTrigger>
      <MenuPopup side="bottom" align="end" className="SharedSidebarProjectSortPopup">
        <MenuGroup>
          <MenuGroupLabel className="SharedSidebarProjectSortGroupLabel">Sort chats</MenuGroupLabel>
          <SidebarThreadSortRadioGroup
            value={props.threadSortOrder}
            onValueChange={props.onThreadSortOrderChange}
          />
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

export function SidebarChatNewElement(props: { readonly onActivate: () => void }) {
  return (
    <SidebarListSectionHeaderIconActionElement
      icon={composePencilSvg}
      label="Open new chat home"
      onActivate={props.onActivate}
    />
  );
}

export function SidebarListSectionHeaderSortElement(props: {
  readonly projectSortOrder: SidebarProjectSortOrderValue;
  readonly threadSortOrder: SidebarThreadSortOrderValue;
  readonly onProjectSortOrderChange: (value: SidebarProjectSortOrderValue) => void;
  readonly onThreadSortOrderChange: (value: SidebarThreadSortOrderValue) => void;
}) {
  return (
    <Menu>
      <MenuTrigger className="SharedSidebarListSectionHeaderAction" ariaLabel="Sort projects">
        <SidebarListSectionHeaderActionIcon content={filterSvg} />
      </MenuTrigger>
      <MenuPopup side="bottom" align="end" className="SharedSidebarProjectSortPopup">
        <MenuGroup>
          <MenuGroupLabel className="SharedSidebarProjectSortGroupLabel">
            Sort projects
          </MenuGroupLabel>
          <MenuRadioGroup
            value={props.projectSortOrder}
            onValueChange={(value) =>
              props.onProjectSortOrderChange(value as SidebarProjectSortOrderValue)
            }
          >
            {SIDEBAR_PROJECT_SORT_OPTIONS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
        <MenuGroup>
          <MenuGroupLabel className="SharedSidebarProjectSortGroupLabel SharedSidebarProjectSortGroupLabel--secondary">
            Sort threads
          </MenuGroupLabel>
          <SidebarThreadSortRadioGroup
            value={props.threadSortOrder}
            onValueChange={props.onThreadSortOrderChange}
          />
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}
