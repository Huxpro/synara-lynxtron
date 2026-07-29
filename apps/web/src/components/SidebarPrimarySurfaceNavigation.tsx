import type { ComponentType } from "react";

import {
  ClockIcon,
  KanbanIcon,
  NewThreadIcon,
  SearchIcon,
  TerminalIcon,
} from "~/lib/icons";
import { splitShortcutLabel } from "~/keybindings";
import { SidebarGlyph } from "~/components/sidebarGlyphs";
import {
  SidebarPrimaryNavigation,
  type SidebarPrimaryNavigationItem,
} from "~/components/SidebarPrimaryNavigation";

type Badge = SidebarPrimaryNavigationItem["badge"];
type Icon = ComponentType<{ className?: string }>;

function item(input: {
  icon: Icon;
  label: string;
  onActivate?: () => void;
  onMouseEnter?: () => void;
  onFocus?: () => void;
  active?: boolean;
  disabled?: boolean;
  shortcutLabel?: string | null;
  badge?: Badge;
}): SidebarPrimaryNavigationItem {
  return {
    id: input.label,
    icon: <SidebarGlyph icon={input.icon} variant="leading" />,
    label: input.label,
    active: input.active,
    disabled: input.disabled,
    shortcutParts: input.shortcutLabel
      ? splitShortcutLabel(input.shortcutLabel)
      : [],
    badge: input.badge,
    onActivate: input.onActivate,
    onMouseEnter: input.onMouseEnter,
    onFocus: input.onFocus,
  };
}

export function SidebarPrimarySurfaceNavigation(props: {
  surface: "threads" | "studio" | "workspace";
  pullRequestIcon: Icon;
  searchOpen?: boolean;
  kanbanActive?: boolean;
  pullRequestsActive?: boolean;
  automationsActive?: boolean;
  pullRequestsBadge?: Badge;
  automationsBadge?: Badge;
  newThreadShortcutLabel?: string | null;
  searchShortcutLabel?: string | null;
  onCreateWorkspace?: () => void;
  onCreateStudioChat?: () => void;
  onCreateThread?: () => void;
  onCreateThreadPrewarm?: () => void;
  onOpenSearch?: () => void;
  onOpenKanban?: () => void;
  onOpenPullRequests?: () => void;
  onOpenAutomations?: () => void;
}) {
  const items =
    props.surface === "workspace"
      ? [
          item({
            icon: TerminalIcon,
            label: "New workspace",
            onActivate: props.onCreateWorkspace,
          }),
        ]
      : props.surface === "studio"
        ? [
            item({
              icon: NewThreadIcon,
              label: "New studio chat",
              onActivate: props.onCreateStudioChat,
            }),
            item({
              icon: SearchIcon,
              label: "Search",
              active: props.searchOpen,
              onActivate: props.onOpenSearch,
              shortcutLabel: props.searchShortcutLabel,
            }),
          ]
        : [
            item({
              icon: NewThreadIcon,
              label: "New thread",
              onActivate: props.onCreateThread,
              onMouseEnter: props.onCreateThreadPrewarm,
              onFocus: props.onCreateThreadPrewarm,
              shortcutLabel: props.newThreadShortcutLabel,
            }),
            item({
              icon: SearchIcon,
              label: "Search",
              active: props.searchOpen,
              onActivate: props.onOpenSearch,
              shortcutLabel: props.searchShortcutLabel,
            }),
            item({
              icon: KanbanIcon,
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
              icon: ClockIcon,
              label: "Automations",
              active: props.automationsActive,
              badge: props.automationsBadge,
              onActivate: props.onOpenAutomations,
              disabled: !props.onOpenAutomations,
            }),
          ];

  return <SidebarPrimaryNavigation items={items} />;
}
