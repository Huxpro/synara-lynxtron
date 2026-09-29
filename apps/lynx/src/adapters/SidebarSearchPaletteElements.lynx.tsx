import type { ReactNode } from "@lynx-js/react";

import {
  ArrowDownToLineIcon,
  ArrowLeftIcon,
  BugIcon,
  CheckIcon,
  CornerLeftUpIcon,
  DeviceLaptopIcon,
  FolderIcon,
  FolderOpenIcon,
  FolderPlusIcon,
  MessageCircleIcon,
  MoonIcon,
  NewThreadIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
  type LynxIcon,
} from "../lib/icons.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";

interface ElementProps {
  children?: ReactNode;
  className?: string;
  style?: Readonly<Record<string, string | number>>;
  "aria-hidden"?: boolean | "true" | "false";
}

export function SidebarSearchPaletteView(props: ElementProps) {
  return (
    <view className={props.className} style={props.style}>
      {props.children}
    </view>
  );
}

export function SidebarSearchPaletteText(props: ElementProps) {
  return (
    <text className={props.className} style={props.style}>
      {props.children}
    </text>
  );
}

export function SidebarSearchPaletteMark(props: ElementProps) {
  return (
    <text className={props.className} style={props.style}>
      {props.children}
    </text>
  );
}

export type SidebarSearchPaletteGlyphKind =
  | "arrow-down-to-line"
  | "arrow-left"
  | "bug"
  | "chat"
  | "check"
  | "corner-left-up"
  | "device-laptop"
  | "folder-closed"
  | "folder-open"
  | "folder-plus"
  | "moon"
  | "new-thread"
  | "provider"
  | "search"
  | "settings"
  | "sun";

const GLYPHS: Record<Exclude<SidebarSearchPaletteGlyphKind, "provider">, LynxIcon> = {
  "arrow-down-to-line": ArrowDownToLineIcon,
  "arrow-left": ArrowLeftIcon,
  bug: BugIcon,
  chat: MessageCircleIcon,
  check: CheckIcon,
  "corner-left-up": CornerLeftUpIcon,
  "device-laptop": DeviceLaptopIcon,
  "folder-closed": FolderIcon,
  "folder-open": FolderOpenIcon,
  "folder-plus": FolderPlusIcon,
  moon: MoonIcon,
  "new-thread": NewThreadIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  sun: SunIcon,
};

export function SidebarSearchPaletteGlyph(props: {
  readonly className?: string;
  readonly kind: SidebarSearchPaletteGlyphKind;
  readonly provider?: string;
}) {
  if (props.kind === "provider") {
    return (
      <view className={props.className}>
        <OpenAIProviderIcon provider={props.provider} />
      </view>
    );
  }
  const Glyph = GLYPHS[props.kind];
  return <Glyph className={props.className} />;
}
