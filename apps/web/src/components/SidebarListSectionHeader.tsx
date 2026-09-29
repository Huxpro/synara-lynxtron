import type { ReactNode } from "react";

import {
  SidebarListSectionHeaderContainerElement,
  SidebarListSectionHeaderLabelElement,
  SidebarListSectionHeaderToolbarElement,
} from "~/components/SidebarListSectionHeaderElements";

export interface SidebarListSectionHeaderProps {
  readonly label: string;
  readonly children?: ReactNode;
}

export function SidebarListSectionHeader({ label, children }: SidebarListSectionHeaderProps) {
  return (
    <SidebarListSectionHeaderContainerElement>
      <SidebarListSectionHeaderLabelElement>{label}</SidebarListSectionHeaderLabelElement>
      {children ? (
        <SidebarListSectionHeaderToolbarElement>{children}</SidebarListSectionHeaderToolbarElement>
      ) : null}
    </SidebarListSectionHeaderContainerElement>
  );
}
