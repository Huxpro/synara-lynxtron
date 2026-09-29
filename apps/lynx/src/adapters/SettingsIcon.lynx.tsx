import { SETTINGS_NAV_ITEMS, type SettingsSectionId } from "@synara-web/settingsNavigation";

import {
  AdjustmentsHorizontalIcon,
  ArchiveIcon,
  BellIcon,
  BlocksIcon,
  BrainIcon,
  GaugeIcon,
  GitBranchIcon,
  KeyboardIcon,
  PaletteIcon,
  PlugIcon,
  PuzzleIcon,
  ScreenshotIcon,
  SettingsIcon,
  ToolsIcon,
  UserIcon,
  type LynxIcon,
} from "../lib/icons.lynx";

const SETTINGS_ICONS: Readonly<Record<string, LynxIcon>> = {
  "settings-gear-4": SettingsIcon,
  user: UserIcon,
  "color-palette": PaletteIcon,
  bell: BellIcon,
  "settings-slider-hor": AdjustmentsHorizontalIcon,
  "screen-capture": ScreenshotIcon,
  shortcut: KeyboardIcon,
  "branch-simple": GitBranchIcon,
  archive: ArchiveIcon,
  brain: BrainIcon,
  puzzle: PuzzleIcon,
  "building-blocks": BlocksIcon,
  gauge: GaugeIcon,
  "plugin-1": PlugIcon,
  toolbox: ToolsIcon,
};

const SETTINGS_SECTION_ICONS = new Map<SettingsSectionId, LynxIcon>(
  SETTINGS_NAV_ITEMS.flatMap((item) => {
    const Icon = SETTINGS_ICONS[item.icon];
    return Icon ? [[item.id, Icon] as const] : [];
  }),
);

export function settingsIconForName(name: string): LynxIcon | undefined {
  return SETTINGS_ICONS[name];
}

export function settingsIconForSection(section: SettingsSectionId): LynxIcon | undefined {
  return SETTINGS_SECTION_ICONS.get(section);
}

export function SettingsIconElement(props: {
  readonly className: string;
  readonly name?: string;
  readonly section?: SettingsSectionId;
}) {
  const Icon = props.section
    ? settingsIconForSection(props.section)
    : props.name
      ? settingsIconForName(props.name)
      : undefined;
  return (
    <view className={props.className}>
      {Icon ? <Icon size={16} color="var(--foreground)" /> : null}
    </view>
  );
}
