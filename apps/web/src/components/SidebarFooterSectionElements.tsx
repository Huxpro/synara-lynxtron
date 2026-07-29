// FILE: SidebarFooterSectionElements.tsx
// Purpose: Web host elements beneath the shared sidebar footer composition.

import type { ReactNode } from "react";

import { SidebarFooter, SidebarMenu, SidebarMenuItem } from "./ui/sidebar";

export function SidebarFooterFrameElement(props: { readonly children?: ReactNode }) {
  return (
    <SidebarFooter className="gap-2 p-2 font-system-ui">
      <SidebarMenu>
        <SidebarMenuItem>{props.children}</SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>
  );
}

export function SidebarFooterStackElement(props: { readonly children?: ReactNode }) {
  return <div className="flex flex-col gap-1">{props.children}</div>;
}

export function SidebarFooterRowElement(props: { readonly children?: ReactNode }) {
  return <div className="flex items-center gap-2">{props.children}</div>;
}
