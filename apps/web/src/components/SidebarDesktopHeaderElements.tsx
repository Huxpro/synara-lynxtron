// FILE: SidebarDesktopHeaderElements.tsx
// Purpose: Web host elements beneath the shared desktop sidebar titlebar.

import type { ReactNode } from "react";

import { CHAT_SURFACE_HEADER_HEIGHT_CLASS } from "./chat/chatSurfaceHeaderStyles";
import { SidebarHeader } from "./ui/sidebar";
import { DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CLASS } from "../hooks/useDesktopTopBarGutter";
import { cn } from "../lib/utils";

export function SidebarDesktopHeaderRootElement(props: {
  readonly children?: ReactNode | undefined;
  readonly trafficLightGutter?: boolean | undefined;
}) {
  return (
    <SidebarHeader
      className={cn(
        "drag-region flex-row items-center gap-2 py-0 ps-4 pe-3 font-system-ui",
        CHAT_SURFACE_HEADER_HEIGHT_CLASS,
        props.trafficLightGutter && DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CLASS,
      )}
    >
      {props.children}
    </SidebarHeader>
  );
}
