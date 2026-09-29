import type { ReactNode } from "@lynx-js/react";

import "./sidebar-project-summary-elements.css";

interface ElementProps {
  readonly className?: string;
  readonly children?: ReactNode;
}

export function SidebarProjectSummaryLeadingElement({ children }: ElementProps) {
  return <view className="SharedSidebarProjectSummaryLeading">{children}</view>;
}

export function SidebarProjectSummaryCopyElement({ children }: ElementProps) {
  return <view className="SharedSidebarProjectSummaryCopy">{children}</view>;
}

export function SidebarProjectSummaryNameElement({ children }: ElementProps) {
  return <text className="SharedSidebarProjectSummaryName">{children}</text>;
}

export function SidebarProjectSummarySecondaryNameElement({ children }: ElementProps) {
  return <text className="SharedSidebarProjectSummarySecondary">{children}</text>;
}
