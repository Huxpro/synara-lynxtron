import type { ReactNode } from "react";

import {
  SidebarProjectSummaryCopyElement,
  SidebarProjectSummaryLeadingElement,
  SidebarProjectSummaryNameElement,
  SidebarProjectSummarySecondaryNameElement,
} from "~/components/SidebarProjectSummaryElements";

export interface SidebarProjectSummaryProps {
  readonly leading: ReactNode;
  readonly name: string;
  readonly secondaryName?: string | null | undefined;
  readonly leadingClassName?: string | undefined;
  readonly copyClassName?: string | undefined;
}

export function SidebarProjectSummary({
  leading,
  name,
  secondaryName,
  leadingClassName,
  copyClassName,
}: SidebarProjectSummaryProps) {
  return (
    <>
      <SidebarProjectSummaryLeadingElement className={leadingClassName}>
        {leading}
      </SidebarProjectSummaryLeadingElement>
      <SidebarProjectSummaryCopyElement className={copyClassName}>
        <SidebarProjectSummaryNameElement>{name}</SidebarProjectSummaryNameElement>
        {secondaryName ? (
          <SidebarProjectSummarySecondaryNameElement>
            {secondaryName}
          </SidebarProjectSummarySecondaryNameElement>
        ) : null}
      </SidebarProjectSummaryCopyElement>
    </>
  );
}
