// FILE: SidebarProjectsSectionElements.tsx
// Purpose: Web host elements beneath the shared Sidebar projects composition.
// Exports: SidebarProjectsSection*Element

import type { ReactNode } from "react";

import { resolveSystemStateSemantics, type SystemStateIntent } from "./systemStateSemantics";
import { SidebarGroup, SidebarMenu } from "./ui/sidebar";

export function SidebarProjectsSectionRootElement(props: { readonly children?: ReactNode }) {
  return <SidebarGroup className="px-1.5 py-1.5">{props.children}</SidebarGroup>;
}

export function SidebarProjectsListElement(props: { readonly children?: ReactNode }) {
  return <SidebarMenu className="gap-3">{props.children}</SidebarMenu>;
}

export function SidebarProjectsStateElement(props: {
  readonly children?: ReactNode;
  readonly intent: Exclude<SystemStateIntent, "plain">;
  readonly announcement: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <div
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      className="px-2 pt-4 text-center text-[length:var(--app-font-size-ui,12px)] text-muted-foreground/58"
    >
      {props.children}
    </div>
  );
}
