import type { ReactNode } from "@lynx-js/react";

import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from "@synara-web/components/systemStateSemantics";

import { useLynxInteractiveState } from "../components/ui/interactive-state.lynx";
import { disclosureContentClassName, useLynxDisclosurePresence } from "../platform/motion.lynx";
import { useLynxSystemStateAnnouncement } from "../platform/system-state-announcement.lynx";
import { ChevronDownIcon, ChevronRightIcon } from "../lib/icons.lynx";

export function SidebarChatsSectionRootElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarChatsRoot">{props.children}</view>;
}

export function SidebarChatsSectionHeaderElement(props: {
  readonly expanded: boolean;
  readonly onActivate: () => void;
  readonly toolbar?: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSidebarChatsHeaderButton",
    onActivate: props.onActivate,
  });
  // Hover owner so the overlay toolbar reveals on header hover, like the web.
  const header = useLynxInteractiveState({
    baseClassName: "SharedSidebarChatsHeader LynxWebHoverOwner",
    focusable: false,
  });
  return (
    <view className={header.className} {...header.eventProps}>
      <view
        className={interaction.className}
        aria-expanded={props.expanded}
        {...interaction.eventProps}
      >
        <text className="SharedSidebarChatsLabel">Chats</text>
        {props.expanded ? (
          <ChevronDownIcon
            className="LynxDisclosureChevron SharedSidebarChatsChevron"
            color="var(--muted-foreground)"
            size={14}
          />
        ) : (
          <ChevronRightIcon
            className="LynxDisclosureChevron SharedSidebarChatsChevron"
            color="var(--muted-foreground)"
            size={14}
          />
        )}
      </view>
      {props.toolbar ? (
        <view className="SharedSidebarListSectionHeaderToolbar">{props.toolbar}</view>
      ) : null}
    </view>
  );
}

export function SidebarChatsSectionBodyElement(props: {
  readonly expanded: boolean;
  readonly children?: ReactNode;
}) {
  const present = useLynxDisclosurePresence(props.expanded);
  return (
    <view className={disclosureContentClassName(props.expanded, "SharedSidebarChatsBody")}>
      {present ? props.children : null}
    </view>
  );
}

export function SidebarChatsEmptyElement(props: {
  readonly children?: ReactNode;
  readonly intent: Extract<SystemStateIntent, "empty">;
  readonly announcement: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  useLynxSystemStateAnnouncement(props);
  return (
    <text
      className="AppSidebarState"
      accessibility-element={semantics.announce}
      accessibility-label={props.announcement}
      accessibility-trait="text"
    >
      {props.children}
    </text>
  );
}

function SidebarChatsPaginationActionElement(props: {
  readonly label: string;
  readonly onActivate?: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "SharedSidebarChatsPaginationAction",
    accessibleLabel: props.label,
    disabled: props.onActivate === undefined,
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} aria-label={props.label} {...interaction.eventProps}>
      <text>{props.label}</text>
    </view>
  );
}

export function SidebarChatsPaginationElement(props: {
  readonly canShowMore: boolean;
  readonly canShowLess: boolean;
  readonly variant?: "section" | "nested";
  readonly onShowMore?: () => void;
  readonly onShowLess?: () => void;
}) {
  if (!props.canShowMore && !props.canShowLess) return null;
  return (
    <view className="SharedSidebarChatsPagination">
      {props.canShowMore ? (
        <SidebarChatsPaginationActionElement label="Show more" onActivate={props.onShowMore} />
      ) : null}
      {props.canShowLess ? (
        <SidebarChatsPaginationActionElement label="Show less" onActivate={props.onShowLess} />
      ) : null}
    </view>
  );
}
