// FILE: SidebarPinnedSectionElements.tsx
// Purpose: Web host elements beneath the shared Pinned section.

import type { ReactNode } from "react";

export function SidebarPinnedSectionRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <div className="mb-3">{props.children}</div>;
}

export function SidebarPinnedListElement(props: {
  readonly children?: ReactNode;
}) {
  return <div className="flex flex-col gap-0.5">{props.children}</div>;
}
