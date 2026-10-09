import type { ComponentType } from "react";

import { ClockIcon, KanbanIcon, NewThreadIcon } from "~/lib/icons";
import { splitShortcutLabel } from "~/keybindings";
import { SidebarGlyph } from "~/components/sidebarGlyphs";
import {
  SidebarPrimaryNavigation,
  type SidebarPrimaryNavigationItem,
} from "~/components/SidebarPrimaryNavigation";

type Badge = SidebarPrimaryNavigationItem["badge"];
type Icon = ComponentType<{ className?: string }>;
export interface SidebarPrimarySurfaceIcons {
  readonly automations: Icon;
  readonly kanban: Icon;
  readonly newThread: Icon;
}

const DEFAULT_ICONS: SidebarPrimarySurfaceIcons = {
  automations: ClockIcon,
  kanban: KanbanIcon,
  newThread: NewThreadIcon,
};

function item(input: {
  icon: Icon;
  label: string;
  onActivate?: (() => void) | undefined;
  onMouseEnter?: (() => void) | undefined;
  onFocus?: (() => void) | undefined;
  active?: boolean | undefined;
  disabled?: boolean | undefined;
  shortcutLabel?: string | null | undefined;
  badge?: Badge | undefined;
}): SidebarPrimaryNavigationItem {
  return {
    id: input.label,
    icon: <SidebarGlyph icon={input.icon} variant="leading" />,
    label: input.label,
    active: input.active,
    disabled: input.disabled,
    shortcutParts: input.shortcutLabel ? splitShortcutLabel(input.shortcutLabel) : [],
    badge: input.badge,
    onActivate: input.onActivate,
    onMouseEnter: input.onMouseEnter,
    onFocus: input.onFocus,
  };
}

/**
 * Primary destinations under the sidebar header. Search lives in the header row next to
 * the surface picker, so neither surface lists it here.
 */
export function SidebarPrimarySurfaceNavigation(props: {
  surface: "threads" | "studio";
  pullRequestIcon: Icon;
  icons?: SidebarPrimarySurfaceIcons | undefined;
  kanbanActive?: boolean | undefined;
  pullRequestsActive?: boolean | undefined;
  automationsActive?: boolean | undefined;
  pullRequestsBadge?: Badge | undefined;
  automationsBadge?: Badge | undefined;
  newThreadShortcutLabel?: string | null | undefined;
  onCreateStudioChat?: (() => void) | undefined;
  onCreateThread?: (() => void) | undefined;
  onCreateThreadPrewarm?: (() => void) | undefined;
  onOpenKanban?: (() => void) | undefined;
  onOpenPullRequests?: (() => void) | undefined;
  onOpenAutomations?: (() => void) | undefined;
}) {
  const icons = props.icons ?? DEFAULT_ICONS;
  const items =
    props.surface === "studio"
      ? [
          item({
            icon: icons.newThread,
            label: "New studio chat",
            onActivate: props.onCreateStudioChat,
          }),
        ]
      : [
          item({
            icon: icons.newThread,
            label: "New thread",
            onActivate: props.onCreateThread,
            onMouseEnter: props.onCreateThreadPrewarm,
            onFocus: props.onCreateThreadPrewarm,
            shortcutLabel: props.newThreadShortcutLabel,
          }),
          item({
            icon: icons.kanban,
            label: "Kanban",
            active: props.kanbanActive,
            onActivate: props.onOpenKanban,
            disabled: !props.onOpenKanban,
          }),
          item({
            icon: props.pullRequestIcon,
            label: "Pull requests",
            active: props.pullRequestsActive,
            badge: props.pullRequestsBadge,
            onActivate: props.onOpenPullRequests,
            disabled: !props.onOpenPullRequests,
          }),
          item({
            icon: icons.automations,
            label: "Automations",
            active: props.automationsActive,
            badge: props.automationsBadge,
            onActivate: props.onOpenAutomations,
            disabled: !props.onOpenAutomations,
          }),
        ];

  return <SidebarPrimaryNavigation items={items} />;
}
