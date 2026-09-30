import { useLatestProjectStore } from "@synara-web/latestProjectStore";
import {
  resolveCurrentProjectTargetId,
  resolveLatestProjectTargetIdWithFallback,
  resolveNewThreadTarget,
} from "@synara-web/lib/projectShortcutTargets";
import { useCallback, useEffect, useMemo, useRef, useState, type ReactNode } from "@lynx-js/react";
import { getRectByRef } from "@lynx-js/lynx-ui";
import type { NodesRef } from "@lynx-js/types";
import {
  buildProjectContextMenuItems,
  buildSpaceContextMenuItems,
  buildThreadContextMenuItems,
  type ThreadContextMenuActionId,
} from "@synara/shared/contextMenu";
import {
  PROVIDER_DISPLAY_NAMES,
  type OrchestrationSpaceShell,
  type ProjectId,
  type ProviderKind,
  type SpaceIconName,
  type SpaceId,
} from "@synara/contracts";
import { useQuery } from "@tanstack/react-query";
import forkSvg from "@synara-central-icons/fork.svg?raw";
import terminalSvg from "@synara-central-icons/console.svg?raw";
import worktreeSvg from "@synara-central-icons/arrow-split-right.svg?raw";

import { SidebarPrimarySurfaceNavigation } from "@synara-web/components/SidebarPrimarySurfaceNavigation";
import { resolvePullRequestReviewBadge } from "@synara-web/components/SidebarActionBadges.logic";
import { resolveSidebarPrimarySurface } from "@synara-web/components/SidebarSurface.logic";
import { resolveSidebarSurfacePickerViews } from "@synara-web/components/SidebarSurfacePicker.logic";
import { SidebarProjectDisclosure } from "@synara-web/components/SidebarProjectDisclosure";
import { SidebarProjectSummary } from "@synara-web/components/SidebarProjectSummary";
import { SidebarThreadRowComposition } from "@synara-web/components/SidebarThreadRowComposition";
import { shouldShowSidebarThreadProviderIdentity } from "@synara-web/components/SidebarThreadProviderIdentity";
import { resolveSidebarThreadMetaDescriptors } from "@synara-web/components/SidebarThreadMetaModel.logic";
import { SidebarThreadTrailingCluster } from "@synara-web/components/SidebarThreadTrailingCluster";
import {
  resolveSidebarProjectStatus,
  resolveSidebarStatusPresentation,
} from "@synara-web/components/SidebarStatus.logic";
import { resolveSidebarProjectsSectionState } from "@synara-web/components/SidebarProjectsState.logic";
import { resolveSidebarThreadRowModel } from "@synara-web/components/SidebarThreadRowModel.logic";
import {
  findDeepestWorkspaceRootMatch,
  resolveThreadHoverCardMetadata,
} from "@synara-web/components/Sidebar.logic";
import { getFallbackThreadIdAfterDelete } from "@synara-web/components/SidebarThreadSort.logic";
import { sortThreadsForSidebar } from "@synara-web/components/SidebarThreadSort.logic";
import { useSpacesUiStore } from "@synara-web/spacesUiStore";
import { deriveSpaceActivityById, type SpaceActivityTone } from "@synara/shared/spaceActivity";
import {
  projectRemoveConfirmation,
  deriveProjectThreadArchivePlan,
  projectThreadArchiveConfirmation,
  projectThreadArchiveResultMessage,
  projectThreadDeleteConfirmation,
} from "@synara/shared/projectThreadArchive";
import { firstLocalServerUrl, localServerMatchesRun } from "@synara/shared/localServers";
import { newCommandId, newSpaceId, newThreadId } from "@synara-web/lib/utils";
import { getDefaultModel } from "@synara/shared/model";
import { abbreviateHomePath } from "@synara-web/components/sidebarHoverCardAnchors";
import {
  SIDEBAR_THREAD_PREVIEW_LIMIT,
  SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
} from "@synara-web/components/SidebarThreadPaging.logic";
import {
  deriveSidebarChatRows,
  resolveSidebarChatListTransition,
  type SidebarChatListAction,
} from "@synara-web/components/SidebarChatRows.logic";
import {
  normalizeSidebarProjectThreadListCwd,
  pruneProjectThreadListPagingForCollapsedProjects,
} from "@synara-web/components/SidebarProjectPaging.logic";
import { deriveSidebarProjectRows } from "@synara-web/components/SidebarProjectRows.logic";
import { SidebarChatsSection } from "@synara-web/components/SidebarChatsSection";
import { SidebarProjectsSection } from "@synara-web/components/SidebarProjectsSection";
import { SidebarStudioSection } from "@synara-web/components/SidebarStudioSection";
import { SidebarPinnedSection } from "@synara-web/components/SidebarPinnedSection";
import { SidebarFooterSection } from "@synara-web/components/SidebarFooterSection";
import { SidebarSurfaceContent } from "@synara-web/components/SidebarSurfaceContent";
import { SidebarDesktopHeader } from "@synara-web/components/SidebarDesktopHeader";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsBehaviorProjection,
  readSettingsGeneralProjection,
  writeSidebarSortProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import {
  type SidebarProjectSortOrderValue,
  type SidebarThreadSortOrderValue,
} from "@synara-web/sidebarSortDefaults";
import { useStore } from "@synara-web/store";
import { dockTerminalThreadId } from "@synara-web/lib/dockTerminalScope";
import { pinActionLabel } from "@synara-web/lib/pin.logic";
import { requestOpenThreadPathInTerminal } from "../../app/threadTerminalIntent.lynx";
import {
  flushTerminalStatePersistence,
  useTerminalStateStore,
} from "@synara-web/terminalStateStore";
import {
  selectPrimaryProjectRunCommand,
  upsertProjectRunCommandScripts,
} from "@synara-web/projectRunTargets";
import { projectScriptRuntimeEnv } from "@synara-web/projectScripts";
import {
  SidebarChatNewElement,
  SidebarChatSortElement,
  SidebarListSectionHeaderAddProjectElement,
  SidebarListSectionHeaderSortElement,
  SidebarListSectionHeaderToggleProjectsElement,
} from "~/components/SidebarListSectionHeaderElements";
import { SIDEBAR_CHAT_SECTION_DEFAULT_EXPANDED } from "@synara-web/components/SidebarDefaults.logic";
import {
  collectVisibleSidebarThreadIds,
  getNextVisibleSidebarThreadId,
} from "@synara-web/components/SidebarThreadNavigation.logic";
import {
  fetchPullRequests,
  fetchSidebarSnapshot,
  fetchThreadHeaderSummary,
  invalidateSidebarSnapshotProjectionCache,
  queryClient,
  type ThreadSummary,
} from "../../app/queries";
import {
  ArchiveIcon,
  ClockIcon,
  ChevronDownIcon,
  FolderIcon,
  FolderOpenIcon,
  GitBranchIcon,
  PlusIcon,
  SettingsIcon,
} from "../../lib/icons";
import { colorizeLynxSvg } from "../../lib/themedSvg.lynx";
import { useTheme } from "../../adapters/useTheme.lynx";
import { useComposerDraftStore } from "../../adapters/composerDraftStore.lynx";
import { Button } from "../ui/button";
import { MenuOverlayPortal } from "../ui/menu.lynx";
import { useLynxInteractiveState } from "../ui/interactive-state.lynx";
import { lynxNestedInteractiveEventProps } from "../ui/interactive-state.lynx";
import {
  countUniqueViewerReviewRequests,
  deriveSidebarSections,
  resolveNativeSidebarSpaceId,
} from "./sidebar.logic";
import { SpaceSwitcherLynx } from "./SpaceSwitcher.lynx";
import { SpaceEditorDialogLynx } from "./SpaceEditorDialog.lynx";
import { SpaceProjectPickerDialogLynx } from "./SpaceProjectPickerDialog.lynx";
import { ProjectRenameDialogLynx } from "./ProjectRenameDialog.lynx";
import { ThreadRenameDialogLynx } from "./ThreadRenameDialog.lynx";
import { ProjectRunDialogLynx } from "./ProjectRunDialog.lynx";
import {
  buildNativeSpaceDeleteCommand,
  buildNativeSpaceCreateCommand,
  buildNativeProjectMoveCommand,
  buildNativeSpaceUpdateCommand,
  assignNativeProjectsToSpace,
  archiveNativeProjectThreads,
  createNativeSpaceWithOptionalProjectMove,
  nativeSpaceDeleteConfirmation,
} from "./spaceContextActions.logic";
import { LYNX_PRIMARY_SHORTCUT_LABELS } from "./sidebarShortcuts";
import { focusLynxNode } from "../ui/focus.lynx";
import { webStorage } from "../../platform/storage";
import { clipboard } from "../../platform/clipboard";
import { platformWindow } from "../../platform/window";
import { platformTerminal } from "../../platform/terminal";
import { sleepOnHost } from "../../platform/timer";
import { removeRightDockThreadState } from "../../app/rightDockState.lynx";
import {
  buildNativeThreadContextCommand,
  nativeThreadContextConfirmation,
  resolveSecondaryPointerOffset,
} from "./threadContextActions.logic";
import {
  createNativeThreadHandoff,
  fetchNativeThreadHandoffProviderContext,
  resolveNativeThreadHandoffTargets,
} from "../../app/threadHandoff.lynx";
import { deleteNativeProjectThreads, removeNativeProject } from "./projectDeletion.lynx.logic";
import "./sidebar.css";
import { PullRequestCompareIcon } from "./PullRequestCompareIcon.lynx";
import { SidebarProjectHoverCard, SidebarThreadHoverCard } from "./SidebarHoverCards.lynx";
import { LYNX_SIDEBAR_PRIMARY_ICONS } from "./SidebarPrimaryIcons.lynx";
import { SidebarSurfaceHeader } from "./SidebarSurfaceHeader.lynx";
import pinSvg from "@synara-central-icons/pin.svg?raw";
import pinFilledSvg from "@synara-central-icons-fill/pin.svg?raw";

const SEARCH_TRIGGER_ELEMENT_ID = "synara-sidebar-search-trigger";
const ADD_PROJECT_TRIGGER_ELEMENT_ID = "synara-sidebar-add-project-trigger";

