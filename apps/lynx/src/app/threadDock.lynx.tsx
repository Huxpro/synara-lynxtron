// Shared thread-surface dock pieces: the header diff toggle, its working-tree
// totals, and the right-dock/main-column width split. The thread page and the
// new-thread landing (the web's draft thread) both use them.

import panelRightCloseSvg from "@synara-central-icons/sidebar-hidden-right-wide.svg?raw";
import { useCallback, useState } from "@lynx-js/react";
import { useQuery } from "@tanstack/react-query";
import { RIGHT_DOCK_MIN_WIDTH_PX, type RightDockThreadState } from "@synara/shared/rightDock";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";
import { clampSidebarWidth } from "@synara-web/components/sidebarResize.logic";
import { VIEWPORT_BREAKPOINTS } from "@synara-web/responsiveLayout.logic";

import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { fetchGitBranches, fetchWorkingTreeDiff } from "../data/synaraClient.lynx";
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

/** Working-tree totals for the header diff toggle, polled while the dock is closed. */
export function useWorkspaceHeaderDiff(input: {
  readonly workspaceRoot: string | null;
  readonly diffOpen: boolean;
  readonly initialData?: { readonly isGitRepo: boolean; readonly patch: string } | undefined;
}): WorkspaceHeaderDiff {
  const state = useQuery({
    queryKey: ["thread-header-git-state", input.workspaceRoot],
    queryFn: async () => {
      "background only";
      const workspaceRoot = input.workspaceRoot;
      if (!workspaceRoot) return { isGitRepo: false, patch: "" };
      const branches = await fetchGitBranches(workspaceRoot);
      if (!branches.isRepo) return { isGitRepo: false, patch: "" };
      const diff = await fetchWorkingTreeDiff(workspaceRoot);
      return { isGitRepo: true, patch: diff.patch };
    },
    enabled: Boolean(input.workspaceRoot),
    initialData: input.initialData,
    refetchInterval: input.diffOpen ? false : 2_000,
  });
  const view = buildPullRequestCodeView(
    state.data?.patch,
    `thread-header:${input.workspaceRoot ?? "none"}`,
  );
  return {
    isPending: state.isPending,
    isGitRepo: state.data?.isGitRepo === true,
    totals:
      view.kind === "files"
        ? {
            additions: view.additions,
            deletions: view.deletions,
            hasChanges: view.additions > 0 || view.deletions > 0,
          }
        : { additions: 0, deletions: 0, hasChanges: false },
  };
}

export function ThreadDiffToggle(props: {
  readonly open: boolean;
  readonly disabled: boolean;
  readonly stats: { readonly additions: number; readonly deletions: number } | null;
  readonly onToggle: () => void;
}) {
  const { semanticIconColor } = useTheme();
  const toggle = useLynxInteractiveState({
    baseClassName: `ThreadDiffToggle${props.open ? " ThreadDiffToggle--active" : ""}${
      props.stats ? " ThreadDiffToggle--with-stats" : ""
    }`,
    accessibleLabel: "Toggle diff panel",
    disabled: props.disabled,
    accessibilityValue: props.open ? "On" : "Off",
    onActivate: props.onToggle,
  });
  return (
    <view
      className={`${toggle.className}${props.disabled ? " ui-disabled" : ""}`}
      aria-pressed={props.open}
      {...toggle.eventProps}
    >
      {props.stats ? (
        <view className="ThreadDiffToggleStats">
          <text className="ThreadDiffToggleAddition">+{props.stats.additions}</text>
          <text className="ThreadDiffToggleDeletion">-{props.stats.deletions}</text>
        </view>
      ) : null}
      <svg
        className="ThreadDiffToggleIcon"
        content={colorizeLynxSvg(
          panelRightCloseSvg,
          props.open ? semanticIconColor("primary") : semanticIconColor("secondary"),
        )}
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
