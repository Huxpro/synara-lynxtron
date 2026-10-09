import { useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import type { TerminalEvent, ThreadId } from "@synara/contracts";
import {
  defaultTerminalTitleForCliKind,
  resolveTerminalVisualIdentity,
  type TerminalCliKind,
  type TerminalVisualState,
} from "@synara/shared/terminalThreads";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { PlusIcon, Trash2 } from "../lib/icons.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { useTheme } from "../adapters/useTheme.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import { IndependentTabRow } from "./IndependentTabRow.lynx";
import { ThreadTerminal } from "./ThreadTerminal.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { dockTerminalThreadId } from "@synara-web/lib/dockTerminalScope";
import { randomUUID } from "@synara-web/lib/utils";
import type { TerminalContextSelection } from "@synara-web/lib/terminalContext";
import { useComposerDraftStore } from "../adapters/composerDraftStore.lynx";
import {
  selectThreadTerminalState,
  flushTerminalStatePersistence,
  useTerminalStateStore,
} from "@synara-web/terminalStateStore";
import { resolveTerminalVisualIdentityMap } from "@synara-web/terminalVisualIdentity";
import "./dock-terminal-pane.css";

function TerminalIcon(props: { readonly cliKind?: TerminalCliKind | null }) {
  const { semanticIconColor } = useTheme();
  if (props.cliKind === "codex") return <OpenAIProviderIcon provider="codex" />;
  if (props.cliKind === "claude") return <OpenAIProviderIcon provider="claudeAgent" />;
  if (props.cliKind === "antigravity") {
    return <OpenAIProviderIcon provider="antigravity" />;
  }
  return (
    <svg
      className="DockTerminalPaneIcon"
      content={colorizeLynxSvg(terminalSvg, semanticIconColor("secondary"))}
    />
  );
}

function ActivityIndicator(props: { readonly state: TerminalVisualState }) {
  if (props.state === "idle") return null;
  return <view className={"DockTerminalPaneActivity DockTerminalPaneActivity--" + props.state} />;
}

function ToolbarButton(props: {
  readonly label: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "DockTerminalPaneToolbarButton",
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={`${interaction.className}${props.disabled ? " ui-disabled" : ""}`}
      {...interaction.eventProps}
    >
      {props.children}
    </view>
  );
}

export function DockTerminalPane(props: {
  readonly closeRequestVersion: number;
  readonly fontFamily: string;
  readonly fontSizePx: number;
  readonly threadId: string;
  readonly workspaceRoot: string;
  readonly onClosePane: () => void;
  readonly isActive?: boolean;
  readonly scope?: "dock" | "thread";
}) {
  const { semanticIconColor } = useTheme();
  const toolbarIconColor = semanticIconColor("secondary");
  const scopeId =
    props.scope === "thread"
      ? (props.threadId as ThreadId)
      : dockTerminalThreadId(props.threadId as ThreadId);
  const terminalState = useTerminalStateStore((state) =>
    selectThreadTerminalState(state.terminalStateByThreadId, scopeId),
  );
  const openTerminalThreadPage = useTerminalStateStore((state) => state.openTerminalThreadPage);
  const newTerminal = useTerminalStateStore((state) => state.newTerminal);
  const setActiveTerminal = useTerminalStateStore((state) => state.setActiveTerminal);
  const closeTerminal = useTerminalStateStore((state) => state.closeTerminal);
  const setTerminalMetadata = useTerminalStateStore((state) => state.setTerminalMetadata);
  const setTerminalActivity = useTerminalStateStore((state) => state.setTerminalActivity);
  // Upstream's terminal workspace is one flat row of tabs per scope (terminal groups and
  // split panes were removed upstream); the pane shows the active tab's session.
  const terminalIds = terminalState.terminalIds;
  const tabs = terminalIds.map((id) => ({
    id,
    label: terminalState.terminalLabelsById[id] ?? "Terminal",
  }));
  const activeId = terminalIds.includes(terminalState.activeTerminalId)
    ? terminalState.activeTerminalId
    : (terminalIds[0] ?? terminalState.activeTerminalId);
  const terminalVisualIdentityById = resolveTerminalVisualIdentityMap({
    terminalIds,
    runningTerminalIds: terminalState.runningTerminalIds,
    terminalAttentionStatesById: terminalState.terminalAttentionStatesById,
    terminalCliKindsById: terminalState.terminalCliKindsById,
    terminalLabelsById: terminalState.terminalLabelsById,
    terminalTitleOverridesById: terminalState.terminalTitleOverridesById,
  });
  const [closeRequestById, setCloseRequestById] = useState<Record<string, number>>({});
  const [closeQueue, setCloseQueue] = useState<readonly string[]>([]);
  const handledExternalCloseRef = useRef(props.closeRequestVersion);
  const addTerminalContext = useComposerDraftStore((state) => state.addTerminalContext);

  const addTerminalSelectionToChat = (selection: TerminalContextSelection) => {
    addTerminalContext(props.threadId, {
      ...selection,
      id: `lynx-terminal-context-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      threadId: props.threadId as ThreadId,
      createdAt: new Date().toISOString(),
    });
  };

  useEffect(() => {
    if (!terminalState.terminalOpen) {
      openTerminalThreadPage(scopeId, { terminalOnly: true });
      flushTerminalStatePersistence();
    }
  }, [openTerminalThreadPage, scopeId, terminalState.terminalOpen]);

  const requestClose = (id: string) => {
    setCloseRequestById((current) => ({
      ...current,
      [id]: (current[id] ?? 0) + 1,
    }));
  };

  // Closing the pane closes every terminal in it, one confirmation at a time.
  useEffect(() => {
    if (handledExternalCloseRef.current === props.closeRequestVersion) return;
    handledExternalCloseRef.current = props.closeRequestVersion;
    if (tabs.length === 0) {
      props.onClosePane();
      return;
    }
    setCloseQueue(terminalIds);
    requestClose(terminalIds[0]!);
  }, [props.closeRequestVersion]);

  const addTerminal = () => {
    newTerminal(scopeId, `terminal-${randomUUID()}`);
    flushTerminalStatePersistence();
  };

  const activateTerminal = (id: string) => {
    setActiveTerminal(scopeId, id);
    flushTerminalStatePersistence();
  };

  const acceptTerminalEvent = (event: TerminalEvent) => {
    const id = event.terminalId;
    if (event.type === "activity") {
      if (event.cliKind) {
        setTerminalMetadata(scopeId, id, {
          cliKind: event.cliKind,
          label: defaultTerminalTitleForCliKind(event.cliKind),
        });
      }
      setTerminalActivity(scopeId, id, {
        agentState: event.agentState ?? null,
        hasRunningSubprocess: event.hasRunningSubprocess,
      });
      return;
    }
    if (event.type === "started" || event.type === "restarted" || event.type === "exited") {
      setTerminalActivity(scopeId, id, {
        agentState: null,
        hasRunningSubprocess: false,
      });
    }
  };

  const finishClose = (id: string, didClose: boolean) => {
    if (!didClose) {
      setCloseQueue([]);
      return;
    }
    if (closeQueue.length > 0) {
      const remainingQueue = closeQueue.filter((terminalId) => terminalId !== id);
      setCloseQueue(remainingQueue);
      closeTerminal(scopeId, id);
      flushTerminalStatePersistence();
      if (remainingQueue.length > 0) requestClose(remainingQueue[0]!);
      else props.onClosePane();
      return;
    }
    closeTerminal(scopeId, id);
    flushTerminalStatePersistence();
    if (terminalIds.length === 1) {
      openTerminalThreadPage(scopeId, { terminalOnly: true });
      flushTerminalStatePersistence();
    }
  };

  return (
    <view className="DockTerminalPane">
      <view className="DockTerminalPaneBody">
        <view className="DockTerminalPaneLeaf">
          <IndependentTabRow
            className="DockTerminalPaneToolbar"
            listClassName="DockTerminalPaneTabs"
            owner="terminal-pane"
            scrollerClassName="DockTerminalPaneTabScroller"
            tabs={
              <>
                {tabs.map((tab) => {
                  const identity =
                    terminalVisualIdentityById.get(tab.id) ??
                    resolveTerminalVisualIdentity({
                      cliKind: null,
                      fallbackTitle: tab.label,
                      state: "idle",
                      title: null,
                    });
                  return (
                    <EditorSurfaceTab
                      key={tab.id}
                      active={tab.id === activeId}
                      className="DockTerminalPaneTab"
                      closeLabel={"Close " + identity.title}
                      icon={<TerminalIcon cliKind={identity.cliKind} />}
                      label={identity.title}
                      leading={<ActivityIndicator state={identity.state} />}
                      onClose={() => requestClose(tab.id)}
                      onSelect={() => activateTerminal(tab.id)}
                    />
                  );
                })}
              </>
            }
            actions={
              <>
                <ToolbarButton label="New terminal tab" onActivate={addTerminal}>
                  <PlusIcon color={toolbarIconColor} size={14} />
                </ToolbarButton>
                <ToolbarButton
                  label="Close active terminal tab"
                  onActivate={() => requestClose(activeId)}
                >
                  <Trash2 color={toolbarIconColor} size={14} />
                </ToolbarButton>
              </>
            }
          />
          <view className="DockTerminalPaneLeafBody">
            {tabs.map((tab) => (
              <view
                key={tab.id}
                className={
                  "DockTerminalPaneSession" +
                  (tab.id === activeId ? "" : " DockTerminalPaneSession--hidden")
                }
                // Hidden sessions stack over the active one; Lynx does not inherit
                // pointer-events: none, so they must refuse touch outright.
                user-interaction-enabled={tab.id === activeId}
                bindtap={() => activateTerminal(tab.id)}
              >
                <ThreadTerminal
                  active={props.isActive !== false && tab.id === activeId}
                  autoOpen
                  closeRequestVersion={closeRequestById[tab.id] ?? 0}
                  fontFamily={props.fontFamily}
                  fontSizePx={props.fontSizePx}
                  open
                  presentationMode="workspace"
                  showHeader={false}
                  terminalId={tab.id}
                  terminalLabel={tab.label}
                  threadId={scopeId}
                  workspaceRoot={props.workspaceRoot}
                  onCloseSettled={(closed) => finishClose(tab.id, closed)}
                  onTerminalEvent={acceptTerminalEvent}
                  onAddTerminalContext={addTerminalSelectionToChat}
                  onOpenChange={() => {}}
                />
              </view>
            ))}
          </view>
        </view>
      </view>
    </view>
  );
}
