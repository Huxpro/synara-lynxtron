// FILE: SidebarPrimaryNavigation.tsx
// Purpose: Shared declarative composition for the Sidebar's primary action list.

import type { ReactNode } from "react";

import {
  SidebarPrimaryNavigationBadgeElement,
  SidebarPrimaryNavigationRootElement,
  SidebarPrimaryNavigationShortcutElement,
} from "~/components/SidebarPrimaryNavigationElements";
import { SidebarPrimaryActionRow } from "~/components/SidebarPrimaryActionRow";

export interface SidebarPrimaryNavigationItem {
  readonly id: string;
  readonly icon: ReactNode;
  readonly elementId?: string;
  readonly label: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly shortcutParts?: readonly string[];
  readonly badge?: {
    readonly text: string;
    readonly accessibleLabel: string;
  } | null;
  readonly onActivate?: (() => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
}

export function SidebarPrimaryNavigation({
  items,
}: {
  readonly items: readonly SidebarPrimaryNavigationItem[];
}) {
  return (
    <SidebarPrimaryNavigationRootElement>
      {items.map((item) => {
        const shortcutParts = item.shortcutParts ?? [];
        const trailing = item.badge ? (
          <SidebarPrimaryNavigationBadgeElement
            text={item.badge.text}
            accessibleLabel={item.badge.accessibleLabel}
          />
        ) : shortcutParts.length > 0 ? (
          <SidebarPrimaryNavigationShortcutElement parts={shortcutParts} />
        ) : null;

        return (
          <SidebarPrimaryActionRow
            key={item.id}
            icon={item.icon}
            elementId={item.elementId}
            label={item.label}
            active={item.active}
            disabled={item.disabled}
            onActivate={item.onActivate}
            onMouseEnter={item.onMouseEnter}
            onFocus={item.onFocus}
            trailing={trailing}
          />
        );
      })}
    </SidebarPrimaryNavigationRootElement>
  );
}
