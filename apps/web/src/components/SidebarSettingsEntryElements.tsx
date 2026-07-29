// FILE: SidebarSettingsEntryElements.tsx
// Purpose: Web host element beneath the shared Settings footer entry.

import type { ComponentType } from "react";

import { SidebarGlyph } from "./sidebarGlyphs";
import { SidebarLeadingIcon } from "./SidebarLeadingIcon";
import { SidebarMenuButton } from "./ui/sidebar";
import {
  SIDEBAR_HEADER_ROW_CLASS_NAME,
  SIDEBAR_ROW_HOVER_CLASS_NAME,
  SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
  SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME,
} from "../sidebarRowStyles";
import { cn } from "../lib/utils";

export function SidebarSettingsEntryElement(props: {
  readonly active?: boolean;
  readonly icon: unknown;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  return (
    <SidebarMenuButton
      size="sm"
      isActive={props.active}
      className={cn(
        SIDEBAR_HEADER_ROW_CLASS_NAME,
        SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
        SIDEBAR_ROW_HOVER_CLASS_NAME,
        "flex-1",
      )}
      onClick={props.onActivate}
    >
      <SidebarLeadingIcon size="sm" tone={SIDEBAR_ROW_LABEL_TEXT_CLASS_NAME}>
        <SidebarGlyph
          icon={props.icon as ComponentType<{ className?: string }>}
          variant="leading"
        />
      </SidebarLeadingIcon>
      <span>{props.label}</span>
    </SidebarMenuButton>
  );
}
