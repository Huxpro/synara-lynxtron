// FILE: SidebarStudioSectionElements.tsx
// Purpose: Web host elements beneath the shared Studio section.

import type { ReactNode, Ref } from "react";

import { SidebarGroup, SidebarMenu } from "./ui/sidebar";

export function SidebarStudioSectionRootElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return <SidebarGroup className="px-1.5 py-1.5">{props.children}</SidebarGroup>;
}

export function SidebarStudioListElement(props: {
  readonly children?: ReactNode | undefined;
  readonly listRef?: unknown | undefined;
}) {
  return (
    <SidebarMenu ref={props.listRef as Ref<HTMLUListElement>} className="gap-1">
      {props.children}
    </SidebarMenu>
  );
}

export function SidebarStudioEmptyElement(props: { readonly children?: ReactNode | undefined }) {
  return (
    <div className="px-2 pt-4 text-center text-ui text-muted-foreground/58">{props.children}</div>
  );
}
