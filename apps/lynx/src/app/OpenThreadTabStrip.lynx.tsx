// FILE: OpenThreadTabStrip.lynx.tsx
// Purpose: Lynx rendering of upstream's components/chat/OpenThreadTabStrip.tsx: the open
//   threads as tabs in the chat header, in place of the thread title.
// Layer: Lynx presentation. Which tabs exist, their order, titles and the tab that takes
//   over after a close come from upstream's openThreadTabsStore, useOpenThreadTabs and
//   openThreadTabs.logic.
//   The tab context menu offers upstream's scoped closes (left, right, others).
// Not ported: drag to reorder, the thread actions upstream merges into the tab menu, and
//   the previous/next tab shortcuts (Native has no keybinding command dispatcher yet).

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
import { useStore } from "@synara-web/store";
import { selectThreadTerminalState, useTerminalStateStore } from "@synara-web/terminalStateStore";
import { useEffect, useRef, useState } from "@lynx-js/react";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "../adapters/useTheme.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { contentTabListStyle, EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
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

/**
 * The rows a tab's context menu lists: only the scopes that have tabs in them, so none on
 * a lone tab and no left (or right) row on the first (or last) tab, as upstream.
 */
export function resolveCloseTabsMenuItems(
  tabs: readonly Pick<OpenThreadTab, "threadId">[],
  anchorThreadId: ThreadId,
): { readonly id: OpenThreadTabCloseScope; readonly label: string }[] {
  return CLOSE_TABS_MENU_ROWS.filter(
    (row) => resolveOpenThreadTabsInCloseScope(tabs, anchorThreadId, row.scope).length > 0,
  ).map((row) => ({ id: row.scope, label: row.label }));
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
  const [enqueueClose] = useState(createOpenThreadTabCloseQueue);
  const openTabContextMenu = async (
    tab: OpenThreadTab,
    position: { readonly x: number; readonly y: number },
  ) => {
    "background only";
    const items = resolveCloseTabsMenuItems(tabs, tab.threadId);
    if (items.length === 0) return;
    const { showContextMenu } = await import(/* webpackMode: "eager" */ "../platform/contextMenu");
    const scope = await showContextMenu(items, position);
    if (!scope) return;
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
    >
      <scroll-view className="OpenThreadTabStripScroller" scroll-orientation="horizontal">
        <view className="OpenThreadTabStripList" style={contentTabListStyle(tabs.length)}>
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
                onSelect={active ? props.onRenameActiveThread : () => openThread(tab.threadId)}
              />
            );
          })}
        </view>
      </scroll-view>
    </view>
  );
}
