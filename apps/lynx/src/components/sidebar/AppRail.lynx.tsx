// FILE: AppRail.lynx.tsx
// Purpose: Lynx rendering of upstream's rail layout (components/AppRail.tsx,
//   AppRailMoreMenu.tsx, AppShellTopStrip.tsx): the window-chrome strip, the fixed
//   icon rail and the panel column beside it.
// Layer: Lynx presentation (L4/L5). Item ids, labels, order, visibility and the
//   active item come from upstream's appRail.logic and railShellStore.

import { useRouter, useRouterState } from "@tanstack/react-router";
import checklistSvg from "@synara-central-icons/checklist.svg?raw";
import inboxSvg from "@synara-central-icons/inbox-empty.svg?raw";
import moreSvg from "@synara-central-icons/dot-grid-1x3-horizontal.svg?raw";
import settingsSvg from "@synara-central-icons/settings-gear-4.svg?raw";
import { useEffect, type ReactNode } from "@lynx-js/react";

import {
  DEFAULT_HIDDEN_RAIL_ITEMS,
  RAIL_ORDERABLE_ITEM_IDS,
  RAIL_PANEL_ITEM_LABELS,
  buildRailItemOrder,
  railItemForPathname,
  railItemShowsPanel,
  type RailItemId,
  type RailOrderableItemId,
} from "@synara-web/appRail.logic";
import { resolvePullRequestReviewBadge } from "@synara-web/components/SidebarActionBadges.logic";
import { useRailShellStore } from "@synara-web/railShellStore";
import { githubInboxReviewBadgeQueryOptions } from "@synara-web/lib/pullRequestReactQuery";
import { useQuery } from "@tanstack/react-query";
import { useGitHubInboxSettings } from "../../app/githubInboxSettings.lynx";
import { useTheme } from "../../adapters/useTheme.lynx";
import { ClockIcon, FoldersIcon, HomeIcon } from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";
import { Menu, MenuGroup, MenuGroupLabel, MenuItem, MenuPopup, MenuTrigger } from "../ui/menu.lynx";
import { toastManager } from "../ui/toast.lynx";
import { AppRailHelp } from "./AppRailHelp.lynx";
import { AppRailUsage } from "./AppRailUsage.lynx";
import { PullRequestCompareIcon } from "./PullRequestCompareIcon.lynx";
import "./app-rail.css";

/** Upstream's `sidebarNavDescriptors` labels for the rail's route items. */
const RAIL_ROUTE_ITEM_LABELS = {
  inbox: "Inbox",
  kanban: "Kanban",
  tasks: "Tasks",
  pullRequests: "Code review",
  automations: "Automations",
  studio: "Hubs",
} as const;

/** Rail destinations whose upstream surface is not ported: where the Native app goes instead. */
const RAIL_ROUTE_ITEM_PATHS: Partial<Record<RailOrderableItemId, string>> = {
  // Upstream's Tasks surface is a List/Kanban switch; Native has the Kanban board only.
  tasks: "/kanban",
  kanban: "/kanban",
  // Upstream's Code review inbox (app/GitHubInboxPage.lynx.tsx).
  pullRequests: "/pull-requests",
  automations: "/automations",
  studio: "/studio",
};

const NOT_AVAILABLE_SUFFIX = "is not available in the Native app yet";

function announceUnavailable(feature: string) {
  "background only";
  toastManager.add({ type: "info", title: `${feature} ${NOT_AVAILABLE_SUFFIX}` });
}

/** Lynx pathname → the upstream pathname appRail.logic expects. */
function railPathname(pathname: string): string {
  return pathname.startsWith("/thread/") || pathname.startsWith("/new-thread/") ? "/" : pathname;
}

/** Whether the panel column shows for a Lynx pathname (upstream `railItemShowsPanel`). */
export function railPanelShownForPathname(pathname: string): boolean {
  const item = railItemForPathname(railPathname(pathname));
  // Upstream's Tasks rail item stands for the Kanban route.
  return item === null || railItemShowsPanel(item);
}

