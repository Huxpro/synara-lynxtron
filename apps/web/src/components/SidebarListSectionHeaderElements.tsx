import type { ReactNode } from "react";

import { SIDEBAR_SECTION_LABEL_CLASS_NAME } from "../sidebarRowStyles";
import { createCentralIconComponent } from "../lib/central-icons";
import { cn } from "../lib/utils";
import { SidebarIconButton } from "./SidebarIconButton";
import { SidebarSectionToolbar } from "./SidebarSectionToolbar";

const AddPlusIcon = createCentralIconComponent("plus-medium");

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
