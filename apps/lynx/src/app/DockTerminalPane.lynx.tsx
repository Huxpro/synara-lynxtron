import { Fragment, useEffect, useRef, useState, type ReactNode } from '@lynx-js/react';
import terminalSvg from '@synara-central-icons/console.svg?raw';
import type { TerminalEvent, ThreadId } from '@synara/contracts';
import {
  defaultTerminalTitleForCliKind,
  deriveTerminalOutputIdentity,
  resolveTerminalVisualIdentity,
  type TerminalCliKind,
  type TerminalVisualState,
} from '@synara/shared/terminalThreads';

import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  LayoutColumnsIcon,
  LayoutRowsIcon,
  PlusIcon,
  Trash2,
} from '../lib/icons.lynx';
import { colorizeLynxSvg } from '../lib/themedSvg.lynx';
import { useTheme } from '../adapters/useTheme.lynx';
import { EditorSurfaceTab } from './EditorSurfaceTab.lynx';
import { ThreadTerminal } from './ThreadTerminal.lynx';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import type { ThreadTerminalLayoutNode } from '@synara-web/types';
import { MAX_TERMINALS_PER_GROUP } from '@synara-web/types';
import { dockTerminalThreadId } from '@synara-web/lib/dockTerminalScope';
import { randomUUID } from '@synara-web/lib/utils';
import type { TerminalContextSelection } from '@synara-web/lib/terminalContext';
import { useComposerDraftStore } from '../adapters/composerDraftStore.lynx';
import {
  selectThreadTerminalState,
  flushTerminalStatePersistence,
  useTerminalStateStore,
} from '@synara-web/terminalStateStore';
import { resolveThreadTerminalLayout } from '@synara-web/components/terminal/TerminalLayout';
import {
  moveLynxTerminalSplitResize,
  readLynxTerminalSplitCoordinate,
  registerLynxTerminalSplitTap,
  type LynxTerminalSplitPointerEvent,
  type LynxTerminalSplitResizeSession,
  type LynxTerminalSplitTapState,
} from './terminalSplitResize.lynx.logic';
import './dock-terminal-pane.css';

function TerminalIcon(props: { readonly cliKind?: TerminalCliKind | null }) {
  const { semanticIconColor } = useTheme();
  if (props.cliKind === 'codex') return <OpenAIProviderIcon provider="codex" />;
  if (props.cliKind === 'claude') return <OpenAIProviderIcon provider="claudeAgent" />;
  if (props.cliKind === 'antigravity') {
    return <OpenAIProviderIcon provider="antigravity" />;
  }
  return (
    <svg
      className="DockTerminalPaneIcon"
      content={colorizeLynxSvg(terminalSvg, semanticIconColor('secondary'))}
    />
  );
}

function ActivityIndicator(props: { readonly state: TerminalVisualState }) {
  if (props.state === 'idle') return null;
  return (
    <view
      className={'DockTerminalPaneActivity DockTerminalPaneActivity--' + props.state}
    />
  );
}