function RailGlyph(props: { readonly id: RailItemId | "more"; readonly active: boolean }) {
  // appRailButtonClassName: the active item takes `--sidebar-accent-foreground` (the
  // foreground), a resting one the section-label tone.
  const { svgColors } = useTheme();
  const color = props.active ? svgColors.foreground : svgColors.sectionLabelForeground;
  const central = (content: string) => (
    <svg className="AppRailGlyph" content={colorizeLynxSvg(content, color)} />
  );
  switch (props.id) {
    case "home":
      return <HomeIcon className="AppRailGlyph" color={color} size={20} strokeWidth={1.5} />;
    case "spaces":
      return <FoldersIcon className="AppRailGlyph" color={color} size={20} strokeWidth={1.5} />;
    case "automations":
      return <ClockIcon className="AppRailGlyph" color={color} size={20} strokeWidth={1.5} />;
    case "pullRequests":
      return <PullRequestCompareIcon className="AppRailGlyph" color={color} />;
    case "inbox":
      return central(inboxSvg);
    case "settings":
      return central(settingsSvg);
    case "more":
      return central(moreSvg);
    default:
      return central(checklistSvg);
  }
}

export function appRailButtonClassName(active: boolean): string {
  return `AppRailButton${active ? " AppRailButton--active" : ""}`;
}

function AppRailButton(props: {
  readonly id: RailItemId;
  readonly label: string;
  readonly active: boolean;
  /** Upstream SidebarActionBadge: a corner dot, with the count in the accessible name. */
  readonly badge?: { readonly accessibleLabel: string } | null;
  readonly onSelect: () => void;
}) {
  const label = props.badge ? `${props.label} · ${props.badge.accessibleLabel}` : props.label;
  const interaction = useLynxInteractiveState({
    baseClassName: appRailButtonClassName(props.active),
    accessibleLabel: label,
    accessibilityValue: props.active ? "Current page" : undefined,
    onActivate: props.onSelect,
  });
  return (
    <view
      className={interaction.className}
      aria-label={label}
      aria-current={props.active ? "page" : undefined}
      {...interaction.eventProps}
    >
      <RailGlyph id={props.id} active={props.active} />
      {props.badge ? <view className="AppRailBadgeDot" /> : null}
    </view>
  );
}

/** Upstream's AppRailMoreMenu. Rail shortcuts and Customize are not ported yet. */
function AppRailMoreMenu(props: { readonly active: boolean; readonly onOpenStudio: () => void }) {
  return (
    <Menu autoHighlightFirst={false}>
      <MenuTrigger ariaLabel="More" className={appRailButtonClassName(props.active)}>
        <RailGlyph id="more" active={props.active} />
      </MenuTrigger>
      <MenuPopup
        align="start"
        side="right"
        sideOffset={4}
        className="LxComposerPickerMenuPopup AppRailMoreMenu"
      >
        <MenuGroup>
          <MenuItem onClick={props.onOpenStudio}>Hubs</MenuItem>
        </MenuGroup>
        <MenuGroup>
          <MenuGroupLabel>Spaces and projects in the rail</MenuGroupLabel>
          <MenuItem disabled>Rail shortcuts are not available in the Native app yet</MenuItem>
          <MenuItem disabled>Customize is not available in the Native app yet</MenuItem>
        </MenuGroup>
      </MenuPopup>
    </Menu>
  );
}

