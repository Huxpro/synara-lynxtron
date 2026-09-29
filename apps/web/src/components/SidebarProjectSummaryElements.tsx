import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import { SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME } from "../sidebarRowStyles";
import { SidebarLeadingIcon } from "./SidebarLeadingIcon";

interface ElementProps {
  readonly className?: string;
  readonly children?: ReactNode;
}

export function SidebarProjectSummaryLeadingElement({ className, children }: ElementProps) {
  return (
    <SidebarLeadingIcon size="sm" tone={SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME} className={className}>
      {children}
    </SidebarLeadingIcon>
  );
}

export function SidebarProjectSummaryCopyElement({ className, children }: ElementProps) {
  return (
    <div
      className={cn(
        "flex min-w-0 flex-1 items-center gap-2 overflow-hidden transition-[padding] duration-150 ease-out",
        className,
      )}
    >
      {children}
    </div>
  );
}

export function SidebarProjectSummaryNameElement({ children }: ElementProps) {
  return (
    <span
      className={cn(
        "truncate font-system-ui text-[length:var(--app-font-size-ui,12px)] font-normal",
        SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME,
      )}
    >
      {children}
    </span>
  );
}

export function SidebarProjectSummarySecondaryNameElement({ children }: ElementProps) {
  return (
    <span className="shrink-0 truncate text-[length:var(--app-font-size-ui,12px)] text-muted-foreground/40">
      {children}
    </span>
  );
}
