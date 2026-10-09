// FILE: OpenThreadTabStrip.lynx.tsx
// Purpose: Lynx rendering of upstream's components/chat/OpenThreadTabStrip.tsx: the open
//   threads as tabs in the chat header, in place of the thread title.
// Layer: Lynx presentation. Which tabs exist, their order, titles and the tab that takes
//   over after a close come from upstream's openThreadTabsStore, useOpenThreadTabs and
//   openThreadTabs.logic.
// Not ported: drag to reorder, the tab context menu and the previous/next tab shortcuts.

import type { ThreadId } from "@synara/contracts";
import { useRouter } from "@tanstack/react-router";
import terminalSvg from "@synara-central-icons/console.svg?raw";

import { useComposerDraftStore } from "@synara-web/composerDraftStore";
import {
  buildOpenThreadTabs,
  canKeepOpenThreadTab,
  resolveOpenThreadTabCloseTarget,
  type OpenThreadTab,
} from "@synara-web/openThreadTabs.logic";
import { useOpenThreadTabsStore } from "@synara-web/openThreadTabsStore";
import { useStore } from "@synara-web/store";
import { selectThreadTerminalState, useTerminalStateStore } from "@synara-web/terminalStateStore";
import { useEffect, useRef } from "@lynx-js/react";
import { useShallow } from "zustand/react/shallow";
import { useTheme } from "../adapters/useTheme.lynx";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { EditorSurfaceTab } from "./EditorSurfaceTab.lynx";
import "./open-thread-tab-strip.css";

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
        <view className="OpenThreadTabStripList">
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
                onSelect={active ? props.onRenameActiveThread : () => openThread(tab.threadId)}
              />
            );
          })}
        </view>
      </scroll-view>
    </view>
  );
}
