import type { ReactNode } from '@lynx-js/react';

import type { ComposerCommandItem } from '@synara-web/components/chat/ComposerCommandMenuComposition';
import {
  BlocksIcon,
  BrainIcon,
  BugIcon,
  ClockIcon,
  DeviceLaptopIcon,
  FolderIcon,
  GaugeIcon,
  GitBranchIcon,
  MessageCircleIcon,
  PuzzleIcon,
  ToolsIcon,
  UserIcon,
  type LynxIcon,
} from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../components/ui/interactive-state.lynx';

const SLASH_COMMAND_ICONS: Record<string, LynxIcon> = {
  clear: ToolsIcon,
  compact: BlocksIcon,
  model: BrainIcon,
  fast: GaugeIcon,
  plan: BlocksIcon,
  default: MessageCircleIcon,
  review: BugIcon,
  status: MessageCircleIcon,
  subagents: UserIcon,
  automation: ClockIcon,
};

function itemIcon(item: ComposerCommandItem): LynxIcon {
  if (
    item.type === 'slash-command' ||
    item.type === 'provider-native-command'
  ) {
    return SLASH_COMMAND_ICONS[item.command] ?? ToolsIcon;
  }
  if (item.type === 'skill') return BlocksIcon;
  if (item.type === 'agent') return UserIcon;
  if (item.type === 'plugin') return PuzzleIcon;
  if (item.type === 'thread') return MessageCircleIcon;
  if (item.type === 'path') return item.pathKind === 'directory' ? FolderIcon : ToolsIcon;
  if (item.type === 'local-root') return DeviceLaptopIcon;
  if (item.type === 'model') return BrainIcon;
  if (item.type === 'fork-target') {
    return item.target === 'local' ? DeviceLaptopIcon : GitBranchIcon;
  }
  return item.target === 'changes' ? BlocksIcon : GitBranchIcon;
}

export function ComposerCommandMenuFrameElement(props: {
  readonly activeItemId: string | null;
  readonly children: ReactNode;
  readonly emptyText: string | null;
  readonly onHighlightedItemChange: (itemId: string | null) => void;
}) {
  return (
    <view className="ComposerCommandMenuLynx">
      <scroll-view
        className="ComposerCommandMenuListLynx"
        scroll-orientation="vertical"
      >
        {props.children}
      </scroll-view>
      {props.emptyText ? (
        <text className="ComposerCommandMenuEmptyLynx">{props.emptyText}</text>
      ) : null}
    </view>
  );
}

export function ComposerCommandGroupElement(props: {
  readonly children: ReactNode;
  readonly separatorBefore: boolean;
}) {
  return (
    <view className="ComposerCommandGroupLynx">
      {props.separatorBefore ? <ComposerCommandSeparatorElement /> : null}
      {props.children}
    </view>
  );
}

export function ComposerCommandSeparatorElement() {
  return <view className="ComposerCommandSeparatorLynx" />;
}

export function ComposerCommandGroupLabelElement(props: {
  readonly children: ReactNode;
}) {
  return <text className="ComposerCommandGroupLabelLynx">{props.children}</text>;
}

export function ComposerCommandMentionFilesFooterElement() {
  return (
    <view className="ComposerCommandFilesFooterLynx">
      <text className="ComposerCommandGroupLabelLynx">Files</text>
      <text className="ComposerCommandSecondaryLynx">Type to search for files</text>
    </view>
  );
}

export function ComposerCommandRowElement(props: {
  readonly item: ComposerCommandItem;
  readonly title: string;
  readonly secondaryText: string | null;
  readonly trailingMeta: string | null;
  readonly resolvedTheme: 'light' | 'dark';
  readonly active: boolean;
  readonly onHighlight: () => void;
  readonly onItemRef: (node: unknown | null) => void;
  readonly onSelect: () => void;
}) {
  const Icon = itemIcon(props.item);
  const interaction = useLynxInteractiveState({
    baseClassName: `ComposerCommandRowLynx${
      props.active ? ' ComposerCommandRowLynx--active' : ''
    }`,
    onActivate: () => {
      'background only';
      props.onHighlight();
      props.onSelect();
    },
  });
  const handleMouseEnter = interaction.eventProps.bindmouseenter;
  return (
    <view
      className={interaction.className}
      aria-label={props.title}
      aria-selected={props.active}
      {...interaction.eventProps}
      bindmouseenter={() => {
        'background only';
        handleMouseEnter?.();
        if (!props.active) props.onHighlight();
      }}
    >
      <view className="ComposerCommandIconSlotLynx">
        <Icon className="ComposerCommandIconLynx" size={14} />
      </view>
      <view className="ComposerCommandCopyLynx">
        <text className="ComposerCommandTitleLynx">{props.title}</text>
        {props.secondaryText ? (
          <text className="ComposerCommandSecondaryLynx">
            {props.secondaryText}
          </text>
        ) : null}
      </view>
      {props.trailingMeta ? (
        <text className="ComposerCommandMetaLynx">{props.trailingMeta}</text>
      ) : null}
    </view>
  );
}