interface PersistedSidebarListState {
  readonly expanded: boolean;
  readonly chatExtraPages: number;
  readonly projectExtraPagesByCwd: Readonly<Record<string, number>>;
  readonly expandedProjectCwds: readonly string[];
  readonly pinnedThreadIds: readonly string[];
  readonly pinnedProjectIds: readonly string[];
}

export function SidebarNavigationRow(props: {
  readonly actions?: ReactNode;
  readonly children?: ReactNode;
  readonly className: string;
  readonly active?: boolean;
  readonly expanded?: boolean;
  readonly hoverCard?: ReactNode;
  readonly label: string;
  readonly projectId?: string;
  readonly threadId?: string;
  readonly onActivate: () => void;
  readonly onContextMenu?: (
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) => void;
}) {
  const rowRef = useRef<NodesRef>(null);
  const [previewVisible, setPreviewVisible] = useState(false);
  const [hoverCardPosition, setHoverCardPosition] = useState<{
    readonly left: number;
    readonly top: number;
  } | null>(null);
  const interaction = useLynxInteractiveState({
    baseClassName: props.className,
    accessibleLabel: props.label,
    accessibilityValue:
      props.expanded === undefined ? undefined : props.expanded ? "Expanded" : "Collapsed",
    onActivate: props.onActivate,
    onIntent: props.hoverCard
      ? () => {
          "background only";
          void getRectByRef(rowRef, true)
            .then((rect) =>
              setHoverCardPosition({
                left: rect.right + 8,
                top: rect.top,
              }),
            )
            .catch(() => setHoverCardPosition(null));
        }
      : undefined,
  });
  return (
    <>
      <view
        ref={rowRef}
        data-project-id={props.projectId}
        data-thread-id={props.threadId}
        data-active={props.active}
        className={interaction.className}
        aria-label={props.label}
        aria-expanded={props.expanded}
        {...interaction.eventProps}
        bindmouseenter={() => {
          interaction.eventProps.bindmouseenter?.();
          setPreviewVisible(true);
        }}
        bindmouseleave={() => {
          interaction.eventProps.bindmouseleave?.();
          setPreviewVisible(false);
        }}
        bindfocus={() => {
          interaction.eventProps.bindfocus?.();
          setPreviewVisible(true);
        }}
        bindblur={() => {
          interaction.eventProps.bindblur?.();
          setPreviewVisible(false);
        }}
        bindmousedown={(event: {
          readonly button?: number;
          readonly x?: number;
          readonly y?: number;
        }) => {
          interaction.eventProps.bindmousedown?.();
          const offset = resolveSecondaryPointerOffset(event);
          if (!offset || !props.onContextMenu) return;
          void getRectByRef(rowRef, true)
            .then(async (rect) => {
              // Let the triggering secondary-button release finish before
              // AppKit places the first native menu item under that pointer.
              await sleepOnHost(50);
              props.onContextMenu?.(
                {
                  x: rect.left + offset.x,
                  y: rect.top + offset.y,
                },
                () => focusLynxNode(rowRef),
              );
            })
            .catch(() => {
              // A context menu with invented coordinates is worse than no menu.
            });
        }}
      >
        {props.children}
        {props.actions ? <view className="AppSidebarRowHoverActions">{props.actions}</view> : null}
      </view>
      {props.hoverCard && previewVisible && hoverCardPosition ? (
        <MenuOverlayPortal>
          <view
            className="AppSidebarRowHoverCard"
            style={{
              left: `${hoverCardPosition.left}px`,
              top: `${hoverCardPosition.top}px`,
            }}
          >
            {props.hoverCard}
          </view>
        </MenuOverlayPortal>
      ) : null}
    </>
  );
}

export function SidebarHoverAction(props: {
  readonly label: string;
  readonly onActivate: () => void;
  readonly children: ReactNode;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: "AppSidebarHoverAction",
    accessibleLabel: props.label,
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      {...lynxNestedInteractiveEventProps(interaction.eventProps)}
    >
      {props.children}
    </view>
  );
}

function ProjectRunIndicatorDot() {
  return (
    <view
      className="AppSidebarProjectRunDot"
      accessibility-element={true}
      accessibility-label="Dev server running"
    />
  );
}

export function ProjectPinAction(props: {
  readonly pinned: boolean;
  readonly projectName: string;
  readonly onActivate: () => void;
}) {
  const { svgColors } = useTheme();
  const interaction = useLynxInteractiveState({
    baseClassName: "AppSidebarProjectPin" + (props.pinned ? " AppSidebarProjectPin--pinned" : ""),
    accessibleLabel: pinActionLabel(props.projectName, props.pinned),
    accessibilityValue: props.pinned ? "Pinned" : "Not pinned",
    onActivate: props.onActivate,
  });
  return (
    <view
      className={interaction.className}
      {...lynxNestedInteractiveEventProps(interaction.eventProps)}
    >
      <svg
        className="AppSidebarProjectPinIcon"
        content={colorizeLynxSvg(props.pinned ? pinFilledSvg : pinSvg, svgColors.iconSecondary)}
      />
    </view>
  );
}

function SidebarThreadTrailing({ thread }: { readonly thread: ThreadSummary }) {
  const { resolvedTheme, semanticIconColor } = useTheme();
  const providerShown =
    shouldShowSidebarThreadProviderIdentity(thread.title) && Boolean(thread.provider);
  const descriptors = resolveSidebarThreadMetaDescriptors({
    forkSourceThreadId: thread.forkSourceThreadId,
    sidechatSourceThreadId: thread.sidechatSourceThreadId,
    handoffBadgeLabel: thread.handoffSourceProvider
      ? `${thread.handoffSourceProvider} handoff`
      : null,
    handoffShownInAvatar: providerShown && Boolean(thread.handoffSourceProvider),
  });
  const status =
    thread.status ??
    resolveSidebarStatusPresentation({
      working: thread.live,
      connecting: thread.sessionStatus === "connecting",
    });

  if (descriptors.length === 0 && !status) return null;
  return (
    <SidebarThreadTrailingCluster
      metaContent={
        descriptors.length > 0
          ? descriptors.map((descriptor) => (
              <view
                key={descriptor.id}
                aria-label={descriptor.tooltip}
                className={`AppSidebarThreadMeta AppSidebarThreadMeta--${descriptor.id}`}
              >
                {descriptor.id === "fork" ? (
                  <svg
                    className="AppSidebarThreadMetaIcon"
                    content={colorizeLynxSvg(
                      forkSvg,
                      resolvedTheme === "dark" ? "#6ee7b7" : "#059669",
                    )}
                  />
                ) : descriptor.id === "handoff" ? (
                  <GitBranchIcon size={12} />
                ) : descriptor.id === "worktree" ? (
                  <svg
                    className="AppSidebarThreadMetaIcon"
                    content={colorizeLynxSvg(worktreeSvg, semanticIconColor("secondary"))}
                  />
                ) : (
                  <ClockIcon size={12} />
                )}
              </view>
            ))
          : null
      }
      status={status}
    />
  );
}

