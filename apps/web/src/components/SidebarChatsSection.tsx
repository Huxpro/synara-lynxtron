// FILE: SidebarChatsSection.tsx
// Purpose: Shared Projects-surface Chats disclosure, rows, empty state and paging.
// Exports: SidebarChatsSection

import type { ReactNode } from "react";

import {
  SidebarChatsEmptyElement,
  SidebarChatsSectionBodyElement,
  SidebarChatsSectionHeaderElement,
  SidebarChatsSectionRootElement,
} from "~/components/SidebarChatsSectionElements";
import { SidebarThreadPagination } from "./SidebarThreadPagination";

export function SidebarChatsSection<Row>(props: {
  readonly visible: boolean;
  readonly expanded: boolean;
  readonly rows: readonly Row[];
  readonly renderRow: (row: Row) => ReactNode;
  readonly toolbar?: ReactNode;
  readonly emptyLabel?: string;
  readonly canShowMore?: boolean;
  readonly canShowLess?: boolean;
  readonly onToggle: () => void;
  readonly onShowMore?: () => void;
  readonly onShowLess?: () => void;
}) {
  if (!props.visible) return null;

  return (
    <SidebarChatsSectionRootElement>
      <SidebarChatsSectionHeaderElement
        expanded={props.expanded}
        onActivate={props.onToggle}
        toolbar={props.toolbar}
      />
      <SidebarChatsSectionBodyElement expanded={props.expanded}>
        {props.rows.length > 0 ? (
          props.rows.map((row) => props.renderRow(row))
        ) : (
          <SidebarChatsEmptyElement
            intent="empty"
            announcement={props.emptyLabel ?? "No chats yet"}
          >
            {props.emptyLabel ?? "No chats yet"}
          </SidebarChatsEmptyElement>
        )}
        <SidebarThreadPagination
          canShowMore={props.canShowMore ?? false}
          canShowLess={props.canShowLess ?? false}
          onShowMore={props.onShowMore}
          onShowLess={props.onShowLess}
        />
      </SidebarChatsSectionBodyElement>
    </SidebarChatsSectionRootElement>
  );
}
