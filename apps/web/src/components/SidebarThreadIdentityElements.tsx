import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import { SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME } from "../sidebarRowStyles";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarThreadIdentityCopyElement({
  subagent,
  children,
}: ChildrenProps & { readonly subagent: boolean }) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center text-left",
        subagent ? "gap-[5px]" : "gap-1.5",
      )}
    >
      {children}
    </div>
  );
}

export function SidebarThreadIdentityTitleElement({
  active,
  subagent,
  testId,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly subagent: boolean;
  readonly testId?: string;
}) {
  return (
    <span
      className={cn(
        "min-w-0 flex-1 truncate-fade text-[length:var(--app-font-size-ui,12px)]",
        active ? "text-foreground" : SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME,
        subagent ? "leading-[18px] text-foreground/80" : "leading-5",
      )}
      data-testid={testId}
    >
      {children}
    </span>
  );
}

export function SidebarThreadIdentityPendingElement({
  colorClass,
  children,
}: ChildrenProps & { readonly colorClass: string }) {
  return (
    <span
      aria-label="Pending approval"
      className={cn("shrink-0 text-[10px] font-medium", colorClass)}
    >
      {children}
    </span>
  );
}
