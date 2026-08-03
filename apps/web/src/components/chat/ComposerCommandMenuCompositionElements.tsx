import { memo, type ReactNode } from "react";

import {
  BotIcon,
  BrainIcon,
  BugIcon,
  ChangesIcon,
  ClockIcon,
  DeviceLaptopIcon,
  EraserIcon,
  FastModeIcon,
  GitBranchIcon,
  GitForkIcon,
  InfoIcon,
  ListTodoIcon,
  type LucideIcon,
  MessageCircleIcon,
  Minimize2,
  PluginIcon,
  SkillCubeIcon,
  TemporaryThreadIcon,
  TerminalIcon,
  WorktreeIcon,
} from "~/lib/icons";
import { cn } from "~/lib/utils";
import {
  Command,
  CommandGroup,
  CommandGroupLabel,
  CommandItem,
  CommandList,
  CommandSeparator,
} from "../ui/command";
import { FileEntryIcon } from "./FileEntryIcon";
import { ProviderIcon } from "../ProviderIcon";
import {
  COMPOSER_COMMAND_MENU_ITEM_ACTIVE_CLASS_NAME,
  COMPOSER_COMMAND_MENU_ITEM_CLASS_NAME,
  COMPOSER_COMMAND_MENU_SURFACE_CLASS_NAME,
} from "./composerPickerStyles";
import type { ComposerCommandItem } from "./ComposerCommandMenuComposition";

const GROUP_LABEL_CLASSNAME =
  "px-2 pt-1.5 pb-1 text-[length:var(--type-picker-group-size)] leading-[var(--type-picker-group-line-height)] font-normal text-muted-foreground/60";
const ICON_SLOT_CLASSNAME =
  "flex size-4 shrink-0 items-center justify-center text-muted-foreground/60";
const FILE_ICON_CLASSNAME =
  "size-3.5 text-[var(--color-text-foreground)] opacity-70 dark:opacity-80";
const GLYPH_CLASSNAME = "size-3.5";

const SLASH_COMMAND_ICONS: Record<string, LucideIcon> = {
  clear: EraserIcon,
  compact: Minimize2,
  model: BrainIcon,
  fast: FastModeIcon,
  plan: ListTodoIcon,
  default: MessageCircleIcon,
  review: BugIcon,
  fork: GitForkIcon,
  side: TemporaryThreadIcon,
  status: InfoIcon,
  subagents: BotIcon,
  feedback: BugIcon,
  automation: ClockIcon,
};

function slashGlyph(command: string, fallback: LucideIcon): ReactNode {
  const Icon = SLASH_COMMAND_ICONS[command] ?? fallback;
  return <Icon className={GLYPH_CLASSNAME} />;
}

function itemGlyph(item: ComposerCommandItem, theme: "light" | "dark"): ReactNode {
  switch (item.type) {
    case "path":
      return (
        <FileEntryIcon
          pathValue={item.path}
          kind={item.pathKind}
          theme={theme}
          className={item.pathKind === "directory" ? GLYPH_CLASSNAME : FILE_ICON_CLASSNAME}
        />
      );
    case "local-root":
      return <DeviceLaptopIcon className={GLYPH_CLASSNAME} />;
    case "fork-target":
      return item.target === "local" ? (
        <DeviceLaptopIcon className={GLYPH_CLASSNAME} />
      ) : (
        <WorktreeIcon className={GLYPH_CLASSNAME} />
      );
    case "review-target":
      return item.target === "changes" ? (
        <ChangesIcon className={GLYPH_CLASSNAME} />
      ) : (
        <GitBranchIcon className={GLYPH_CLASSNAME} />
      );
    case "slash-command":
      return slashGlyph(item.command, TerminalIcon);
    case "provider-native-command":
      return slashGlyph(item.command, SkillCubeIcon);
    case "model":
      return <BrainIcon className={GLYPH_CLASSNAME} />;
    case "agent":
      return <BotIcon className={GLYPH_CLASSNAME} />;
    case "plugin":
      return <PluginIcon className={GLYPH_CLASSNAME} />;
    case "thread":
      return <ProviderIcon provider={item.provider} className={GLYPH_CLASSNAME} />;
    case "skill":
      return <SkillCubeIcon className={GLYPH_CLASSNAME} />;
  }
}

