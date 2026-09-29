import type {
  ModelSlug,
  ProjectEntry,
  ProviderKind,
  ProviderMentionReference,
  ProviderNativeCommandDescriptor,
  ProviderPluginDescriptor,
  ProviderSkillDescriptor,
} from "@synara/contracts";

import type { ComposerTriggerKind } from "../../composer-logic";
import type { ComposerSlashCommand } from "../../composerSlashCommands";
import { formatSkillScope } from "~/lib/providerDiscovery";
import {
  ComposerCommandGroupElement,
  ComposerCommandGroupLabelElement,
  ComposerCommandMenuFrameElement,
  ComposerCommandMentionFilesFooterElement,
  ComposerCommandRowElement,
  ComposerCommandSeparatorElement,
} from "~/components/chat/ComposerCommandMenuCompositionElements";

function humanizeProviderCommandName(command: string): string {
  return command
    .split(/[-_]/g)
    .filter((part) => part.length > 0)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function commandMenuTitle(
  item: Extract<ComposerCommandItem, { type: "slash-command" | "provider-native-command" }>,
): string {
  switch (item.command) {
    case "clear":
      return "Clear";
    case "compact":
      return "Compact Context";
    case "model":
      return "Model";
    case "fast":
      return "Fast Mode";
    case "plan":
      return "Plan Mode";
    case "default":
      return "Default Mode";
    case "review":
      return "Code Review";
    case "fork":
      return "Fork";
    case "side":
      return "Sidechat";
    case "status":
      return "Status";
    case "subagents":
      return "Subagents";
    case "feedback":
      return "Feedback Synara";
    default:
      return humanizeProviderCommandName(item.command);
  }
}

function commandMenuTrailingMeta(item: ComposerCommandItem): string | null {
  if (item.type === "agent") return "delegate task to subagent";
  if (item.type === "plugin") return "Plugin";
  if (item.type === "thread") return null;
  if (item.type === "local-root") return "Local";
  if (item.type === "skill") return formatSkillScope(item.skill.scope);
  if (item.type === "model") return "Model";
  if (item.type === "slash-command" || item.type === "provider-native-command") {
    return `/${item.command}`;
  }
  if (item.type === "path") {
    return item.description.length > 0 ? item.description : null;
  }
  return null;
}

function commandMenuSecondaryText(item: ComposerCommandItem): string | null {
  if (
    item.type === "slash-command" ||
    item.type === "provider-native-command" ||
    item.type === "agent" ||
    item.type === "plugin" ||
    item.type === "skill" ||
    item.type === "local-root" ||
    item.type === "thread"
  ) {
    return item.description;
  }
  return null;
}

export type ComposerCommandItem =
  | {
      id: string;
      type: "path";
      path: string;
      pathKind: ProjectEntry["kind"];
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "local-root";
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "slash-command";
      command: ComposerSlashCommand;
      label: string;
      description: string;
      source: "app" | "shared";
    }
  | {
      id: string;
      type: "provider-native-command";
      provider: ProviderKind;
      command: ProviderNativeCommandDescriptor["name"];
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "fork-target";
      target: "local" | "worktree";
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "review-target";
      target: "changes" | "base-branch";
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "model";
      provider: ProviderKind;
      model: ModelSlug;
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "plugin";
      plugin: ProviderPluginDescriptor;
      mention: ProviderMentionReference;
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "thread";
      threadId: string;
      provider: ProviderKind;
      mention: ProviderMentionReference;
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "skill";
      skill: ProviderSkillDescriptor;
      label: string;
      description: string;
    }
  | {
      id: string;
      type: "agent";
      provider: ProviderKind;
      alias: string;
      color: string;
      label: string;
      description: string;
    };

interface ComposerCommandGroupModel {
  readonly id: string;
  readonly label: string | null;
  readonly items: readonly ComposerCommandItem[];
}

export function groupCommandItems(
  items: readonly ComposerCommandItem[],
  triggerKind: ComposerTriggerKind | null,
  groupSlashCommandSections: boolean,
): ComposerCommandGroupModel[] {
  if (triggerKind === "mention") {
    const pluginItems = items.filter((item) => item.type === "plugin");
    const threadItems = items.filter((item) => item.type === "thread");
    const localItems = items.filter((item) => item.type === "local-root" || item.type === "path");
    const agentItems = items.filter((item) => item.type === "agent");
    const otherItems = items.filter(
      (item) =>
        item.type !== "plugin" &&
        item.type !== "thread" &&
        item.type !== "local-root" &&
        item.type !== "path" &&
        item.type !== "agent",
    );
    const groups: ComposerCommandGroupModel[] = [];
    if (pluginItems.length > 0)
      groups.push({ id: "plugins", label: "Plugins", items: pluginItems });
    if (threadItems.length > 0) groups.push({ id: "chats", label: "Chats", items: threadItems });
    if (localItems.length > 0) groups.push({ id: "local", label: "Local", items: localItems });
    if (agentItems.length > 0)
      groups.push({ id: "subagents", label: "Subagents", items: agentItems });
    if (otherItems.length > 0) groups.push({ id: "other", label: null, items: otherItems });
    return groups;
  }

  if (triggerKind !== "slash-command" || !groupSlashCommandSections) {
    return [{ id: "default", label: null, items }];
  }

  const builtInItems = items.filter((item) => item.type === "slash-command");
  const providerItems = items.filter((item) => item.type === "provider-native-command");
  const skillItems = items.filter((item) => item.type === "skill");
  const otherItems = items.filter(
    (item) =>
      item.type !== "slash-command" &&
      item.type !== "provider-native-command" &&
      item.type !== "skill",
  );
  const groups: ComposerCommandGroupModel[] = [];
  if (builtInItems.length > 0) {
    groups.push({ id: "built-in", label: "Built-in", items: builtInItems });
  }
  if (providerItems.length > 0) {
    groups.push({ id: "provider", label: "Provider", items: providerItems });
  }
  if (skillItems.length > 0) groups.push({ id: "skills", label: "Skills", items: skillItems });
  if (otherItems.length > 0) groups.push({ id: "other", label: null, items: otherItems });
  return groups;
}

export interface ComposerCommandMenuCompositionProps {
  readonly items: readonly ComposerCommandItem[];
  readonly resolvedTheme: "light" | "dark";
  readonly isLoading: boolean;
  readonly triggerKind: ComposerTriggerKind | null;
  readonly groupSlashCommandSections?: boolean;
  readonly emptyStateText?: string;
  readonly activeItemId: string | null;
  readonly onHighlightedItemChange: (itemId: string | null) => void;
  readonly onSelect: (item: ComposerCommandItem) => void;
  readonly onItemRef?: (itemId: string, node: unknown | null) => void;
}

function emptyStateText(props: ComposerCommandMenuCompositionProps): string {
  if (props.isLoading) {
    if (props.triggerKind === "mention") return "Searching mentions...";
    if (props.triggerKind === "skill") return "Loading skills...";
    return "Loading commands...";
  }
  if (props.emptyStateText) return props.emptyStateText;
  if (props.triggerKind === "mention") return "No matching plugin, chat, or file.";
  if (props.triggerKind === "skill") return "No matching skill.";
  return "No matching command.";
}

export function ComposerCommandMenuComposition(props: ComposerCommandMenuCompositionProps) {
  const groups = groupCommandItems(
    props.items,
    props.triggerKind,
    props.groupSlashCommandSections ?? true,
  );

  return (
    <ComposerCommandMenuFrameElement
      activeItemId={props.activeItemId}
      emptyText={props.items.length === 0 ? emptyStateText(props) : null}
      onHighlightedItemChange={props.onHighlightedItemChange}
    >
      {groups.map((group, groupIndex) => (
        <ComposerCommandGroupElement key={group.id} separatorBefore={groupIndex > 0}>
          {group.label ? (
            <ComposerCommandGroupLabelElement>{group.label}</ComposerCommandGroupLabelElement>
          ) : null}
          {group.items.map((item) => (
            <ComposerCommandRowElement
              key={item.id}
              item={item}
              title={
                item.type === "slash-command" || item.type === "provider-native-command"
                  ? commandMenuTitle(item)
                  : item.label
              }
              secondaryText={commandMenuSecondaryText(item)}
              trailingMeta={commandMenuTrailingMeta(item)}
              resolvedTheme={props.resolvedTheme}
              active={props.activeItemId === item.id}
              onHighlight={() => props.onHighlightedItemChange(item.id)}
              onItemRef={(node) => props.onItemRef?.(item.id, node)}
              onSelect={() => props.onSelect(item)}
            />
          ))}
        </ComposerCommandGroupElement>
      ))}
      {props.triggerKind === "mention" ? (
        <>
          {groups.length > 0 ? <ComposerCommandSeparatorElement /> : null}
          <ComposerCommandMentionFilesFooterElement />
        </>
      ) : null}
    </ComposerCommandMenuFrameElement>
  );
}
