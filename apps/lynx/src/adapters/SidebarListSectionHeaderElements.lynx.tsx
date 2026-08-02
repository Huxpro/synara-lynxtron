import type { ReactNode } from '@lynx-js/react';

import './sidebar-list-section-header-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarListSectionHeaderContainerElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarListSectionHeader">{children}</view>;
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
