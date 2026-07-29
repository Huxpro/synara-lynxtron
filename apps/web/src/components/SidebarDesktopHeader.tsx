// FILE: SidebarDesktopHeader.tsx
// Purpose: Shared desktop sidebar titlebar composition.

import type { ReactNode } from "react";

import { SynaraLogo } from "~/components/SynaraLogo";
import { SidebarDesktopHeaderRootElement } from "~/components/SidebarDesktopHeaderElements";

export function SidebarDesktopHeader(props: {
  readonly leadingControls?: ReactNode;
  readonly trafficLightGutter?: boolean;
}) {
  return (
    <SidebarDesktopHeaderRootElement
      trafficLightGutter={props.trafficLightGutter}
    >
      {props.leadingControls}
      <SynaraLogo
        aria-label="Synara"
        className="SharedSidebarDesktopLogo pointer-events-none ml-auto size-3.5 text-[var(--color-text-foreground-secondary)] opacity-80"
      />
    </SidebarDesktopHeaderRootElement>
  );
}
