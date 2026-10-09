// FILE: SidebarSettingsEntry.tsx
// Purpose: Shared Settings footer-entry composition and route visibility.

import { SidebarSettingsEntryElement } from "~/components/SidebarSettingsEntryElements";

export function SidebarSettingsEntry(props: {
  readonly visible: boolean;
  readonly active?: boolean | undefined;
  readonly icon: unknown;
  readonly onActivate: () => void;
}) {
  if (!props.visible) {
    return null;
  }

  return (
    <SidebarSettingsEntryElement
      active={props.active}
      icon={props.icon}
      label="Settings"
      onActivate={props.onActivate}
    />
  );
}