async function readPersistedSidebarListState(): Promise<PersistedSidebarListState> {
  "background only";
  const { hydrateStorage } = await import(/* webpackMode: "eager" */ "../../platform/storage");
  await hydrateStorage();
  const { readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  const { readPersistedProjectExpansionState } = await import(
    /* webpackMode: "eager" */ "@synara-web/storePersistence"
  );
  const { usePinnedThreadsStore } = await import(
    /* webpackMode: "eager" */ "@synara-web/pinnedThreadsStore"
  );
  const { usePinnedProjectsStore } = await import(
    /* webpackMode: "eager" */ "@synara-web/pinnedProjectsStore"
  );
  await usePinnedThreadsStore.persist.rehydrate();
  await usePinnedProjectsStore.persist.rehydrate();
  const state = readSidebarUiState();
  return {
    expanded: state.chatSectionExpanded,
    chatExtraPages: state.chatThreadListExtraPages,
    projectExtraPagesByCwd: state.projectThreadListExtraPagesByCwd,
    expandedProjectCwds: readPersistedProjectExpansionState().expandedProjectCwds,
    pinnedThreadIds: usePinnedThreadsStore.getState().pinnedThreadIds,
    pinnedProjectIds: usePinnedProjectsStore.getState().pinnedProjectIds,
  };
}

async function persistSidebarListState(state: PersistedSidebarListState): Promise<void> {
  "background only";
  const { persistSidebarUiState, readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  persistSidebarUiState({
    ...readSidebarUiState(),
    chatSectionExpanded: state.expanded,
    chatThreadListExtraPages: state.chatExtraPages,
    projectThreadListExtraPagesByCwd: { ...state.projectExtraPagesByCwd },
  });
}

async function persistProjectDisclosureState(
  projects: ReadonlyArray<{ readonly cwd: string; readonly expanded: boolean }>,
): Promise<void> {
  "background only";
  const { persistProjectExpansionState } = await import(
    /* webpackMode: "eager" */ "@synara-web/storePersistence"
  );
  persistProjectExpansionState(projects);
}

export function Sidebar({
  activeThreadId,
  draftProjectId = null,
  activePath,
  navigate,
  searchOpen,
  onOpenSearch,
  titlebarControls,
}: {
  readonly activeThreadId: string | null;
  // Project of the new-thread (draft) route, which the web also treats as focused.
  readonly draftProjectId?: string | null;
  readonly activePath: string;
  readonly navigate: (to: string) => void;
  readonly searchOpen: boolean;
  readonly onOpenSearch: (initialQuery?: string, returnFocusElementId?: string) => void;
  readonly titlebarControls?: ReactNode;
}) {
  const { semanticIconColor } = useTheme();
  const sidebarSecondaryIconColor = semanticIconColor("secondary");
  const initialSortSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const { data, error, isPending } = useQuery({
    queryKey: ["sidebar-snapshot", "navigation"],
    queryFn: fetchSidebarSnapshot,
    refetchInterval: 5_000,
  });
  const serverConfigQuery = useQuery({
    queryKey: ["sidebar-server-config"],
    queryFn: async () => {
      "background only";
      const { fetchServerConfig } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      return fetchServerConfig();
    },
  });
  const projectDevServersQuery = useQuery({
    queryKey: ["project-dev-servers"],
    queryFn: async () => {
      "background only";
      const { fetchProjectDevServers } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      return fetchProjectDevServers();
    },
    refetchInterval: 5_000,
  });
  const localServersQuery = useQuery({
    queryKey: ["sidebar-local-servers-native"],
    queryFn: async () => {
      "background only";
      const { fetchLocalServers } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      return fetchLocalServers();
    },
    enabled: (data?.projects.length ?? 0) > 0,
    refetchInterval: (data?.projects.length ?? 0) > 0 ? 5_000 : false,
  });
  const projectRunServerByProjectId = useMemo(() => {
    const projects = (data?.projects ?? []).filter((project) => project.kind === "project");
    const servers = localServersQuery.data?.servers ?? [];
    const result = new Map<string, (typeof servers)[number]>();
    for (const run of projectDevServersQuery.data?.servers ?? []) {
      const server = servers.find((candidate) => localServerMatchesRun(candidate, run));
      if (server) result.set(run.projectId, server);
    }
    for (const server of servers) {
      if (!server.cwd) continue;
      const project = findDeepestWorkspaceRootMatch(
        projects,
        server.cwd,
        (candidate) => candidate.workspaceRoot,
      );
      if (project && !result.has(project.id)) result.set(project.id, server);
    }
    return result;
  }, [data?.projects, localServersQuery.data?.servers, projectDevServersQuery.data?.servers]);
  const { data: pullRequests } = useQuery({
    queryKey: ["pull-requests", "sidebar-review-count"],
    queryFn: () =>
      fetchPullRequests({
        state: "open",
        projectId: null,
      }),
    refetchInterval: 30_000,
  });
  const pullRequestsReviewBadge = resolvePullRequestReviewBadge(
    pullRequests
      ? {
          count: countUniqueViewerReviewRequests(pullRequests.entries),
          incomplete: false,
        }
      : undefined,
  );
  const primarySidebarSurface = resolveSidebarPrimarySurface({
    isOnStudio: activePath === "/studio",
  });
  const chatsSectionVisible = initialSortSettings.showChatsSection;
  const studioSectionVisible = initialSortSettings.showStudioSection;
  const storedActiveSpaceId = useSpacesUiStore((state) => state.activeSpaceId);
  const setActiveSpaceId = useSpacesUiStore((state) => state.setActiveSpaceId);
  const rememberSpaceThread = useSpacesUiStore((state) => state.rememberThread);
  const setLatestProjectId = useLatestProjectStore((state) => state.setLatestProjectId);
  const getLastSpaceThreadId = useSpacesUiStore((state) => state.getLastThreadId);
  const activeSpaceId = resolveNativeSidebarSpaceId({
    activeThreadId,
    projects: data?.projects ?? [],
    spaces: data?.spaces ?? [],
    storedActiveSpaceId,
    threads: data?.threads ?? [],
  });
  useEffect(() => {
    if (!activeThreadId || !data) return;
    const activeThread = data.threads.find((thread) => thread.id === activeThreadId);
    const activeProject = activeThread
      ? data.projects.find((project) => project.id === activeThread.projectId)
      : null;
    if (!activeProject || activeProject.kind !== "project") return;
    setLatestProjectId(activeProject.id as never);
    const routeSpaceId = activeProject.spaceId ?? null;
    rememberSpaceThread(routeSpaceId, activeThreadId as never);
    if (routeSpaceId !== storedActiveSpaceId) setActiveSpaceId(routeSpaceId);
  }, [
    activeThreadId,
    data,
    rememberSpaceThread,
    setActiveSpaceId,
    setLatestProjectId,
    storedActiveSpaceId,
  ]);
  // Like the web sidebar: New thread opens in the focused project, else the latest
  // one used, else this Space's most recently updated project.
  const latestProjectId = useLatestProjectStore((state) => state.latestProjectId);
  const openPrimaryNewThread = () => {
    const spaceProjects = (data?.projects ?? []).filter(
      (project) => (project.spaceId ?? null) === activeSpaceId,
    );
    const focusedProjectId =
      data?.threads.find((thread) => thread.id === activeThreadId)?.projectId ?? null;
    const target = resolveNewThreadTarget({
      currentProjectId: resolveCurrentProjectTargetId(spaceProjects, focusedProjectId as never),
      latestUsableProjectId: resolveLatestProjectTargetIdWithFallback(
        spaceProjects,
        latestProjectId,
      ),
    });
    navigate(target ? `/new-thread/${encodeURIComponent(target.projectId)}` : "/");
  };
  const [persistedPinnedThreadIds, setPersistedPinnedThreadIds] = useState<readonly string[]>([]);
  const [persistedPinnedProjectIds, setPersistedPinnedProjectIds] = useState<readonly string[]>([]);
  const [projectSortOrder, setProjectSortOrder] = useState<SidebarProjectSortOrderValue>(
    initialSortSettings.sidebarProjectSortOrder,
  );
  const [threadSortOrder, setThreadSortOrder] = useState<SidebarThreadSortOrderValue>(
    initialSortSettings.sidebarThreadSortOrder,
  );
  const sections = useMemo(
    () =>
      deriveSidebarSections({
        projects: data?.projects ?? [],
        threads: data?.threads ?? [],
        persistedPinnedThreadIds,
        persistedPinnedProjectIds,
        projectSortOrder,
        threadSortOrder,
        activeSpaceId,
      }),
    [
      data,
      activeSpaceId,
      persistedPinnedProjectIds,
      persistedPinnedThreadIds,
      projectSortOrder,
      threadSortOrder,
    ],
  );
  const spaceActivityById = useMemo(
    () =>
      deriveSpaceActivityById({
        projects: data?.projects.filter((project) => project.kind === "project") ?? [],
        threads: data?.threads ?? [],
        resolveTone: (thread): SpaceActivityTone | null => {
          const status =
            thread.status ??
            resolveSidebarStatusPresentation({
              working: thread.live,
              connecting: thread.sessionStatus === "connecting",
            });
          if (!status) return null;
          return status.label === "Working" || status.label === "Connecting"
            ? "running"
            : status.label === "Completed"
              ? "completed"
              : "attention";
        },
      }),
    [data],
  );
  const activeSpace =
    activeSpaceId === null
      ? null
      : (data?.spaces.find((space) => space.id === activeSpaceId) ?? null);
  const ordinaryProjects = data?.projects.filter((project) => project.kind === "project") ?? [];
  const hasProjectsElsewhere = ordinaryProjects.some(
    (project) => (project.spaceId ?? null) !== activeSpaceId,
  );
  const [expandedProjectCwds, setExpandedProjectCwds] = useState<ReadonlySet<string> | null>(null);
  // Match the authoritative Web Sidebar.uiState default; persistence moves with
  // the shared controller boundary rather than inventing a second default here.
  const [chatsExpanded, setChatsExpanded] = useState(SIDEBAR_CHAT_SECTION_DEFAULT_EXPANDED);
  const [chatExtraPages, setChatExtraPages] = useState(0);
  const [projectExtraPagesByCwd, setProjectExtraPagesByCwd] = useState<
    Readonly<Record<string, number>>
  >({});
  const [editingSpace, setEditingSpace] = useState<OrchestrationSpaceShell | null>(null);
  const [spaceEditorMode, setSpaceEditorMode] = useState<"create" | "edit" | null>(null);
  const [projectIdAfterSpaceCreate, setProjectIdAfterSpaceCreate] = useState<ProjectId | null>(
    null,
  );
  const [renameProjectId, setRenameProjectId] = useState<ProjectId | null>(null);
  const [renameThreadId, setRenameThreadId] = useState<string | null>(null);
  const [runProjectState, setRunProjectState] = useState<{
    readonly command: string;
    readonly cwd: string;
    readonly loading: boolean;
    readonly projectId: ProjectId;
  } | null>(null);
  const [spaceProjectPickerTarget, setSpaceProjectPickerTarget] = useState<{
    readonly id: SpaceId;
    readonly name: string;
    readonly icon: SpaceIconName;
  } | null>(null);
  const [spaceActionError, setSpaceActionError] = useState<string | null>(null);
  const persistSidebarSortOrders = useCallback(
    (
      nextProjectSortOrder: SidebarProjectSortOrderValue,
      nextThreadSortOrder: SidebarThreadSortOrderValue,
    ) => {
      "background only";
      setProjectSortOrder(nextProjectSortOrder);
      setThreadSortOrder(nextThreadSortOrder);
      void import(/* webpackMode: "eager" */ "../../platform/storage")
        .then(({ setPersistedStorageItem, webStorage: storage }) =>
          setPersistedStorageItem(
            APP_SETTINGS_STORAGE_KEY,
            writeSidebarSortProjection(storage.getItem(APP_SETTINGS_STORAGE_KEY), {
              sidebarProjectSortOrder: nextProjectSortOrder,
              sidebarThreadSortOrder: nextThreadSortOrder,
            }),
          ),
        )
        .catch(() => {
          // Keep the immediate sort selection. Settings hydration owns
          // durable storage failure and retry presentation.
        });
    },
    [],
  );
  useEffect(() => {
    "background only";
    return () => {
      void import(/* webpackMode: "eager" */ "../../platform/bridge")
        .then(({ bridgeCall }) => bridgeCall("shellSetSearchNavigationEnabled", { enabled: false }))
        .catch(() => {});
    };
  }, []);

  async function openThreadContextMenu(
    thread: ThreadSummary,
    workspaceRoot: string,
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) {
    "background only";
    const isPinned = thread.isPinned === true || persistedPinnedThreadIds.includes(thread.id);
    const { showContextMenu } = await import(
      /* webpackMode: "eager" */ "../../platform/contextMenu"
    );
    const [detail, handoffProviders] = await Promise.all([
      fetchThreadHeaderSummary(thread.id),
      fetchNativeThreadHandoffProviderContext().catch(() => null),
    ]);
    const handoffTargets = handoffProviders
      ? resolveNativeThreadHandoffTargets(detail, handoffProviders)
      : [];
    const action = (await showContextMenu(
      buildThreadContextMenuItems({
        isPinned,
        middleItems: handoffTargets.map((provider, index) => ({
          id: "handoff:" + provider,
          label: "Handoff to " + PROVIDER_DISPLAY_NAMES[provider],
          separatorBefore: index === 0,
        })),
        copyPathAvailable: workspaceRoot.length > 0,
        openPathInTerminalAvailable: workspaceRoot.length > 0,
        archiveAvailable: !thread.live,
        deleteAvailable: !thread.live,
      }),
      position,
      { restoreFocus },
    )) as string | null;
    if (!action) return;
    if (action === "rename") {
      setRenameThreadId(thread.id);
      return;
    }
    if (action === "mark-unread") {
      useStore.getState().markThreadUnread(thread.id as never);
      return;
    }
    if (action.startsWith("handoff:")) {
      const targetProvider = action.slice("handoff:".length) as ProviderKind;
      const project = data?.projects.find((candidate) => candidate.id === thread.projectId);
      if (!detail || !project || !handoffTargets.includes(targetProvider)) return;
      try {
        const nextThreadId = await createNativeThreadHandoff({
          project,
          targetProvider,
          thread: detail,
        });
        navigate("/thread/" + nextThreadId);
      } catch (cause) {
        setSpaceActionError(cause instanceof Error ? cause.message : "Could not hand off thread.");
      }
      return;
    }
    if (action === "open-path-in-terminal") {
      requestOpenThreadPathInTerminal({ threadId: thread.id, cwd: workspaceRoot });
      navigate("/thread/" + thread.id);
      return;
    }
    await performThreadAction(thread, workspaceRoot, action);
  }

  async function cleanupDeletedThreadState(threadId: import("@synara/contracts").ThreadId) {
    "background only";
    useComposerDraftStore.getState().discardDraft(threadId);
    const terminals = useTerminalStateStore.getState();
    terminals.removeTerminalState(threadId);
    terminals.removeTerminalState(dockTerminalThreadId(threadId));
    removeRightDockThreadState(threadId);
    const { usePinnedThreadsStore } = await import(
      /* webpackMode: "eager" */ "@synara-web/pinnedThreadsStore"
    );
    usePinnedThreadsStore.getState().unpinThread(threadId);
    setPersistedPinnedThreadIds(usePinnedThreadsStore.getState().pinnedThreadIds);
  }

  async function performThreadAction(
    thread: ThreadSummary,
    workspaceRoot: string,
    action: ThreadContextMenuActionId,
  ) {
    "background only";
    const isPinned = thread.isPinned === true || persistedPinnedThreadIds.includes(thread.id);
    if (action === "copy-path" || action === "copy-thread-id") {
      const { clipboard } = await import(/* webpackMode: "eager" */ "../../platform/clipboard");
      await clipboard.writeText(action === "copy-path" ? workspaceRoot : thread.id);
      return;
    }

    const behaviorSettings = readSettingsBehaviorProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    );
    const confirmation = nativeThreadContextConfirmation(action, thread.title, behaviorSettings);
    if (confirmation) {
      const { dialogs } = await import(/* webpackMode: "eager" */ "../../platform/dialogs");
      if (!(await dialogs.confirm(confirmation))) return;
    }

    if (action === "delete") {
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      const deletion = await deleteNativeProjectThreads({
        threads: [thread],
        dispatch: dispatchSynaraCommand,
        closeTerminalHistory: async (threadId) => {
          await platformTerminal.close({ threadId, deleteHistory: true }).catch(() => undefined);
          await platformTerminal
            .close({
              threadId: dockTerminalThreadId(threadId),
              deleteHistory: true,
            })
            .catch(() => undefined);
        },
        cleanupThreadState: cleanupDeletedThreadState,
      });
      flushTerminalStatePersistence();
      if (deletion.failureCount > 0) {
        setSpaceActionError('Could not delete thread "' + thread.title + '".');
        return;
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["threads"] }),
      ]);
      if (activeThreadId === thread.id) {
        const fallbackThreadId = getFallbackThreadIdAfterDelete({
          threads: data?.threads ?? [],
          deletedThreadId: thread.id,
          sortOrder: threadSortOrder,
        });
        navigate(fallbackThreadId ? `/thread/${fallbackThreadId}` : "/");
      }
      return;
    }

    const command = buildNativeThreadContextCommand({
      action,
      commandId: `lynx-command-${Date.now()}-${Math.random().toString(16).slice(2)}`,
      isPinned,
      threadId: thread.id,
    });
    if (!command) return;
    const { dispatchSynaraCommand } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    await dispatchSynaraCommand(command);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["threads"] }),
    ]);

    if (action === "toggle-pin") {
      const { usePinnedThreadsStore } = await import(
        /* webpackMode: "eager" */ "@synara-web/pinnedThreadsStore"
      );
      if (isPinned) {
        usePinnedThreadsStore.getState().unpinThread(thread.id as never);
      } else {
        usePinnedThreadsStore.getState().pinThread(thread.id as never);
      }
      setPersistedPinnedThreadIds(usePinnedThreadsStore.getState().pinnedThreadIds);
    } else if (activeThreadId === thread.id) {
      const fallbackThreadId = getFallbackThreadIdAfterDelete({
        threads: data?.threads ?? [],
        deletedThreadId: thread.id,
        sortOrder: threadSortOrder,
      });
      navigate(fallbackThreadId ? `/thread/${fallbackThreadId}` : "/");
    }
  }

  async function toggleProjectPinned(project: {
    readonly id: string;
    readonly isPinned?: boolean;
  }) {
    "background only";
    const isPinned = project.isPinned === true || persistedPinnedProjectIds.includes(project.id);
    const { dispatchSynaraCommand } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    await dispatchSynaraCommand({
      type: "project.meta.update",
      commandId: `lynx-command-${Date.now()}-${Math.random().toString(16).slice(2)}` as never,
      projectId: project.id as never,
      isPinned: !isPinned,
    });
    await queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
    const { usePinnedProjectsStore } = await import(
      /* webpackMode: "eager" */ "@synara-web/pinnedProjectsStore"
    );
    if (isPinned) {
      usePinnedProjectsStore.getState().unpinProject(project.id as never);
    } else {
      usePinnedProjectsStore.getState().pinProject(project.id as never);
    }
    setPersistedPinnedProjectIds(usePinnedProjectsStore.getState().pinnedProjectIds);
  }

  async function openProjectContextMenu(
    project: {
      readonly id: string;
      readonly isPinned?: boolean;
      readonly spaceId?: SpaceId | null;
      readonly workspaceRoot: string;
    },
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) {
    "background only";
    if (!project.workspaceRoot) return;
    setSpaceActionError(null);
    const isPinned = project.isPinned === true || persistedPinnedProjectIds.includes(project.id);
    const projectThreads = (data?.threads ?? []).filter(
      (thread) => thread.projectId === project.id,
    );
    const archivePlan = deriveProjectThreadArchivePlan(projectThreads);
    const projectRun =
      projectDevServersQuery.data?.servers.find((server) => server.projectId === project.id) ??
      null;
    const detectedServer = projectRunServerByProjectId.get(project.id) ?? null;
    const projectRunUrl = detectedServer ? firstLocalServerUrl(detectedServer) : null;
    try {
      const { showContextMenu } = await import(
        /* webpackMode: "eager" */ "../../platform/contextMenu"
      );
      const action = await showContextMenu(
        buildProjectContextMenuItems({
          currentSpaceId: project.spaceId ?? null,
          isRunning: projectRun !== null,
          hasOpenServer: projectRunUrl !== null,
          hasArchivableThreads: archivePlan.archivableThreadIds.length > 0,
          hasAnyThreads: projectThreads.length > 0,
          isPinned,
          spaces: (data?.spaces ?? []).map((space) => ({
            id: space.id,
            label: space.name,
          })),
        }),
        position,
        { restoreFocus },
      );
      if (action === "open-in-finder") {
        await platformWindow.showInFolder(project.workspaceRoot);
      } else if (action === "open-in-kanban") {
        navigate(`/kanban/${encodeURIComponent(project.id)}`);
      } else if (action === "copy-path") {
        await clipboard.writeText(project.workspaceRoot);
      } else if (action === "toggle-pin") {
        await toggleProjectPinned(project);
      } else if (action === "rename") {
        setRenameProjectId(project.id as ProjectId);
      } else if (action === "start-dev") {
        const projectSummary = data?.projects.find((candidate) => candidate.id === project.id);
        if (!projectSummary) return;
        const saved = selectPrimaryProjectRunCommand({
          project: {
            cwd: projectSummary.workspaceRoot,
            scripts: [...projectSummary.scripts],
          },
        });
        setRunProjectState({
          command: saved?.command ?? "",
          cwd: saved?.cwd ?? projectSummary.workspaceRoot,
          loading: saved === null,
          projectId: projectSummary.id as ProjectId,
        });
        if (!saved) {
          void import(/* webpackMode: "eager" */ "../../data/synaraClient")
            .then(({ discoverProjectScripts }) =>
              discoverProjectScripts({ cwd: projectSummary.workspaceRoot }),
            )
            .then((discovered) => {
              const target = selectPrimaryProjectRunCommand({
                project: {
                  cwd: projectSummary.workspaceRoot,
                  scripts: [...projectSummary.scripts],
                },
                discoveredTargets: discovered.targets,
              });
              setRunProjectState((current) =>
                current?.projectId === projectSummary.id
                  ? {
                      ...current,
                      command: target?.command ?? "",
                      cwd: target?.cwd ?? projectSummary.workspaceRoot,
                      loading: false,
                    }
                  : current,
              );
            })
            .catch(() => {
              setRunProjectState((current) =>
                current?.projectId === projectSummary.id ? { ...current, loading: false } : current,
              );
            });
        }
      } else if (action === "stop-dev") {
        const { stopProjectDevServer } = await import(
          /* webpackMode: "eager" */ "../../data/synaraClient"
        );
        const result = await stopProjectDevServer({
          projectId: project.id as ProjectId,
        });
        if (!result.stopped) {
          setSpaceActionError("Unable to stop the dev server.");
        }
        await Promise.all([projectDevServersQuery.refetch(), localServersQuery.refetch()]);
      } else if (action === "open-dev-server") {
        if (projectRunUrl) await platformWindow.openExternal(projectRunUrl);
      } else if (action === "new-space") {
        setEditingSpace(null);
        setProjectIdAfterSpaceCreate(project.id as ProjectId);
        setSpaceEditorMode("create");
      } else if (action === "archive-threads") {
        const confirmed = await import(/* webpackMode: "eager" */ "../../platform/dialogs").then(
          ({ dialogs }) =>
            dialogs.confirm(
              projectThreadArchiveConfirmation({
                projectName:
                  data?.projects.find((candidate) => candidate.id === project.id)?.title ??
                  "Project",
                archivableCount: archivePlan.archivableThreadIds.length,
                runningCount: archivePlan.runningCount,
              }),
            ),
        );
        if (!confirmed) return;
        const { dispatchSynaraCommand } = await import(
          /* webpackMode: "eager" */ "../../data/synaraClient"
        );
        const result = await archiveNativeProjectThreads({
          dispatch: dispatchSynaraCommand,
          threadIds:
            archivePlan.archivableThreadIds as readonly import("@synara/contracts").ThreadId[],
        });
        const resultMessage = projectThreadArchiveResultMessage({
          archivedCount: result.archivedCount,
          failureCount: result.failureCount,
          projectName:
            data?.projects.find((candidate) => candidate.id === project.id)?.title ?? "Project",
          runningCount: archivePlan.runningCount,
        });
        if (result.failureCount > 0 && resultMessage) {
          setSpaceActionError(resultMessage);
        }
        const archivedThreadIds = new Set(result.archivedThreadIds);
        if (activeThreadId && archivedThreadIds.has(activeThreadId as never)) {
          const fallbackThreadId = getFallbackThreadIdAfterDelete({
            threads: data?.threads ?? [],
            deletedThreadId: activeThreadId,
            deletedThreadIds: archivedThreadIds,
            sortOrder: threadSortOrder,
          });
          navigate(fallbackThreadId ? `/thread/${fallbackThreadId}` : "/");
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
      } else if (action === "delete-threads" || action === "delete") {
        const removalThreads =
          action === "delete"
            ? [
                ...projectThreads,
                ...(data?.archivedThreads ?? []).filter(
                  (thread) => thread.projectId === project.id,
                ),
              ]
            : projectThreads;
        const projectName =
          data?.projects.find((candidate) => candidate.id === project.id)?.title ?? "Project";
        const confirmation =
          action === "delete"
            ? projectRemoveConfirmation({
                projectName,
                threadCount: removalThreads.length,
              })
            : projectThreadDeleteConfirmation({
                projectName,
                threadCount: projectThreads.length,
              });
        const confirmed = await import(/* webpackMode: "eager" */ "../../platform/dialogs").then(
          ({ dialogs }) => dialogs.confirm(confirmation),
        );
        if (!confirmed) return;
        const { dispatchSynaraCommand } = await import(
          /* webpackMode: "eager" */ "../../data/synaraClient"
        );
        const deleteInput = {
          threads: removalThreads,
          dispatch: dispatchSynaraCommand,
          closeTerminalHistory: async (threadId) => {
            await platformTerminal.close({ threadId, deleteHistory: true }).catch(() => undefined);
            await platformTerminal
              .close({
                threadId: dockTerminalThreadId(threadId),
                deleteHistory: true,
              })
              .catch(() => undefined);
          },
          cleanupThreadState: cleanupDeletedThreadState,
        } as const;
        const deletion =
          action === "delete"
            ? await removeNativeProject({
                ...deleteInput,
                projectId: project.id as ProjectId,
              })
            : {
                ...(await deleteNativeProjectThreads(deleteInput)),
                projectDeleted: false as const,
                projectDeleteError: null,
              };
        flushTerminalStatePersistence();
        if (action === "delete" && deletion.projectDeleted) {
          const { usePinnedProjectsStore } = await import(
            /* webpackMode: "eager" */ "@synara-web/pinnedProjectsStore"
          );
          usePinnedProjectsStore.getState().unpinProject(project.id as never);
          setPersistedPinnedProjectIds(usePinnedProjectsStore.getState().pinnedProjectIds);
        }
        const deletedIds = new Set(deletion.deletedThreadIds);
        if (activeThreadId && deletedIds.has(activeThreadId as never)) {
          const fallbackThreadId = getFallbackThreadIdAfterDelete({
            threads: data?.threads ?? [],
            deletedThreadId: activeThreadId,
            deletedThreadIds: deletedIds,
            sortOrder: threadSortOrder,
          });
          navigate(fallbackThreadId ? `/thread/${fallbackThreadId}` : "/");
        }
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
        if (deletion.failureCount > 0) {
          const noun = deletion.failureCount === 1 ? "thread" : "threads";
          setSpaceActionError(
            `Could not delete ${deletion.failureCount} ${noun} in "${projectName}".`,
          );
        } else if (action === "delete" && !deletion.projectDeleted) {
          setSpaceActionError(
            deletion.projectDeleteError instanceof Error
              ? deletion.projectDeleteError.message
              : `Could not remove "${projectName}".`,
          );
        }
      } else if (action === "move-to-void" || action?.startsWith("move-to-space:")) {
        const targetSpaceId =
          action === "move-to-void" ? null : (action.slice("move-to-space:".length) as SpaceId);
        const command = buildNativeProjectMoveCommand({
          currentSpaceId: project.spaceId ?? null,
          projectId: project.id as never,
          targetSpaceId,
        });
        if (!command) return;
        const { dispatchSynaraCommand } = await import(
          /* webpackMode: "eager" */ "../../data/synaraClient"
        );
        await dispatchSynaraCommand(command);
        setActiveSpaceId(targetSpaceId);
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
      }
    } catch (cause) {
      setSpaceActionError(cause instanceof Error ? cause.message : "Unable to update the project.");
    }
  }

  async function openSpaceContextMenu(
    space: OrchestrationSpaceShell,
    position: { readonly x: number; readonly y: number },
    restoreFocus: () => void,
  ) {
    "background only";
    setSpaceActionError(null);
    try {
      const { showContextMenu } = await import(
        /* webpackMode: "eager" */ "../../platform/contextMenu"
      );
      const action = await showContextMenu(buildSpaceContextMenuItems(), position, {
        restoreFocus,
      });
      if (action === "edit") {
        setEditingSpace(space);
        setSpaceEditorMode("edit");
        return;
      }
      if (action !== "delete") return;
      const projectCount = (data?.projects ?? []).filter(
        (project) => project.kind === "project" && project.spaceId === space.id,
      ).length;
      const confirmed = await import(/* webpackMode: "eager" */ "../../platform/dialogs").then(
        ({ dialogs }) => dialogs.confirm(nativeSpaceDeleteConfirmation(space.name, projectCount)),
      );
      if (!confirmed) return;
      const { dispatchSynaraCommand } = await import(
        /* webpackMode: "eager" */ "../../data/synaraClient"
      );
      await dispatchSynaraCommand(buildNativeSpaceDeleteCommand(space.id));
      if (activeSpaceId === space.id) {
        setActiveSpaceId(null);
        navigate("/");
      }
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["threads"] }),
      ]);
    } catch (cause) {
      setSpaceActionError(cause instanceof Error ? cause.message : "Unable to update the space.");
    }
  }

  async function saveSpaceEdit(value: { readonly name: string; readonly icon: SpaceIconName }) {
    "background only";
    const { dispatchSynaraCommand } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    if (spaceEditorMode === "create") {
      const spaceId = newSpaceId();
      const pendingProject = projectIdAfterSpaceCreate
        ? (data?.projects.find((project) => project.id === projectIdAfterSpaceCreate) ?? null)
        : null;
      const result = await createNativeSpaceWithOptionalProjectMove({
        createCommand: buildNativeSpaceCreateCommand({
          icon: value.icon,
          name: value.name,
          spaceId,
        }) as Extract<
          import("@synara/contracts").ClientOrchestrationCommand,
          { type: "space.create" }
        >,
        dispatch: dispatchSynaraCommand,
        projectId: projectIdAfterSpaceCreate,
        projectSpaceId: pendingProject?.spaceId ?? null,
      });
      if (projectIdAfterSpaceCreate) {
        if (result.moveError) {
          setSpaceActionError(
            `${value.name.trim()} was created, but the project was not moved. ${
              result.moveError instanceof Error
                ? result.moveError.message
                : "Try moving the project again."
            }`,
          );
          await queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
          return;
        }
        setActiveSpaceId(spaceId);
        navigate("/");
        await Promise.all([
          queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
          queryClient.invalidateQueries({ queryKey: ["threads"] }),
        ]);
        return;
      }
      setActiveSpaceId(spaceId);
      navigate("/");
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
        queryClient.invalidateQueries({ queryKey: ["threads"] }),
      ]);
      setSpaceProjectPickerTarget({ id: spaceId, name: value.name.trim(), icon: value.icon });
      return;
    }
    if (!editingSpace) return;
    const command = buildNativeSpaceUpdateCommand({
      currentIcon: editingSpace.icon,
      currentName: editingSpace.name,
      nextIcon: value.icon,
      nextName: value.name,
      spaceId: editingSpace.id,
    });
    if (!command) return;
    await dispatchSynaraCommand(command);
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["threads"] }),
    ]);
  }

  async function assignProjectsToSpace(projectIds: readonly ProjectId[]) {
    "background only";
    if (!spaceProjectPickerTarget) return [];
    const { dispatchSynaraCommand, fetchSynaraSidebarShellSnapshot } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    const failedProjectIds = await assignNativeProjectsToSpace({
      dispatch: dispatchSynaraCommand,
      getSnapshot: fetchSynaraSidebarShellSnapshot,
      projectIds,
      spaceId: spaceProjectPickerTarget.id,
    });
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
      queryClient.invalidateQueries({ queryKey: ["threads"] }),
    ]);
    return failedProjectIds;
  }

  async function startProjectDevServer(command: string) {
    "background only";
    if (!runProjectState || !data) return;
    const project = data.projects.find((candidate) => candidate.id === runProjectState.projectId);
    if (!project) throw new Error("Project is no longer available.");
    const { dispatchSynaraCommand, runProjectDevServer } = await import(
      /* webpackMode: "eager" */ "../../data/synaraClient"
    );
    const nextScripts = upsertProjectRunCommandScripts({
      scripts: [...project.scripts],
      command,
    });
    if (nextScripts) {
      await dispatchSynaraCommand({
        type: "project.meta.update",
        commandId: `lynx-project-run-script-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}` as never,
        projectId: project.id as ProjectId,
        scripts: nextScripts,
      }).catch(() => undefined);
    }
    try {
      await runProjectDevServer({
        projectId: project.id as ProjectId,
        command,
        cwd: runProjectState.cwd,
        env: projectScriptRuntimeEnv({
          project: { cwd: project.workspaceRoot },
          worktreePath: null,
        }),
      });
    } catch (cause) {
      await projectDevServersQuery.refetch();
      throw cause;
    }
    await Promise.all([
      projectDevServersQuery.refetch(),
      queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
    ]);
  }

  function threadHoverActions(thread: ThreadSummary) {
    const isPinned = thread.isPinned === true || persistedPinnedThreadIds.includes(thread.id);
    return (
      <>
        <SidebarHoverAction
          label={isPinned ? "Unpin thread" : "Pin thread"}
          onActivate={() => void performThreadAction(thread, "", "toggle-pin")}
        >
          <svg
            className="AppSidebarHoverActionIcon"
            content={colorizeLynxSvg(pinSvg, sidebarSecondaryIconColor)}
          />
        </SidebarHoverAction>
        {!thread.live ? (
          <SidebarHoverAction
            label="Archive thread"
            onActivate={() => void performThreadAction(thread, "", "archive")}
          >
            <ArchiveIcon
              className="AppSidebarHoverActionIcon"
              color={sidebarSecondaryIconColor}
              size={13}
            />
          </SidebarHoverAction>
        ) : null}
      </>
    );
  }

  function threadHoverCard(thread: ThreadSummary) {
    const project = sections.projectGroups.find((group) => group.id === thread.projectId) ?? null;
    const metadata = resolveThreadHoverCardMetadata({
      thread,
      project: project
        ? {
            // Sidebar project groups are always real projects (chats and studio are separate sections).
            kind: "project" as const,
            cwd: project.workspaceRoot,
            folderName: project.workspaceRoot.split(/[\\/]/).filter(Boolean).at(-1) ?? "",
            name: project.title,
          }
        : null,
    });
    return (
      <SidebarThreadHoverCard
        branch={metadata.branch}
        projectName={metadata.projectName}
        sourceProjectName={metadata.sourceProjectName}
        thread={thread}
        worktreeName={metadata.worktreeName}
      />
    );
  }

  async function createProjectTerminalThread(projectId: string) {
    "background only";
    const project = data?.projects.find((candidate) => candidate.id === projectId);
    if (!project) return;
    const threadId = newThreadId();
    const modelSelection = project.defaultModelSelection ?? {
      provider: initialSortSettings.defaultProvider,
      model: getDefaultModel(initialSortSettings.defaultProvider),
    };
    await dispatchSynaraCommand({
      type: "thread.create",
      commandId: newCommandId(),
      threadId,
      projectId: project.id as ProjectId,
      title: "New terminal",
      modelSelection,
      runtimeMode: "full-access",
      interactionMode: "default",
      envMode: initialSortSettings.defaultThreadEnvMode,
      branch: null,
      worktreePath: null,
      createdAt: new Date().toISOString(),
    });
    useTerminalStateStore.getState().openTerminalThreadPage(threadId, { terminalOnly: true });
    navigate(`/thread/${threadId}`);
  }

  useEffect(() => {
    "background only";
    let active = true;
    void readPersistedSidebarListState()
      .then((value) => {
        if (!active) return;
        setChatsExpanded(value.expanded);
        setChatExtraPages(value.chatExtraPages);
        setProjectExtraPagesByCwd(value.projectExtraPagesByCwd);
        setExpandedProjectCwds(
          value.expandedProjectCwds.length > 0 ? new Set(value.expandedProjectCwds) : null,
        );
        setPersistedPinnedThreadIds(value.pinnedThreadIds);
        setPersistedPinnedProjectIds(value.pinnedProjectIds);
      })
      .catch(() => {
        // The initialized Sidebar defaults remain usable when persistence is
        // unavailable.
      });
    return () => {
      active = false;
    };
  }, []);
  const chatRows = useMemo(
    () =>
      deriveSidebarChatRows({
        threads: primarySidebarSurface === "studio" ? sections.studioThreads : sections.chatThreads,
        expanded: chatsExpanded,
        activeThreadId: activeThreadId ?? undefined,
        requestedExtraPages: chatExtraPages,
        previewLimit: SIDEBAR_THREAD_PREVIEW_LIMIT,
        previewPageSize: SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
      }),
    [
      activeThreadId,
      chatExtraPages,
      chatsExpanded,
      primarySidebarSurface,
      sections.chatThreads,
      sections.studioThreads,
    ],
  );
  const projectRowsById = useMemo(() => {
    const sortedThreadsByProjectId = new Map(
      sections.projectGroups.map((group) => [group.id, group.threads] as const),
    );
    return deriveSidebarProjectRows({
      projects: sections.projectGroups.map((group) => {
        const key = normalizeSidebarProjectThreadListCwd(group.workspaceRoot);
        return {
          id: group.id,
          cwd: group.workspaceRoot,
          expanded: expandedProjectCwds === null || expandedProjectCwds.has(key),
        };
      }),
      sortedThreadsByProjectId,
      pinnedThreadIds: [],
      filterPinnedThreads: (threads) => threads,
      resolveThreadStatus: (thread) =>
        thread.status ??
        resolveSidebarStatusPresentation({
          working: thread.live,
          connecting: thread.sessionStatus === "connecting",
        }),
      resolveProjectStatus: resolveSidebarProjectStatus,
      threadListExtraPagesByProjectCwd: new Map(Object.entries(projectExtraPagesByCwd)),
      normalizeProjectCwd: normalizeSidebarProjectThreadListCwd,
      activeThreadId: activeThreadId ?? undefined,
      previewLimit: SIDEBAR_THREAD_PREVIEW_LIMIT,
      previewPageSize: SIDEBAR_THREAD_PREVIEW_PAGE_SIZE,
    });
  }, [activeThreadId, expandedProjectCwds, projectExtraPagesByCwd, sections.projectGroups]);
  useEffect(() => {
    if (expandedProjectCwds === null) return;
    setProjectExtraPagesByCwd((current) => {
      const currentMap = new Map(Object.entries(current));
      const nextMap = pruneProjectThreadListPagingForCollapsedProjects({
        threadListExtraPagesByProjectCwd: currentMap,
        projects: sections.projectGroups.map((project) => ({
          cwd: project.workspaceRoot,
          expanded: expandedProjectCwds.has(
            normalizeSidebarProjectThreadListCwd(project.workspaceRoot),
          ),
        })),
        normalizeProjectCwd: normalizeSidebarProjectThreadListCwd,
      });
      if (nextMap === currentMap) return current;
      const next = Object.fromEntries(nextMap);
      void persistSidebarListState({
        expanded: chatsExpanded,
        chatExtraPages,
        projectExtraPagesByCwd: next,
      });
      return next;
    });
  }, [chatExtraPages, chatsExpanded, expandedProjectCwds, sections.projectGroups]);
  const visibleThreadIds = useMemo(
    () =>
      collectVisibleSidebarThreadIds({
        pinnedThreadIds: sections.pinnedThreads.map((thread) => thread.id),
        projectVisibleThreadIds: sections.projectGroups.map(
          (group) =>
            projectRowsById.get(group.id)?.visibleEntries.map((entry) => entry.rowId) ?? [],
        ),
        trailingThreadIds: chatRows.visibleEntries.map((entry) => entry.rowId),
      }),
    [chatRows.visibleEntries, projectRowsById, sections.pinnedThreads, sections.projectGroups],
  );
  useEffect(() => {
    "background only";
    let active = true;
    let disposers: Array<() => void> = [];
    void import(/* webpackMode: "eager" */ "../../platform/bridge")
      .then(({ onGlobalEvent }) => {
        if (!active) return;
        disposers = [
          onGlobalEvent("shell:command", (command: string) => {
            if (command === "chat.new") {
              navigate("/");
              return;
            }
            if (command !== "chat.visible.previous" && command !== "chat.visible.next") {
              return;
            }
            const threadId = getNextVisibleSidebarThreadId({
              visibleThreadIds,
              activeThreadId: activeThreadId ?? undefined,
              direction: command === "chat.visible.previous" ? "backward" : "forward",
            });
            if (threadId) navigate(`/thread/${threadId}`);
          }),
        ];
      })
      .catch(() => {
        // Sidebar pointer/tap navigation remains available without shell
        // accelerators.
      });
    return () => {
      active = false;
      for (const dispose of disposers) dispose();
    };
  }, [activeThreadId, navigate, onOpenSearch, visibleThreadIds]);

  function setProjectExtraPages(projectCwd: string, extraPages: number) {
    const key = normalizeSidebarProjectThreadListCwd(projectCwd);
    setProjectExtraPagesByCwd((current) => {
      const next = { ...current };
      if (extraPages > 0) next[key] = extraPages;
      else delete next[key];
      void persistSidebarListState({
        expanded: chatsExpanded,
        chatExtraPages,
        projectExtraPagesByCwd: next,
      });
      return next;
    });
  }

  function persistProjectExpansion(next: ReadonlySet<string>) {
    void persistProjectDisclosureState(
      sections.projectGroups
        .filter((project) => project.workspaceRoot.length > 0)
        .map((project) => ({
          cwd: project.workspaceRoot,
          expanded: next.has(normalizeSidebarProjectThreadListCwd(project.workspaceRoot)),
        })),
    );
  }

  function toggleProject(projectCwd: string) {
    "background only";
    const projectKey = normalizeSidebarProjectThreadListCwd(projectCwd);
    setExpandedProjectCwds((current) => {
      const next =
        current === null
          ? new Set(
              sections.projectGroups
                .map((project) => normalizeSidebarProjectThreadListCwd(project.workspaceRoot))
                .filter(Boolean),
            )
          : new Set(current);
      if (next.has(projectKey)) next.delete(projectKey);
      else next.add(projectKey);
      persistProjectExpansion(next);
      return next;
    });
  }

  // Web handleToggleProjects: collapse every project except the focused one when
  // all are open, else open them all.
  const focusedProjectId =
    data?.threads.find((thread) => thread.id === activeThreadId)?.projectId ?? draftProjectId;
  const allProjectsExpanded =
    sections.projectGroups.length > 0 &&
    sections.projectGroups.every(
      (group) =>
        expandedProjectCwds === null ||
        expandedProjectCwds.has(normalizeSidebarProjectThreadListCwd(group.workspaceRoot)),
    );
  function toggleAllProjects() {
    "background only";
    const next = new Set(
      sections.projectGroups
        .filter((group) => !allProjectsExpanded || group.id === focusedProjectId)
        .map((group) => normalizeSidebarProjectThreadListCwd(group.workspaceRoot))
        .filter(Boolean),
    );
    setExpandedProjectCwds(next);
    persistProjectExpansion(next);
  }

  function applyChatListAction(action: SidebarChatListAction) {
    const next = resolveSidebarChatListTransition({
      expanded: chatsExpanded,
      requestedExtraPages: chatExtraPages,
      effectiveExtraPages: chatRows.effectiveExtraPages,
      action,
    });
    setChatsExpanded(next.expanded);
    setChatExtraPages(next.requestedExtraPages);
    void persistSidebarListState({
      expanded: next.expanded,
      chatExtraPages: next.requestedExtraPages,
      projectExtraPagesByCwd,
    });
  }

  function selectSpace(spaceId: import("@synara/contracts").SpaceId | null) {
    "background only";
    if (spaceId === activeSpaceId) return;
    if (activeThreadId) {
      const activeThread = data?.threads.find((thread) => thread.id === activeThreadId);
      const activeProject = activeThread
        ? data?.projects.find((project) => project.id === activeThread.projectId)
        : null;
      if (activeProject?.kind === "project") {
        rememberSpaceThread(activeProject.spaceId ?? null, activeThread.id as never);
      }
    }
    setActiveSpaceId(spaceId);
    const targetThreads = (data?.threads ?? []).filter((thread) => {
      if (thread.archivedAt != null) return false;
      const project = data?.projects.find((candidate) => candidate.id === thread.projectId);
      return project?.kind === "project" && (project.spaceId ?? null) === spaceId;
    });
    const rememberedId = getLastSpaceThreadId(spaceId);
    const target =
      targetThreads.find((thread) => thread.id === rememberedId) ??
      sortThreadsForSidebar(targetThreads, threadSortOrder)[0] ??
      null;
    navigate(target ? `/thread/${target.id}` : "/");
  }

  return (
    <view className="AppSidebar">
      <SidebarDesktopHeader leadingControls={titlebarControls} trafficLightGutter />
      <SidebarSurfaceContent
        surfaceKey={primarySidebarSurface}
        picker={
          <SidebarSurfaceHeader
            views={resolveSidebarSurfacePickerViews(studioSectionVisible)}
            activeView={activePath === "/studio" ? "studio" : "threads"}
            onSelectView={(view) => {
              if (view === "studio") {
                navigate("/studio");
                return;
              }
              navigate("/");
            }}
            searchElementId={SEARCH_TRIGGER_ELEMENT_ID}
            searchOpen={searchOpen}
            onOpenSearch={() => onOpenSearch()}
          />
        }
        navigation={
          <SidebarPrimarySurfaceNavigation
            surface={primarySidebarSurface}
            pullRequestIcon={PullRequestCompareIcon}
            icons={LYNX_SIDEBAR_PRIMARY_ICONS}
            kanbanActive={activePath === "/kanban"}
            pullRequestsActive={activePath === "/pull-requests"}
            automationsActive={activePath.startsWith("/automations")}
            pullRequestsBadge={pullRequestsReviewBadge}
            newThreadShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.newThread}
            onCreateThread={openPrimaryNewThread}
            onCreateStudioChat={() => navigate("/studio")}
            onOpenKanban={() => navigate("/kanban")}
            onOpenPullRequests={() => navigate("/pull-requests")}
            onOpenAutomations={() => navigate("/automations")}
          />
        }
        body={
          <>
            <>
              <SidebarPinnedSection
                rows={sections.pinnedThreads}
                renderRow={(thread) => {
                  const rowModel = resolveSidebarThreadRowModel({
                    threadId: thread.id,
                    parentThreadId: thread.parentThreadId,
                    sidechatSourceThreadId: thread.sidechatSourceThreadId,
                    activeThreadId,
                    topLevel: true,
                  });
                  return (
                    <SidebarNavigationRow
                      key={thread.id}
                      threadId={thread.id}
                      active={rowModel.isActive}
                      className={`AppSidebarThread AppSidebarPinnedThread${
                        rowModel.isActive ? " AppSidebarThread--active" : ""
                      }`}
                      actions={threadHoverActions(thread)}
                      hoverCard={threadHoverCard(thread)}
                      label={thread.title}
                      onActivate={() => navigate(`/thread/${thread.id}`)}
                      onContextMenu={(position, restoreFocus) =>
                        void openThreadContextMenu(
                          thread,
                          sections.projectGroups.find((group) => group.id === thread.projectId)
                            ?.workspaceRoot ?? "",
                          position,
                          restoreFocus,
                        )
                      }
                    >
                      <SidebarThreadRowComposition
                        thread={thread}
                        provider={thread.provider}
                        handoffSourceProvider={thread.handoffSourceProvider}
                        isActive={rowModel.isActive}
                        variant="pinned"
                        subagentIndentPx={rowModel.subagentIndentPx}
                        suffix={<SidebarThreadTrailing thread={thread} />}
                      />
                    </SidebarNavigationRow>
                  );
                }}
              />
              {primarySidebarSurface === "studio" ? (
                <SidebarStudioSection
                  hydrated={!isPending}
                  rows={chatRows.visibleEntries}
                  renderRow={({ row: { thread, depth } }) => {
                    const rowModel = resolveSidebarThreadRowModel({
                      threadId: thread.id,
                      parentThreadId: thread.parentThreadId,
                      sidechatSourceThreadId: thread.sidechatSourceThreadId,
                      activeThreadId,
                      topLevel: true,
                    });
                    return (
                      <SidebarNavigationRow
                        key={thread.id}
                        className={`AppSidebarThread AppSidebarChatThread${
                          rowModel.isActive ? " AppSidebarThread--active" : ""
                        }`}
                        actions={threadHoverActions(thread)}
                        hoverCard={threadHoverCard(thread)}
                        label={thread.title}
                        onActivate={() => navigate(`/thread/${thread.id}`)}
                        onContextMenu={(position, restoreFocus) =>
                          void openThreadContextMenu(
                            thread,
                            sections.projectGroups.find((group) => group.id === thread.projectId)
                              ?.workspaceRoot ?? "",
                            position,
                            restoreFocus,
                          )
                        }
                      >
                        <SidebarThreadRowComposition
                          thread={thread}
                          provider={thread.provider}
                          handoffSourceProvider={thread.handoffSourceProvider}
                          isActive={rowModel.isActive}
                          variant="standard"
                          subagentIndentPx={Math.max(rowModel.subagentIndentPx, depth * 10)}
                          suffix={<SidebarThreadTrailing thread={thread} />}
                        />
                      </SidebarNavigationRow>
                    );
                  }}
                />
              ) : (
                <SidebarProjectsSection
                  prelude={
                    <SpaceSwitcherLynx
                      activeSpaceId={activeSpaceId}
                      activityBySpaceId={spaceActivityById}
                      spaces={data?.spaces ?? []}
                      onSelect={selectSpace}
                      onCreate={() => {
                        setEditingSpace(null);
                        setProjectIdAfterSpaceCreate(null);
                        setSpaceEditorMode("create");
                      }}
                      onContextMenu={(space, position, restoreFocus) =>
                        void openSpaceContextMenu(space, position, restoreFocus)
                      }
                    />
                  }
                  state={resolveSidebarProjectsSectionState({
                    loading: isPending,
                    error: Boolean(error) && data === undefined,
                    projectCount:
                      sections.projectGroups.length === 0 && activeSpace && hasProjectsElsewhere
                        ? 1
                        : sections.projectGroups.length,
                  })}
                  headerActions={
                    <>
                      {sections.projectGroups.length > 0 ? (
                        <SidebarListSectionHeaderToggleProjectsElement
                          allExpanded={allProjectsExpanded}
                          hasFocusedProject={focusedProjectId !== null}
                          onActivate={toggleAllProjects}
                        />
                      ) : null}
                      <SidebarListSectionHeaderSortElement
                        projectSortOrder={projectSortOrder}
                        threadSortOrder={threadSortOrder}
                        onProjectSortOrderChange={(value) =>
                          persistSidebarSortOrders(value, threadSortOrder)
                        }
                        onThreadSortOrderChange={(value) =>
                          persistSidebarSortOrders(projectSortOrder, value)
                        }
                      />
                      <SidebarListSectionHeaderAddProjectElement
                        elementId={ADD_PROJECT_TRIGGER_ELEMENT_ID}
                        onActivate={() => onOpenSearch("~/", ADD_PROJECT_TRIGGER_ELEMENT_ID)}
                      />
                    </>
                  }
                  rows={sections.projectGroups}
                  afterList={
                    !isPending &&
                    !error &&
                    sections.projectGroups.length === 0 &&
                    activeSpace &&
                    hasProjectsElsewhere ? (
                      <view className="AppSidebarSpaceEmptyState">
                        <text className="AppSidebarSpaceEmptyTitle">
                          {activeSpace.name} is empty
                        </text>
                        <text className="AppSidebarSpaceEmptyDescription">
                          Move projects here, or right-click a project to file it.
                        </text>
                        <Button
                          size="xs"
                          variant="outline"
                          onClick={() => setSpaceProjectPickerTarget(activeSpace)}
                        >
                          Move projects here
                        </Button>
                      </view>
                    ) : null
                  }
                  renderRow={(group) => {
                    const projectPagingKey = normalizeSidebarProjectThreadListCwd(
                      group.workspaceRoot,
                    );
                    const isExpanded =
                      expandedProjectCwds === null || expandedProjectCwds.has(projectPagingKey);
                    const projectRows = projectRowsById.get(group.id);
                    const visibleProjectThreadRows = projectRows?.visibleEntries ?? [];
                    const projectPinned =
                      group.isPinned === true || persistedPinnedProjectIds.includes(group.id);
                    const projectRun =
                      projectDevServersQuery.data?.servers.find(
                        (server) => server.projectId === group.id,
                      ) ?? null;
                    const projectRunServer = projectRunServerByProjectId.get(group.id) ?? null;
                    const collapsedProjectStatus = isExpanded
                      ? null
                      : (projectRows?.projectStatus ?? null);
                    return (
                      <SidebarProjectDisclosure
                        key={group.id}
                        expanded={isExpanded}
                        header={
                          <SidebarNavigationRow
                            className="AppSidebarProjectHeader"
                            projectId={group.id}
                            expanded={isExpanded}
                            hoverCard={
                              <SidebarProjectHoverCard
                                chatCount={group.threads.length}
                                isPinned={projectPinned}
                                name={group.title}
                                path={abbreviateHomePath(
                                  group.workspaceRoot,
                                  serverConfigQuery.data?.homeDir ?? null,
                                )}
                              />
                            }
                            actions={
                              <>
                                <SidebarHoverAction
                                  label={`View pull requests for ${group.title}`}
                                  onActivate={() => navigate("/pull-requests")}
                                >
                                  <PullRequestCompareIcon
                                    className="AppSidebarHoverActionIcon"
                                    color={sidebarSecondaryIconColor}
                                  />
                                </SidebarHoverAction>
                                <SidebarHoverAction
                                  label={`Create new terminal thread in ${group.title}`}
                                  onActivate={() => void createProjectTerminalThread(group.id)}
                                >
                                  <svg
                                    className="AppSidebarHoverActionIcon"
                                    content={colorizeLynxSvg(
                                      terminalSvg,
                                      sidebarSecondaryIconColor,
                                    )}
                                  />
                                </SidebarHoverAction>
                                <SidebarHoverAction
                                  label={`Create new thread in ${group.title}`}
                                  onActivate={() =>
                                    navigate(`/new-thread/${encodeURIComponent(group.id)}`)
                                  }
                                >
                                  <PlusIcon
                                    className="AppSidebarHoverActionIcon"
                                    color={sidebarSecondaryIconColor}
                                    size={13}
                                  />
                                </SidebarHoverAction>
                              </>
                            }
                            label={`${isExpanded ? "Collapse" : "Expand"} ${group.title}`}
                            onActivate={() => toggleProject(group.workspaceRoot)}
                            onContextMenu={(position, restoreFocus) =>
                              void openProjectContextMenu(group, position, restoreFocus)
                            }
                          >
                            <ProjectPinAction
                              pinned={projectPinned}
                              projectName={group.title}
                              onActivate={() => void toggleProjectPinned(group)}
                            />
                            <SidebarProjectSummary
                              leadingClassName={
                                projectPinned ? "AppSidebarProjectFolder--hidden" : undefined
                              }
                              leading={
                                isExpanded ? <FolderOpenIcon size={16} /> : <FolderIcon size={16} />
                              }
                              name={group.title}
                            />
                            {projectRun || projectRunServer || collapsedProjectStatus ? (
                              <SidebarThreadTrailingCluster
                                metaContent={
                                  projectRun || projectRunServer ? <ProjectRunIndicatorDot /> : null
                                }
                                status={collapsedProjectStatus}
                              />
                            ) : null}
                          </SidebarNavigationRow>
                        }
                        rows={visibleProjectThreadRows}
                        renderRow={({ thread, depth }) => {
                          const rowModel = resolveSidebarThreadRowModel({
                            threadId: thread.id,
                            parentThreadId: thread.parentThreadId,
                            sidechatSourceThreadId: thread.sidechatSourceThreadId,
                            activeThreadId,
                          });
                          return (
                            <SidebarNavigationRow
                              key={thread.id}
                              threadId={thread.id}
                              active={rowModel.isActive}
                              className={`AppSidebarThread${
                                rowModel.isActive ? " AppSidebarThread--active" : ""
                              }`}
                              actions={threadHoverActions(thread)}
                              hoverCard={threadHoverCard(thread)}
                              label={thread.title}
                              onActivate={() => navigate(`/thread/${thread.id}`)}
                              onContextMenu={(position, restoreFocus) =>
                                void openThreadContextMenu(
                                  thread,
                                  group.workspaceRoot,
                                  position,
                                  restoreFocus,
                                )
                              }
                            >
                              <SidebarThreadRowComposition
                                thread={thread}
                                provider={thread.provider}
                                handoffSourceProvider={thread.handoffSourceProvider}
                                isActive={rowModel.isActive}
                                variant="standard"
                                subagentIndentPx={Math.max(rowModel.subagentIndentPx, depth * 10)}
                                suffix={<SidebarThreadTrailing thread={thread} />}
                              />
                            </SidebarNavigationRow>
                          );
                        }}
                        canShowMore={projectRows?.canShowMoreThreads ?? false}
                        canShowLess={projectRows?.canShowLessThreads ?? false}
                        onShowMore={() =>
                          setProjectExtraPages(
                            group.workspaceRoot,
                            (projectRows?.threadListExtraPages ?? 0) + 1,
                          )
                        }
                        onShowLess={() =>
                          setProjectExtraPages(
                            group.workspaceRoot,
                            Math.max(0, (projectRows?.threadListExtraPages ?? 0) - 1),
                          )
                        }
                      />
                    );
                  }}
                />
              )}
            </>
          </>
        }
        trailing={
          <SidebarChatsSection
            visible={
              chatsSectionVisible && primarySidebarSurface === "threads" && !isPending && !error
            }
            expanded={chatsExpanded}
            toolbar={
              <>
                <SidebarChatSortElement
                  threadSortOrder={threadSortOrder}
                  onThreadSortOrderChange={(value) =>
                    persistSidebarSortOrders(projectSortOrder, value)
                  }
                />
                <SidebarChatNewElement onActivate={() => navigate("/")} />
              </>
            }
            rows={chatRows.visibleEntries}
            canShowMore={chatRows.canShowMoreThreads}
            canShowLess={chatRows.canShowLessThreads}
            renderRow={({ row: { thread, depth } }) => {
              const rowModel = resolveSidebarThreadRowModel({
                threadId: thread.id,
                parentThreadId: thread.parentThreadId,
                sidechatSourceThreadId: thread.sidechatSourceThreadId,
                activeThreadId,
                topLevel: true,
              });
              return (
                <SidebarNavigationRow
                  key={thread.id}
                  threadId={thread.id}
                  active={rowModel.isActive}
                  className={`AppSidebarThread AppSidebarChatThread${
                    rowModel.isActive ? " AppSidebarThread--active" : ""
                  }`}
                  actions={threadHoverActions(thread)}
                  hoverCard={threadHoverCard(thread)}
                  label={thread.title}
                  onActivate={() => navigate(`/thread/${thread.id}`)}
                  onContextMenu={(position, restoreFocus) =>
                    void openThreadContextMenu(
                      thread,
                      sections.projectGroups.find((group) => group.id === thread.projectId)
                        ?.workspaceRoot ?? "",
                      position,
                      restoreFocus,
                    )
                  }
                >
                  <SidebarThreadRowComposition
                    thread={thread}
                    provider={thread.provider}
                    handoffSourceProvider={thread.handoffSourceProvider}
                    isActive={rowModel.isActive}
                    variant="standard"
                    subagentIndentPx={Math.max(rowModel.subagentIndentPx, depth * 10)}
                    suffix={<SidebarThreadTrailing thread={thread} />}
                  />
                </SidebarNavigationRow>
              );
            }}
            onToggle={() => applyChatListAction("toggle")}
            onShowMore={() => applyChatListAction("show_more")}
            onShowLess={() => applyChatListAction("show_less")}
          />
        }
      />
      <SidebarFooterSection
        settingsVisible={activePath !== "/settings"}
        settingsActive={activePath === "/settings"}
        settingsIcon={<SettingsIcon className="AppSidebarSettingsIcon" size={15} />}
        onOpenSettings={() => navigate("/settings")}
      />
      <SpaceEditorDialogLynx
        mode={spaceEditorMode ?? "edit"}
        open={spaceEditorMode !== null}
        space={editingSpace}
        existingNames={(data?.spaces ?? [])
          .filter((space) => space.id !== editingSpace?.id)
          .map((space) => space.name)}
        onOpenChange={(open) => {
          if (!open) {
            setEditingSpace(null);
            setProjectIdAfterSpaceCreate(null);
            setSpaceEditorMode(null);
          }
        }}
        onSave={saveSpaceEdit}
      />
      <SpaceProjectPickerDialogLynx
        activeSpaceId={activeSpaceId}
        open={spaceProjectPickerTarget !== null}
        projects={data?.projects ?? []}
        spaces={data?.spaces ?? []}
        targetSpace={spaceProjectPickerTarget}
        onOpenChange={(open) => {
          if (!open) setSpaceProjectPickerTarget(null);
        }}
        onSubmit={assignProjectsToSpace}
      />
      <ProjectRenameDialogLynx
        open={renameProjectId !== null}
        project={
          renameProjectId
            ? (data?.projects.find((project) => project.id === renameProjectId) ?? null)
            : null
        }
        onOpenChange={(open) => {
          if (!open) setRenameProjectId(null);
        }}
        onSave={(nextName) => {
          if (!renameProjectId) return;
          const { renameProjectLocally } = useStore.getState();
          renameProjectLocally(renameProjectId, nextName.length > 0 ? nextName : null);
          invalidateSidebarSnapshotProjectionCache();
          void queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
        }}
      />
      <ThreadRenameDialogLynx
        open={renameThreadId !== null}
        thread={
          renameThreadId
            ? (data?.threads.find((thread) => thread.id === renameThreadId) ?? null)
            : null
        }
        onOpenChange={(open) => {
          if (!open) setRenameThreadId(null);
        }}
        onSave={async (title) => {
          "background only";
          if (!renameThreadId) return;
          const { dispatchSynaraCommand } = await import(
            /* webpackMode: "eager" */ "../../data/synaraClient"
          );
          await dispatchSynaraCommand({
            type: "thread.meta.update",
            commandId: `lynx-thread-rename-${Date.now()}-${Math.random()
              .toString(16)
              .slice(2)}` as never,
            threadId: renameThreadId as never,
            title,
          });
          await Promise.all([
            queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
            queryClient.invalidateQueries({ queryKey: ["threads"] }),
            queryClient.invalidateQueries({ queryKey: ["thread-detail", renameThreadId] }),
          ]);
        }}
      />
      <ProjectRunDialogLynx
        open={runProjectState !== null}
        project={
          runProjectState
            ? (data?.projects.find((project) => project.id === runProjectState.projectId) ?? null)
            : null
        }
        initialCommand={runProjectState?.command ?? ""}
        loading={runProjectState?.loading ?? false}
        onOpenChange={(open) => {
          if (!open) setRunProjectState(null);
        }}
        onRun={startProjectDevServer}
      />
      {spaceActionError ? (
        <text
          className="AppSidebarSpaceActionError"
          accessibility-element
          accessibility-role="alert"
        >
          {spaceActionError}
        </text>
      ) : null}
    </view>
  );
}
