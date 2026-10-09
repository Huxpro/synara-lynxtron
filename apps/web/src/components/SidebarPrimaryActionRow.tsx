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
  readonly elementId?: string | undefined;
  readonly label: string;
  readonly active?: boolean | undefined;
  readonly disabled?: boolean | undefined;
  readonly trailing?: ReactNode | undefined;
  readonly onActivate?: (() => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
  readonly visualState?: "default" | "hover" | "focus" | "pressed" | undefined;
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
  visualState = "default",
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
        visualState={visualState}
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
