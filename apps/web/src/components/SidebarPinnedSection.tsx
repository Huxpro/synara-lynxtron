// FILE: SidebarPinnedSection.tsx
// Purpose: Shared Pinned section composition for Threads and Studio surfaces.

import type { ReactNode } from "react";

import { SidebarListSectionHeader } from "./SidebarListSectionHeader";
import {
  SidebarPinnedListElement,
  SidebarPinnedSectionRootElement,
} from "~/components/SidebarPinnedSectionElements";

export function SidebarPinnedSection<Row>(props: {
  readonly rows: readonly Row[];
  readonly renderRow: (row: Row) => ReactNode;
}) {
  if (props.rows.length === 0) {
    return null;
  }

  return (
    <SidebarPinnedSectionRootElement>
      <SidebarListSectionHeader label="Pinned" />
      <SidebarPinnedListElement>
        {props.rows.map((row) => props.renderRow(row))}
      </SidebarPinnedListElement>
    </SidebarPinnedSectionRootElement>
  );
}
