// FILE: OpenThreadTabStrip.lynx.tsx
// Purpose: Lynx rendering of upstream's components/chat/OpenThreadTabStrip.tsx: the open
//   threads as tabs in the chat header, in place of the thread title.
// Layer: Lynx presentation. Which tabs exist, their order, titles and the tab that takes
//   over after a close come from upstream's openThreadTabsStore, useOpenThreadTabs and
//   openThreadTabs.logic.
//   The tab context menu is the sidebar's thread menu (through upstream's
//   lib/threadContextMenu registration) plus upstream's scoped closes (left, right, others);
//   threadTab.next / threadTab.previous step through the strip, wrapping, as upstream; a
//   press that travels 6px drags the tab and reorders with upstream's moveThreadTab.
// Not ported: the dragged tab does not follow the pointer between slots (it moves a slot
//   at a time), and the clicked tab does not paint as active before its thread renders
//   (upstream's useOptimisticTabSelection).

import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import type { ThreadId } from "@synara/contracts";
import { useRouter } from "@tanstack/react-router";
import terminalSvg from "@synara-central-icons/console.svg?raw";

import { useComposerDraftStore } from "@synara-web/composerDraftStore";
import {
  buildOpenThreadTabs,
  canKeepOpenThreadTab,
  closeOpenThreadTabs,
  createOpenThreadTabCloseQueue,
  resolveOpenThreadTabCloseTarget,
  resolveOpenThreadTabsInCloseScope,
  type OpenThreadTab,
  type OpenThreadTabCloseScope,
} from "@synara-web/openThreadTabs.logic";
import { useOpenThreadTabsStore } from "@synara-web/openThreadTabsStore";
import { getNextVisibleSidebarThreadId } from "@synara-web/components/SidebarThreadNavigation.logic";
import { showThreadContextMenu } from "@synara-web/lib/threadContextMenu";
import { useStore } from "@synara-web/store";
import { selectThreadTerminalState, useTerminalStateStore } from "@synara-web/terminalStateStore";
import { useEffect, useRef, useState } from "@lynx-js/react";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "../adapters/useTheme.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import {
  CONTENT_TAB_METRICS,
  contentTabListStyle,
  EditorSurfaceTab,
} from "./EditorSurfaceTab.lynx";
import { useKeybindingCommand } from "./keybindingDispatcher.lynx";
import {
  readNativeKanbanButtons,
  readNativeKanbanPointer,
  type NativeKanbanPointerEvent,
} from "./kanbanDnd.logic";
import {
  createOpenThreadTabDragSession,
  moveOpenThreadTabDrag,
  type OpenThreadTabDragSession,
  type OpenThreadTabStripGeometry,
} from "./openThreadTabDrag.logic";
import "./open-thread-tab-strip.css";

/** Upstream's `CLOSE_TABS_MENU_ROWS` (components/chat/OpenThreadTabStrip.tsx), in its order. */
export const CLOSE_TABS_MENU_ROWS: readonly {
  readonly scope: OpenThreadTabCloseScope;
  readonly label: string;
}[] = [
  { scope: "left", label: "Close Tabs to the Left" },
  { scope: "right", label: "Close Tabs to the Right" },
  { scope: "others", label: "Close Other Tabs" },
];

/** Upstream's id prefix for the close rows inside the thread menu. */
export const CLOSE_TABS_MENU_ID_PREFIX = "close-tabs:";

/**
 * The rows a tab's context menu lists: only the scopes that have tabs in them, so none on
 * a lone tab and no left (or right) row on the first (or last) tab, as upstream. They are
 * a group of their own below the thread's actions.
 */
export function resolveCloseTabsMenuItems(
  tabs: readonly Pick<OpenThreadTab, "threadId">[],
  anchorThreadId: ThreadId,
): { readonly id: string; readonly label: string; readonly separatorBefore: boolean }[] {
  return CLOSE_TABS_MENU_ROWS.filter(
    (row) => resolveOpenThreadTabsInCloseScope(tabs, anchorThreadId, row.scope).length > 0,
  ).map((row, index) => ({
    id: `${CLOSE_TABS_MENU_ID_PREFIX}${row.scope}`,
    label: row.label,
    separatorBefore: index === 0,
  }));
}

