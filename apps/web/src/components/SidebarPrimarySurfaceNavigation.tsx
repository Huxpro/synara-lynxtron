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
export interface SidebarPrimarySurfaceIcons {
  readonly automations: Icon;
  readonly kanban: Icon;
  readonly newThread: Icon;
  readonly search: Icon;
}

const DEFAULT_ICONS: SidebarPrimarySurfaceIcons = {
  automations: ClockIcon,
  kanban: KanbanIcon,
  newThread: NewThreadIcon,
  search: SearchIcon,
};

function item(input: {
  icon: Icon;
  elementId?: string;
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
    elementId: input.elementId,
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
  icons?: SidebarPrimarySurfaceIcons;
  searchOpen?: boolean;
  kanbanActive?: boolean;
  pullRequestsActive?: boolean;
  automationsActive?: boolean;
  pullRequestsBadge?: Badge;
  automationsBadge?: Badge;
  newThreadShortcutLabel?: string | null;
  searchShortcutLabel?: string | null;
  searchElementId?: string;
  onCreateWorkspace?: () => void;
  onCreateStudioChat?: () => void;
  onCreateThread?: () => void;
  onCreateThreadPrewarm?: () => void;
  onOpenSearch?: () => void;
  onOpenKanban?: () => void;
  onOpenPullRequests?: () => void;
  onOpenAutomations?: () => void;
}) {
  const icons = props.icons ?? DEFAULT_ICONS;
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
              icon: icons.newThread,
              label: "New studio chat",
              onActivate: props.onCreateStudioChat,
            }),
            item({
              icon: icons.search,
              elementId: props.searchElementId,
              label: "Search",
              active: props.searchOpen,
              onActivate: props.onOpenSearch ? () => props.onOpenSearch?.() : undefined,
              shortcutLabel: props.searchShortcutLabel,
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
              icon: icons.search,
              elementId: props.searchElementId,
              label: "Search",
              active: props.searchOpen,
              onActivate: props.onOpenSearch ? () => props.onOpenSearch?.() : undefined,
              shortcutLabel: props.searchShortcutLabel,
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
