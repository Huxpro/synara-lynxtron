import type { ReactNode } from "react";

import { SidebarThreadIdentity } from "./SidebarThreadIdentity";

export interface SidebarThreadRowPresentationProps {
  readonly leading?: ReactNode;
  readonly title: ReactNode;
  readonly active: boolean;
  readonly subagent?: boolean;
  readonly pendingStatusColorClass?: string | null;
  readonly titleTestId?: string;
  readonly suffix?: ReactNode;
}

/**
 * Shared, host-neutral identity/status composition for a sidebar thread row.
 *
 * The clickable row root and its event surface stay in the platform renderer;
 * this component owns the ordered visual content used inside that root.
 */
export function SidebarThreadRowPresentation({
  leading,
  title,
  active,
  subagent = false,
  pendingStatusColorClass,
  titleTestId,
  suffix,
}: SidebarThreadRowPresentationProps) {
  return (
    <>
      {leading}
      <SidebarThreadIdentity
        active={active}
        subagent={subagent}
        pendingStatusColorClass={pendingStatusColorClass}
        titleTestId={titleTestId}
        title={title}
      />
      {suffix}
    </>
  );
}
