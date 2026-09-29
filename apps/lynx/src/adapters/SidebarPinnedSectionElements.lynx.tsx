import type { ReactNode } from "@lynx-js/react";

export function SidebarPinnedSectionRootElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarPinnedRoot">{props.children}</view>;
}

export function SidebarPinnedListElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarPinnedList">{props.children}</view>;
}
