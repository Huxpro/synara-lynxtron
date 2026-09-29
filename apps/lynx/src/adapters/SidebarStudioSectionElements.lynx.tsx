import type { ReactNode } from "@lynx-js/react";

export function SidebarStudioSectionRootElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarStudioRoot">{props.children}</view>;
}

export function SidebarStudioListElement(props: {
  readonly children?: ReactNode;
  readonly listRef?: unknown;
}) {
  return <view className="SharedSidebarStudioList">{props.children}</view>;
}

export function SidebarStudioEmptyElement(props: { readonly children?: ReactNode }) {
  return <text className="AppSidebarState">{props.children}</text>;
}
