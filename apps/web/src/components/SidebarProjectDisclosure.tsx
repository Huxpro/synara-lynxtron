// FILE: SidebarProjectDisclosure.tsx
// Purpose: Shared project header/disclosure/thread-list/pagination ordering.
// Exports: Generic project row composition with platform host elements below it.

import type { ReactNode } from "react";

import {
  SidebarProjectDisclosureBodyElement,
  SidebarProjectDisclosureRootElement,
} from "~/components/SidebarProjectDisclosureElements";
import { SidebarThreadPagination } from "./SidebarThreadPagination";

export function SidebarProjectDisclosure<Row>(props: {
  readonly expanded: boolean;
  readonly header: ReactNode;
  readonly rows: readonly Row[];
  readonly renderRow: (row: Row) => ReactNode;
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
  readonly onShowMore: () => void;
  readonly onShowLess: () => void;
}) {
  return (
    <SidebarProjectDisclosureRootElement>
      {props.header}
      <SidebarProjectDisclosureBodyElement expanded={props.expanded}>
        {props.rows.map((row) => props.renderRow(row))}
        <SidebarThreadPagination
          variant="nested"
          canShowMore={props.canShowMore}
          canShowLess={props.canShowLess}
          onShowMore={props.onShowMore}
          onShowLess={props.onShowLess}
        />
      </SidebarProjectDisclosureBodyElement>
    </SidebarProjectDisclosureRootElement>
  );
}
