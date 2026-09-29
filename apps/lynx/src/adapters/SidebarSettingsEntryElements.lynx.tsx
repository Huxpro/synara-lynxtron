import type { ReactNode } from "@lynx-js/react";

import { SidebarPrimaryActionRow } from "@synara-web/components/SidebarPrimaryActionRow";

export function SidebarSettingsEntryElement(props: {
  readonly active?: boolean;
  readonly icon: unknown;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <SidebarPrimaryActionRow
      active={props.active}
      icon={props.icon as ReactNode}
      label={props.label}
      onActivate={props.onActivate}
    />
  );
}
