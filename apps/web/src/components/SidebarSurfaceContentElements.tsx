// FILE: SidebarSurfaceContentElements.tsx
// Purpose: Web host elements beneath the shared sidebar content/surface composition.

import type { ReactNode } from "react";

import { SidebarContent } from "./ui/sidebar";

export function SidebarContentFrameElement(props: { readonly children?: ReactNode }) {
  return (
    <div className="flex min-h-0 flex-1 flex-col font-system-ui">
      {props.children}
    </div>
  );
}

export function SidebarFixedRegionElement(props: { readonly children?: ReactNode }) {
  return <div className="shrink-0">{props.children}</div>;
}

export function SidebarScrollRegionElement(props: { readonly children?: ReactNode }) {
  return <SidebarContent className="gap-0">{props.children}</SidebarContent>;
}

export function SidebarSurfaceTransitionElement(props: { readonly children?: ReactNode }) {
  return <div className="sidebar-surface-enter">{props.children}</div>;
}
