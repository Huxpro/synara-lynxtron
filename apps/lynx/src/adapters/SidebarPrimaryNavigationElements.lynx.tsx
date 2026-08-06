import type { ReactNode } from 'react';

export function SidebarPrimaryNavigationRootElement({
  children,
}: {
  readonly children?: ReactNode;
}) {
  return <view className="AppSidebarPrimaryNav">{children}</view>;
}

export function SidebarPrimaryNavigationBadgeElement({
  text,
}: {
  readonly text: string;
  readonly accessibleLabel: string;
}) {
  return <text className="SharedSidebarPrimaryNavigationBadge">{text}</text>;
}

export function SidebarPrimaryNavigationShortcutElement({
  parts,
}: {
  readonly parts: readonly string[];
}) {
  return (
    <view className="AppSidebarShortcut">
      {parts.map((part, index) => (
        <text
          key={`${part}-${index}`}
          className="AppSidebarShortcutKey"
        >
          {part}
        </text>
      ))}
    </view>
  );
}
