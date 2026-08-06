import type { ReactNode } from '@lynx-js/react';

export function SidebarDesktopHeaderRootElement(props: {
  readonly children?: ReactNode;
  readonly trafficLightGutter?: boolean;
}) {
  return (
    <view className="AppSidebarTitlebar AppWindowDragRegion">
      {props.children}
    </view>
  );
}
