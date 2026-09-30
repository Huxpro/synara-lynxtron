import type { ReactNode } from "react";

export function SidebarThreadTrailingRoot({
  className,
  children,
}: {
  readonly className?: string | undefined;
  readonly children?: ReactNode | undefined;
}) {
  return <div className={className}>{children}</div>;
}

export function SidebarThreadTrailingGroup({
  className,
  children,
}: {
  readonly className?: string | undefined;
  readonly children?: ReactNode | undefined;
}) {
  return <div className={className}>{children}</div>;
}

export function SidebarThreadTrailingStatus({
  className,
  children,
}: {
  readonly className?: string | undefined;
  readonly children?: ReactNode | undefined;
}) {
  return <span className={className}>{children}</span>;
}
