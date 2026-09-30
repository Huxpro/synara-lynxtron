import type { ReactNode } from "react";

import {
  SidebarThreadIdentityCopyElement,
  SidebarThreadIdentityPendingElement,
  SidebarThreadIdentityTitleElement,
} from "~/components/SidebarThreadIdentityElements";

export interface SidebarThreadIdentityProps {
  readonly title: ReactNode;
  readonly active: boolean;
  readonly subagent?: boolean | undefined;
  readonly pendingStatusColorClass?: string | null | undefined;
  readonly titleTestId?: string | undefined;
}

export function SidebarThreadIdentity({
  title,
  active,
  subagent = false,
  pendingStatusColorClass,
  titleTestId,
}: SidebarThreadIdentityProps) {
  return (
    <SidebarThreadIdentityCopyElement subagent={subagent}>
      <SidebarThreadIdentityTitleElement active={active} subagent={subagent} testId={titleTestId}>
        {title}
      </SidebarThreadIdentityTitleElement>
      {!subagent && pendingStatusColorClass ? (
        <SidebarThreadIdentityPendingElement colorClass={pendingStatusColorClass}>
          Pending
        </SidebarThreadIdentityPendingElement>
      ) : null}
    </SidebarThreadIdentityCopyElement>
  );
}
