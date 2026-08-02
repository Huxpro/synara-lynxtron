import type { ReactNode } from '@lynx-js/react';

export function SidebarFooterFrameElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarFooter">{props.children}</view>;
}

export function SidebarFooterStackElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarFooterStack">{props.children}</view>;
}

export function SidebarFooterRowElement(props: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarFooterRow">{props.children}</view>;
}
