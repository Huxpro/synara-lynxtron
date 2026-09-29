import type { ReactNode } from "react";
import { Badge } from "../components/ui/badge.lynx";

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
  return (
    <Badge className="SharedSidebarPrimaryNavigationBadge" variant="secondary">
      {text}
    </Badge>
  );
}

export function SidebarPrimaryNavigationShortcutElement({
  parts,
}: {
  readonly parts: readonly string[];
}) {
  return (
    <view className="AppSidebarShortcut">
      {parts.map((part, index) => (
        <text key={`${part}-${index}`} className="AppSidebarShortcutKey">
          {part}
        </text>
      ))}
    </view>
  );
}