export function ComposerCommandMenuFrameElement(props: {
  readonly activeItemId: string | null;
  readonly children: ReactNode;
  readonly emptyText: string | null;
  readonly onHighlightedItemChange: (itemId: string | null) => void;
}) {
  return (
    <Command
      autoHighlight={false}
      mode="none"
      onItemHighlighted={(highlightedValue) => {
        props.onHighlightedItemChange(
          typeof highlightedValue === "string" ? highlightedValue : null,
        );
      }}
    >
      <div className={COMPOSER_COMMAND_MENU_SURFACE_CLASS_NAME}>
        <CommandList className="max-h-72 scroll-py-1 p-1">{props.children}</CommandList>
        {props.emptyText ? (
          <p className="px-2 py-1.5 text-muted-foreground/50 text-[length:var(--type-picker-description-size)] leading-[var(--type-picker-description-line-height)]">
            {props.emptyText}
          </p>
        ) : null}
      </div>
    </Command>
  );
}

export function ComposerCommandGroupElement(props: {
  readonly children: ReactNode;
  readonly separatorBefore: boolean;
}) {
  return (
    <div>
      {props.separatorBefore ? <CommandSeparator className="my-0.5" /> : null}
      <CommandGroup>{props.children}</CommandGroup>
    </div>
  );
}

export function ComposerCommandSeparatorElement() {
  return <CommandSeparator className="my-0.5" />;
}

export function ComposerCommandGroupLabelElement(props: { readonly children: ReactNode }) {
  return <CommandGroupLabel className={GROUP_LABEL_CLASSNAME}>{props.children}</CommandGroupLabel>;
}

export function ComposerCommandMentionFilesFooterElement() {
  return (
    <div className="pt-0.5 pb-2">
      <p className={cn(GROUP_LABEL_CLASSNAME, "px-2 py-0 font-medium text-muted-foreground text-xs")}>
        Files
      </p>
      <p className="px-2 pt-0.5 text-[11px] text-muted-foreground/55">
        Type to search for files
      </p>
    </div>
  );
}

export const ComposerCommandRowElement = memo(function ComposerCommandRowElement(props: {
  readonly item: ComposerCommandItem;
  readonly title: string;
  readonly secondaryText: string | null;
  readonly trailingMeta: string | null;
  readonly resolvedTheme: "light" | "dark";
  readonly active: boolean;
  readonly onHighlight: () => void;
  readonly onItemRef: (node: unknown | null) => void;
  readonly onSelect: () => void;
}) {
  return (
    <CommandItem
      ref={(node) => props.onItemRef(node)}
      value={props.item.id}
      className={cn(
        COMPOSER_COMMAND_MENU_ITEM_CLASS_NAME,
        props.active && COMPOSER_COMMAND_MENU_ITEM_ACTIVE_CLASS_NAME,
      )}
      onMouseMove={() => {
        if (!props.active) props.onHighlight();
      }}
      onMouseDown={(event) => {
        event.preventDefault();
      }}
      onClick={props.onSelect}
    >
      <span className={cn(ICON_SLOT_CLASSNAME, props.active && "text-foreground/70")}>
        {itemGlyph(props.item, props.resolvedTheme)}
      </span>
      <div className="min-w-0 flex flex-1 items-center gap-3">
        <div className="min-w-0 flex flex-1 items-center gap-1.5 overflow-hidden">
          <span className="shrink-0 text-[length:var(--type-picker-title-size)] leading-[var(--type-picker-title-line-height)] font-medium text-foreground/80">
            {props.title}
          </span>
          {props.secondaryText ? (
            <span className="truncate text-[length:var(--type-picker-description-size)] leading-[var(--type-picker-description-line-height)] text-muted-foreground/55">
              {props.secondaryText}
            </span>
          ) : null}
        </div>
        {props.trailingMeta ? (
          <span className="shrink-0 pl-2 text-right text-[length:var(--type-picker-meta-size)] leading-[var(--type-picker-meta-line-height)] text-muted-foreground/42">
            {props.trailingMeta}
          </span>
        ) : null}
      </div>
    </CommandItem>
  );
});
