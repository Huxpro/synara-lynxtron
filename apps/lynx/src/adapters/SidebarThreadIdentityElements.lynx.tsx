import type { ReactNode } from "@lynx-js/react";

import "./sidebar-thread-identity-elements.css";

interface ChildrenProps {
  readonly children?: ReactNode;
}

export function SidebarThreadIdentityCopyElement({
  subagent,
  children,
}: ChildrenProps & { readonly subagent: boolean }) {
  return (
    <view
      className={`SharedSidebarThreadIdentityCopy${
        subagent ? " SharedSidebarThreadIdentityCopy--subagent" : ""
      }`}
    >
      {children}
    </view>
  );
}

export function SidebarThreadIdentityTitleElement({
  active,
  subagent,
  children,
}: ChildrenProps & {
  readonly active: boolean;
  readonly subagent: boolean;
  readonly testId?: string;
}) {
  return (
    <text
      className={`SharedSidebarThreadIdentityTitle${
        active ? " SharedSidebarThreadIdentityTitle--active" : ""
      }${subagent ? " SharedSidebarThreadIdentityTitle--subagent" : ""}`}
      text-maxline="1"
    >
      {children}
    </text>
  );
}

export function SidebarThreadIdentityPendingElement({
  children,
}: ChildrenProps & { readonly colorClass: string }) {
  return <text className="SharedSidebarThreadIdentityPending">{children}</text>;
}