/** The scope a chosen menu row closes, or null for a row that is not a close row. */
export function closeTabsScopeFromMenuItemId(itemId: string): OpenThreadTabCloseScope | null {
  return (
    CLOSE_TABS_MENU_ROWS.find((row) => itemId === `${CLOSE_TABS_MENU_ID_PREFIX}${row.scope}`)
      ?.scope ?? null
  );
}

/**
 * Upstream's `hooks/useOpenThreadTabs` (useOpenThreadTabs + useRecordOpenThreadTab) on the
 * same stores and derivation. That module is typed against the registered TanStack route
 * tree, which the Lynx program does not have, so the store wiring is repeated here.
 * Not carried over: naming a subagent tab from its parent's activity log, and the
 * "preparing worktree" spinner of a send in flight.
 */
function useOpenThreadTabs(activeThreadId: ThreadId | null): OpenThreadTab[] {
  const threadIds = useOpenThreadTabsStore((state) => state.threadIds);
  const openThreadTab = useOpenThreadTabsStore((state) => state.openThreadTab);
  const pruneThreadTabs = useOpenThreadTabsStore((state) => state.pruneThreadTabs);
  const threadsHydrated = useStore((state) => state.threadsHydrated);
  const summaries = useStore(
    useShallow((state) => threadIds.map((threadId) => state.sidebarThreadSummaryById[threadId])),
  );
  const terminalEntryPoints = useTerminalStateStore(
    useShallow((state) =>
      threadIds.map(
        (threadId) =>
          selectThreadTerminalState(state.terminalStateByThreadId, threadId).entryPoint ===
          "terminal",
      ),
    ),
  );
  useEffect(() => {
    "background only";
    if (activeThreadId) openThreadTab(activeThreadId);
  }, [activeThreadId, openThreadTab]);
  // Once per mount after hydration, as upstream: later churn must not drop a tab whose
  // thread only disappears transiently.
  const didPruneRef = useRef(false);
  useEffect(() => {
    "background only";
    if (!threadsHydrated || didPruneRef.current) return;
    didPruneRef.current = true;
    const { draftThreadsByThreadId } = useComposerDraftStore.getState();
    const { sidebarThreadSummaryById } = useStore.getState();
    pruneThreadTabs(
      (threadId) =>
        threadId === activeThreadId ||
        canKeepOpenThreadTab(
          sidebarThreadSummaryById[threadId],
          draftThreadsByThreadId[threadId] !== undefined,
        ),
    );
  }, [activeThreadId, pruneThreadTabs, threadsHydrated]);
  return buildOpenThreadTabs({
    sources: threadIds.map((threadId, index) => ({
      threadId,
      summary: summaries[index],
      terminalEntryPoint: terminalEntryPoints[index] ?? false,
    })),
    activeThreadId,
  });
}

/** A release over the dragged tab also reports a tap on it; that tap is not a selection. */
const DRAG_END_TAP_GUARD_MS = 250;

