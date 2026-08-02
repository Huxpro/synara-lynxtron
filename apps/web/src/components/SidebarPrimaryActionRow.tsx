import type { ReactNode } from "react";

import {
  SidebarPrimaryActionButtonElement,
  SidebarPrimaryActionItemElement,
  SidebarPrimaryActionLabelElement,
  SidebarPrimaryActionLeadingElement,
  SidebarPrimaryActionTrailingElement,
} from "~/components/SidebarPrimaryActionElements";

export interface SidebarPrimaryActionRowProps {
  readonly icon: ReactNode;
  readonly elementId?: string;
  readonly label: string;
  readonly active?: boolean;
  readonly disabled?: boolean;
  readonly trailing?: ReactNode;
  readonly onActivate?: (() => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
}

export function SidebarPrimaryActionRow({
  icon,
  elementId,
  label,
  active = false,
  disabled = false,
  trailing,
  onActivate,
  onMouseEnter,
  onFocus,
}: SidebarPrimaryActionRowProps) {
  return (
    <SidebarPrimaryActionItemElement>
      <SidebarPrimaryActionButtonElement
        elementId={elementId}
        active={active}
        accessibleLabel={label}
        disabled={disabled}
        onActivate={onActivate}
        onMouseEnter={onMouseEnter}
        onFocus={onFocus}
      >
        <SidebarPrimaryActionLeadingElement>{icon}</SidebarPrimaryActionLeadingElement>
        <SidebarPrimaryActionLabelElement>{label}</SidebarPrimaryActionLabelElement>
        {trailing ? (
          <SidebarPrimaryActionTrailingElement>{trailing}</SidebarPrimaryActionTrailingElement>
        ) : null}
      </SidebarPrimaryActionButtonElement>
    </SidebarPrimaryActionItemElement>
  );
}
