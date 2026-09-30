import bellSvg from "@synara-central-icons/notes.svg?raw";
import searchSvg from "@synara-central-icons/magnifying-glass.svg?raw";

import {
  SIDEBAR_SURFACE_PICKER_COPY,
  type SidebarView,
} from "@synara-web/components/SidebarSurfacePicker.logic";
import { useLynxInteractiveState } from "../../adapters/useLynxInteractiveState";
import { useTheme } from "../../adapters/useTheme.lynx";
import { ChevronDownIcon } from "../../lib/icons.lynx";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { Menu, MenuPopup, MenuRadioGroup, MenuRadioItem, MenuTrigger } from "../ui/menu.lynx";
import "./sidebar-surface-header.css";

/**
 * Electron's sidebar header row: the surface picker ("Synara ▾") on the left and the
 * header icon buttons on the right.
 */
export function SidebarSurfaceHeader(props: {
  readonly views: readonly SidebarView[];
  readonly activeView: SidebarView;
  readonly onSelectView: (view: SidebarView) => void;
  readonly searchElementId: string;
  readonly searchOpen: boolean;
  readonly onOpenSearch: () => void;
  /** The Activity bell is hidden on Studio, like Electron's header. */
  readonly activity?: {
    readonly active: boolean;
    readonly showUnreadDot: boolean;
    readonly onToggle: () => void;
  };
}) {
  return (
    <view className="SidebarSurfaceHeader">
      <SidebarSurfacePicker
        views={props.views}
        activeView={props.activeView}
        onSelectView={props.onSelectView}
      />
      <view className="SidebarSurfaceHeaderActions">
        <SidebarHeaderIconButton
          elementId={props.searchElementId}
          icon={searchSvg}
          label="Search"
          active={props.searchOpen}
          onActivate={props.onOpenSearch}
        />
        {props.activity ? <SidebarActivityBellButton {...props.activity} /> : null}
      </view>
    </view>
  );
}

function SidebarSurfacePicker(props: {
  readonly views: readonly SidebarView[];
  readonly activeView: SidebarView;
  readonly onSelectView: (view: SidebarView) => void;
}) {
  return (
    <Menu autoHighlightFirst={false}>
      <MenuTrigger ariaLabel="Switch sidebar surface" className="SidebarSurfacePickerTrigger">
        <text className="SidebarSurfacePickerTitle">
          {SIDEBAR_SURFACE_PICKER_COPY[props.activeView].title}
        </text>
        <view className="SidebarSurfacePickerChevron">
          <ChevronDownIcon size={14} color="var(--muted-foreground)" />
        </view>
      </MenuTrigger>
      <MenuPopup align="start" side="bottom" sideOffset={4} className="SidebarSurfacePickerMenu">
        <MenuRadioGroup
          value={props.activeView}
          onValueChange={(value) => props.onSelectView(value as SidebarView)}
        >
          {props.views.map((view) => (
            <MenuRadioItem
              key={view}
              value={view}
              className={`SidebarSurfacePickerItem${
                view === props.activeView ? " SidebarSurfacePickerItem--checked" : ""
              }`}
            >
              <view className="SidebarSurfacePickerItemCopy">
                <text className="SidebarSurfacePickerItemTitle">
                  {SIDEBAR_SURFACE_PICKER_COPY[view].title}
                </text>
                <text className="SidebarSurfacePickerItemDescription">
                  {SIDEBAR_SURFACE_PICKER_COPY[view].description}
                </text>
              </view>
            </MenuRadioItem>
          ))}
        </MenuRadioGroup>
      </MenuPopup>
    </Menu>
  );
}

function SidebarHeaderIconButton(props: {
  readonly elementId: string;
  readonly icon: string;
  readonly label: string;
  readonly active: boolean;
  readonly onActivate: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "SidebarHeaderIconButton",
    accessibleLabel: props.label,
    accessibilityValue: props.active ? "Expanded" : "Collapsed",
    programmaticFocusId: props.elementId,
    onActivate: () => props.onActivate(),
  });
  return (
    <view id={props.elementId} className={interaction.className} {...interaction.eventProps}>
      <svg
        className="SidebarHeaderIconButtonGlyph"
        content={colorizeLynxSvg(props.icon, semanticIconColor("secondary"))}
      />
    </view>
  );
}

/** Header Activity toggle: accent-tinted while the Activity view is on, dotted when unread. */
function SidebarActivityBellButton(props: {
  readonly active: boolean;
  readonly showUnreadDot: boolean;
  readonly onToggle: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: `SidebarHeaderIconButton SidebarActivityBell${
      props.active ? " SidebarActivityBell--active" : ""
    }`,
    accessibleLabel: props.active ? "Switch to classic view" : "Switch to activity view",
    accessibilityValue: props.active ? "On" : "Off",
    onActivate: () => props.onToggle(),
  });
  return (
    <view
      className={interaction.className}
      aria-label={props.active ? "Switch to classic view" : "Switch to activity view"}
      aria-pressed={props.active}
      {...interaction.eventProps}
    >
      <svg
        className="SidebarHeaderIconButtonGlyph SidebarActivityBellGlyph"
        content={colorizeLynxSvg(bellSvg, semanticIconColor(props.active ? "accent" : "secondary"))}
      />
      {props.showUnreadDot ? <view className="SidebarActivityBellDot" /> : null}
    </view>
  );
}