export function OpenThreadTabStrip(props: {
  /** The thread on screen; null on the landing (an unsent draft has no tab). */
  readonly activeThreadId: string | null;
  /** Upstream renames on a double-click of the active tab; Lynx has taps only. */
  readonly onRenameActiveThread?: (() => void) | undefined;
}) {
  const activeThreadId = props.activeThreadId as ThreadId | null;
  const { semanticIconColor } = useTheme();
  const router = useRouter();
  const tabs = useOpenThreadTabs(activeThreadId);
  const closeThreadTab = useOpenThreadTabsStore((state) => state.closeThreadTab);
  const openThread = (threadId: ThreadId | null) => {
    "background only";
    void router.navigate(threadId ? { to: "/$threadId", params: { threadId } } : { to: "/" });
  };
  // The route's thread as of the latest render, for closes that finish after a navigation.
  const routeThreadIdRef = useRef(activeThreadId);
  routeThreadIdRef.current = activeThreadId;
  const pruneThreadTabs = useOpenThreadTabsStore((state) => state.pruneThreadTabs);
  const moveThreadTab = useOpenThreadTabsStore((state) => state.moveThreadTab);
  const [enqueueClose] = useState(createOpenThreadTabCloseQueue);

  // Previous/next tab, wrapping at either end like a browser (upstream's onKeyDown).
  const stepTab = (direction: "forward" | "backward") => {
    "background only";
    const nextThreadId = getNextVisibleSidebarThreadId({
      visibleThreadIds: tabs.map((tab) => tab.threadId),
      activeThreadId: activeThreadId ?? undefined,
      direction,
    });
    if (nextThreadId && nextThreadId !== activeThreadId) openThread(nextThreadId);
  };
  useKeybindingCommand("threadTab.next", () => stepTab("forward"));
  useKeybindingCommand("threadTab.previous", () => stepTab("backward"));

  // Drag to reorder. The session lives in a ref (moves must not re-render the strip);
  // `draggingThreadId` only mounts the overlay that keeps the drag alive off the strip.
  const listRef = useRef<NodesRef>(null);
  const dragSessionRef = useRef<OpenThreadTabDragSession<ThreadId> | null>(null);
  const dragGeometryRef = useRef<OpenThreadTabStripGeometry | null>(null);
  const tabsRef = useRef(tabs);
  tabsRef.current = tabs;
  const [draggingThreadId, setDraggingThreadId] = useState<ThreadId | null>(null);
  // True from a press on a tab to its release. The strip does not pan meanwhile: a pan
  // would carry the held tab along under the pointer (and, for a touch, take the gesture
  // away from the tab), so the pointer could never enter another slot.
  const [tabPressed, setTabPressed] = useState(false);
  // A drag that ends over its own tab must not also select it.
  const dragEndedAtRef = useRef(0);
  const startTabDrag = (threadId: ThreadId, point: { readonly x: number; readonly y: number }) => {
    "background only";
    // A press whose release was never reported is replaced; a drag in progress is kept.
    if (dragSessionRef.current?.activated || tabsRef.current.length < 2) return;
    dragSessionRef.current = createOpenThreadTabDragSession(threadId, point);
    dragGeometryRef.current = null;
    setTabPressed(true);
    // Measured at the press, before anything can move; the row is then held still.
    void getRectByRef(listRef, true)
      .then((rect) => {
        if (dragSessionRef.current?.key !== threadId) return;
        dragGeometryRef.current = { listLeft: rect.left, listWidth: rect.width };
      })
      .catch(() => {
        // Without the row's position there is no slot to drop on; the drag stays inert.
      });
  };
  const endTabDrag = () => {
    "background only";
    const session = dragSessionRef.current;
    if (!session) return;
    dragSessionRef.current = null;
    dragGeometryRef.current = null;
    setTabPressed(false);
    if (session.activated) {
      dragEndedAtRef.current = Date.now();
      setDraggingThreadId(null);
    }
  };
  // The strip's order as the store has it now. The rendered order lags the store by a
  // render, and a second move in that gap would drop the tab back onto its old slot.
  const readTabOrder = (): ThreadId[] => {
    "background only";
    const shown = new Set(tabsRef.current.map((tab) => tab.threadId));
    return useOpenThreadTabsStore.getState().threadIds.filter((threadId) => shown.has(threadId));
  };
  const moveTabDrag = (event: NativeKanbanPointerEvent) => {
    "background only";
    const session = dragSessionRef.current;
    if (!session) return;
    const result = moveOpenThreadTabDrag({
      session,
      point: readNativeKanbanPointer(event),
      buttons: readNativeKanbanButtons(event),
      keys: readTabOrder(),
      geometry: dragGeometryRef.current,
      metrics: CONTENT_TAB_METRICS,
    });
    if (result.kind === "ended") {
      endTabDrag();
      return;
    }
    if (result.kind !== "dragging") return;
    if (!session.activated) {
      dragSessionRef.current = result.session;
      setDraggingThreadId(session.key);
    }
    if (result.overKey) moveThreadTab(session.key, result.overKey);
  };

  const closeTabsInScope = (tab: OpenThreadTab, scope: OpenThreadTabCloseScope) => {
    "background only";
    void enqueueClose(() => {
      const openThreadIds = useOpenThreadTabsStore.getState().threadIds;
      // The route's thread: the one on screen, then the kept tab once navigating to it
      // has resolved (the render that would refresh the ref may not have run yet).
      let routeThreadId: ThreadId | null = routeThreadIdRef.current;
      return closeOpenThreadTabs({
        closedThreadIds: resolveOpenThreadTabsInCloseScope(
          // The tabs as right-clicked, minus any an earlier queued close has since dropped.
          tabs.filter((candidate) => openThreadIds.includes(candidate.threadId)),
          tab.threadId,
          scope,
        ),
        keptThreadId: tab.threadId,
        activeThreadId: routeThreadIdRef.current,
        closeTabs: (threadIds) => pruneThreadTabs((threadId) => !threadIds.includes(threadId)),
        openTab: async (threadId) => {
          await router.navigate({ to: "/$threadId", params: { threadId } });
          routeThreadId = threadId;
        },
        readRouteThreadId: () => routeThreadId,
      });
    });
  };
  const openTabContextMenu = async (
    tab: OpenThreadTab,
    position: { readonly x: number; readonly y: number },
  ) => {
    "background only";
    const closeItems = resolveCloseTabsMenuItems(tabs, tab.threadId);
    const onCloseAction = (itemId: string) => {
      const scope = closeTabsScopeFromMenuItemId(itemId);
      if (scope) closeTabsInScope(tab, scope);
    };
    // A thread has one menu wherever it is right-clicked: the sidebar's, with the tab's
    // close rows added. A draft has no thread actions, and with no sidebar mounted the
    // registration is absent; both keep the close rows alone, as upstream's fallback.
    if (
      useStore.getState().sidebarThreadSummaryById[tab.threadId] !== undefined &&
      showThreadContextMenu(tab.threadId, position, {
        extraItems: closeItems,
        onExtraAction: onCloseAction,
      })
    ) {
      return;
    }
    if (closeItems.length === 0) return;
    const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
    const itemId = await showContextMenu(closeItems, position);
    if (itemId) onCloseAction(itemId);
  };
  const closeTab = (threadId: ThreadId) => {
    "background only";
    const target = resolveOpenThreadTabCloseTarget({
      tabs,
      closedThreadId: threadId,
      activeThreadId,
    });
    closeThreadTab(threadId);
    // Closing the last tab leaves a fresh chat, as upstream's replaceLastTabWithFreshChat.
    if (target) openThread(target.threadId);
  };
  return (
    <view
      className="OpenThreadTabStrip"
      accessibility-element={true}
      accessibility-label="Open threads"
      accessibility-trait="none"
      bindmousemove={moveTabDrag}
      bindmouseup={endTabDrag}
      bindtouchmove={moveTabDrag}
      bindtouchend={endTabDrag}
      bindtouchcancel={endTabDrag}
    >
      <scroll-view
        className="OpenThreadTabStripScroller"
        scroll-orientation="horizontal"
        enable-scroll={!tabPressed}
      >
        <view
          ref={listRef}
          className="OpenThreadTabStripList"
          style={contentTabListStyle(tabs.length)}
        >
          {tabs.map((tab) => {
            const active = tab.threadId === activeThreadId;
            return (
              <EditorSurfaceTab
                key={tab.threadId}
                active={active}
                closePlacement="trailing"
                closeLabel={`Close ${tab.title}`}
                icon={
                  tab.isTerminal ? (
                    <svg
                      className="OpenThreadTabTerminalIcon"
                      content={colorizeLynxSvg(terminalSvg, semanticIconColor("accent"))}
                    />
                  ) : (
                    <OpenAIProviderIcon provider={tab.provider} />
                  )
                }
                label={tab.title}
                onClose={() => closeTab(tab.threadId)}
                onContextMenu={(position) => void openTabContextMenu(tab, position)}
                onDragPointerStart={(point) => startTabDrag(tab.threadId, point)}
                onSelect={
                  active && !props.onRenameActiveThread
                    ? undefined
                    : () => {
                        if (Date.now() - dragEndedAtRef.current < DRAG_END_TAP_GUARD_MS) return;
                        if (active) props.onRenameActiveThread?.();
                        else openThread(tab.threadId);
                      }
                }
              />
            );
          })}
        </view>
      </scroll-view>
      {draggingThreadId ? (
        // The pointer leaves the 32px strip during most drags; this keeps its moves and
        // its release, as the Kanban board's drag overlay does.
        <view
          className="OpenThreadTabDragOverlay"
          bindmousemove={moveTabDrag}
          bindmouseup={endTabDrag}
          bindtouchmove={moveTabDrag}
          bindtouchend={endTabDrag}
          bindtouchcancel={endTabDrag}
        />
      ) : null}
    </view>
  );
}