function AppRail(props: { readonly onHome: () => void }) {
  const router = useRouter();
  const pathname = useRouterState({ select: (state) => state.location.pathname });
  const activeItem = useRailShellStore((store) => store.activeItem);
  const reconcile = useRailShellStore((store) => store.reconcile);
  const selectPanelItem = useRailShellStore((store) => store.selectPanelItem);
  const selectRouteItem = useRailShellStore((store) => store.selectRouteItem);
  const upstreamPathname = railPathname(pathname);
  // The viewer's open review requests, as upstream's Code review rail badge: it observes
  // the open inbox list, so with the page open the badge costs no extra request.
  const { settings: inboxSettings } = useGitHubInboxSettings();
  const { data: reviewRequests } = useQuery(
    githubInboxReviewBadgeQueryOptions(inboxSettings.githubInboxSort),
  );
  const pullRequestsReviewBadge = resolvePullRequestReviewBadge(reviewRequests);
  useEffect(() => {
    "background only";
    reconcile({
      pathname: upstreamPathname,
      onStudioSurface: pathname === "/studio",
      projectIds: null,
    });
  }, [pathname, reconcile, upstreamPathname]);
  const routeItem = railItemForPathname(upstreamPathname);
  // Upstream `reconcileActiveRailItem`, with Tasks standing for the Kanban board
  // (upstream `railSlotActiveItem`). Read from the route so the first frame is right.
  const slotActive: RailItemId =
    routeItem === "kanban" ? "tasks" : (routeItem ?? (activeItem === "spaces" ? "spaces" : "home"));
  const itemIds = buildRailItemOrder({
    // Upstream `resolveTasksSurfaceSlot`: Tasks stands in Kanban's slot.
    order: RAIL_ORDERABLE_ITEM_IDS.filter((id) => id !== "kanban"),
    hidden: new Set(DEFAULT_HIDDEN_RAIL_ITEMS),
    activeItem: slotActive,
    studioAvailable: true,
    inboxAvailable: true,
  });
  const navigate = (to: string) => {
    "background only";
    void router.navigate({ to });
  };
  const selectItem = (id: RailOrderableItemId) => {
    "background only";
    if (id === "home") {
      selectPanelItem("home");
      if (routeItem !== null) props.onHome();
      return;
    }
    if (id === "spaces") {
      // Upstream swaps the panel for the Spaces drill-in; Native keeps its Space switcher
      // at the top of the Home panel.
      announceUnavailable("The Spaces panel");
      return;
    }
    const path = RAIL_ROUTE_ITEM_PATHS[id];
    if (!path) {
      announceUnavailable(RAIL_ROUTE_ITEM_LABELS[id]);
      return;
    }
    selectRouteItem(id);
    navigate(path);
  };
  return (
    <view
      className="AppRail"
      accessibility-element={true}
      accessibility-label="Primary"
      accessibility-trait="none"
    >
      <scroll-view className="AppRailItems" scroll-orientation="vertical">
        <view className="AppRailItemsInner">
          {itemIds.map((id) => (
            <AppRailButton
              key={id}
              id={id}
              label={
                id === "home" || id === "spaces"
                  ? RAIL_PANEL_ITEM_LABELS[id]
                  : RAIL_ROUTE_ITEM_LABELS[id]
              }
              active={slotActive === id}
              badge={id === "pullRequests" ? pullRequestsReviewBadge : null}
              onSelect={() => selectItem(id)}
            />
          ))}
          <AppRailMoreMenu
            active={slotActive === "studio" && !itemIds.includes("studio")}
            onOpenStudio={() => selectItem("studio")}
          />
        </view>
      </scroll-view>
      <view className="AppRailBottom">
        <AppRailUsage onOpenUsageSettings={() => navigate("/settings?section=usage")} />
        <AppRailHelp />
        <AppRailButton
          id="settings"
          label="Settings"
          active={slotActive === "settings"}
          onSelect={() => {
            selectRouteItem("settings");
            navigate("/settings");
          }}
        />
      </view>
    </view>
  );
}

/**
 * The shell column left of the route: upstream's top strip over the rail and the panel.
 * The children are the route's panel (threads sidebar, settings navigation) inside its
 * own disclosure, which keeps its width and resize handle.
 */
export function AppRailShell(props: {
  readonly titlebarControls?: ReactNode;
  readonly onHome: () => void;
  readonly children?: ReactNode;
}) {
  return (
    <view className="AppRailShell">
      <view className="AppRailShellTopStrip AppWindowDragRegion">{props.titlebarControls}</view>
      <view className="AppRailShellBody">
        <AppRail onHome={props.onHome} />
        {props.children}
      </view>
    </view>
  );
}