function ToolbarButton(props: {
  readonly label: string;
  readonly children: ReactNode;
  readonly disabled?: boolean;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: 'DockTerminalPaneToolbarButton',
    accessibleLabel: props.label,
    disabled: props.disabled,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={`${interaction.className}${props.disabled ? ' ui-disabled' : ''}`}
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
  readonly scope?: 'dock' | 'thread';
}) {
  const scopeId =
    props.scope === 'thread'
      ? (props.threadId as ThreadId)
      : dockTerminalThreadId(props.threadId as ThreadId);
  const terminalState = useTerminalStateStore((state) =>
    selectThreadTerminalState(state.terminalStateByThreadId, scopeId)
  );
  const openTerminalThreadPage = useTerminalStateStore(
    (state) => state.openTerminalThreadPage
  );
  const newTerminalTab = useTerminalStateStore((state) => state.newTerminalTab);
  const newTerminalGroup = useTerminalStateStore((state) => state.newTerminal);
  const splitTerminalRight = useTerminalStateStore(
    (state) => state.splitTerminalRight
  );
  const splitTerminalDown = useTerminalStateStore(
    (state) => state.splitTerminalDown
  );
  const setActiveTerminal = useTerminalStateStore(
    (state) => state.setActiveTerminal
  );
  const closeTerminal = useTerminalStateStore((state) => state.closeTerminal);
  const resizeTerminalSplit = useTerminalStateStore(
    (state) => state.resizeTerminalSplit
  );
  const setTerminalMetadata = useTerminalStateStore(
    (state) => state.setTerminalMetadata
  );
  const setTerminalActivity = useTerminalStateStore(
    (state) => state.setTerminalActivity
  );
  const resolvedLayout = resolveThreadTerminalLayout({
    activeTerminalGroupId: terminalState.activeTerminalGroupId,
    activeTerminalId: terminalState.activeTerminalId,
    runningTerminalIds: terminalState.runningTerminalIds,
    terminalAttentionStatesById: terminalState.terminalAttentionStatesById,
    terminalCliKindsById: terminalState.terminalCliKindsById,
    terminalGroups: terminalState.terminalGroups,
    terminalIds: terminalState.terminalIds,
    terminalLabelsById: terminalState.terminalLabelsById,
    terminalTitleOverridesById: terminalState.terminalTitleOverridesById,
  });
  const allTabs = resolvedLayout.normalizedTerminalIds.map((id) => ({
    id,
    label: terminalState.terminalLabelsById[id] ?? 'Terminal',
  }));
  const tabs = allTabs.filter((tab) =>
    resolvedLayout.visibleTerminalIds.includes(tab.id)
  );
  const activeId = resolvedLayout.resolvedActiveTerminalId;
  const [closeRequestById, setCloseRequestById] = useState<Record<string, number>>({});
  const [closeQueue, setCloseQueue] = useState<readonly string[]>([]);
  const [closeQueuePurpose, setCloseQueuePurpose] = useState<
    'group' | 'pane' | null
  >(null);
  const handledExternalCloseRef = useRef(props.closeRequestVersion);
  const splitSizeByIdRef = useRef<Record<string, number>>({});
  const splitResizeSessionRef = useRef<LynxTerminalSplitResizeSession | null>(null);
  const splitTapStateRef = useRef<LynxTerminalSplitTapState | null>(null);
  const [resizingSplit, setResizingSplit] = useState(false);
  const [hoveredSplitHandle, setHoveredSplitHandle] = useState<string | null>(null);
  const addTerminalContext = useComposerDraftStore(
    (state) => state.addTerminalContext
  );

  const addTerminalSelectionToChat = (
    selection: TerminalContextSelection
  ) => {
    addTerminalContext(props.threadId, {
      ...selection,
      id: `lynx-terminal-context-${Date.now()}-${Math.random()
        .toString(16)
        .slice(2)}`,
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

  useEffect(() => {
    if (handledExternalCloseRef.current === props.closeRequestVersion) return;
    handledExternalCloseRef.current = props.closeRequestVersion;
    if (tabs.length === 0) {
      props.onClosePane();
      return;
    }
    const ids = terminalState.terminalIds;
    setCloseQueuePurpose('pane');
    setCloseQueue(ids);
    requestClose(ids[0]!);
  }, [props.closeRequestVersion]);

  const addTerminalTab = (targetTerminalId: string, terminalCount: number) => {
    if (terminalCount >= MAX_TERMINALS_PER_GROUP) return;
    newTerminalTab(scopeId, targetTerminalId, `terminal-${randomUUID()}`);
    flushTerminalStatePersistence();
  };

  const addTerminalGroup = () => {
    newTerminalGroup(scopeId, `terminal-${randomUUID()}`);
    flushTerminalStatePersistence();
  };

  const moveTerminalToGroup = (terminalId: string, terminalCount: number) => {
    if (terminalCount <= 1) return;
    newTerminalGroup(scopeId, terminalId);
    flushTerminalStatePersistence();
  };

  const splitTerminal = (
    targetTerminalId: string,
    terminalCount: number,
    position: 'right' | 'bottom'
  ) => {
    if (terminalCount >= MAX_TERMINALS_PER_GROUP) return;
    const terminalId = `terminal-${randomUUID()}`;
    setActiveTerminal(scopeId, targetTerminalId);
    if (position === 'right') splitTerminalRight(scopeId, terminalId);
    else splitTerminalDown(scopeId, terminalId);
    flushTerminalStatePersistence();
  };

  const activateTerminal = (id: string) => {
    setActiveTerminal(scopeId, id);
    flushTerminalStatePersistence();
  };

  const acceptTerminalEvent = (event: TerminalEvent) => {
    const id = event.terminalId;
    if (event.type === 'activity') {
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
    if (event.type === 'output') {
      const identity = deriveTerminalOutputIdentity(event.data);
      if (!identity) return;
      setTerminalMetadata(scopeId, id, {
        cliKind: identity.cliKind,
        label: identity.title,
      });
      return;
    }
    if (
      event.type === 'started' ||
      event.type === 'restarted' ||
      event.type === 'exited'
    ) {
      setTerminalActivity(scopeId, id, {
        agentState: null,
        hasRunningSubprocess: false,
      });
    }
  };

  const stopSplitResize = () => {
    splitResizeSessionRef.current = null;
    setResizingSplit(false);
    flushTerminalStatePersistence();
  };

  const moveSplitResize = (event: LynxTerminalSplitPointerEvent) => {
    const session = splitResizeSessionRef.current;
    if (!session) return;
    const result = moveLynxTerminalSplitResize({ event, session });
    if (result.kind === 'ended-missed-mouseup') {
      stopSplitResize();
      return;
    }
    if (result.kind !== 'moved') return;
    resizeTerminalSplit(
      scopeId,
      session.groupId,
      session.splitId,
      result.weights
    );
  };

  const equalizeSplitOnSecondPointerDown = (input: {
    readonly groupId: string;
    readonly handleIndex: number;
    readonly node: Extract<ThreadTerminalLayoutNode, { readonly type: 'split' }>;
  }): boolean => {
    const handleKey = input.node.id + ':' + input.handleIndex;
    const tap = registerLynxTerminalSplitTap({
      handleKey,
      now: Date.now(),
      previous: splitTapStateRef.current,
    });
    splitTapStateRef.current = tap.next;
    if (!tap.doubleTap) return false;
    splitResizeSessionRef.current = null;
    setResizingSplit(false);
    resizeTerminalSplit(
      scopeId,
      input.groupId,
      input.node.id,
      input.node.children.map(() => 1)
    );
    flushTerminalStatePersistence();
    return true;
  };

  const finishClose = (id: string, didClose: boolean) => {
    if (!didClose) {
      setCloseQueue([]);
      setCloseQueuePurpose(null);
      return;
    }
    const closingAll = closeQueue.length > 0;
    const allTerminalIds = terminalState.terminalIds;
    if (closingAll) {
      const remainingQueue = closeQueue.filter((terminalId) => terminalId !== id);
      setCloseQueue(remainingQueue);
      closeTerminal(scopeId, id);
      flushTerminalStatePersistence();
      if (remainingQueue.length > 0) {
        requestClose(remainingQueue[0]!);
      } else if (closeQueuePurpose === 'pane') {
        setCloseQueuePurpose(null);
        props.onClosePane();
      } else {
        setCloseQueuePurpose(null);
      }
      return;
    }
    closeTerminal(scopeId, id);
    flushTerminalStatePersistence();
    if (allTerminalIds.length === 1) {
      openTerminalThreadPage(scopeId, { terminalOnly: true });
      flushTerminalStatePersistence();
      return;
    }
  };

  const closeTerminalGroup = (groupId: string) => {
    if (resolvedLayout.resolvedTerminalGroups.length <= 1) return;
    const terminalGroup = resolvedLayout.resolvedTerminalGroups.find(
      (candidate) => candidate.id === groupId
    );
    const ids = terminalGroup?.terminalIds ?? [];
    if (ids.length === 0) return;
    setCloseQueuePurpose('group');
    setCloseQueue(ids);
    requestClose(ids[0]!);
  };

  const renderLayout = (
    node: ThreadTerminalLayoutNode,
    terminalGroupId: string
  ): ReactNode => {
    if (node.type === 'split') {
      const weights = node.weights.map((weight) =>
        Number.isFinite(weight) && weight > 0 ? weight : 1
      );
      return (
        <view
          className={
            'DockTerminalPaneSplit DockTerminalPaneSplit--' + node.direction
          }
          bindlayoutchange={(event: {
            readonly detail?: { readonly height?: number; readonly width?: number };
            readonly params?: { readonly height?: number; readonly width?: number };
          }) => {
            'background only';
            const detail = event.detail ?? event.params ?? {};
            const size =
              node.direction === 'horizontal' ? detail.width : detail.height;
            if (typeof size === 'number' && size > 0) {
              splitSizeByIdRef.current[node.id] = size;
            }
          }}
        >
          {node.children.map((child, index) => (
            <Fragment key={child.type === 'split' ? child.id : child.paneId}>
              <view
                className="DockTerminalPaneSplitChild"
                style={{ flexGrow: weights[index] ?? 1, flexBasis: 0 }}
              >
                {renderLayout(child, terminalGroupId)}
              </view>
              {index < node.children.length - 1 ? (
                <view
                  className={
                    'DockTerminalPaneSplitHandle DockTerminalPaneSplitHandle--' +
                    node.direction +
                    (hoveredSplitHandle === `${node.id}:${index}` ? ' ui-hover' : '')
                  }
                  accessibility-element={true}
                  accessibility-label="Resize terminal panes"
                  accessibility-trait="adjustable"
                  bindmouseenter={() => setHoveredSplitHandle(`${node.id}:${index}`)}
                  bindmouseleave={() => setHoveredSplitHandle(null)}
                  bindmousedown={(event: LynxTerminalSplitPointerEvent & { readonly button?: number }) => {
                    const buttons = event.detail?.buttons ?? event.buttons;
                    if (event.button !== undefined && event.button !== 0 && !(event.button === 1 && buttons === 1)) return;
                    if (equalizeSplitOnSecondPointerDown({
                      groupId: terminalGroupId,
                      handleIndex: index,
                      node,
                    })) return;
                    const startCoordinate = readLynxTerminalSplitCoordinate(event, node.direction);
                    const totalSize = splitSizeByIdRef.current[node.id] ?? 0;
                    if (startCoordinate === null || totalSize <= 0) return;
                    splitResizeSessionRef.current = {
                      direction: node.direction,
                      groupId: terminalGroupId,
                      handleIndex: index,
                      splitId: node.id,
                      startCoordinate,
                      totalSize,
                      weights,
                    };
                    setResizingSplit(true);
                  }}
                  bindmousemove={moveSplitResize}
                  bindmouseup={stopSplitResize}
                  bindtouchstart={(event: LynxTerminalSplitPointerEvent) => {
                    if (equalizeSplitOnSecondPointerDown({
                      groupId: terminalGroupId,
                      handleIndex: index,
                      node,
                    })) return;
                    const startCoordinate = readLynxTerminalSplitCoordinate(event, node.direction);
                    const totalSize = splitSizeByIdRef.current[node.id] ?? 0;
                    if (startCoordinate === null || totalSize <= 0) return;
                    splitResizeSessionRef.current = {
                      direction: node.direction, groupId: terminalGroupId, handleIndex: index, splitId: node.id,
                      startCoordinate, totalSize, weights,
                    };
                    setResizingSplit(true);
                  }}
                  bindtouchmove={moveSplitResize}
                  bindtouchend={stopSplitResize}
                  bindtouchcancel={stopSplitResize}
                >
                  <view className="DockTerminalPaneSplitHandleLine" />
                </view>
              ) : null}
            </Fragment>
          ))}
        </view>
      );
    }
    const leafTabs = node.terminalIds
      .map((terminalId) =>
        allTabs.find((candidate) => candidate.id === terminalId)
      )
      .filter((tab): tab is (typeof allTabs)[number] => Boolean(tab));
    const leafActiveId = node.terminalIds.includes(node.activeTerminalId)
      ? node.activeTerminalId
      : leafTabs[0]?.id ?? activeId;
    return (
      <view className="DockTerminalPaneLeaf">
        <view className="DockTerminalPaneToolbar">
          <scroll-view
            className="DockTerminalPaneTabScroller"
            scroll-orientation="horizontal"
          >
            <view className="DockTerminalPaneTabs">
              {leafTabs.map((tab) => {
                const identity =
                  resolvedLayout.terminalVisualIdentityById.get(tab.id) ??
                  resolveTerminalVisualIdentity({
                    cliKind: null, fallbackTitle: tab.label, state: 'idle', title: null,
                  });
                return (
                  <EditorSurfaceTab
                    key={tab.id}
                    active={tab.id === leafActiveId}
                    className="DockTerminalPaneTab"
                    closeLabel={'Close ' + identity.title}
                    icon={<TerminalIcon cliKind={identity.cliKind} />}
                    label={identity.title}
                    leading={<ActivityIndicator state={identity.state} />}
                    onClose={() => requestClose(tab.id)}
                    onSelect={() => activateTerminal(tab.id)}
                  />
                );
              })}
              <ToolbarButton
                disabled={node.terminalIds.length >= MAX_TERMINALS_PER_GROUP}
                label="New terminal tab"
                onActivate={() =>
                  addTerminalTab(leafActiveId, node.terminalIds.length)
                }
              >
                <PlusIcon size={14} />
              </ToolbarButton>
            </view>
          </scroll-view>
          {node.terminalIds.length > 1 ? (
            <ToolbarButton
              label="Move to its own terminal tab"
              onActivate={() =>
                moveTerminalToGroup(leafActiveId, node.terminalIds.length)
              }
            >
              <TerminalIcon />
            </ToolbarButton>
          ) : null}
          <ToolbarButton
            disabled={
              resolvedLayout.visibleTerminalIds.length >=
              MAX_TERMINALS_PER_GROUP
            }
            label="Split right"
            onActivate={() =>
              splitTerminal(
                leafActiveId,
                resolvedLayout.visibleTerminalIds.length,
                'right'
              )
            }
          >
            <LayoutColumnsIcon size={14} />
          </ToolbarButton>
          <ToolbarButton
            disabled={
              resolvedLayout.visibleTerminalIds.length >=
              MAX_TERMINALS_PER_GROUP
            }
            label="Split down"
            onActivate={() =>
              splitTerminal(
                leafActiveId,
                resolvedLayout.visibleTerminalIds.length,
                'bottom'
              )
            }
          >
            <LayoutRowsIcon size={14} />
          </ToolbarButton>
          <ToolbarButton
            label="Close active terminal tab"
            onActivate={() => requestClose(leafActiveId)}
          >
            <Trash2 size={14} />
          </ToolbarButton>
        </view>
        <view className="DockTerminalPaneLeafBody">
        {node.terminalIds.map((terminalId) => {
          const tab = allTabs.find((candidate) => candidate.id === terminalId);
          if (!tab) return null;
          return (
            <view
              key={tab.id}
              className={
                'DockTerminalPaneSession' +
                (tab.id === node.activeTerminalId
                  ? ''
                  : ' DockTerminalPaneSession--hidden')
              }
              bindtap={() => activateTerminal(tab.id)}
            >
              <ThreadTerminal
                active={
                  props.isActive !== false &&
                  terminalGroupId === resolvedLayout.resolvedActiveGroupId &&
                  tab.id === resolvedLayout.resolvedActiveTerminalId
                }
                autoOpen={
                  terminalGroupId === resolvedLayout.resolvedActiveGroupId
                }
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
          );
        })}
        </view>
      </view>
    );
  };

  return (
    <view className="DockTerminalPane">
      {resolvedLayout.resolvedTerminalGroups.length > 1 ? (
        <scroll-view
          className="DockTerminalPaneGroupScroller"
          scroll-orientation="horizontal"
        >
          <view className="DockTerminalPaneGroups">
            {resolvedLayout.resolvedTerminalGroups.map((terminalGroup) => {
              const identity =
                resolvedLayout.terminalVisualIdentityById.get(
                  terminalGroup.activeTerminalId
                ) ??
                resolveTerminalVisualIdentity({
                  cliKind: null,
                  fallbackTitle: 'Terminal',
                  state: 'idle',
                  title: null,
                });
              return (
                <EditorSurfaceTab
                  key={terminalGroup.id}
                  active={
                    terminalGroup.id === resolvedLayout.resolvedActiveGroupId
                  }
                  className="DockTerminalPaneGroupTab"
                  closeLabel={'Close ' + identity.title + ' tab'}
                  icon={<TerminalIcon cliKind={identity.cliKind} />}
                  label={identity.title}
                  leading={<ActivityIndicator state={identity.state} />}
                  onClose={() => closeTerminalGroup(terminalGroup.id)}
                  onSelect={() =>
                    activateTerminal(terminalGroup.activeTerminalId)
                  }
                />
              );
            })}
            <ToolbarButton
              disabled={tabs.length >= MAX_TERMINALS_PER_GROUP}
              label="Split right"
              onActivate={() =>
                splitTerminal(activeId, tabs.length, 'right')
              }
            >
              <LayoutColumnsIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              disabled={tabs.length >= MAX_TERMINALS_PER_GROUP}
              label="Split down"
              onActivate={() =>
                splitTerminal(activeId, tabs.length, 'bottom')
              }
            >
              <LayoutRowsIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              label="New terminal"
              onActivate={addTerminalGroup}
            >
              <PlusIcon size={14} />
            </ToolbarButton>
            <ToolbarButton
              label="Close active terminal tab"
              onActivate={() => requestClose(activeId)}
            >
              <Trash2 size={14} />
            </ToolbarButton>
          </view>
        </scroll-view>
      ) : null}
      <view className="DockTerminalPaneBody">
        {resolvedLayout.resolvedTerminalGroups.map((terminalGroup) => (
          <view
            key={terminalGroup.id}
            className={
              'DockTerminalPaneGroupBody' +
              (terminalGroup.id === resolvedLayout.resolvedActiveGroupId
                ? ''
                : ' DockTerminalPaneGroupBody--hidden')
            }
          >
            {renderLayout(terminalGroup.layout, terminalGroup.id)}
          </view>
        ))}
      </view>
      {resizingSplit ? (
        <view
          className="DockTerminalPaneSplitResizeOverlay"
          bindmousemove={moveSplitResize}
          bindmouseup={stopSplitResize}
          bindtouchmove={moveSplitResize}
          bindtouchend={stopSplitResize}
          bindtouchcancel={stopSplitResize}
        />
      ) : null}
    </view>
  );
}
