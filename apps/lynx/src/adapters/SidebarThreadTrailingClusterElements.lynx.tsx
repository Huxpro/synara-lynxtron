import type { ReactNode } from '@lynx-js/react';

function joinClassName(base: string, className?: string): string {
  return className ? `${base} ${className}` : base;
}

export function SidebarThreadTrailingRoot({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return (
    <view className={joinClassName('AppSidebarThreadTrailing', className)}>
      {children}
    </view>
  );
}

export function SidebarThreadTrailingGroup({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return <view className={className}>{children}</view>;
}

export function SidebarThreadTrailingStatus({
  className,
  children,
}: {
  readonly className?: string;
  readonly children?: ReactNode;
}) {
  return <view className={className}>{children}</view>;
}
