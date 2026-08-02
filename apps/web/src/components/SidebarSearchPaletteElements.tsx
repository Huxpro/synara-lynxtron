import type * as React from "react";

import {
  ArrowLeftIcon,
  BugIcon,
  CheckIcon,
  DeviceLaptopIcon,
  FolderOpenIcon,
  MoonIcon,
  NewThreadIcon,
  SearchIcon,
  SettingsIcon,
  SunIcon,
} from "~/lib/icons";
import { BsChat } from "react-icons/bs";
import { LuArrowDownToLine, LuCornerLeftUp, LuFolderPlus } from "react-icons/lu";

import { FolderClosed } from "~/components/FolderClosed";
import { ProviderIcon } from "~/components/ProviderIcon";

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

const GLYPHS: Record<
  Exclude<SidebarSearchPaletteGlyphKind, "provider">,
  React.ComponentType<{ className?: string }>
> = {
  "arrow-down-to-line": LuArrowDownToLine,
  "arrow-left": ArrowLeftIcon,
  bug: BugIcon,
  chat: BsChat,
  check: CheckIcon,
  "corner-left-up": LuCornerLeftUp,
  "device-laptop": DeviceLaptopIcon,
  "folder-closed": FolderClosed,
  "folder-open": FolderOpenIcon,
  "folder-plus": LuFolderPlus,
  moon: MoonIcon,
  "new-thread": NewThreadIcon,
  search: SearchIcon,
  settings: SettingsIcon,
  sun: SunIcon,
};

export function SidebarSearchPaletteView(props: React.ComponentProps<"div">) {
  return <div {...props} />;
}

export function SidebarSearchPaletteText(props: React.ComponentProps<"span">) {
  return <span {...props} />;
}

export function SidebarSearchPaletteMark(props: React.ComponentProps<"mark">) {
  return <mark {...props} />;
}

export function SidebarSearchPaletteGlyph(props: {
  className?: string;
  kind: SidebarSearchPaletteGlyphKind;
  provider?: string;
}) {
  if (props.kind === "provider") {
    return <ProviderIcon provider={props.provider as never} className={props.className} />;
  }
  const Glyph = GLYPHS[props.kind];
  return <Glyph className={props.className} />;
}
