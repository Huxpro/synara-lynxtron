// FILE: SidebarFooterSection.tsx
// Purpose: Shared sidebar footer composition (stack + row + Settings entry ordering).

import type { ReactNode } from "react";

import { SidebarSettingsEntry } from "~/components/SidebarSettingsEntry";
import {
  SidebarFooterFrameElement,
  SidebarFooterRowElement,
  SidebarFooterStackElement,
} from "~/components/SidebarFooterSectionElements";

export function SidebarFooterSection(props: {
  readonly settingsVisible: boolean;
  readonly settingsActive?: boolean;
  readonly settingsIcon: unknown;
  readonly onOpenSettings: () => void;
  readonly prelude?: ReactNode;
  readonly trailing?: ReactNode;
}) {
  return (
    <SidebarFooterFrameElement>
      <SidebarFooterStackElement>
        {props.prelude}
        <SidebarFooterRowElement>
          <SidebarSettingsEntry
            visible={props.settingsVisible}
            active={props.settingsActive}
            icon={props.settingsIcon}
            onActivate={props.onOpenSettings}
          />
          {props.trailing}
        </SidebarFooterRowElement>
      </SidebarFooterStackElement>
    </SidebarFooterFrameElement>
  );
}
