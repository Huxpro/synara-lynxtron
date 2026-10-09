// FILE: SidebarChatsSectionElements.tsx
// Purpose: Web host elements beneath the shared Sidebar chats composition.
// Exports: SidebarChatsSection*Element

import type { ReactNode } from "react";

import { resolveSystemStateSemantics, type SystemStateIntent } from "./systemStateSemantics";
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
} from "./ui/sidebar";
import { DisclosureChevron } from "./ui/DisclosureChevron";
import { SidebarSectionToolbar } from "./SidebarSectionToolbar";
import {
  SIDEBAR_HEADER_ROW_CLASS_NAME,
  SIDEBAR_ROW_HOVER_CLASS_NAME,
  SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME,
} from "../sidebarRowStyles";
import {
  disclosureContentClassName,
  disclosureShellClassName,
  DISCLOSURE_INNER_CLASS,
} from "~/platform/motion";

export function SidebarChatsSectionRootElement(props: {
  readonly children?: ReactNode | undefined;
}) {
  return (
    <SidebarGroup className="sidebar-surface-enter px-1.5 pt-1 pb-2">
      <div className="group/collapsible">{props.children}</div>
    </SidebarGroup>
  );
}

export function SidebarChatsSectionHeaderElement(props: {
  readonly expanded: boolean;
  readonly onActivate: () => void;
  readonly toolbar?: ReactNode | undefined;
}) {
  return (
    <div className="group/project-header relative">
      <SidebarMenuButton
        size="sm"
        aria-expanded={props.expanded}
        className={`${SIDEBAR_HEADER_ROW_CLASS_NAME} ${SIDEBAR_ROW_IDLE_TEXT_CLASS_NAME} ${SIDEBAR_ROW_HOVER_CLASS_NAME} cursor-pointer`}
        onClick={props.onActivate}
        onKeyDown={(event) => {
          if (event.key !== "Enter" && event.key !== " ") return;
          event.preventDefault();
          props.onActivate();
        }}
      >
        <div className="flex min-w-0 flex-1 items-center gap-1 overflow-hidden">
          <span className="truncate font-system-ui text-ui font-normal text-muted-foreground/79">
            Chats
          </span>
          <DisclosureChevron open={props.expanded} className="text-muted-foreground/79" />
        </div>
      </SidebarMenuButton>
      {props.toolbar ? (
        <SidebarSectionToolbar placement="overlay" revealOnHover>
          {props.toolbar}
        </SidebarSectionToolbar>
      ) : null}
    </div>
  );
}

export function SidebarChatsSectionBodyElement(props: {
  readonly expanded: boolean;
  readonly children?: ReactNode | undefined;
}) {
  return (
    <div className={`${disclosureShellClassName(props.expanded)} pt-1`}>
      <div className={DISCLOSURE_INNER_CLASS}>
        <SidebarMenu className={`gap-1 ${disclosureContentClassName(props.expanded)}`}>
          {props.children}
        </SidebarMenu>
      </div>
    </div>
  );
}

export function SidebarChatsEmptyElement(props: {
  readonly children?: ReactNode | undefined;
  readonly intent: Extract<SystemStateIntent, "empty">;
  readonly announcement: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  return (
    <div
      role={semantics.role}
      aria-live={semantics.live}
      aria-atomic={semantics.atomic}
      className="px-2 py-2 text-ui text-muted-foreground/48"
    >
      {props.children}
    </div>
  );
}

export function SidebarChatsPaginationElement(props: {
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
  readonly variant?: "section" | "nested" | undefined;
  readonly onShowMore?: (() => void) | undefined;
  readonly onShowLess?: (() => void) | undefined;
}) {
  if (!props.canShowMore && !props.canShowLess) return null;
  if (props.variant === "nested") {
    return (
      <SidebarMenuSubItem className="w-full">
        <div className="flex w-full items-center gap-1">
          {props.canShowMore ? (
            <SidebarMenuSubButton
              render={<button type="button" />}
              data-thread-selection-safe
              size="sm"
              className="h-7 flex-1 translate-x-0 justify-start rounded-lg pr-2 pl-8 text-left text-ui text-muted-foreground/79 hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground"
              onMouseDown={(event) => event.preventDefault()}
              onClick={props.onShowMore}
            >
              <span>Show more</span>
            </SidebarMenuSubButton>
          ) : null}
          {props.canShowLess ? (
            <SidebarMenuSubButton
              render={<button type="button" />}
              data-thread-selection-safe
              size="sm"
              className={`h-7 translate-x-0 justify-start rounded-lg text-left text-ui text-muted-foreground/79 hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground ${
                props.canShowMore ? "w-auto flex-none px-2" : "flex-1 pr-2 pl-8"
              }`}
              onMouseDown={(event) => event.preventDefault()}
              onClick={props.onShowLess}
            >
              <span>Show less</span>
            </SidebarMenuSubButton>
          ) : null}
        </div>
      </SidebarMenuSubItem>
    );
  }
  return (
    <SidebarMenuItem className="w-full">
      <div className="flex w-full items-center gap-1">
        {props.canShowMore ? (
          <SidebarMenuButton
            size="sm"
            className="h-7 flex-1 justify-start rounded-lg pr-2 pl-8 text-left text-ui font-normal text-muted-foreground/79 hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground"
            onMouseDown={(event) => event.preventDefault()}
            onClick={props.onShowMore}
          >
            <span>Show more</span>
          </SidebarMenuButton>
        ) : null}
        {props.canShowLess ? (
          <SidebarMenuButton
            size="sm"
            className={`h-7 justify-start rounded-lg text-left text-ui font-normal text-muted-foreground/79 hover:bg-transparent hover:text-foreground active:bg-transparent active:text-foreground ${
              props.canShowMore ? "w-auto flex-none px-2" : "flex-1 pr-2 pl-8"
            }`}
            onMouseDown={(event) => event.preventDefault()}
            onClick={props.onShowLess}
          >
            <span>Show less</span>
          </SidebarMenuButton>
        ) : null}
      </div>
    </SidebarMenuItem>
  );
}
