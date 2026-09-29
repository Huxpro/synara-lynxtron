import type { ReactNode } from "@lynx-js/react";

import {
  resolveSystemStateSemantics,
  type SystemStateIntent,
} from "@synara-web/components/systemStateSemantics";

import { useLynxSystemStateAnnouncement } from "../platform/system-state-announcement.lynx";

export function SidebarProjectsSectionRootElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarProjectsRoot">{props.children}</view>;
}

export function SidebarProjectsListElement(props: { readonly children?: ReactNode }) {
  return <view className="SharedSidebarProjectsList">{props.children}</view>;
}

export function SidebarProjectsStateElement(props: {
  readonly children?: ReactNode;
  readonly intent: Exclude<SystemStateIntent, "plain">;
  readonly announcement: string;
}) {
  const semantics = resolveSystemStateSemantics(props.intent);
  useLynxSystemStateAnnouncement(props);
  return (
    <text
      className="SharedSidebarProjectsState"
      accessibility-element={semantics.announce}
      accessibility-label={props.announcement}
      accessibility-trait={props.intent === "status" ? "updating" : "text"}
    >
      {props.children}
    </text>
  );
}
