// FILE: SidebarPrimaryNavigationElements.tsx
// Purpose: Web host elements beneath the shared primary Sidebar navigation.

import type { ReactNode } from "react";

import { Kbd, KbdGroup } from "~/components/ui/kbd";
import { SidebarGroup, SidebarMenu } from "~/components/ui/sidebar";

export function SidebarPrimaryNavigationRootElement({
  children,
}: {
  readonly children?: ReactNode | undefined;
}) {
  return (
    <SidebarGroup className="px-1.5 pt-1 pb-1.5">
      <SidebarMenu className="gap-0.5">{children}</SidebarMenu>
    </SidebarGroup>
  );
}

export function SidebarPrimaryNavigationBadgeElement({
  text,
  accessibleLabel,
}: {
  readonly text: string;
  readonly accessibleLabel: string;
}) {
  return (
    <span
      className="inline-flex h-4 min-w-4 items-center justify-center rounded-md bg-muted px-1 text-ui-xs font-medium text-muted-foreground"
      aria-label={accessibleLabel}
      title={accessibleLabel}
    >
      {text}
    </span>
  );
}

export function SidebarPrimaryNavigationShortcutElement({
  parts,
}: {
  readonly parts: readonly string[];
}) {
  return (
    <span className="opacity-0 transition-opacity group-hover/sidebar-primary-action:opacity-100 group-focus-visible/sidebar-primary-action:opacity-100">
      <KbdGroup>
        {parts.map((part) => (
          <Kbd key={part}>{part}</Kbd>
        ))}
      </KbdGroup>
    </span>
  );
}
