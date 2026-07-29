// FILE: SidebarStudioSection.tsx
// Purpose: Shared flat Studio chat section composition.

import type { ReactNode } from "react";

import { SidebarListSectionHeader } from "./SidebarListSectionHeader";
import {
  SidebarStudioEmptyElement,
  SidebarStudioListElement,
  SidebarStudioSectionRootElement,
} from "~/components/SidebarStudioSectionElements";

export function SidebarStudioSection<Row>(props: {
  readonly rows: readonly Row[];
  readonly renderRow: (row: Row) => ReactNode;
  readonly hydrated: boolean;
  readonly prelude?: ReactNode;
  readonly headerActions?: ReactNode;
  readonly listRef?: unknown;
}) {
  return (
    <SidebarStudioSectionRootElement>
      {props.prelude}
      <SidebarListSectionHeader label="Studio">
        {props.headerActions}
      </SidebarListSectionHeader>
      <SidebarStudioListElement listRef={props.listRef}>
        {props.rows.length > 0 ? (
          props.rows.map((row) => props.renderRow(row))
        ) : (
          <SidebarStudioEmptyElement>
            {props.hydrated ? "No studio chats yet" : "Loading Studio..."}
          </SidebarStudioEmptyElement>
        )}
      </SidebarStudioListElement>
    </SidebarStudioSectionRootElement>
  );
}
