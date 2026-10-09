// Shared thread-surface dock pieces: the header right-sidebar toggle, the working-tree
// totals, and the right-dock/main-column width split. The thread page and the
// new-thread landing (the web's draft thread) both use them.

import sidebarRightSvg from "@synara-central-icons/sidebar-simple-right-wide.svg?raw";
import { useCallback, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import {
  GIT_WORKING_TREE_DIFF_LIVE_REFETCH_INTERVAL_MS,
  gitBranchesQueryOptions,
  gitWorkingTreeDiffStatsQueryOptions,
} from "@synara-web/lib/gitReactQuery";
import { RIGHT_DOCK_MIN_WIDTH_PX, type RightDockThreadState } from "@synara/shared/rightDock";
import { clampSidebarWidth } from "@synara-web/components/sidebarResize.logic";
import { VIEWPORT_BREAKPOINTS } from "@synara-web/responsiveLayout.logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { readRightDockThreadState, storeRightDockThreadState } from "./rightDockState.lynx";

export interface WorkspaceHeaderDiff {
  readonly isPending: boolean;
  readonly isGitRepo: boolean;
  readonly totals: {
    readonly additions: number;
    readonly deletions: number;
    readonly hasChanges: boolean;
  };
}

/**
 * Working-tree totals for the header diff toggle, read the way the Web header
 * reads them (`useRepoDiffTotals`): the server-side line counts, refreshed by
 * git invalidations and polled only while a turn is live and the dock is closed.
 */
export function useWorkspaceHeaderDiff(input: {
  readonly workspaceRoot: string | null;
  readonly diffOpen: boolean;
  readonly turnLive?: boolean;
}): WorkspaceHeaderDiff {
  const branches = useQuery(gitBranchesQueryOptions(input.workspaceRoot));
  const isGitRepo = branches.data?.isRepo === true;
  const stats = useQuery(
    gitWorkingTreeDiffStatsQueryOptions({
      cwd: input.workspaceRoot,
      enabled: isGitRepo,
      refetchInterval:
        input.turnLive === true && !input.diffOpen
          ? GIT_WORKING_TREE_DIFF_LIVE_REFETCH_INTERVAL_MS
          : false,
    }),
  );
  const additions = isGitRepo ? (stats.data?.additions ?? 0) : 0;
  const deletions = isGitRepo ? (stats.data?.deletions ?? 0) : 0;
  return {
    isPending: Boolean(input.workspaceRoot) && branches.isPending,
    isGitRepo,
    totals: { additions, deletions, hasChanges: additions > 0 || deletions > 0 },
  };
}

/**
 * Electron's ChatHeader right-dock toggle: shows or hides the right sidebar, which opens on
 * its launcher when no pane is active.
 */
export function ThreadRightSidebarToggle(props: {
  readonly open: boolean;
  readonly onToggle: () => void;
}) {
  const { svgColors } = useTheme();
  const toggle = useLynxInteractiveState({
    baseClassName: `ThreadRightSidebarToggle${props.open ? " ThreadRightSidebarToggle--active" : ""}`,
    accessibleLabel: "Toggle right sidebar",
    accessibilityValue: props.open ? "On" : "Off",
    onActivate: props.onToggle,
  });
  return (
    <view className={toggle.className} aria-pressed={props.open} {...toggle.eventProps}>
      <svg
        className="ThreadRightSidebarToggleIcon"
        content={colorizeLynxSvg(sidebarRightSvg, svgColors.foreground)}
      />
    </view>
  );
}

/**
 * Width split between the main column and the right dock. Below md the dock
 * overlays the page, so the main column keeps its full width.
 */
export function useRightDockLayout(input: {
  readonly dockOpen: boolean;
  /** Width used until the dock reports one; half the page when absent. */
  readonly fallbackDockWidth?: number | null;
  readonly initialDockWidth: number | null;
  readonly viewportWidth: number;
}) {
  const [pageWidth, setPageWidth] = useState(0);
  const [dockWidth, setDockWidth] = useState<number | null>(input.initialDockWidth);
  const availableWidth = pageWidth || input.viewportWidth;
  const overlaysMainContent =
    input.viewportWidth > 0 && input.viewportWidth < VIEWPORT_BREAKPOINTS.md;
  const effectiveDockWidth =
    input.dockOpen && !overlaysMainContent
      ? dockWidth !== null && dockWidth > 0
        ? dockWidth
        : clampSidebarWidth(input.fallbackDockWidth ?? Math.round(availableWidth / 2), {
            maxWidth: 960,
            minWidth: RIGHT_DOCK_MIN_WIDTH_PX,
            minimumContentWidth: 320,
            viewportWidth: availableWidth,
          })
      : null;
  return {
    availableWidth,
    effectiveDockWidth,
    mainWidth: Math.max(0, availableWidth - (effectiveDockWidth ?? 0)),
    overlaysMainContent,
    pageWidth,
    setDockWidth,
    setPageWidth,
  };
}

/** Right-dock panes for one (possibly draft) thread, persisted like the thread page's. */
export function usePersistedRightDockState(threadId: string) {
  const [state, setState] = useState<RightDockThreadState>(() =>
    readRightDockThreadState(threadId),
  );
  const update = useCallback(
    (transform: (current: RightDockThreadState) => RightDockThreadState) => {
      setState((current) => {
        const next = transform(current);
        if (next !== current) storeRightDockThreadState(threadId, next);
        return next;
      });
    },
    [threadId],
  );
  return [state, update] as const;
}
