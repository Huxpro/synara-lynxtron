// FILE: SidebarProjectDisclosureElements.tsx
// Purpose: Web host anatomy for shared project disclosure rows.

import type { ReactNode } from "react";

import { cn } from "../lib/utils";
import {
  disclosureContentClassName,
  disclosureShellClassName,
  DISCLOSURE_INNER_CLASS,
} from "../platform/motion";
import {
  SIDEBAR_NESTED_LIST_GAP_CLASS_NAME,
  SIDEBAR_NESTED_LIST_OFFSET_CLASS_NAME,
} from "../sidebarRowStyles";
import { SidebarMenuSub } from "./ui/sidebar";

export function SidebarProjectDisclosureRootElement(props: {
  readonly children?: ReactNode;
}) {
  return <div className="group/collapsible">{props.children}</div>;
}

export function SidebarProjectDisclosureBodyElement(props: {
  readonly expanded: boolean;
  readonly children?: ReactNode;
}) {
  return (
    <div
      className={cn(
        disclosureShellClassName(props.expanded),
        SIDEBAR_NESTED_LIST_OFFSET_CLASS_NAME,
      )}
    >
      <div className={DISCLOSURE_INNER_CLASS}>
        <SidebarMenuSub
          className={cn(
            "mx-0 my-0 w-full translate-x-0 border-l-0 px-0 py-0",
            SIDEBAR_NESTED_LIST_GAP_CLASS_NAME,
            disclosureContentClassName(props.expanded),
          )}
        >
          {props.children}
        </SidebarMenuSub>
      </div>
    </div>
  );
}
