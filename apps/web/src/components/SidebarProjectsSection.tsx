// FILE: SidebarProjectsSection.tsx
// Purpose: Shared Projects section composition, row mapping and state copy.
// Exports: SidebarProjectsSection

import type { ReactNode } from "react";

import { SidebarListSectionHeader } from "./SidebarListSectionHeader";
import {
  SidebarProjectsListElement,
  SidebarProjectsSectionRootElement,
  SidebarProjectsStateElement,
} from "~/components/SidebarProjectsSectionElements";

export type SidebarProjectsSectionState =
  | "ready"
  | "loading"
  | "error"
  | "empty";

export function SidebarProjectsSection<Row>(props: {
  readonly rows: readonly Row[];
  readonly renderRow: (row: Row) => ReactNode;
  readonly renderList?: (children: ReactNode) => ReactNode;
  readonly prelude?: ReactNode;
  readonly headerActions?: ReactNode;
  readonly afterList?: ReactNode;
  readonly state?: SidebarProjectsSectionState;
  readonly loadingLabel?: string;
  readonly errorLabel?: string;
  readonly emptyLabel?: string;
}) {
  const state = props.state ?? "ready";
  const rows = props.rows.map((row) => props.renderRow(row));
  const list =
    state === "ready"
      ? props.renderList
        ? props.renderList(rows)
        : <SidebarProjectsListElement>{rows}</SidebarProjectsListElement>
      : null;

  return (
    <SidebarProjectsSectionRootElement>
      {props.prelude}
      <SidebarListSectionHeader label="Projects">
        {props.headerActions}
      </SidebarListSectionHeader>
      {list}
      {state === "loading" ? (
        <SidebarProjectsStateElement>
          {props.loadingLabel ?? "Loading projects..."}
        </SidebarProjectsStateElement>
      ) : state === "error" ? (
        <SidebarProjectsStateElement>
          {props.errorLabel ?? "Server unavailable"}
        </SidebarProjectsStateElement>
      ) : state === "empty" ? (
        <SidebarProjectsStateElement>
          {props.emptyLabel ?? "No projects yet"}
        </SidebarProjectsStateElement>
      ) : null}
      {props.afterList}
    </SidebarProjectsSectionRootElement>
  );
}
