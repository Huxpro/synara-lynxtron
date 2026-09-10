import type { ReactNode } from "react";

import {
  SIDEBAR_HEADER_ROW_CLASS_NAME,
  SIDEBAR_ROW_ACTIVE_CLASS_NAME,
  SIDEBAR_ROW_HOVER_CLASS_NAME,
  SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
} from "../sidebarRowStyles";
import { cn } from "../lib/utils";
import { SidebarLeadingIcon } from "./SidebarLeadingIcon";
import { SidebarMenuButton, SidebarMenuItem } from "./ui/sidebar";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarPrimaryActionItemElement({ children }: ChildrenProps) {
  return <SidebarMenuItem>{children}</SidebarMenuItem>;
}

export function SidebarPrimaryActionButtonElement({
  active,
  elementId,
  accessibleLabel,
  disabled,
  onActivate,
  onMouseEnter,
  onFocus,
  visualState,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly elementId?: string;
  readonly accessibleLabel: string;
  readonly disabled: boolean;
  readonly onActivate?: (() => void) | undefined;
  readonly onMouseEnter?: (() => void) | undefined;
  readonly onFocus?: (() => void) | undefined;
  readonly visualState?: "default" | "hover" | "focus" | "pressed";
}) {
  return (
    <SidebarMenuButton
      id={elementId}
      size="sm"
      aria-label={accessibleLabel}
      data-active={active}
      aria-current={active ? "page" : undefined}
      className={cn(
        "group/sidebar-primary-action",
        visualState === "hover" && "bg-[var(--sidebar-accent)] text-[var(--sidebar-accent-foreground)]",
        visualState === "pressed" && "bg-[var(--sidebar-accent-active)] text-[var(--sidebar-accent-foreground)]",
        visualState === "focus" && "ring-1 ring-inset ring-ring",
        SIDEBAR_HEADER_ROW_CLASS_NAME,
        active
          ? SIDEBAR_ROW_ACTIVE_CLASS_NAME
          : cn(SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME, SIDEBAR_ROW_HOVER_CLASS_NAME),
      )}
      aria-disabled={disabled || undefined}
      disabled={disabled}
      onClick={onActivate}
      onMouseEnter={onMouseEnter}
      onFocus={onFocus}
    >
      {children}
    </SidebarMenuButton>
  );
}

export function SidebarPrimaryActionLeadingElement({ children }: ChildrenProps) {
  return (
    <SidebarLeadingIcon size="sm" tone="text-inherit">
      {children}
    </SidebarLeadingIcon>
  );
}

export function SidebarPrimaryActionLabelElement({ children }: ChildrenProps) {
  return <span className="truncate">{children}</span>;
}

export function SidebarPrimaryActionTrailingElement({ children }: ChildrenProps) {
  return <span className="ml-auto">{children}</span>;
}
