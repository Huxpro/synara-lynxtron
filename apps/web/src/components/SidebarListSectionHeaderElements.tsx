import type { ReactNode } from "react";

import { SIDEBAR_SECTION_LABEL_CLASS_NAME } from "../sidebarRowStyles";
import type {
  SidebarProjectSortOrderValue,
  SidebarThreadSortOrderValue,
} from "../sidebarSortDefaults";
import { createCentralIconComponent } from "../lib/central-icons";
import { cn } from "../lib/utils";
import { ComposerPickerMenuPopup } from "./chat/ComposerPickerMenuPopup";
import { SidebarIconButton } from "./SidebarIconButton";
import {
  Menu,
  MenuGroup,
  MenuGroupLabel,
  MenuRadioGroup,
  MenuRadioItem,
  MenuTrigger,
} from "./ui/menu";
import {
  SIDEBAR_PROJECT_SORT_OPTIONS,
  SIDEBAR_THREAD_SORT_OPTIONS,
} from "./SidebarProjectSort.logic";
import { SidebarSectionToolbar } from "./SidebarSectionToolbar";

const AddPlusIcon = createCentralIconComponent("plus-medium");
const SortFilterIcon = createCentralIconComponent("filter-2");

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarListSectionHeaderContainerElement({ children }: ChildrenProps) {
  return <div className="group/project-header relative my-1">{children}</div>;
}

export function SidebarListSectionHeaderLabelElement({ children }: ChildrenProps) {
  return (
    <div
      className={cn(
        "flex h-7 w-full min-w-0 items-center px-2 py-0.5 pr-[4.75rem]",
        SIDEBAR_SECTION_LABEL_CLASS_NAME,
      )}
    >
      <span className="truncate">{children}</span>
    </div>
  );
}

export function SidebarListSectionHeaderToolbarElement({ children }: ChildrenProps) {
  return (
    <SidebarSectionToolbar placement="overlay" revealOnHover>
      {children}
    </SidebarSectionToolbar>
  );
}

export function SidebarListSectionHeaderAddProjectElement(props: {
  readonly elementId?: string;
  readonly onActivate: () => void;
}) {
  return (
    <SidebarIconButton
      id={props.elementId}
      icon={AddPlusIcon}
      label="Add project"
      onClick={props.onActivate}
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
      <SidebarIconButton render={<MenuTrigger />} icon={SortFilterIcon} label="Sort projects" />
      <ComposerPickerMenuPopup align="end" side="bottom" className="min-w-44">
        <MenuGroup>
          <MenuGroupLabel>Sort projects</MenuGroupLabel>
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
          <MenuGroupLabel>Sort threads</MenuGroupLabel>
          <MenuRadioGroup
            value={props.threadSortOrder}
            onValueChange={(value) =>
              props.onThreadSortOrderChange(value as SidebarThreadSortOrderValue)
            }
          >
            {SIDEBAR_THREAD_SORT_OPTIONS.map((option) => (
              <MenuRadioItem key={option.value} value={option.value}>
                {option.label}
              </MenuRadioItem>
            ))}
          </MenuRadioGroup>
        </MenuGroup>
      </ComposerPickerMenuPopup>
    </Menu>
  );
}
