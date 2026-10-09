import { useEffect, useState } from "@lynx-js/react";
import type { ProviderKind } from "@synara/contracts";
import {
  readEditorRailChatTabs,
  storeEditorRailChatTabs,
  type EditorRailChatTabSnapshot,
} from "./editorViewState.lynx";

import { ClockIcon, PlusIcon } from "../lib/icons.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import type { ThreadSummary } from "./queries";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import { EditorRailAddMenu } from "./EditorRailAddMenu.lynx";
import { IndependentTabRow } from "./IndependentTabRow.lynx";

import "./editor-rail-tabs.css";

function EditorRailIconButton(props: {
  readonly label: string;
  readonly onActivate: () => void;
  readonly icon: "history" | "plus";
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "ThreadEditorRailIconButton",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  const Icon = props.icon === "plus" ? PlusIcon : ClockIcon;
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <Icon className="ThreadEditorRailIcon" size={14} />
    </view>
  );
}

function EditorRailTab(props: {
  readonly active: boolean;
  readonly label: string;
  readonly onClose: () => void;
  readonly onSelect: () => void;
  readonly provider?: ProviderKind;
  readonly terminal?: boolean;
}) {
  return (
    <EditorSurfaceTab
      active={props.active}
      className="ThreadEditorRailTabChip"
      closeLabel={`Close ${props.label}`}
      icon={
        props.terminal ? (
          <text className="ThreadEditorRailTerminalGlyph">&gt;_</text>
        ) : (
          <OpenAIProviderIcon provider={props.provider} />
        )
      }
      label={props.label}
      labelClassName="ThreadEditorRailTabLabel"
      onSelect={props.onSelect}
      onClose={props.onClose}
    />
  );
}

export function EditorRailTabs(props: {
  readonly activeProvider: ProviderKind;
  readonly activeSurface: "chat" | "terminal";
  readonly activeThreadId: string;
  readonly activeThreadTitle: string;
  readonly onCloseTerminal: () => void;
  readonly onHistory: () => void;
  readonly onNewChat: () => void;
  readonly onNewTerminal: () => void;
  readonly onOpenChat: (threadId: string) => void;
  readonly onOpenTerminal: () => void;
  readonly projectId: string;
  readonly terminalAvailable: boolean;
  readonly threads: readonly ThreadSummary[];
}) {
  const [openTabs, setOpenTabs] = useState<ReadonlyArray<EditorRailChatTabSnapshot>>(() => {
    const stored = readEditorRailChatTabs(props.projectId as never);
    return stored.length > 0
      ? stored
      : [
          {
            id: props.activeThreadId as never,
            title: props.activeThreadTitle,
            provider: props.activeProvider,
          },
        ];
  });
  const currentTab: EditorRailChatTabSnapshot = {
    id: props.activeThreadId as never,
    title: props.activeThreadTitle,
    provider: props.activeProvider,
  };

  function updateTabs(
    updater: (
      current: ReadonlyArray<EditorRailChatTabSnapshot>,
    ) => ReadonlyArray<EditorRailChatTabSnapshot>,
  ) {
    setOpenTabs((current) => {
      const next = updater(current);
      storeEditorRailChatTabs(props.projectId as never, next);
      return next;
    });
  }

  useEffect(() => {
    if (props.activeSurface !== "chat") return;
    updateTabs((current) => {
      const existing = current.find((tab) => tab.id === currentTab.id);
      if (!existing) return [...current, currentTab];
      if (existing.title === currentTab.title && existing.provider === currentTab.provider) {
        return current;
      }
      return current.map((tab) => (tab.id === currentTab.id ? currentTab : tab));
    });
  }, [
    props.activeProvider,
    props.activeSurface,
    props.activeThreadId,
    props.activeThreadTitle,
    props.projectId,
  ]);

  const threadById = new Map(props.threads.map((thread) => [thread.id, thread]));
  const tabs = openTabs.map((tab) => {
    const thread = threadById.get(tab.id);
    return thread
      ? {
          id: thread.id,
          title: thread.title,
          provider: thread.provider ?? tab.provider,
        }
      : tab;
  });
  function closeChat(threadId: string) {
    const next = tabs.find((tab) => tab.id !== threadId);
    updateTabs((current) => current.filter((tab) => tab.id !== threadId));
    if (props.activeSurface === "chat" && props.activeThreadId === threadId) {
      if (next) props.onOpenChat(next.id);
      else if (props.terminalAvailable) props.onOpenTerminal();
    }
  }

  return (
    <IndependentTabRow
      actionPlacement="start"
      className="ThreadEditorRailTabsRoot"
      listClassName="ThreadEditorRailTabList"
      owner="chat"
      scrollerClassName="ThreadEditorRailTabScroller"
      actions={
        <view className="ThreadEditorRailTabActions">
          <EditorRailAddMenu
            onNewChat={props.onNewChat}
            onNewTerminal={props.onNewTerminal}
            terminalDisabled={!props.projectId}
            trigger={
              <EditorRailIconButton
                icon="plus"
                label="New editor rail item"
                onActivate={() => {}}
              />
            }
          />
          <EditorRailIconButton icon="history" label="Chat history" onActivate={props.onHistory} />
        </view>
      }
      tabs={
        <>
          {tabs.map((tab, index) => (
            <EditorRailTab
              key={tab.id}
              active={props.activeSurface === "chat" && tab.id === props.activeThreadId}
              label={`Chat ${index + 1}`}
              provider={tab.provider}
              onSelect={() => props.onOpenChat(tab.id)}
              onClose={() => closeChat(tab.id)}
            />
          ))}
          {props.terminalAvailable ? (
            <EditorRailTab
              active={props.activeSurface === "terminal"}
              label="Terminal"
              terminal
              onSelect={props.onOpenTerminal}
              onClose={props.onCloseTerminal}
            />
          ) : null}
        </>
      }
    />
  );
}
