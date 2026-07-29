import type { ReactNode } from "react";

export function SidebarThreadTrailingRoot({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

export function SidebarThreadTrailingGroup({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return <div className={className}>{children}</div>;
}

export function SidebarThreadTrailingStatus({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return <span className={className}>{children}</span>;
}
