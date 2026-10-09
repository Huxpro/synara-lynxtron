// FILE: AutomationsRailPanel.lynx.tsx
// Purpose: Lynx rendering of upstream's components/RailAutomationsPanel.tsx: the rail
//   layout's panel on the Automations routes (title, "New automation", Active / Paused).
// Not ported: the row's schedule subtitle, status glyph and unread-result dot.

import { useRouter, useRouterState } from "@tanstack/react-router";
import plusSvg from "@synara-central-icons/plus-large.svg?raw";

import { SidebarPrimaryNavigation } from "@synara-web/components/SidebarPrimaryNavigation";
import { useTheme } from "../adapters/useTheme.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { setAutomationCreateOpen } from "./automationCreateIntent.lynx";
import { useAutomationsListQuery } from "./AutomationsPage.lynx";
import { useSidebarSnapshot } from "./sidebarSnapshot.lynx";
import "./automations-rail-panel.css";

const AUTOMATION_PATH_PATTERN = /^\/automations\/([^/]+)$/;

function PanelRow(props: {
  readonly active: boolean;
  readonly dimmed: boolean;
  readonly name: string;
  readonly onOpen: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `AutomationsRailRow${props.active ? " AutomationsRailRow--active" : ""}${
      props.dimmed ? " AutomationsRailRow--dimmed" : ""
    }`,
    accessibleLabel: `Open automation ${props.name}`,
    accessibilityValue: props.active ? "Selected" : undefined,
    onActivate: props.onOpen,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <text className="AutomationsRailRowTitle" text-maxline="1">
        {props.name}
      </text>
    </view>
  );
}

export function AutomationsRailPanel() {
  const { activeTheme } = useTheme();
  const router = useRouter();
  const openAutomationId = useRouterState({
    select: (state) => {
      const id = AUTOMATION_PATH_PATTERN.exec(state.location.pathname)?.[1];
      return id ? decodeURIComponent(id) : null;
    },
  });
  const automations = useAutomationsListQuery();
  const sidebar = useSidebarSnapshot();
  const definitions = automations.data?.definitions ?? [];
  const section = (label: string, enabled: boolean) => {
    const rows = definitions.filter((definition) => definition.enabled === enabled);
    if (rows.length === 0) return null;
    return (
      <view className="AutomationsRailSection">
        <text className="AutomationsRailSectionLabel">{label}</text>
        {rows.map((definition) => (
          <PanelRow
            key={definition.id}
            active={openAutomationId === definition.id}
            dimmed={!definition.enabled}
            name={definition.name}
            onOpen={() =>
              void router.navigate({ to: `/automations/${encodeURIComponent(definition.id)}` })
            }
          />
        ))}
      </view>
    );
  };
  return (
    <view className="AppSidebar AutomationsRailPanel">
      <view className="AppRailPanelTitleRow">
        <text className="AppRailPanelTitle" accessibility-trait="header">
          Automations
        </text>
      </view>
      <SidebarPrimaryNavigation
        items={[
          {
            id: "New automation",
            icon: (
              <svg
                className="AutomationsRailNewIcon"
                content={colorizeLynxSvg(plusSvg, activeTheme.theme.ink)}
              />
            ),
            label: "New automation",
            disabled: (sidebar.data?.projects.length ?? 0) === 0,
            onActivate: () => setAutomationCreateOpen(true),
          },
        ]}
      />
      <scroll-view className="AutomationsRailScroller" scroll-orientation="vertical">
        <view className="AutomationsRailList">
          {automations.isPending ? (
            <text className="AutomationsRailState">Loading automations...</text>
          ) : definitions.length === 0 ? (
            <text className="AutomationsRailState">No automations yet</text>
          ) : (
            <>
              {section("Active", true)}
              {section("Paused", false)}
            </>
          )}
        </view>
      </scroll-view>
    </view>
  );
}
