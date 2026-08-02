import type { ReactNode } from '@lynx-js/react';

export function SidebarContentFrameElement(props: {
  readonly children?: ReactNode;
}) {
  return (
    <scroll-view className="AppSidebarScroll" scroll-orientation="vertical">
      <view className="AppSidebarScrollInner">{props.children}</view>
    </scroll-view>
  );
}

export function SidebarSurfaceTransitionElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarSurfaceEnter">{props.children}</view>;
}
