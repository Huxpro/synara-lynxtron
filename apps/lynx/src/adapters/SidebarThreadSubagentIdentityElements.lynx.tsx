import type { ReactNode } from '@lynx-js/react';

import './sidebar-thread-subagent-identity-elements.css';

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarThreadSubagentConnectorElement({
  indentPx,
  accentColor,
}: {
  readonly indentPx: number;
  readonly accentColor: string;
}) {
  return (
    <view
      className="SharedSidebarSubagentConnector"
      style={{ marginLeft: `${indentPx}px` }}
    >
      <view className="SharedSidebarSubagentConnectorStem" />
      <view className="SharedSidebarSubagentConnectorArm" />
      <view
        className="SharedSidebarSubagentConnectorDot"
        style={{ backgroundColor: accentColor }}
      />
    </view>
  );
}

export function SidebarThreadSubagentCopyElement({ children }: ChildrenProps) {
  return <view className="SharedSidebarSubagentCopy">{children}</view>;
}

export function SidebarThreadSubagentPrimaryElement({
  accentColor,
  children,
}: ChildrenProps & { readonly accentColor: string }) {
  return (
    <text
      className="SharedSidebarSubagentPrimary"
      style={{ color: accentColor }}
    >
      {children}
    </text>
  );
}

export function SidebarThreadSubagentSupportingElement({
  children,
}: ChildrenProps & { readonly className?: string | undefined }) {
  return <text className="SharedSidebarSubagentSupporting">{children}</text>;
}
