// P2-V1: navigation on ReactLynx — TanStack *memory history* engine with a
// Lynx-native render layer.
//
// FINDING (P2-V1, 2026-07-27): @tanstack/react-router's component layer
// (RouterProvider/Match) crashes the Lynx renderer with
// `snapshotPatchApply failed: ctx not found, snapshot type: 'wrapper'` — its
// internals (Suspense/transition machinery) are incompatible with this
// ReactLynx build, and its <Link> renders a raw HTML <a>. The history engine
// itself (@tanstack/history) is pure JS and works fine, so routes are matched
// and rendered by hand here (see synara-lynx plan 04 pattern P-08).

import { createMemoryHistory } from "@tanstack/history";
import {
  useCallback,
  useEffect,
  useInitData,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "@lynx-js/react";
import type { InputRef } from "@lynx-js/lynx-ui";
import { useQuery } from "@tanstack/react-query";
import type {
  GitReadWorkingTreeDiffResult,
  ProviderApprovalDecision,
  ProviderKind,
  ProviderUserInputAnswers,
  ServerProviderStatus,
  TurnId,
} from "@synara/contracts";
import { COMPONENT_LAB_STORIES } from "@synara/shared/componentLab";
import { MAC_DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CSS_PX } from "@synara/shared/desktopChrome";
import {
  RIGHT_DOCK_MIN_WIDTH_PX,
  closePaneInState,
  openPaneInState,
  resolveActivePane,
  setActivePaneInState,
  setDockOpenInState,
  type RightDockThreadState,
} from "@synara/shared/rightDock";
import { resolveThreadHeaderActionState } from "@synara/shared/threadHeaderActions";
import { resolveThreadHeaderIconKind } from "@synara/shared/threadHeaderIdentity";
import { buildPullRequestCodeView } from "@synara-web/components/pullRequest/pullRequestCode.logic";
import type { SettingsAppearanceValues } from "@synara-web/components/settings/SettingsAppearanceComposition.logic";
import type { ThemeState } from "@synara-web/theme/theme.logic";
import type { SettingsSectionId } from "@synara-web/settingsNavigation";
import type { Project } from "@synara-web/types";
import { useStore } from "@synara-web/store";
import { useSpacesUiStore } from "@synara-web/spacesUiStore";
import { useWorkspaceStore } from "@synara-web/workspaceStore";
import { useRecentViewsStore } from "@synara-web/recentViewsStore";
import {
  buildRecentViewDisplayEntries,
  deriveCurrentRecentView,
  pruneRecentViews,
  recentViewKey,
  resolveRecentViewNavigationIndex,
  type RecentView,
} from "@synara-web/recentViews.logic";
import { dockTerminalThreadId } from "@synara-web/lib/dockTerminalScope";
import { quotePosixShellArgument } from "@synara-web/lib/shellQuote";
import { DEFAULT_THREAD_TERMINAL_ID } from "@synara-web/types";
import {
  flushTerminalStatePersistence,
  selectThreadTerminalState,
  useTerminalStateStore,
} from "@synara-web/terminalStateStore";
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
  writeSettingsGeneralProjection,
} from "@synara-web/appSettingsStorageProjection.logic";
import { resolveProviderHealthBannerPresentation } from "@synara-web/components/chat/ProviderHealthBanner.logic";
import { findProviderStatus } from "@synara-web/lib/providerAvailability";
import { clampSidebarWidth } from "@synara-web/components/sidebarResize.logic";
import {
  isSupportedLocalPdfPath,
  isSupportedLocalPreviewFilePath,
} from "@synara/shared/localPreviewFiles";
import { VIEWPORT_BREAKPOINTS } from "@synara-web/responsiveLayout.logic";
import panelRightCloseSvg from "@synara-central-icons/sidebar-hidden-right-wide.svg?raw";
import changesSvg from "@synara-central-icons/changes.svg?raw";
import foldersSvg from "@synara-central-icons/folders.svg?raw";
import bubbleTextSvg from "@synara-central-icons/bubble-text.svg?raw";
import terminalSvg from "@synara-central-icons/console.svg?raw";

import {
  fetchExplorerDirectory,
  fetchExplorerEntries,
  fetchExplorerFile,
  fetchExplorerLocalPreviewUrl,
  fetchExplorerPdfMetadata,
  fetchThreadHeaderSummary,
  fetchThreadTranscriptRows,
  fetchThreads,
  queryClient,
  type ExplorerEntriesResult,
  type ProjectSummary,
  type ThreadSummary,
} from "./queries";
import { resolveStudioRestoreRoute } from "./studioRoute.logic";
import { buildThreadRelaunchUrl } from "./relaunchSurface.logic";
import { parseSettingsRouteLocation, settingsRouteLocation } from "./settingsRoute.logic";
import { projectExplorerDirectories, toggleExpandedDirectory } from "./explorerTree.logic";
import { threadRecapRevision } from "./environmentRecap.logic";
import type { EnvironmentBootstrapData } from "./environmentBootstrap.lynx";
import { Transcript, type TranscriptController } from "./Transcript";
import { SettingsPage } from "./SettingsPage";
import { UpdatePage } from "./UpdatePage";
import { KanbanProjectPage, ProjectsPage, PullRequestsPage } from "./FeatureListsPage";
import { AutomationsPage } from "./AutomationsPage.lynx";
import { PluginLibraryPage } from "./PluginLibraryPage.lynx";
import { resolveLandingRoutePresentation } from "./landingRoutePresentation.logic";
import { WorkspacePage } from "./WorkspacePage.lynx";
import { RecentViewSwitcherLynx } from "./RecentViewSwitcher.lynx";
import { Composer } from "../components/composer/Composer.lynx";
import { PendingApprovalPanel } from "../components/composer/PendingApprovalPanel.lynx";
import { PendingUserInputPanel } from "../components/composer/PendingUserInputPanel.lynx";
import { Button } from "../components/ui/button";
import type { RpcTransportState } from "../data/rpcTransport.logic";
import { Input } from "../components/ui/input.lynx";
import { platformTerminal } from "../platform/terminal";
import {
  dispatchSynaraCommand,
  fetchGitBranches,
  fetchWorkingTreeDiff,
} from "../data/synaraClient.lynx";
import { subscribeOrchestrationShellEvents } from "../data/synaraClient.lynx";
import { Sidebar } from "../components/sidebar/Sidebar.lynx";
import { SidebarSearchPaletteHost } from "../components/sidebar/SidebarSearchPaletteHost.lynx";
import { focusLynxElementById } from "../components/ui/focus.lynx";
import { CenteredEmptyLanding } from "@synara-web/components/CenteredEmptyLanding";
import { CenteredEmptyLandingStack } from "@synara-web/components/CenteredEmptyLandingStack";
import { AppShellFrame } from "@synara-web/components/AppShellFrame";
import { ChatSurfaceHeaderFrame } from "@synara-web/components/chat/ChatSurfaceHeaderFrame";
import { ChatSurfaceHeaderIdentity } from "@synara-web/components/chat/ChatSurfaceHeaderIdentity";
import { ComposerColumnFrameSurface } from "@synara-web/components/chat/ComposerColumnFrameSurface";
import { PanelStateMessage } from "@synara-web/components/chat/PanelStateMessage";
import { LandingComposer, loadLandingBootstrap } from "../components/composer/LandingComposer.lynx";
import { landingDraftId } from "../components/composer/landingDraftIdentity.logic";
import { resolveLandingModelProvider } from "../components/composer/landingModelProvider.logic";
import { OpenAIProviderIcon } from "../components/OpenAIProviderIcon.lynx";
import { ProviderHealthBanner } from "../components/ProviderHealthBanner.lynx";
import { ThreadErrorBanner } from "../components/ThreadErrorBanner.lynx";
import {
  EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS,
  resolveRestorableThreadRoute,
  type LastThreadRoute,
} from "@synara-web/chatRouteRestore";
import { useRestoreOrCreateChatRouteController } from "@synara-web/components/useRestoreOrCreateChatRoute.logic";
import { resolveSettingsBackTarget } from "@synara-web/components/SidebarSettingsBack.logic";
import { resolveThreadPageBodyState } from "./threadPageState.logic";
import { threadErrorDismissKey, visibleThreadError } from "./threadErrorBanner.logic";
import {
  resolveDefaultEnvironmentPanelOpen,
  resolveEnvironmentPanelLayout,
} from "@synara-web/components/ChatView.logic";
import {
  readEditorChatPaneVisible,
  readEditorSidebarVisible,
  readEditorViewState,
  storeEditorChatPaneVisible,
  storeEditorSidebarVisible,
  storeEditorViewState,
} from "@synara-web/editorViewState";
import { sleepOnHost } from "../platform/timer";
import { EmptyThreadContextTray } from "./EmptyThreadContextTray.lynx";
import { ThreadTerminal } from "./ThreadTerminal.lynx";
import { DockTerminalPane } from "./DockTerminalPane.lynx";
import { GitDockPane } from "./GitDockPane.lynx";
import { BrowserDockPane } from "./BrowserDockPane.lynx";
import { browserView } from "../platform/browserView.lynx";
import { EmbeddedSidechatPane } from "./EmbeddedSidechatPane.lynx";
import { buildLynxSidechatCreateCommand, canCreateLynxSidechat } from "./sidechatCreate.logic";
import { newCommandId, newThreadId } from "@synara-web/lib/utils";
import { DiffDock } from "./DiffDock.lynx";
import { ThreadRightDockTabs } from "./ThreadRightDockTabs.lynx";
import { ThreadRightDockHost } from "./ThreadRightDockHost.lynx";
import { readRightDockThreadState, storeRightDockThreadState } from "./rightDockState.lynx";
import {
  ThreadDiffToggle,
  usePersistedRightDockState,
  useRightDockLayout,
  useWorkspaceHeaderDiff,
} from "./threadDock.lynx";
import { EXPLORER_DOCK_MIN_WIDTH, ExplorerDock } from "./ExplorerDock.lynx";
import { ResizableRightPanel } from "./ResizableRightPanel.lynx";
import {
  EDITOR_CHAT_PANE_DEFAULT_WIDTH,
  EDITOR_CHAT_PANE_MAX_WIDTH,
  EDITOR_CHAT_PANE_MIN_WIDTH,
  EDITOR_CHAT_PANE_STORAGE_KEY,
} from "@synara-web/editorViewState";
import { EnvironmentPanel, EnvironmentToggle } from "./EnvironmentPanel.lynx";
import { useTemporaryThreadLifecycle } from "./temporaryThreadLifecycle.lynx";
import { DesktopTitlebarControls } from "../adapters/DesktopTitlebarControls.lynx";
import { SidebarDisclosure } from "./SidebarDisclosure.lynx";
import {
  ClockIcon,
  ChevronDownIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
  XIcon,
} from "../lib/icons.lynx";
import { useLynxInteractiveState } from "../adapters/useLynxInteractiveState";
import { useTheme } from "../adapters/useTheme.lynx";
import { colorizeLynxSvg } from "../lib/themedSvg.lynx";
import { webStorage } from "../platform/storage";
import { formatRelativeTime } from "@synara-web/lib/relativeTime";
import { resolveEditorChatHistoryThreads } from "./editorChatHistory.logic";
import {
  groupEditorProjectSwitchOptions,
  resolveEditorProjectSwitchOptions,
  resolveEditorProjectSwitchTarget,
} from "./editorProjectSwitch.logic";
import { resolveMemoryNavigationState, type MemoryNavigationState } from "./routerHistory.logic";
import { readPersistedLastThreadRouteFallback } from "./routerPersistence.logic";
import { resolveResponsiveSidebarOpen } from "./sidebarVisibility.logic";
import { TaskCompletionToastHost } from "./TaskCompletionToastHost.lynx";
import { VoiceNotificationHost } from "./VoiceNotificationHost.lynx";
import { ComponentsLabPageLynx } from "./ComponentsLabPage.lynx";
import { ProviderUpdatePrompt } from "./ProviderUpdatePrompt.lynx";
import { AppSnapCoordinator } from "./AppSnapCoordinator.lynx";
import { AppSnapWelcomeDialogLynx } from "./AppSnapWelcomeDialog.lynx";
import { EditorRailTabs } from "./EditorRailTabs.lynx";
import { ThreadHeaderActions } from "./ThreadHeaderActions.lynx";
import {
  consumeOpenThreadPathInTerminal,
  executeOpenThreadPathInTerminal,
  resolveOpenThreadPathTerminalTarget,
  subscribeOpenThreadPathInTerminal,
} from "./threadTerminalIntent.lynx";
import { EditorProjectSwitchMenu } from "./EditorProjectSwitchMenu.lynx";
export const history = createMemoryHistory({ initialEntries: ["/"] });

async function readPersistedLastThreadRoute(): Promise<LastThreadRoute | null> {
  "background only";
  const { hydrateStorage } = await import(/* webpackMode: "eager" */ "../platform/storage");
  await hydrateStorage();
  const { readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  return readSidebarUiState().lastThreadRoute;
}

async function persistLastThreadRoute(threadId: string): Promise<void> {
  "background only";
  const { persistSidebarUiState, readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  persistSidebarUiState({
    ...readSidebarUiState(),
    lastThreadRoute: { threadId },
  });
}

async function refreshLynxRouteSnapshot(): Promise<unknown> {
  return fetchThreads();
}

function waitForLynxRouteFallback(): Promise<void> {
  return sleepOnHost(EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS);
}

// --- tiny route subscription --------------------------------------------------
interface RouteState {
  readonly pathname: string;
  readonly params: Record<string, string>;
}

function parseRoute(pathname: string): RouteState {
  const [routePathname, routeSearch = ""] = pathname.split("?", 2);
  const threadMatch = routePathname.match(/^\/thread\/([^/]+)$/);
  if (threadMatch) {
    return { pathname: "/thread/$threadId", params: { threadId: threadMatch[1] } };
  }
  const settingsRoute = parseSettingsRouteLocation(pathname);
  if (settingsRoute) {
    return {
      pathname: "/settings",
      params: {
        ...(settingsRoute.section ? { section: settingsRoute.section } : {}),
        ...(settingsRoute.target ? { target: settingsRoute.target } : {}),
      },
    };
  }
  const newThreadMatch = routePathname.match(/^\/new-thread\/([^/]+)$/);
  if (newThreadMatch) {
    return {
      pathname: "/new-thread/$projectId",
      params: { projectId: decodeURIComponent(newThreadMatch[1]) },
    };
  }
  if (routePathname === "/studio") {
    return { pathname: "/studio", params: {} };
  }
  if (routePathname === "/components-lab") {
    const search = new URLSearchParams(routeSearch);
    return {
      pathname: "/components-lab",
      params: {
        ...(search.get("story") ? { story: search.get("story")! } : {}),
        ...(search.get("state") ? { state: search.get("state")! } : {}),
        ...(search.get("variant") ? { variant: search.get("variant")! } : {}),
        ...(search.get("embed") === "1" ? { embed: "1" } : {}),
      },
    };
  }
  const workspaceMatch = routePathname.match(/^\/workspace\/([^/]+)$/);
  if (workspaceMatch) {
    return {
      pathname: "/workspace/$workspaceId",
      params: { workspaceId: decodeURIComponent(workspaceMatch[1]) },
    };
  }
  if (routePathname === "/workspace") {
    return { pathname: "/workspace", params: {} };
  }
  if (routePathname === "/kanban") {
    return { pathname: "/kanban", params: {} };
  }
  const kanbanProjectMatch = routePathname.match(/^\/kanban\/([^/]+)$/);
  if (kanbanProjectMatch) {
    return {
      pathname: "/kanban/$projectId",
      params: { projectId: decodeURIComponent(kanbanProjectMatch[1]) },
    };
  }
  if (routePathname === "/pull-requests") {
    return { pathname: "/pull-requests", params: {} };
  }
  if (routePathname === "/plugins") {
    return { pathname: "/plugins", params: {} };
  }
  if (routePathname === "/automations") {
    return { pathname: "/automations", params: {} };
  }
  const automationMatch = routePathname.match(/^\/automations\/([^/]+)$/);
  if (automationMatch) {
    return {
      pathname: "/automations/$automationId",
      params: { automationId: decodeURIComponent(automationMatch[1]) },
    };
  }
  if (routePathname === "/update") {
    return { pathname: "/update", params: {} };
  }
  return { pathname: "/", params: {} };
}

export function useRoute(
  initialPathname: string | null = null,
): readonly [RouteState, (route: RouteState) => void] {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRoute(initialPathname ?? history.location.href),
  );
  useEffect(() => {
    return history.subscribe(({ location }) => {
      setRoute(parseRoute(location.href));
    });
  }, []);
  return [route, setRoute] as const;
}

function useMemoryNavigationState(): MemoryNavigationState {
  const readState = () =>
    resolveMemoryNavigationState({
      length: history.length,
      state: history.location.state,
    });
  const [navigation, setNavigation] = useState(readState);
  useEffect(() => history.subscribe(() => setNavigation(readState())), []);
  return navigation;
}

function useProviderHealthBanner(
  provider: ProviderKind,
  providerStatuses: readonly ServerProviderStatus[],
): {
  readonly dismiss: () => void;
  readonly status: ServerProviderStatus | null;
} {
  const status = findProviderStatus(providerStatuses, provider);
  const presentation = resolveProviderHealthBannerPresentation(status);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const dismiss = useCallback(() => {
    setDismissedKey(presentation?.key ?? null);
  }, [presentation?.key]);

  return {
    dismiss,
    status: presentation?.key === dismissedKey ? null : status,
  };
}

// --- pages ----------------------------------------------------------------------
function ThreadsLandingHeader(props: {
  // Omitted when the page has no environment to toggle (e.g. Studio bootstrapping).
  readonly environment?: {
    readonly open: boolean;
    readonly onOpenChange: (open: boolean) => void;
  };
  // Landing projects come from the shell snapshot, where `kind` is optional.
  readonly project:
    | (Pick<ProjectSummary, "id" | "workspaceRoot" | "defaultModelSelection" | "scripts"> & {
        readonly kind?: ProjectSummary["kind"];
      })
    | null;
  readonly title?: "New Chat" | "New thread";
  readonly diffToggle?: ReactNode;
  readonly compact?: boolean;
}) {
  const project = props.project;
  return (
    <ChatSurfaceHeaderFrame className="ThreadsLandingHeader">
      <view className="ThreadsLandingHeaderIdentity">
        <ChatSurfaceHeaderIdentity title={props.title ?? "New Chat"} />
      </view>
      <view className="ThreadHeaderControls">
        <ThreadHeaderActions
          actionState={{ showHandoff: true, showProjectActions: project?.kind === "project" }}
          compact={props.compact ?? false}
          project={
            project
              ? {
                  id: project.id,
                  cwd: project.workspaceRoot,
                  defaultModelSelection: project.defaultModelSelection,
                  scripts: project.scripts,
                }
              : null
          }
          thread={undefined}
          onNavigateToThread={() => {}}
          onOpenTerminal={() => {}}
        />
        {props.environment ? (
          <EnvironmentToggle
            open={props.environment.open}
            onChange={props.environment.onOpenChange}
          />
        ) : null}
        {props.diffToggle ?? (
          <ThreadDiffToggle open={false} disabled stats={null} onToggle={() => {}} />
        )}
      </view>
    </ChatSurfaceHeaderFrame>
  );
}

function ThreadsLandingPage(props: {
  readonly appearance: SettingsAppearanceValues;
  readonly containerKind?: "chat" | "studio";
  readonly explorerDockProps: ExplorerDockProps;
  readonly initialProjectId?: string | null;
  readonly onDockWorkspaceChange: (workspaceRoot: string | null) => void;
  readonly onThreadCreated: (threadId: string, options: { readonly temporary: boolean }) => void;
  readonly resolvedTheme: "dark" | "light";
  readonly viewportHeight: number;
  readonly viewportWidth: number;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    props.initialProjectId ?? null,
  );
  const [environmentOpen, setEnvironmentOpen] = useState(false);
  const [branch, setBranch] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [temporary, setTemporary] = useState(false);
  const initData = useInitData() as {
    readonly initialComposerModelProvider?: unknown;
  };
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const [envMode, setEnvMode] = useState<"local" | "worktree">(
    generalSettings.defaultThreadEnvMode,
  );
  const envModeTouchedRef = useRef(false);
  const initialModelProvider = resolveLandingModelProvider(
    initData.initialComposerModelProvider,
    generalSettings.defaultProvider,
  );
  const { data: landingBootstrap } = useQuery({
    queryKey: ["landing-composer-bootstrap", initialModelProvider, props.containerKind ?? "chat"],
    queryFn: () => loadLandingBootstrap(initialModelProvider, props.containerKind ?? "chat"),
    staleTime: 30_000,
  });
  const providerStatuses = landingBootstrap?.serverConfig.providers ?? [];
  const providerHealth = useProviderHealthBanner(initialModelProvider, providerStatuses);
  const routePresentation = resolveLandingRoutePresentation({
    initialProjectId: selectedProjectId,
    projects: landingBootstrap?.projects ?? [],
  });
  const selectedProject = selectedProjectId
    ? (landingBootstrap?.projects.find((project) => project.id === selectedProjectId) ?? null)
    : null;
  const environmentProject = selectedProject ?? landingBootstrap?.homeProject ?? null;
  const environmentVisible = environmentOpen && environmentProject !== null;
  useEffect(() => {
    if (!envModeTouchedRef.current && landingBootstrap?.generalSettings.defaultThreadEnvMode) {
      setEnvMode(landingBootstrap.generalSettings.defaultThreadEnvMode);
    }
  }, [landingBootstrap?.generalSettings.defaultThreadEnvMode]);
  const landingThreadId = landingDraftId(props.containerKind);
  // Web: the landing is the draft thread, so its header diff toggle and right
  // dock work on the project before the first message.
  const dockWorkspaceRoot = environmentProject?.workspaceRoot || null;
  const { onDockWorkspaceChange } = props;
  useEffect(() => {
    onDockWorkspaceChange(dockWorkspaceRoot);
  }, [dockWorkspaceRoot, onDockWorkspaceChange]);
  useEffect(() => () => onDockWorkspaceChange(null), [onDockWorkspaceChange]);
  const [rightDockState, updateRightDockState] = usePersistedRightDockState(landingThreadId);
  const [explorerPresentationMode, setExplorerPresentationMode] = useState<"dock" | "single-file">(
    "dock",
  );
  const [diffFileTreeOpen, setDiffFileTreeOpen] = useState(false);
  const activeDockPane = resolveActivePane(rightDockState);
  const dockOpen = rightDockState.open && Boolean(rightDockState.activePaneId);
  const diffOpen = rightDockState.open && activeDockPane?.kind === "diff";
  const explorerOpen =
    rightDockState.open && (activeDockPane?.kind === "explorer" || activeDockPane?.kind === "file");
  const terminalOpen = rightDockState.open && activeDockPane?.kind === "terminal";
  const dockLayout = useRightDockLayout({
    dockOpen,
    initialDockWidth: null,
    viewportWidth: props.viewportWidth,
  });
  const headerDiff = useWorkspaceHeaderDiff({ workspaceRoot: dockWorkspaceRoot, diffOpen });
  const headerActionState = resolveThreadHeaderActionState({
    diffDisabledReason:
      dockWorkspaceRoot && headerDiff.isPending ? "Checking Git repository…" : null,
    diffOpen,
    diffTotals: headerDiff.totals,
    environmentEnabled: environmentProject !== null,
    hasProject: environmentProject !== null,
    hasProjectActionSurface: selectedProject?.kind === "project",
    isGitRepo: headerDiff.isGitRepo,
    gitActionsAvailable: true,
    surface: { kind: "thread", layout: "single", primary: "chat", sidechat: false },
  });
  return (
    <view
      className={`ThreadsLanding${environmentVisible ? " ThreadsLanding--environment-open" : ""}`}
      bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
        const width = event.detail?.width;
        if (typeof width === "number" && width > 0) dockLayout.setPageWidth(width);
      }}
    >
      <view
        className="ThreadsLandingMain"
        style={
          dockLayout.effectiveDockWidth !== null
            ? { width: `${dockLayout.mainWidth}px` }
            : undefined
        }
      >
        <ThreadsLandingHeader
          environment={
            environmentProject !== null
              ? { open: environmentOpen, onOpenChange: setEnvironmentOpen }
              : undefined
          }
          project={selectedProject}
          title={routePresentation.headerTitle}
          // Same rule as the thread page header (compactThreadHeader).
          compact={dockLayout.mainWidth < 700}
          diffToggle={
            headerActionState.showDiff ? (
              <ThreadDiffToggle
                open={diffOpen}
                disabled={headerActionState.diffDisabled}
                stats={headerActionState.diffStats}
                onToggle={() => {
                  setEnvironmentOpen(false);
                  updateRightDockState((current) =>
                    diffOpen
                      ? setDockOpenInState(current, false)
                      : openPaneInState(current, { paneId: "diff", kind: "diff" }),
                  );
                }}
              />
            ) : null
          }
        />
        <ProviderHealthBanner status={providerHealth.status} onDismiss={providerHealth.dismiss} />
        <scroll-view className="ThreadsLandingBody" scroll-orientation="vertical">
          <view className="ThreadsLandingBodyInner">
            <CenteredEmptyLandingStack>
              <CenteredEmptyLanding projectName={routePresentation.projectName} />
              <ComposerColumnFrameSurface>
                <LandingComposer
                  availableWidth={dockLayout.mainWidth}
                  containerKind={props.containerKind}
                  branch={branch}
                  envMode={envMode}
                  initialModelProvider={initialModelProvider}
                  initialProjectId={selectedProjectId}
                  notes={notes}
                  onEnvModeChange={(nextEnvMode) => {
                    envModeTouchedRef.current = true;
                    setEnvMode(nextEnvMode);
                  }}
                  onProjectSelectionChange={setSelectedProjectId}
                  onTemporaryChange={() => setTemporary((current) => !current)}
                  onThreadCreated={props.onThreadCreated}
                  temporary={temporary}
                />
              </ComposerColumnFrameSurface>
            </CenteredEmptyLandingStack>
          </view>
        </scroll-view>
        {environmentProject ? (
          <EnvironmentPanel
            branch={branch}
            bootstrapOnly={false}
            initialData={null}
            envMode={envMode}
            notes={notes}
            onBranchChange={setBranch}
            onNotesChange={setNotes}
            onOpenSettings={() => history.push("/settings/general")}
            onJumpToPinnedMessage={() => {}}
            onOpenChanges={() => {}}
            onOpenEditorView={() => {}}
            open={environmentVisible}
            pinnedMessages={[]}
            pinnedMessageTextById={{}}
            projectId={environmentProject.id}
            provider={initialModelProvider}
            pullRequest={null}
            recapRevision="0:empty:0:settled:no-turn"
            threadId={null}
            threadMarkers={[]}
            workspaceRoot={environmentProject.workspaceRoot}
          />
        ) : null}
      </view>
      <ThreadRightDocks
        {...props.explorerDockProps}
        chatFontSizePx={props.appearance.chatFontSizePx}
        diffOpen={diffOpen}
        dockThread={
          dockWorkspaceRoot
            ? {
                id: landingThreadId,
                workspaceRoot: dockWorkspaceRoot,
                checkpoints: [],
                sidechatSource: null,
              }
            : undefined
        }
        explorerOpen={explorerOpen}
        explorerPresentationMode={explorerPresentationMode}
        initialDiffFileTreeOpen={diffFileTreeOpen}
        initialExplorerActionMenuOpen={false}
        initialExplorerCommentLine={null}
        initialExplorerWidth={null}
        onDiffFileTreeOpenChange={setDiffFileTreeOpen}
        resolvedTheme={props.resolvedTheme}
        rightDockState={rightDockState}
        setExplorerPresentationMode={setExplorerPresentationMode}
        setRightDockWidth={dockLayout.setDockWidth}
        terminalFontFamily={props.appearance.terminalFontFamily}
        terminalFontSizePx={props.appearance.terminalFontSizePx}
        terminalOpen={terminalOpen}
        threadPageWidth={dockLayout.pageWidth}
        timestampFormat={props.appearance.timestampFormat}
        updateRightDockState={updateRightDockState}
        viewportHeight={props.viewportHeight}
        viewportWidth={props.viewportWidth}
      />
    </view>
  );
}

type ExplorerDockProps = Pick<
  ThreadPageProps,
  | "explorerEntries"
  | "explorerEntriesError"
  | "explorerEntriesPending"
  | "explorerEntriesTruncated"
  | "explorerDirectoryEntries"
  | "explorerDirectoryErrors"
  | "explorerDirectoryPending"
  | "explorerExpandedDirectories"
  | "explorerFile"
  | "explorerFileError"
  | "explorerFilePending"
  | "explorerFileRetrying"
  | "explorerFileSyntaxHighlight"
  | "explorerLocalPreviewUrl"
  | "explorerLocalPreviewError"
  | "explorerLocalPreviewPending"
  | "explorerPdfPageCount"
  | "explorerPdfPageHeight"
  | "explorerPdfPageWidth"
  | "explorerPdfMetadataError"
  | "explorerPdfMetadataPending"
  | "explorerQuery"
  | "explorerSelectedPath"
  | "onExplorerQueryChange"
  | "onExplorerRetryFile"
  | "onExplorerSelectPath"
  | "onExplorerToggleDirectory"
>;

interface ThreadPageProps {
  readonly appearance: SettingsAppearanceValues;
  readonly currentThread: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
  readonly data: Awaited<ReturnType<typeof fetchThreadTranscriptRows>> | undefined;
  readonly error: unknown;
  readonly environmentData: EnvironmentBootstrapData | null;
  readonly explorerEntries: Awaited<ReturnType<typeof fetchExplorerEntries>>["entries"];
  readonly explorerEntriesError: boolean;
  readonly explorerEntriesPending: boolean;
  readonly explorerEntriesTruncated: boolean;
  readonly explorerDirectoryEntries: Readonly<Record<string, ExplorerEntriesResult["entries"]>>;
  readonly explorerDirectoryErrors: ReadonlySet<string>;
  readonly explorerDirectoryPending: ReadonlySet<string>;
  readonly explorerExpandedDirectories: ReadonlySet<string>;
  readonly explorerFile: Awaited<ReturnType<typeof fetchExplorerFile>>["file"] | null;
  readonly explorerFileError: boolean;
  readonly explorerFilePending: boolean;
  readonly explorerFileRetrying: boolean;
  readonly explorerFileSyntaxHighlight: Awaited<
    ReturnType<typeof fetchExplorerFile>
  >["syntaxHighlight"];
  readonly explorerLocalPreviewUrl: string | null;
  readonly explorerLocalPreviewError: boolean;
  readonly explorerLocalPreviewPending: boolean;
  readonly explorerPdfPageCount: number;
  readonly explorerPdfPageHeight: number;
  readonly explorerPdfPageWidth: number;
  readonly explorerPdfMetadataError: boolean;
  readonly explorerPdfMetadataPending: boolean;
  readonly explorerQuery: string;
  readonly explorerSelectedPath: string | null;
  readonly initialEnvironmentOpen: boolean;
  readonly initialDiffOpen: boolean;
  readonly initialDiffTurnId: TurnId | null;
  readonly initialDiffFilePath: string | null;
  readonly initialDiffFileTreeOpen: boolean;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: "file" | "diff" | null;
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorSearchOpen: boolean;
  readonly initialEditorProjectMenuOpen: boolean;
  readonly initialWorkingTreeDiff: GitReadWorkingTreeDiffResult | null;
  readonly initialWorkingTreeDiffUnavailableLabel: string | null;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialTemporaryOpen: boolean;
  readonly initialExplorerWidth: number | null;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerPresentationMode: "dock" | "single-file";
  readonly initialExplorerActionMenuOpen: boolean;
  readonly initialExplorerCommentLine: number | null;
  readonly isPending: boolean;
  readonly onExplorerQueryChange: (query: string) => void;
  readonly onExplorerRetryFile: () => void;
  readonly onExplorerSelectPath: (path: string) => void;
  readonly onExplorerToggleDirectory: (path: string) => void;
  readonly onEditorModeChange: (open: boolean) => void;
  readonly onNavigateToThread: (threadId: string) => void;
  readonly projects: readonly Project[];
  readonly threadId: string;
  readonly threads: readonly ThreadSummary[];
  readonly resolvedTheme: "dark" | "light";
  readonly viewportWidth: number;
  readonly viewportHeight: number;
}

/** What the right dock needs from its thread (a draft on the new-thread landing). */
interface RightDockThread {
  readonly id: string;
  readonly workspaceRoot: string | null;
  readonly checkpoints: NonNullable<ThreadPageProps["currentThread"]>["checkpoints"];
  /** The thread a side chat forks from; null where side chats are unavailable. */
  readonly sidechatSource: NonNullable<ThreadPageProps["currentThread"]> | null;
}

function ThreadRightDocks(
  props: Pick<
    ThreadPageProps,
    | "explorerDirectoryEntries"
    | "explorerDirectoryErrors"
    | "explorerDirectoryPending"
    | "explorerEntries"
    | "explorerEntriesError"
    | "explorerEntriesPending"
    | "explorerEntriesTruncated"
    | "explorerExpandedDirectories"
    | "explorerFile"
    | "explorerFileError"
    | "explorerFilePending"
    | "explorerFileRetrying"
    | "explorerFileSyntaxHighlight"
    | "explorerLocalPreviewError"
    | "explorerLocalPreviewPending"
    | "explorerLocalPreviewUrl"
    | "explorerPdfPageCount"
    | "explorerPdfPageHeight"
    | "explorerPdfPageWidth"
    | "explorerPdfMetadataError"
    | "explorerPdfMetadataPending"
    | "explorerQuery"
    | "explorerSelectedPath"
    | "initialExplorerWidth"
    | "initialExplorerCommentLine"
    | "initialExplorerActionMenuOpen"
    | "initialDiffFileTreeOpen"
    | "onExplorerQueryChange"
    | "onExplorerRetryFile"
    | "onExplorerSelectPath"
    | "onExplorerToggleDirectory"
    | "resolvedTheme"
    | "viewportWidth"
  > & {
    readonly dockThread: RightDockThread | undefined;
    readonly diffOpen: boolean;
    readonly explorerOpen: boolean;
    readonly terminalOpen: boolean;
    readonly terminalFontFamily: string;
    readonly terminalFontSizePx: number;
    readonly chatFontSizePx: number;
    readonly timestampFormat: "locale" | "12-hour" | "24-hour";
    readonly viewportHeight: number;
    readonly explorerPresentationMode: "dock" | "single-file";
    readonly rightDockState: RightDockThreadState;
    readonly onDiffFileTreeOpenChange: (open: boolean) => void;
    readonly threadPageWidth: number;
    readonly setRightDockWidth: (width: number | null) => void;
    readonly setExplorerPresentationMode: (mode: "dock" | "single-file") => void;
    readonly updateRightDockState: (
      transform: (state: RightDockThreadState) => RightDockThreadState,
    ) => void;
  },
) {
  const [sidechatCreateError, setSidechatCreateError] = useState<string | null>(null);
  const [paneLabelOverrides, setPaneLabelOverrides] = useState<Readonly<Record<string, string>>>(
    {},
  );
  const [hydratedTerminalKey, setHydratedTerminalKey] = useState<string | null>(null);
  const [terminalCloseRequestVersion, setTerminalCloseRequestVersion] = useState(0);
  const { data: browserViewState } = useQuery({
    queryKey: ["browser-view-capability"],
    queryFn: () => {
      "background only";
      return browserView.getState();
    },
    staleTime: Number.POSITIVE_INFINITY,
  });
  const browserSupported = browserViewState?.supported === true;
  const {
    dockThread,
    diffOpen,
    explorerDirectoryEntries,
    explorerDirectoryErrors,
    explorerDirectoryPending,
    explorerEntries,
    explorerEntriesError,
    explorerEntriesPending,
    explorerEntriesTruncated,
    explorerExpandedDirectories,
    explorerFile,
    explorerFileError,
    explorerFilePending,
    explorerFileRetrying,
    explorerFileSyntaxHighlight,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerLocalPreviewUrl,
    explorerPdfPageCount,
    explorerPdfPageHeight,
    explorerPdfPageWidth,
    explorerPdfMetadataError,
    explorerPdfMetadataPending,
    explorerOpen,
    terminalOpen,
    terminalFontFamily,
    terminalFontSizePx,
    chatFontSizePx,
    timestampFormat,
    viewportHeight,
    explorerPresentationMode,
    rightDockState,
    explorerQuery,
    explorerSelectedPath,
    initialExplorerWidth,
    initialExplorerCommentLine,
    initialExplorerActionMenuOpen,
    initialDiffFileTreeOpen,
    onDiffFileTreeOpenChange,
    onExplorerQueryChange,
    onExplorerRetryFile,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
    resolvedTheme,
    setRightDockWidth,
    setExplorerPresentationMode,
    updateRightDockState,
    threadPageWidth,
    viewportWidth,
  } = props;
  useEffect(() => {
    "background only";
    let cancelled = false;
    let dispose: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ onGlobalEvent }) => {
        if (cancelled) return;
        dispose = onGlobalEvent("shell:command", (command: unknown) => {
          if (command !== "browser.toggle" || !browserSupported) return;
          updateRightDockState((current) => {
            const active = resolveActivePane(current);
            return current.open && active?.kind === "browser"
              ? setDockOpenInState(current, false)
              : openPaneInState(current, {
                  paneId: "browser",
                  kind: "browser",
                });
          });
        });
      })
      .catch(() => undefined);
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, [browserSupported, updateRightDockState]);
  const availableWidth = threadPageWidth || viewportWidth;
  const activePane = resolveActivePane(rightDockState);
  const terminalPane = rightDockState.panes.find((pane) => pane.kind === "terminal");
  const browserPane = rightDockState.panes.find((pane) => pane.kind === "browser");
  const browserOpen = rightDockState.open && activePane?.kind === "browser";
  const gitOpen = rightDockState.open && activePane?.kind === "git";
  const terminalKey = terminalPane ? `${dockThread?.id ?? ""}\0${terminalPane.id}` : null;
  const terminalHydrated =
    terminalOpen || (terminalKey !== null && hydratedTerminalKey === terminalKey);
  useEffect(() => {
    if (terminalOpen && terminalKey !== null) {
      setHydratedTerminalKey(terminalKey);
    }
  }, [terminalKey, terminalOpen]);
  const dockTabs = (
    <ThreadRightDockTabs
      activePaneId={rightDockState.activePaneId}
      paneLabelOverrides={paneLabelOverrides}
      addMenuKinds={
        dockThread?.workspaceRoot
          ? dockThread.sidechatSource
            ? [
                ...(browserSupported ? ["browser" as const] : []),
                "diff",
                "explorer",
                "terminal",
                "sidechat",
                "git",
              ]
            : [
                ...(browserSupported ? ["browser" as const] : []),
                "diff",
                "explorer",
                "terminal",
                "git",
              ]
          : dockThread?.sidechatSource
            ? [...(browserSupported ? ["browser" as const] : []), "diff", "explorer", "sidechat"]
            : [...(browserSupported ? ["browser" as const] : []), "diff", "explorer"]
      }
      panes={rightDockState.panes.filter(
        (pane) =>
          pane.kind === "browser" ||
          pane.kind === "diff" ||
          pane.kind === "explorer" ||
          pane.kind === "file" ||
          pane.kind === "terminal" ||
          pane.kind === "sidechat" ||
          pane.kind === "git",
      )}
      onAddPane={(kind) => {
        "background only";
        if (kind === "sidechat") {
          const source = dockThread?.sidechatSource;
          if (!source) return;
          const sidechatThreadId = newThreadId();
          setSidechatCreateError(null);
          void dispatchSynaraCommand(
            buildLynxSidechatCreateCommand({
              commandId: newCommandId(),
              createdAt: new Date().toISOString(),
              source,
              threadId: sidechatThreadId,
            }),
          )
            .then(async () => {
              await queryClient.invalidateQueries({ queryKey: ["threads"] });
              await queryClient.invalidateQueries({
                queryKey: ["thread-detail", sidechatThreadId],
              });
              updateRightDockState((current) =>
                openPaneInState(current, {
                  paneId: "sidechat:" + sidechatThreadId,
                  kind: "sidechat",
                  threadId: sidechatThreadId,
                }),
              );
            })
            .catch((error) =>
              setSidechatCreateError(error instanceof Error ? error.message : String(error)),
            );
          return;
        }
        if (kind === "explorer") setExplorerPresentationMode("dock");
        updateRightDockState((current) => openPaneInState(current, { paneId: kind, kind }));
      }}
      onClosePane={(paneId) => {
        const pane = rightDockState.panes.find((candidate) => candidate.id === paneId);
        if (pane?.kind === "terminal") {
          if (!terminalHydrated) {
            updateRightDockState((current) => closePaneInState(current, paneId));
            return;
          }
          setTerminalCloseRequestVersion((current) => current + 1);
          return;
        }
        updateRightDockState((current) => closePaneInState(current, paneId));
      }}
      onCollapse={() => updateRightDockState((current) => setDockOpenInState(current, false))}
      onSelectPane={(paneId) =>
        updateRightDockState((current) => setActivePaneInState(current, paneId))
      }
    />
  );
  return (
    <ThreadRightDockHost
      availableWidth={availableWidth}
      onWidthChange={setRightDockWidth}
      open={rightDockState.open && Boolean(rightDockState.activePaneId)}
      tabs={dockTabs}
    >
      {diffOpen ? (
        <DiffDock
          availableWidth={availableWidth}
          open={diffOpen}
          initialFileTreeOpen={initialDiffFileTreeOpen}
          initialDiffSource={activePane?.diffTurnId ? `turn:${activePane.diffTurnId}` : undefined}
          initialSelectedFilePath={activePane?.diffFilePath}
          checkpoints={dockThread?.checkpoints ?? []}
          onFileTreeOpenChange={onDiffFileTreeOpenChange}
          presentation="hosted"
          threadId={dockThread?.id ?? ""}
          workspaceRoot={dockThread?.workspaceRoot ?? null}
          onClose={() => {
            updateRightDockState((current) => {
              const pane = current.panes.find((candidate) => candidate.kind === "diff");
              return pane ? closePaneInState(current, pane.id) : current;
            });
          }}
          onWidthChange={() => {}}
        />
      ) : null}
      {explorerOpen ? (
        <ExplorerDock
          availableWidth={availableWidth}
          entries={explorerEntries}
          entriesError={explorerEntriesError}
          entriesPending={explorerEntriesPending}
          entriesTruncated={explorerEntriesTruncated}
          directoryEntries={explorerDirectoryEntries}
          directoryErrors={explorerDirectoryErrors}
          directoryPending={explorerDirectoryPending}
          expandedDirectories={explorerExpandedDirectories}
          initialWidth={initialExplorerWidth}
          initialCommentLine={initialExplorerCommentLine}
          initialActionMenuOpen={initialExplorerActionMenuOpen}
          file={explorerFile}
          fileError={explorerFileError}
          filePending={explorerFilePending}
          fileRetrying={explorerFileRetrying}
          fileSyntaxHighlight={explorerFileSyntaxHighlight}
          localPreviewUrl={explorerLocalPreviewUrl}
          localPreviewError={explorerLocalPreviewError}
          localPreviewPending={explorerLocalPreviewPending}
          pdfPageCount={explorerPdfPageCount}
          pdfPageHeight={explorerPdfPageHeight}
          pdfPageWidth={explorerPdfPageWidth}
          pdfMetadataError={explorerPdfMetadataError}
          pdfMetadataPending={explorerPdfMetadataPending}
          open={explorerOpen}
          hosted
          presentationMode={explorerPresentationMode}
          query={explorerQuery}
          selectedPath={explorerSelectedPath}
          threadId={dockThread?.id ?? ""}
          theme={resolvedTheme}
          workspaceRoot={dockThread?.workspaceRoot ?? null}
          onWidthChange={() => {}}
          onQueryChange={onExplorerQueryChange}
          onRetryFile={onExplorerRetryFile}
          onSelectPath={onExplorerSelectPath}
          onToggleDirectory={onExplorerToggleDirectory}
          onClose={() => {
            updateRightDockState((current) => {
              const pane = current.panes.find((candidate) => candidate.id === current.activePaneId);
              return pane ? closePaneInState(current, pane.id) : current;
            });
          }}
        />
      ) : null}
      {terminalPane && terminalHydrated && dockThread?.workspaceRoot ? (
        <view
          className={`ThreadRightDockTerminalPane${
            terminalOpen ? "" : " ThreadRightDockTerminalPane--hidden"
          }`}
        >
          <DockTerminalPane
            isActive={terminalOpen}
            closeRequestVersion={terminalCloseRequestVersion}
            fontFamily={terminalFontFamily}
            fontSizePx={terminalFontSizePx}
            threadId={dockThread.id}
            workspaceRoot={dockThread.workspaceRoot}
            onClosePane={() => {
              updateRightDockState((current) => {
                const pane = current.panes.find((candidate) => candidate.kind === "terminal");
                return pane ? closePaneInState(current, pane.id) : current;
              });
            }}
          />
        </view>
      ) : null}
      {gitOpen && dockThread?.workspaceRoot ? (
        <GitDockPane
          threadId={dockThread.id}
          workspaceRoot={dockThread.workspaceRoot}
          onClose={() => {
            updateRightDockState((current) => {
              const pane = current.panes.find((candidate) => candidate.kind === "git");
              return pane ? closePaneInState(current, pane.id) : current;
            });
          }}
        />
      ) : null}
      {browserPane && dockThread ? (
        <BrowserDockPane
          key={dockThread.id}
          active={browserOpen}
          supported={browserSupported}
          threadId={dockThread.id}
          onClose={() => {
            updateRightDockState((current) => closePaneInState(current, browserPane.id));
          }}
          onTitleChange={(title) => {
            if (!title || paneLabelOverrides[browserPane.id] === title) return;
            setPaneLabelOverrides((current) => ({
              ...current,
              [browserPane.id]: title,
            }));
          }}
        />
      ) : null}
      {rightDockState.open && activePane?.kind === "sidechat" ? (
        activePane.threadId ? (
          <EmbeddedSidechatPane
            chatFontSizePx={chatFontSizePx}
            threadId={activePane.threadId}
            timestampFormat={timestampFormat}
            viewportHeight={viewportHeight}
            viewportWidth={availableWidth}
            onTitleChange={(title) => {
              setPaneLabelOverrides((current) =>
                current[activePane.id] === title ? current : { ...current, [activePane.id]: title },
              );
            }}
            onClose={() =>
              updateRightDockState((current) => closePaneInState(current, activePane.id))
            }
          />
        ) : (
          <PanelStateMessage fill="flex" intent="alert">
            Side thread is unavailable.
          </PanelStateMessage>
        )
      ) : null}
      {sidechatCreateError ? (
        <view className="ThreadRightDockCreateError">
          <text>{sidechatCreateError}</text>
        </view>
      ) : null}
    </ThreadRightDockHost>
  );
}

function EditorActivityItem(props: {
  readonly active: boolean;
  readonly children: ReactNode;
  readonly label: string;
  readonly onActivate: () => void;
}) {
  const interaction = useLynxInteractiveState({
    baseClassName: `ThreadEditorActivityItem${
      props.active ? " ThreadEditorActivityItem--active" : ""
    }`,
    accessibleLabel: props.label,
    accessibilityValue: props.active ? "Selected" : "Not selected",
    onActivate: props.onActivate,
  });
  return (
    <view className={interaction.className} {...interaction.eventProps}>
      <view
        className={`ThreadEditorActivityIndicator${
          props.active ? " ThreadEditorActivityIndicator--active" : ""
        }`}
      />
      {props.children}
    </view>
  );
}

function ThreadPage(props: ThreadPageProps) {
  const { semanticIconColor } = useTheme();
  const initData = useInitData() as {
    readonly initialEditorHistoryOpen?: unknown;
    readonly initialEditorNewChatOpen?: unknown;
    readonly initialEditorNewOpen?: unknown;
  };
  const {
    appearance,
    currentThread,
    data,
    error,
    environmentData,
    explorerEntries,
    explorerEntriesError,
    explorerEntriesPending,
    explorerEntriesTruncated,
    explorerDirectoryEntries,
    explorerDirectoryErrors,
    explorerDirectoryPending,
    explorerExpandedDirectories,
    explorerFile,
    explorerFileError,
    explorerFilePending,
    explorerFileRetrying,
    explorerFileSyntaxHighlight,
    explorerLocalPreviewUrl,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerPdfPageCount,
    explorerPdfPageHeight,
    explorerPdfPageWidth,
    explorerPdfMetadataError,
    explorerPdfMetadataPending,
    explorerQuery,
    explorerSelectedPath,
    initialEnvironmentOpen,
    initialEditorOpen,
    initialEditorCenterMode,
    initialEditorChatOpen,
    initialEditorSearchOpen,
    initialEditorProjectMenuOpen,
    initialWorkingTreeDiff,
    initialWorkingTreeDiffUnavailableLabel,
    initialRenameOpen,
    initialTerminalOpen,
    initialTemporaryOpen,
    initialExplorerWidth,
    initialExplorerCommentLine,
    initialExplorerActionMenuOpen,
    initialExplorerOpen,
    initialExplorerPresentationMode,
    isPending,
    onExplorerQueryChange,
    onExplorerRetryFile,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
    onEditorModeChange,
    onNavigateToThread,
    threadId,
    threads,
    resolvedTheme,
    viewportWidth,
    viewportHeight,
  } = props;
  const { temporary, toggleTemporary } = useTemporaryThreadLifecycle(
    threadId,
    initialTemporaryOpen,
  );
  const terminalPrimaryState = useTerminalStateStore((state) =>
    selectThreadTerminalState(
      state.terminalStateByThreadId,
      threadId as import("@synara/contracts").ThreadId,
    ),
  );
  const terminalPrimary =
    terminalPrimaryState.entryPoint === "terminal" &&
    terminalPrimaryState.workspaceLayout === "terminal-only";
  const [providerStatuses, setProviderStatuses] = useState<readonly ServerProviderStatus[]>([]);
  const environmentSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const [environmentUserOverride, setEnvironmentUserOverride] = useState<boolean | null>(
    initialEnvironmentOpen ? true : null,
  );
  const [diffFileTreeOpen, setDiffFileTreeOpen] = useState(props.initialDiffFileTreeOpen);
  const [rightDockState, setRightDockState] = useState<RightDockThreadState>(() => {
    const stored = readRightDockThreadState(threadId);
    const withDiff =
      props.initialDiffOpen && !initialEditorOpen
        ? openPaneInState(stored, {
            paneId: "diff",
            kind: "diff",
            diffTurnId: props.initialDiffTurnId,
            diffFilePath: props.initialDiffFilePath,
          })
        : stored;
    const withExplorer = initialExplorerOpen
      ? openPaneInState(
          withDiff,
          initialExplorerPresentationMode === "single-file"
            ? {
                paneId: `file:${explorerSelectedPath ?? "empty"}`,
                kind: "file",
                filePath: explorerSelectedPath,
              }
            : { paneId: "explorer", kind: "explorer" },
        )
      : withDiff;
    return initialTerminalOpen && !initialEditorOpen
      ? openPaneInState(withExplorer, {
          paneId: "terminal",
          kind: "terminal",
        })
      : withExplorer;
  });
  const rightDockThreadIdRef = useRef(threadId);
  const activeRightDockPane = resolveActivePane(rightDockState);
  const diffOpen = rightDockState.open && activeRightDockPane?.kind === "diff";
  const explorerOpen =
    rightDockState.open &&
    (activeRightDockPane?.kind === "explorer" || activeRightDockPane?.kind === "file");
  const updateRightDockState = useCallback(
    (transform: (state: RightDockThreadState) => RightDockThreadState) => {
      setRightDockState((current) => {
        const next = transform(current);
        if (next !== current) storeRightDockThreadState(threadId, next);
        return next;
      });
    },
    [threadId],
  );
  const setDiffOpen = useCallback(
    (open: boolean) =>
      updateRightDockState((current) =>
        open
          ? openPaneInState(current, { paneId: "diff", kind: "diff" })
          : setDockOpenInState(current, false),
      ),
    [updateRightDockState],
  );
  const openTurnDiff = useCallback(
    (turnId: string) => {
      updateRightDockState((current) =>
        openPaneInState(current, {
          paneId: "diff",
          kind: "diff",
          diffTurnId: turnId as never,
        }),
      );
    },
    [updateRightDockState],
  );
  const setExplorerOpen = useCallback(
    (open: boolean) =>
      updateRightDockState((current) =>
        open
          ? openPaneInState(current, { paneId: "explorer", kind: "explorer" })
          : setDockOpenInState(current, false),
      ),
    [updateRightDockState],
  );
  const [explorerPresentationMode, setExplorerPresentationMode] = useState<"dock" | "single-file">(
    initialExplorerPresentationMode,
  );
  useEffect(() => {
    if (activeRightDockPane?.kind === "file" && activeRightDockPane.filePath) {
      if (explorerSelectedPath !== activeRightDockPane.filePath) {
        onExplorerSelectPath(activeRightDockPane.filePath);
      }
      setExplorerPresentationMode("single-file");
    } else if (activeRightDockPane?.kind === "explorer") {
      setExplorerPresentationMode("dock");
    }
  }, [
    activeRightDockPane?.filePath,
    activeRightDockPane?.kind,
    explorerSelectedPath,
    onExplorerSelectPath,
  ]);
  useEffect(() => {
    if (rightDockThreadIdRef.current === threadId) return;
    rightDockThreadIdRef.current = threadId;
    setRightDockState(readRightDockThreadState(threadId));
  }, [threadId]);
  useEffect(() => {
    if (activeRightDockPane?.kind === "file" && activeRightDockPane.filePath) {
      if (explorerSelectedPath !== activeRightDockPane.filePath) {
        onExplorerSelectPath(activeRightDockPane.filePath);
      }
      setExplorerPresentationMode("single-file");
    } else if (activeRightDockPane?.kind === "explorer") {
      setExplorerPresentationMode("dock");
    }
  }, [
    activeRightDockPane?.filePath,
    activeRightDockPane?.kind,
    explorerSelectedPath,
    onExplorerSelectPath,
  ]);
  const terminalOpen = rightDockState.open && activeRightDockPane?.kind === "terminal";
  const setTerminalOpen = useCallback(
    (open: boolean) =>
      updateRightDockState((current) =>
        open
          ? openPaneInState(current, { paneId: "terminal", kind: "terminal" })
          : setDockOpenInState(current, false),
      ),
    [updateRightDockState],
  );
  useEffect(() => {
    "background only";
    const handleIntent = async () => {
      const intent = consumeOpenThreadPathInTerminal(threadId);
      if (!intent) return;
      const scopeId = dockTerminalThreadId(threadId as never);
      const terminalStore = useTerminalStateStore.getState();
      const state = selectThreadTerminalState(terminalStore.terminalStateByThreadId, scopeId);
      const { shouldCreateNewTerminal, terminalId } = resolveOpenThreadPathTerminalTarget({
        activeTerminalId: state.activeTerminalId,
        createTerminalId: () =>
          "terminal-" + Date.now() + "-" + Math.random().toString(16).slice(2),
        runningTerminalIds: state.runningTerminalIds,
        terminalIds: state.terminalIds,
        terminalOpen: state.terminalOpen,
      });
      const previousTerminalOpen = state.terminalOpen;
      const previousPresentationMode = state.presentationMode;
      const previousActiveTerminalId = state.activeTerminalId;
      const previousRightDockState = rightDockState;
      try {
        await executeOpenThreadPathInTerminal({
          activateTerminal: (nextTerminalId) =>
            terminalStore.setActiveTerminal(scopeId, nextTerminalId),
          addTerminal: (nextTerminalId) => terminalStore.newTerminal(scopeId, nextTerminalId),
          closeHostTerminal: (nextTerminalId) =>
            platformTerminal.close({ threadId: scopeId, terminalId: nextTerminalId }),
          closeTerminal: (nextTerminalId) => terminalStore.closeTerminal(scopeId, nextTerminalId),
          flush: flushTerminalStatePersistence,
          openDock: () => setTerminalOpen(true),
          openHostTerminal: async (nextTerminalId) => {
            await platformTerminal.open({
              threadId: scopeId,
              terminalId: nextTerminalId,
              cwd: intent.cwd,
              cols: 120,
              rows: 30,
            });
          },
          restoreDock: () => {
            setRightDockState(previousRightDockState);
            storeRightDockThreadState(threadId, previousRightDockState);
          },
          restoreTerminalState: () => {
            terminalStore.setTerminalPresentationMode(scopeId, previousPresentationMode);
            terminalStore.setTerminalOpen(scopeId, previousTerminalOpen);
            if (previousActiveTerminalId) {
              terminalStore.setActiveTerminal(scopeId, previousActiveTerminalId);
            }
          },
          target: { shouldCreateNewTerminal, terminalId },
          writePath: (nextTerminalId) =>
            platformTerminal.write({
              threadId: scopeId,
              terminalId: nextTerminalId,
              data: "cd " + quotePosixShellArgument(intent.cwd) + "\r",
            }),
        });
      } catch (cause) {
        setLocalThreadError(
          cause instanceof Error ? cause.message : "Could not open path in Terminal.",
        );
      }
    };
    const dispose = subscribeOpenThreadPathInTerminal((intent) => {
      if (intent.threadId === threadId) void handleIntent();
    });
    void handleIntent();
    return dispose;
  }, [rightDockState, setTerminalOpen, threadId]);
  const [editorMode, setEditorMode] = useState(initialEditorOpen);
  const [editorSearchActive, setEditorSearchActive] = useState(initialEditorSearchOpen);
  const [editorSidebarVisible, setEditorSidebarVisible] = useState(readEditorSidebarVisible);
  const [editorChatOpen, setEditorChatOpen] = useState(
    () => initialEditorChatOpen ?? readEditorChatPaneVisible(),
  );
  const [editorChatHistoryOpen, setEditorChatHistoryOpen] = useState(
    initData.initialEditorHistoryOpen === true,
  );
  const [editorProjectSwitchOpen, setEditorProjectSwitchOpen] = useState(
    initialEditorProjectMenuOpen,
  );
  const [editorProjectSwitchQuery, setEditorProjectSwitchQuery] = useState("");
  const [editorRailSurface, setEditorRailSurface] = useState<"chat" | "terminal">(
    initialEditorOpen && initialTerminalOpen ? "terminal" : "chat",
  );
  const [editorTerminalOpen, setEditorTerminalOpen] = useState(
    initialEditorOpen && initialTerminalOpen,
  );
  const [editorRailDraftProjectId, setEditorRailDraftProjectId] = useState<string | null>(
    initData.initialEditorNewChatOpen === true ? (currentThread?.projectId ?? null) : null,
  );
  const [editorRailDraftOpen, setEditorRailDraftOpen] = useState(
    initData.initialEditorNewChatOpen === true,
  );
  const [editorCenterMode, setEditorCenterMode] = useState<"file" | "diff">(() =>
    initialEditorCenterMode === "file"
      ? "file"
      : initialEditorCenterMode === "diff"
        ? "diff"
        : (readEditorViewState(threadId)?.centerMode ?? "file"),
  );
  useEffect(() => {
    if (initialEditorCenterMode !== null) {
      setEditorCenterMode(initialEditorCenterMode);
    }
  }, [initialEditorCenterMode]);
  const [renamingThread, setRenamingThread] = useState(initialRenameOpen);
  const [threadTitleDraft, setThreadTitleDraft] = useState(currentThread?.title ?? "");
  const [threadRenamePending, setThreadRenamePending] = useState(false);
  const [threadRenameError, setThreadRenameError] = useState<string | null>(null);
  const [dismissedThreadErrorKey, setDismissedThreadErrorKey] = useState<string | null>(null);
  const [localThreadError, setLocalThreadError] = useState<string | null>(null);
  const threadRenameInputRef = useRef<InputRef>(null);
  const threadRenameTouchedRef = useRef(false);
  const rightDockLayout = useRightDockLayout({
    dockOpen: rightDockState.open && Boolean(rightDockState.activePaneId),
    fallbackDockWidth: initialExplorerWidth,
    initialDockWidth:
      initialExplorerOpen && viewportWidth > 0
        ? clampSidebarWidth(initialExplorerWidth ?? Math.round(viewportWidth / 2), {
            maxWidth: 960,
            minWidth: EXPLORER_DOCK_MIN_WIDTH,
            minimumContentWidth: 320,
            viewportWidth,
          })
        : null,
    viewportWidth,
  });
  const threadPageWidth = rightDockLayout.pageWidth;
  const setThreadPageWidth = rightDockLayout.setPageWidth;
  const setRightDockWidth = rightDockLayout.setDockWidth;
  const transcriptControllerRef = useRef<TranscriptController | null>(null);
  const registerTranscriptController = useCallback((controller: TranscriptController | null) => {
    transcriptControllerRef.current = controller;
  }, []);
  const providerHealth = useProviderHealthBanner(
    currentThread?.provider ?? "codex",
    providerStatuses,
  );
  const providerHealthVisible =
    resolveProviderHealthBannerPresentation(providerHealth.status) !== null;
  const editorProjectSpaces = useStore((state) => state.spaces);
  const editorActiveSpaceId = useSpacesUiStore((state) => state.activeSpaceId);
  const editorChatHistoryThreads = currentThread
    ? resolveEditorChatHistoryThreads({
        projectId: currentThread.projectId,
        sortOrder: environmentSettings.sidebarThreadSortOrder,
        threads,
      })
    : [];
  const editorProjectSwitchOptions = resolveEditorProjectSwitchOptions({
    currentProjectId: currentThread?.projectId ?? null,
    projects: props.projects.map((project) => ({
      id: project.id,
      kind: project.kind,
      title: project.name,
      spaceId: project.spaceId ?? null,
    })),
    sortOrder: environmentSettings.sidebarThreadSortOrder,
    threads,
  });
  const editorProjectSwitchGroups = groupEditorProjectSwitchOptions({
    activeSpaceId: editorActiveSpaceId,
    options: editorProjectSwitchOptions,
    query: editorProjectSwitchQuery,
    spaces: editorProjectSpaces,
  });
  const editorRailDraftProject =
    editorRailDraftProjectId === null
      ? null
      : (props.projects.find((project) => project.id === editorRailDraftProjectId) ?? null);
  const currentProject = currentThread
    ? (props.projects.find((project) => project.id === currentThread.projectId) ?? null)
    : null;
  const headerDiff = useWorkspaceHeaderDiff({
    workspaceRoot: currentThread?.workspaceRoot ?? null,
    diffOpen,
    initialData:
      environmentData?.branches && initialWorkingTreeDiff
        ? {
            isGitRepo: environmentData.branches.isRepo,
            patch: initialWorkingTreeDiff.patch,
          }
        : undefined,
  });
  const threadHeaderActionState = resolveThreadHeaderActionState({
    diffDisabledReason:
      currentThread?.workspaceRoot && headerDiff.isPending ? "Checking Git repository…" : null,
    diffOpen,
    diffTotals: headerDiff.totals,
    environmentEnabled: currentThread !== undefined,
    hasProject: currentProject !== null,
    hasProjectActionSurface: currentProject?.kind === "project",
    isGitRepo: headerDiff.isGitRepo,
    gitActionsAvailable: true,
    surface: {
      kind: "thread",
      layout: "single",
      primary: terminalPrimary ? "terminal" : "chat",
      sidechat: currentThread?.sidechatSourceThreadId != null,
    },
  });
  const bodyState = resolveThreadPageBodyState({
    isPending,
    error,
    rows: data,
  });
  const resolvedEnvironmentOpen =
    environmentUserOverride ??
    resolveDefaultEnvironmentPanelOpen({
      environmentEnabled: currentThread !== undefined,
      isCenteredEmptyLanding: bodyState.kind === "empty",
      isTerminalPrimarySurface: terminalPrimary,
      isConstrainedChatLayout: false,
      settingsDefaultOpen: environmentSettings.environmentPanelDefaultOpen,
    });
  const environmentPanelLayout = resolveEnvironmentPanelLayout({
    environmentEnabled: currentThread !== undefined,
    environmentPanelOpen: resolvedEnvironmentOpen,
    isCenteredEmptyLanding: bodyState.kind === "empty",
    isConstrainedChatLayout: viewportWidth < VIEWPORT_BREAKPOINTS.lg || diffOpen || explorerOpen,
  });
  const setEnvironmentVisibility = useCallback((open: boolean) => {
    "background only";
    setEnvironmentUserOverride(open);
    void import(/* webpackMode: "eager" */ "../platform/storage")
      .then(({ setPersistedStorageItem, webStorage: storage }) =>
        setPersistedStorageItem(
          APP_SETTINGS_STORAGE_KEY,
          writeSettingsGeneralProjection(storage.getItem(APP_SETTINGS_STORAGE_KEY), {
            ...readSettingsGeneralProjection(storage.getItem(APP_SETTINGS_STORAGE_KEY)),
            environmentPanelDefaultOpen: open,
          }),
        ),
      )
      .catch(() => {
        // Keep the explicit session override. Settings hydration owns
        // persistence failure and retry presentation.
      });
  }, []);
  const closeEnvironmentForAction = useCallback(() => {
    setEnvironmentUserOverride(false);
  }, []);
  const openExplorerFileReference = useCallback(
    (relativePath: string) => {
      onExplorerQueryChange("");
      onExplorerSelectPath(relativePath);
      setExplorerPresentationMode("single-file");
      closeEnvironmentForAction();
      updateRightDockState((current) =>
        openPaneInState(current, {
          paneId: `file:${relativePath}`,
          kind: "file",
          filePath: relativePath,
        }),
      );
    },
    [closeEnvironmentForAction, onExplorerQueryChange, onExplorerSelectPath, updateRightDockState],
  );
  const effectiveRightDockWidth = rightDockLayout.effectiveDockWidth;
  const threadHeaderAvailableWidth = Math.max(
    0,
    (threadPageWidth || viewportWidth) - (effectiveRightDockWidth ?? 0),
  );
  const compactThreadHeader = threadHeaderAvailableWidth < 700;
  const [respondingApprovalRequestId, setRespondingApprovalRequestId] = useState<string | null>(
    null,
  );
  const [respondingUserInputRequestId, setRespondingUserInputRequestId] = useState<string | null>(
    null,
  );
  const activePendingApproval = currentThread?.pendingApprovals[0] ?? null;
  const activePendingUserInput = currentThread?.pendingUserInputs[0] ?? null;
  const respondToApproval = async (
    decision: ProviderApprovalDecision,
    lifecycleGeneration?: string,
  ) => {
    "background only";
    if (!activePendingApproval || respondingApprovalRequestId !== null) return;
    setRespondingApprovalRequestId(activePendingApproval.requestId);
    try {
      await dispatchSynaraCommand({
        type: "thread.approval.respond",
        commandId: newCommandId(),
        threadId: threadId as never,
        requestId: activePendingApproval.requestId,
        ...(lifecycleGeneration ? { lifecycleGeneration } : {}),
        decision,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["thread-detail", threadId],
      });
    } finally {
      setRespondingApprovalRequestId(null);
    }
  };
  const respondToUserInput = async (
    answers: ProviderUserInputAnswers,
    lifecycleGeneration?: string,
  ) => {
    "background only";
    if (!activePendingUserInput || respondingUserInputRequestId !== null) return;
    setRespondingUserInputRequestId(activePendingUserInput.requestId);
    try {
      await dispatchSynaraCommand({
        type: "thread.user-input.respond",
        commandId: newCommandId(),
        threadId: threadId as never,
        requestId: activePendingUserInput.requestId,
        ...(lifecycleGeneration ? { lifecycleGeneration } : {}),
        answers,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: ["thread-detail", threadId],
      });
    } finally {
      setRespondingUserInputRequestId(null);
    }
  };
  const composer = (
    <ComposerColumnFrameSurface>
      {activePendingApproval ? (
        <PendingApprovalPanel
          approval={activePendingApproval}
          pendingCount={currentThread?.pendingApprovals.length ?? 0}
          responding={respondingApprovalRequestId === activePendingApproval.requestId}
          onRespond={(decision, lifecycleGeneration) => {
            "background only";
            void respondToApproval(decision, lifecycleGeneration);
          }}
        />
      ) : null}
      {!activePendingApproval && activePendingUserInput ? (
        <PendingUserInputPanel
          key={`${activePendingUserInput.requestId}:${
            activePendingUserInput.lifecycleGeneration ?? "legacy"
          }`}
          prompt={activePendingUserInput}
          pendingCount={currentThread?.pendingUserInputs.length ?? 0}
          responding={respondingUserInputRequestId === activePendingUserInput.requestId}
          onRespond={(answers, lifecycleGeneration) => {
            "background only";
            void respondToUserInput(answers, lifecycleGeneration);
          }}
        />
      ) : null}
      <Composer
        activities={currentThread?.activities ?? []}
        availableWidth={threadHeaderAvailableWidth}
        chatFontSizePx={appearance.chatFontSizePx}
        voiceInputEnabled
        pendingUserInputCount={currentThread?.pendingUserInputs.length ?? 0}
        threadId={threadId}
        modelSelection={currentThread?.modelSelection}
        runtimeMode={currentThread?.runtimeMode}
        interactionMode={currentThread?.interactionMode}
        sessionStatus={currentThread?.sessionStatus ?? null}
        activeTurnId={currentThread?.activeTurnId ?? null}
        workspaceRoot={currentThread?.workspaceRoot ?? null}
        onProviderStatusesChange={setProviderStatuses}
      />
    </ComposerColumnFrameSurface>
  );
  useEffect(() => {
    if (currentThread?.title && (!renamingThread || threadTitleDraft.length === 0)) {
      setThreadTitleDraft(currentThread.title);
      if (renamingThread && !threadRenameTouchedRef.current) {
        void threadRenameInputRef.current?.setValue(currentThread.title);
      }
    }
  }, [currentThread?.title, renamingThread, threadTitleDraft.length]);
  const beginThreadRename = () => {
    "background only";
    if (!currentThread || threadRenamePending) return;
    setThreadTitleDraft(currentThread.title);
    threadRenameTouchedRef.current = false;
    setThreadRenameError(null);
    setRenamingThread(true);
  };
  const commitThreadRename = async () => {
    "background only";
    if (!currentThread || threadRenamePending) return;
    const title = threadTitleDraft.trim();
    if (!title || title === currentThread.title) {
      setThreadTitleDraft(currentThread.title);
      setThreadRenameError(null);
      setRenamingThread(false);
      return;
    }
    setThreadRenamePending(true);
    setThreadRenameError(null);
    try {
      await dispatchSynaraCommand({
        type: "thread.meta.update",
        commandId: newCommandId(),
        threadId: threadId as never,
        title,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ["thread-detail", threadId] }),
        queryClient.invalidateQueries({ queryKey: ["threads"] }),
        queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] }),
      ]);
      setRenamingThread(false);
    } catch (error) {
      setThreadRenameError(error instanceof Error ? error.message : "Unable to rename thread.");
    } finally {
      setThreadRenamePending(false);
    }
  };
  const threadHeaderIdentity = renamingThread ? (
    <view className="ThreadHeaderRename">
      <Input
        ref={threadRenameInputRef}
        key={`thread-rename:${currentThread?.title ?? threadId}`}
        nativeInput
        className="ThreadHeaderRenameInput"
        accessibility-label="Thread title"
        defaultValue={threadTitleDraft || currentThread?.title || ""}
        disabled={threadRenamePending}
        onInput={(value) => {
          threadRenameTouchedRef.current = true;
          setThreadTitleDraft(value);
        }}
        onConfirm={() => void commitThreadRename()}
        onBlur={() => void commitThreadRename()}
      />
      {threadRenameError ? (
        <text className="ThreadHeaderRenameError">{threadRenameError}</text>
      ) : null}
    </view>
  ) : (
    <ChatSurfaceHeaderIdentity
      title={currentThread?.title ?? "Thread"}
      icon={
        resolveThreadHeaderIconKind(terminalPrimary ? "terminal" : "chat", currentThread?.title) ===
        "terminal" ? (
          <svg
            className="ThreadHeaderTerminalIcon"
            content={colorizeLynxSvg(terminalSvg, semanticIconColor("accent"))}
          />
        ) : (
          <OpenAIProviderIcon provider={currentThread?.provider} />
        )
      }
      iconTitle={terminalPrimary ? "Terminal" : (currentThread?.project ?? "Synara")}
      onRename={currentThread ? beginThreadRename : undefined}
    />
  );
  const chatBody =
    bodyState.kind === "transcript" ? (
      <view className="ThreadTranscriptViewport">
        <view className="ThreadTranscriptColumn">
          <Transcript
            activeTurnId={currentThread?.activeTurnId ?? null}
            chatFontSizePx={appearance.chatFontSizePx}
            interactionMode={currentThread?.interactionMode ?? null}
            modelSelection={currentThread?.modelSelection ?? null}
            workspaceRoot={currentThread?.workspaceRoot ?? null}
            pinnedMessageIds={
              new Set(currentThread?.pinnedMessages.map((pin) => pin.messageId) ?? [])
            }
            rows={bodyState.rows}
            threadId={threadId}
            timestampFormat={appearance.timestampFormat}
            viewportLeft={Math.max(0, viewportWidth - threadPageWidth)}
            viewportWidth={threadHeaderAvailableWidth}
            viewportHeight={viewportHeight}
            onController={registerTranscriptController}
            onOpenFileReference={openExplorerFileReference}
            onOpenTurnDiff={openTurnDiff}
            onThreadError={setLocalThreadError}
            runtimeMode={currentThread?.runtimeMode ?? null}
            sessionStatus={currentThread?.sessionStatus ?? null}
          />
        </view>
      </view>
    ) : bodyState.kind === "empty" ? (
      <CenteredEmptyLandingStack>
        <CenteredEmptyLanding projectName={currentThread?.project} />
        {composer}
        <EmptyThreadContextTray
          branch={currentThread?.branch ?? null}
          envMode={currentThread?.envMode ?? "local"}
          onTemporaryChange={toggleTemporary}
          projectName={currentThread?.project ?? "this folder"}
          temporary={temporary}
        />
      </CenteredEmptyLandingStack>
    ) : (
      <view className="ThreadTranscriptState">
        <PanelStateMessage
          fill="flex"
          intent={bodyState.kind === "loading" ? "status" : "alert"}
          announcement={
            bodyState.kind === "loading"
              ? "Loading conversation"
              : bodyState.kind === "offline"
                ? "Synara is offline. Reconnect to load this conversation."
                : "Unable to load this conversation."
          }
        >
          {bodyState.kind === "loading"
            ? "Loading conversation…"
            : bodyState.kind === "offline"
              ? "Synara is offline. Reconnect to load this conversation."
              : "Unable to load this conversation."}
        </PanelStateMessage>
      </view>
    );
  const enterEditorMode = () => {
    "background only";
    closeEnvironmentForAction();
    setExplorerOpen(false);
    setDiffOpen(false);
    setTerminalOpen(false);
    setEditorTerminalOpen(false);
    setEditorMode(true);
  };
  const exitEditorMode = () => {
    "background only";
    setEditorMode(false);
  };
  const showEditorFiles = () => {
    "background only";
    if (editorSidebarVisible && editorCenterMode === "file" && !editorSearchActive) {
      setEditorSidebarVisible(false);
      storeEditorSidebarVisible(false);
      return;
    }
    setEditorSidebarVisible(true);
    storeEditorSidebarVisible(true);
    setEditorSearchActive(false);
    setEditorCenterMode("file");
  };
  const showEditorChanges = () => {
    "background only";
    if (editorSidebarVisible && editorCenterMode === "diff" && !editorSearchActive) {
      setEditorSidebarVisible(false);
      storeEditorSidebarVisible(false);
      return;
    }
    setEditorSidebarVisible(true);
    storeEditorSidebarVisible(true);
    setEditorSearchActive(false);
    setEditorCenterMode("diff");
  };
  const showEditorSearch = () => {
    "background only";
    if (editorSidebarVisible && editorSearchActive) {
      setEditorSidebarVisible(false);
      storeEditorSidebarVisible(false);
      return;
    }
    setEditorSidebarVisible(true);
    storeEditorSidebarVisible(true);
    setEditorSearchActive(true);
    setEditorCenterMode("file");
  };
  const toggleEditorChat = () => {
    "background only";
    setEditorChatOpen((current) => {
      const next = !current;
      storeEditorChatPaneVisible(next);
      return next;
    });
  };
  const openEditorHistoryThread = (nextThreadId: string) => {
    "background only";
    setEditorChatHistoryOpen(false);
    if (nextThreadId !== threadId) onNavigateToThread(nextThreadId);
  };
  const openEditorTerminal = () => {
    "background only";
    setEditorRailDraftOpen(false);
    setEditorRailDraftProjectId(null);
    setEditorTerminalOpen(true);
    setEditorRailSurface("terminal");
  };
  const openEditorNewChat = () => {
    "background only";
    setEditorRailDraftOpen(true);
    setEditorRailDraftProjectId(currentThread?.projectId ?? null);
    setEditorRailSurface("chat");
  };
  const closeEditorTerminal = () => {
    "background only";
    setEditorTerminalOpen(false);
    setEditorRailSurface("chat");
  };
  useEffect(() => {
    if (!editorMode) return;
    storeEditorViewState(threadId, {
      centerMode: editorCenterMode,
      expandedDirectories: [...explorerExpandedDirectories],
    });
  }, [editorCenterMode, editorMode, explorerExpandedDirectories, threadId]);
  useEffect(() => {
    onEditorModeChange(editorMode);
    return () => onEditorModeChange(false);
  }, [editorMode, onEditorModeChange]);
  useEffect(() => {
    "background only";
    const relaunchUrl = buildThreadRelaunchUrl({
      threadId,
      editorMode,
      editorCenterMode,
      editorChatOpen,
      editorSearchActive,
      environmentOpen: resolvedEnvironmentOpen,
      diffFileTreeOpen,
      terminalOpen: editorMode ? editorTerminalOpen : terminalOpen,
      explorerOpen,
      explorerPresentationMode,
      explorerPath: explorerSelectedPath,
      explorerQuery,
      explorerExpandedDirectories: [...explorerExpandedDirectories],
    });
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ bridgeCall }) =>
        bridgeCall("shellRouteChanged", {
          route: `/thread/${threadId}`,
          relaunchUrl,
        }),
      )
      .catch(() => {
        // Web and older hosts do not need the desktop reload surface mirror.
      });
  }, [
    editorCenterMode,
    editorChatOpen,
    editorMode,
    editorSearchActive,
    explorerExpandedDirectories,
    explorerOpen,
    explorerPresentationMode,
    explorerQuery,
    explorerSelectedPath,
    resolvedEnvironmentOpen,
    diffFileTreeOpen,
    editorTerminalOpen,
    terminalOpen,
    threadId,
  ]);

  if (editorMode) {
    return (
      <>
        <view className="ThreadEditorView">
          <view className="ThreadEditorHeader AppWindowDragRegion chat-surface-divider">
            <view
              className="ThreadEditorIdentity"
              style={{
                paddingLeft: `${MAC_DESKTOP_TOP_BAR_TRAFFIC_LIGHT_GUTTER_CSS_PX}px`,
              }}
            >
              <text className="ThreadEditorProject">{currentThread?.project ?? "Workspace"}</text>
              <text className="ThreadEditorPath">
                {currentThread?.workspaceRoot ?? "No workspace"}
              </text>
              {editorProjectSwitchOptions.length > 0 ? (
                <EditorProjectSwitchMenu
                  currentProjectId={currentThread?.projectId ?? null}
                  groups={editorProjectSwitchGroups}
                  open={editorProjectSwitchOpen}
                  onOpenChange={(open) => {
                    setEditorProjectSwitchOpen(open);
                    if (!open) setEditorProjectSwitchQuery("");
                  }}
                  query={editorProjectSwitchQuery}
                  onQueryChange={setEditorProjectSwitchQuery}
                  onProjectIdChange={(projectId) => {
                    const option = editorProjectSwitchOptions.find(
                      (candidate) => candidate.id === projectId,
                    );
                    if (!option) return;
                    const target = resolveEditorProjectSwitchTarget(option);
                    if (target.kind === "current") return;
                    if (target.kind === "thread") {
                      setEditorRailDraftOpen(false);
                      setEditorRailDraftProjectId(null);
                      onNavigateToThread(target.threadId);
                    } else {
                      setEditorRailDraftOpen(true);
                      setEditorRailDraftProjectId(target.projectId);
                      setEditorChatOpen(true);
                      setEditorRailSurface("chat");
                    }
                  }}
                />
              ) : null}
            </view>
            <Button
              aria-label={editorChatOpen ? "Hide chat panel" : "Show chat panel"}
              className="ThreadEditorChatToggle"
              size="icon-xs"
              variant="outline"
              onClick={toggleEditorChat}
            >
              <svg
                className="ThreadEditorHeaderIcon"
                content={colorizeLynxSvg(panelRightCloseSvg, semanticIconColor("primary"))}
              />
            </Button>
            <Button
              className="ThreadEditorExitButton"
              size="xs"
              variant="outline"
              onClick={exitEditorMode}
            >
              <svg
                className="ThreadEditorHeaderIcon"
                content={colorizeLynxSvg(bubbleTextSvg, semanticIconColor("primary"))}
              />
              <text className="LxButton__text">Chat</text>
            </Button>
          </view>
          <view className="ThreadEditorBody">
            <view className="ThreadEditorActivityRail">
              <EditorActivityItem
                active={editorSidebarVisible && editorCenterMode === "file" && !editorSearchActive}
                label={
                  editorSidebarVisible && editorCenterMode === "file" && !editorSearchActive
                    ? "Hide files sidebar"
                    : "Files"
                }
                onActivate={showEditorFiles}
              >
                <svg
                  className="ThreadEditorActivityIcon"
                  content={colorizeLynxSvg(
                    foldersSvg,
                    editorSidebarVisible && editorCenterMode === "file" && !editorSearchActive
                      ? semanticIconColor("primary")
                      : semanticIconColor("secondary"),
                  )}
                />
              </EditorActivityItem>
              <EditorActivityItem
                active={editorSidebarVisible && editorCenterMode === "diff" && !editorSearchActive}
                label={
                  editorSidebarVisible && editorCenterMode === "diff" && !editorSearchActive
                    ? "Hide diff sidebar"
                    : "Diff"
                }
                onActivate={showEditorChanges}
              >
                <svg
                  className="ThreadEditorActivityIcon"
                  content={colorizeLynxSvg(
                    changesSvg,
                    editorSidebarVisible && editorCenterMode === "diff" && !editorSearchActive
                      ? semanticIconColor("primary")
                      : semanticIconColor("secondary"),
                  )}
                />
              </EditorActivityItem>
              <EditorActivityItem
                active={editorSidebarVisible && editorSearchActive}
                label={
                  editorSidebarVisible && editorSearchActive
                    ? "Hide search sidebar"
                    : "Search files"
                }
                onActivate={showEditorSearch}
              >
                <SearchIcon
                  className="ThreadEditorActivityIcon"
                  size={20}
                  color={
                    editorSidebarVisible && editorSearchActive
                      ? semanticIconColor("primary")
                      : semanticIconColor("secondary")
                  }
                />
              </EditorActivityItem>
            </view>
            <view
              className={`ThreadEditorCenter${
                editorChatOpen ? "" : " ThreadEditorCenter--chat-hidden"
              }`}
            >
              {editorCenterMode === "file" ? (
                <ExplorerDock
                  key={`editor-files:${threadId}:${currentThread?.workspaceRoot ?? "pending"}`}
                  availableWidth={threadPageWidth || viewportWidth}
                  entries={explorerEntries}
                  entriesError={explorerEntriesError}
                  entriesPending={explorerEntriesPending}
                  entriesTruncated={explorerEntriesTruncated}
                  directoryEntries={explorerDirectoryEntries}
                  directoryErrors={explorerDirectoryErrors}
                  directoryPending={explorerDirectoryPending}
                  expandedDirectories={explorerExpandedDirectories}
                  initialWidth={initialExplorerWidth}
                  initialCommentLine={initialExplorerCommentLine}
                  initialActionMenuOpen={initialExplorerActionMenuOpen}
                  file={explorerFile}
                  fileError={explorerFileError}
                  filePending={explorerFilePending}
                  fileRetrying={explorerFileRetrying}
                  fileSyntaxHighlight={explorerFileSyntaxHighlight}
                  localPreviewUrl={explorerLocalPreviewUrl}
                  localPreviewError={explorerLocalPreviewError}
                  localPreviewPending={explorerLocalPreviewPending}
                  pdfPageCount={explorerPdfPageCount}
                  pdfPageHeight={explorerPdfPageHeight}
                  pdfPageWidth={explorerPdfPageWidth}
                  pdfMetadataError={explorerPdfMetadataError}
                  pdfMetadataPending={explorerPdfMetadataPending}
                  open
                  presentationMode={editorSearchActive ? "editor-search" : "editor"}
                  sidebarVisible={editorSidebarVisible}
                  query={explorerQuery}
                  selectedPath={explorerSelectedPath}
                  threadId={threadId}
                  theme={resolvedTheme}
                  workspaceRoot={currentThread?.workspaceRoot ?? null}
                  onWidthChange={() => {}}
                  onQueryChange={onExplorerQueryChange}
                  onRetryFile={onExplorerRetryFile}
                  onSelectPath={onExplorerSelectPath}
                  onToggleDirectory={onExplorerToggleDirectory}
                  onClose={exitEditorMode}
                />
              ) : (
                <view className="ThreadEditorChanges">
                  <DiffDock
                    availableWidth={threadPageWidth || viewportWidth}
                    initialDiff={initialWorkingTreeDiff ?? undefined}
                    initialActionMenuOpen={initialExplorerActionMenuOpen}
                    checkpoints={currentThread?.checkpoints ?? []}
                    initialSelectedFilePath={explorerSelectedPath}
                    unavailableLabel={initialWorkingTreeDiffUnavailableLabel}
                    onClose={() => setEditorCenterMode("file")}
                    onWidthChange={() => undefined}
                    open
                    presentation="editor"
                    sidebarVisible={editorSidebarVisible}
                    threadId={threadId}
                    workspaceRoot={currentThread?.workspaceRoot ?? null}
                  />
                </view>
              )}
            </view>
            <ResizableRightPanel
              availableWidth={threadPageWidth || viewportWidth}
              className={`ThreadEditorChat${editorChatOpen ? "" : " ThreadEditorChat--hidden"}`}
              defaultWidth={EDITOR_CHAT_PANE_DEFAULT_WIDTH}
              maxWidth={EDITOR_CHAT_PANE_MAX_WIDTH}
              minimumMainWidth={320}
              minWidth={EDITOR_CHAT_PANE_MIN_WIDTH}
              resizable={editorChatOpen && viewportWidth >= VIEWPORT_BREAKPOINTS.lg}
              storageKey={EDITOR_CHAT_PANE_STORAGE_KEY}
            >
              <ChatSurfaceHeaderFrame editorRail>
                <view className="ThreadHeaderIdentity">
                  {editorRailDraftOpen ? (
                    <ChatSurfaceHeaderIdentity
                      title="New chat"
                      icon={<OpenAIProviderIcon />}
                      iconTitle={currentThread?.project ?? "Synara"}
                    />
                  ) : (
                    threadHeaderIdentity
                  )}
                </view>
                <EditorRailTabs
                  activeProvider={currentThread?.provider ?? "codex"}
                  activeSurface={editorRailSurface}
                  activeThreadId={threadId}
                  activeThreadTitle={currentThread?.title ?? "New chat"}
                  projectId={currentThread?.projectId ?? ""}
                  terminalAvailable={editorTerminalOpen}
                  threads={editorChatHistoryThreads}
                  onNewChat={openEditorNewChat}
                  onNewTerminal={openEditorTerminal}
                  onHistory={() => setEditorChatHistoryOpen(true)}
                  onOpenChat={(nextThreadId) => {
                    setEditorRailDraftOpen(false);
                    setEditorRailDraftProjectId(null);
                    setEditorRailSurface("chat");
                    if (nextThreadId !== threadId) {
                      onNavigateToThread(nextThreadId);
                    }
                  }}
                  onOpenTerminal={() => setEditorRailSurface("terminal")}
                  onCloseTerminal={closeEditorTerminal}
                />
              </ChatSurfaceHeaderFrame>
              <view
                className={`ThreadEditorChatSurface${
                  editorRailSurface === "chat" ? "" : " ThreadEditorChatSurface--hidden"
                }`}
              >
                {editorRailDraftOpen ? (
                  <view className="ThreadEditorNewChat">
                    <CenteredEmptyLandingStack>
                      <CenteredEmptyLanding projectName={editorRailDraftProject?.name ?? null} />
                      <ComposerColumnFrameSurface>
                        <LandingComposer
                          initialProjectId={editorRailDraftProject?.id ?? null}
                          onProjectSelectionChange={setEditorRailDraftProjectId}
                          onThreadCreated={(newThreadId) => onNavigateToThread(newThreadId)}
                        />
                      </ComposerColumnFrameSurface>
                    </CenteredEmptyLandingStack>
                  </view>
                ) : (
                  <>
                    <ProviderHealthBanner
                      status={providerHealth.status}
                      onDismiss={providerHealth.dismiss}
                    />
                    {chatBody}
                    {bodyState.kind === "empty" ? null : composer}
                  </>
                )}
              </view>
              {editorTerminalOpen && currentThread?.workspaceRoot ? (
                <view
                  className={`ThreadEditorTerminalSurface${
                    editorRailSurface === "terminal" ? "" : " ThreadEditorTerminalSurface--hidden"
                  }`}
                >
                  <ThreadTerminal
                    active={editorRailSurface === "terminal"}
                    autoOpen
                    fontFamily={appearance.terminalFontFamily}
                    fontSizePx={appearance.terminalFontSizePx}
                    open={editorTerminalOpen}
                    presentationMode="workspace"
                    terminalId="lynx-editor-rail"
                    threadId={threadId}
                    workspaceRoot={currentThread.workspaceRoot}
                    onOpenChange={(open) => {
                      if (!open) closeEditorTerminal();
                    }}
                  />
                </view>
              ) : null}
            </ResizableRightPanel>
          </view>
        </view>
        {editorChatHistoryOpen ? (
          <view
            className="ThreadEditorHistoryViewport"
            accessibility-element
            accessibility-label="Chat history dialog"
            bindkeydown={(event: { readonly key?: string }) => {
              "background only";
              if (event.key === "Escape") setEditorChatHistoryOpen(false);
            }}
            tabindex={0}
          >
            <view
              className="ThreadEditorHistoryBackdrop"
              bindtap={() => setEditorChatHistoryOpen(false)}
            />
            <view
              className="ThreadEditorHistoryDialog"
              accessibility-element
              accessibility-label="Chat history"
              role="dialog"
              aria-modal={true}
            >
              <Button
                aria-label="Close chat history"
                className="ThreadEditorHistoryClose"
                variant="ghost"
                onClick={() => setEditorChatHistoryOpen(false)}
              >
                <XIcon color={semanticIconColor("secondary")} size={14} />
              </Button>
              <text className="ThreadEditorHistoryHeading">Chat history</text>
              <text className="ThreadEditorHistoryDescription">
                Recent chats in {currentThread?.project ?? "this project"}.
              </text>
              <scroll-view className="ThreadEditorHistoryPanel" scroll-orientation="vertical">
                {threads.length === 0 ? (
                  <text className="ThreadEditorHistoryEmpty">Loading chat history…</text>
                ) : editorChatHistoryThreads.length === 0 ? (
                  <text className="ThreadEditorHistoryEmpty">No chats in this project yet</text>
                ) : (
                  editorChatHistoryThreads.map((historyThread) => (
                    <Button
                      key={historyThread.id}
                      className={`ThreadEditorHistoryItem${
                        historyThread.id === threadId ? " ThreadEditorHistoryItem--active" : ""
                      }`}
                      variant="ghost"
                      onClick={() => openEditorHistoryThread(historyThread.id)}
                    >
                      <OpenAIProviderIcon provider={historyThread.provider} />
                      <text className="ThreadEditorHistoryTitle">{historyThread.title}</text>
                      <text className="ThreadEditorHistoryMeta">
                        {historyThread.id === threadId
                          ? "✓"
                          : formatRelativeTime(historyThread.updatedAt)}
                      </text>
                    </Button>
                  ))
                )}
              </scroll-view>
            </view>
          </view>
        ) : null}
      </>
    );
  }

  return (
    <view
      className={`Page ThreadPage${
        environmentPanelLayout.visible
          ? ` ThreadPage--environment-open${
              environmentPanelLayout.variant === "docked"
                ? " ThreadPage--environment-docked"
                : " ThreadPage--environment-floating"
            }`
          : ""
      }${diffOpen ? " ThreadPage--diff-open" : ""}${
        explorerOpen ? " ThreadPage--explorer-open" : ""
      }${providerHealthVisible ? " ThreadPage--provider-health-visible" : ""}`}
      bindlayoutchange={(event: { readonly detail?: { readonly width?: number } }) => {
        const width = event.detail?.width;
        if (typeof width === "number" && width > 0) setThreadPageWidth(width);
      }}
    >
      <view
        className="ThreadPageMain"
        style={
          effectiveRightDockWidth !== null
            ? {
                width: `${Math.max(
                  0,
                  (threadPageWidth || viewportWidth) - effectiveRightDockWidth,
                )}px`,
              }
            : undefined
        }
      >
        <ChatSurfaceHeaderFrame className="ThreadPageHeader">
          <view className="ThreadHeaderIdentity">{threadHeaderIdentity}</view>
          <view className="ThreadHeaderControls">
            <ThreadHeaderActions
              actionState={threadHeaderActionState}
              compact={compactThreadHeader}
              project={
                currentProject
                  ? {
                      id: currentProject.id,
                      cwd: currentProject.cwd,
                      defaultModelSelection: currentProject.defaultModelSelection,
                      scripts: currentProject.scripts,
                    }
                  : null
              }
              thread={currentThread}
              onNavigateToThread={onNavigateToThread}
              onOpenTerminal={() => {
                setTerminalOpen(true);
              }}
            />
            {threadHeaderActionState.showEnvironment ? (
              <EnvironmentToggle
                open={environmentPanelLayout.visible}
                onChange={setEnvironmentVisibility}
              />
            ) : null}
            {threadHeaderActionState.showDiff ? (
              <ThreadDiffToggle
                open={diffOpen}
                disabled={threadHeaderActionState.diffDisabled}
                stats={threadHeaderActionState.diffStats}
                onToggle={() => {
                  closeEnvironmentForAction();
                  setExplorerOpen(false);
                  setDiffOpen(!diffOpen);
                }}
              />
            ) : null}
          </view>
        </ChatSurfaceHeaderFrame>
        <ThreadErrorBanner
          error={
            localThreadError ??
            visibleThreadError({
              dismissedKey: dismissedThreadErrorKey,
              error: currentThread?.error,
              revision: currentThread?.errorRevision,
            })
          }
          onDismiss={() => {
            setLocalThreadError(null);
            setDismissedThreadErrorKey(
              threadErrorDismissKey({
                error: currentThread?.error,
                revision: currentThread?.errorRevision,
              }),
            );
          }}
        />
        <ProviderHealthBanner status={providerHealth.status} onDismiss={providerHealth.dismiss} />
        {terminalPrimary && currentThread?.workspaceRoot ? (
          <view className="ThreadPrimaryTerminal">
            <DockTerminalPane
              closeRequestVersion={0}
              fontFamily={appearance.terminalFontFamily}
              fontSizePx={appearance.terminalFontSizePx}
              isActive
              scope="thread"
              threadId={threadId}
              workspaceRoot={currentThread.workspaceRoot}
              onClosePane={() => {}}
            />
          </view>
        ) : (
          chatBody
        )}
        {!terminalPrimary && bodyState.kind !== "empty" ? (
          <view className="ThreadComposerDock">{composer}</view>
        ) : null}
        {currentThread ? (
          <EnvironmentPanel
            bootstrapOnly={initialEnvironmentOpen && environmentData !== null}
            initialData={environmentData}
            open={environmentPanelLayout.visible}
            threadId={threadId}
            projectId={currentThread.projectId}
            pinnedMessages={currentThread.pinnedMessages}
            pinnedMessageTextById={currentThread.pinnedMessageTextById}
            threadMarkers={currentThread.threadMarkers}
            pullRequest={currentThread.lastKnownPr}
            provider={currentThread.provider ?? "codex"}
            recapRevision={threadRecapRevision(data ?? [], currentThread.latestTurnState)}
            branch={currentThread.branch}
            envMode={currentThread.envMode}
            workspaceRoot={currentThread.workspaceRoot}
            notes={currentThread.notes}
            onJumpToPinnedMessage={(messageId) =>
              transcriptControllerRef.current?.scrollToMessage(messageId)
            }
            onOpenChanges={() => {
              closeEnvironmentForAction();
              setExplorerOpen(false);
              setDiffOpen(true);
            }}
            onOpenEditorView={enterEditorMode}
            onOpenSettings={() => {
              closeEnvironmentForAction();
              history.push("/settings/general");
            }}
          />
        ) : null}
      </view>
      <ThreadRightDocks
        dockThread={
          currentThread
            ? {
                id: currentThread.id,
                workspaceRoot: currentThread.workspaceRoot,
                checkpoints: currentThread.checkpoints,
                sidechatSource: canCreateLynxSidechat(currentThread) ? currentThread : null,
              }
            : undefined
        }
        diffOpen={diffOpen}
        explorerDirectoryEntries={explorerDirectoryEntries}
        explorerDirectoryErrors={explorerDirectoryErrors}
        explorerDirectoryPending={explorerDirectoryPending}
        explorerEntries={explorerEntries}
        explorerEntriesError={explorerEntriesError}
        explorerEntriesPending={explorerEntriesPending}
        explorerEntriesTruncated={explorerEntriesTruncated}
        explorerExpandedDirectories={explorerExpandedDirectories}
        explorerFile={explorerFile}
        explorerFileError={explorerFileError}
        explorerFilePending={explorerFilePending}
        explorerFileRetrying={explorerFileRetrying}
        explorerFileSyntaxHighlight={explorerFileSyntaxHighlight}
        explorerLocalPreviewError={explorerLocalPreviewError}
        explorerLocalPreviewPending={explorerLocalPreviewPending}
        explorerLocalPreviewUrl={explorerLocalPreviewUrl}
        explorerPdfPageCount={explorerPdfPageCount}
        explorerPdfPageHeight={explorerPdfPageHeight}
        explorerPdfPageWidth={explorerPdfPageWidth}
        explorerPdfMetadataError={explorerPdfMetadataError}
        explorerPdfMetadataPending={explorerPdfMetadataPending}
        explorerOpen={explorerOpen}
        explorerPresentationMode={explorerPresentationMode}
        rightDockState={rightDockState}
        terminalOpen={terminalOpen}
        terminalFontFamily={appearance.terminalFontFamily}
        terminalFontSizePx={appearance.terminalFontSizePx}
        chatFontSizePx={appearance.chatFontSizePx}
        timestampFormat={appearance.timestampFormat}
        viewportHeight={viewportHeight}
        explorerQuery={explorerQuery}
        explorerSelectedPath={explorerSelectedPath}
        initialExplorerWidth={initialExplorerWidth}
        initialExplorerCommentLine={initialExplorerCommentLine}
        initialExplorerActionMenuOpen={initialExplorerActionMenuOpen}
        initialDiffFileTreeOpen={diffFileTreeOpen}
        onExplorerQueryChange={onExplorerQueryChange}
        onExplorerRetryFile={onExplorerRetryFile}
        onExplorerSelectPath={onExplorerSelectPath}
        onExplorerToggleDirectory={onExplorerToggleDirectory}
        resolvedTheme={resolvedTheme}
        setRightDockWidth={setRightDockWidth}
        setExplorerPresentationMode={setExplorerPresentationMode}
        updateRightDockState={updateRightDockState}
        onDiffFileTreeOpenChange={setDiffFileTreeOpen}
        threadPageWidth={threadPageWidth}
        viewportWidth={viewportWidth}
      />
    </view>
  );
}

export function SliceRouter({
  appearance,
  initialDiffOpen,
  initialDiffTurnId,
  initialDiffFilePath,
  initialEditorOpen,
  initialEditorCenterMode,
  initialEditorChatOpen,
  initialEditorSearchOpen,
  initialEditorProjectMenuOpen,
  initialEnvironmentOpen,
  initialRenameOpen,
  initialTerminalOpen,
  initialTemporaryOpen,
  initialSettingsTarget,
  initialWorkspaceVisible,
  initialRoute,
  initialExplorerOpen,
  initialExplorerPresentationMode,
  initialExplorerActionMenuOpen,
  initialDiffFileTreeOpen,
  initialExplorerCommentLine,
  initialExplorerExpandedDirectories,
  initialExplorerPath,
  initialExplorerQuery,
  initialExplorerWidth,
  resolvedTheme,
  viewportWidth,
  viewportHeight,
  onAppearanceChange,
  onThemeStateChange,
  transportState,
  onRetryTransport,
}: {
  readonly appearance: SettingsAppearanceValues;
  readonly initialDiffOpen: boolean;
  readonly initialDiffTurnId: TurnId | null;
  readonly initialDiffFilePath: string | null;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: "file" | "diff" | null;
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorSearchOpen: boolean;
  readonly initialEditorProjectMenuOpen: boolean;
  readonly initialEnvironmentOpen: boolean;
  readonly initialDiffFileTreeOpen: boolean;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialTemporaryOpen: boolean;
  readonly initialSettingsTarget: string | null;
  readonly initialWorkspaceVisible: boolean;
  readonly initialRoute: string | null;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerPresentationMode: "dock" | "single-file";
  readonly initialExplorerActionMenuOpen: boolean;
  readonly initialExplorerCommentLine: number | null;
  readonly initialExplorerExpandedDirectories: readonly string[];
  readonly initialExplorerPath: string | null;
  readonly initialExplorerQuery: string;
  readonly initialExplorerWidth: number | null;
  readonly resolvedTheme: "dark" | "light";
  readonly viewportWidth: number;
  readonly viewportHeight: number;
  readonly onAppearanceChange: (appearance: SettingsAppearanceValues) => void;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly transportState: RpcTransportState;
  readonly onRetryTransport: () => void;
}) {
  const [route, setRoute] = useRoute(initialRoute);
  const [landingTemporaryThreadId, setLandingTemporaryThreadId] = useState<string | null>(null);
  useEffect(() => {
    if (
      route.pathname === "/thread/$threadId" &&
      route.params.threadId === landingTemporaryThreadId
    ) {
      setLandingTemporaryThreadId(null);
    }
  }, [landingTemporaryThreadId, route]);
  const componentsLabRoute = route.pathname === "/components-lab";
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchPaletteKey, setSearchPaletteKey] = useState(0);
  const [searchInitialQuery, setSearchInitialQuery] = useState("");
  const [searchReturnFocusElementId, setSearchReturnFocusElementId] = useState(
    "synara-sidebar-search-trigger",
  );
  const navigation = useMemoryNavigationState();
  const setSearchPaletteOpen = useCallback(
    (open: boolean) => {
      "background only";
      setSearchOpen(open);
      void import(/* webpackMode: "eager" */ "../platform/bridge")
        .then(({ bridgeCall }) => bridgeCall("shellSetSearchNavigationEnabled", { enabled: open }))
        .catch(() => {
          // The Web host has no native application-menu accelerators.
        });
      if (!open && route.pathname !== "/settings") {
        focusLynxElementById(searchReturnFocusElementId);
      }
    },
    [route.pathname, searchReturnFocusElementId],
  );
  const openSearchPalette = useCallback(
    (initialQuery = "", returnFocusElementId = "synara-sidebar-search-trigger") => {
      setSearchInitialQuery(initialQuery);
      setSearchReturnFocusElementId(returnFocusElementId);
      setSearchPaletteKey((current) => current + 1);
      setSearchPaletteOpen(true);
    },
    [setSearchPaletteOpen],
  );
  useEffect(() => {
    "background only";
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ bridgeCall }) => {
        if (cancelled) return;
        const publishRoute = () => {
          const location = history.location.href;
          void bridgeCall("shellRouteChanged", {
            route: location,
            clearRelaunchUrl: !location.startsWith("/thread/"),
          }).catch(() => {
            // Web and older hosts do not need the desktop reload route mirror.
          });
        };
        unsubscribe = history.subscribe(publishRoute);
      })
      .catch(() => {
        // Web and older hosts do not need the desktop reload route mirror.
      });
    return () => {
      cancelled = true;
      unsubscribe?.();
    };
  }, []);
  const [sidebarUserOverride, setSidebarUserOverride] = useState<boolean | null>(null);
  const sidebarOpen = resolveResponsiveSidebarOpen({
    userOverride: sidebarUserOverride,
    viewportWidth,
    desktopMinimumWidth: VIEWPORT_BREAKPOINTS.md,
  });
  const setSidebarOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setSidebarUserOverride(typeof next === "function" ? next(sidebarOpen) : next);
    },
    [sidebarOpen],
  );
  const { data: routeThreads, isPending: routeThreadsPending } = useQuery({
    queryKey: ["threads"],
    queryFn: fetchThreads,
    enabled: !componentsLabRoute,
    refetchInterval: 5_000,
  });
  useEffect(() => {
    if (componentsLabRoute) return;
    let active = true;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeOrchestrationShellEvents((item) => {
      if (item.kind !== "snapshot" && item.kind !== "thread-upserted") return;
      if (invalidateTimer !== null) return;
      invalidateTimer = setTimeout(() => {
        invalidateTimer = null;
        if (!active) return;
        void queryClient.invalidateQueries({ queryKey: ["threads"] });
        // The sidebar and Kanban board read the sidebar snapshot; refresh it on
        // the same shell change instead of waiting for its 5s poll, as the web
        // app updates both live.
        void queryClient.invalidateQueries({ queryKey: ["sidebar-snapshot"] });
      }, 50);
    });
    return () => {
      active = false;
      unsubscribe();
      if (invalidateTimer !== null) clearTimeout(invalidateTimer);
    };
  }, [componentsLabRoute]);
  const routeProjects = useStore((state) => state.projects);
  const workspacePages = useWorkspaceStore((state) => state.workspacePages);
  const recentViews = useRecentViewsStore((state) => state.recentViews);
  const recordRecentView = useRecentViewsStore((state) => state.recordRecentView);
  const pruneRecentViewsStore = useRecentViewsStore((state) => state.pruneRecentViews);
  const [recentViewSelection, setRecentViewSelection] = useState<{
    readonly selectedIndex: number;
    readonly selectedKey: string;
  } | null>(null);
  const recentViewsRef = useRef(recentViews);
  const recentViewSelectionRef = useRef(recentViewSelection);
  const studioSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
  );
  const workspaceEnabled = initialWorkspaceVisible || studioSettings.showWorkspaceSection;
  const activeThreadId =
    route.pathname === "/thread/$threadId"
      ? route.params.threadId
      : initialRoute
        ? (parseRoute(initialRoute).params.threadId ?? null)
        : null;
  const currentRecentView = deriveCurrentRecentView({
    pathname: route.pathname,
    routeThreadId:
      route.pathname === "/thread/$threadId"
        ? (route.params.threadId as import("@synara/contracts").ThreadId)
        : null,
    activeThreadId:
      route.pathname === "/thread/$threadId"
        ? (route.params.threadId as import("@synara/contracts").ThreadId)
        : null,
    routeWorkspaceId:
      route.pathname === "/workspace/$workspaceId" ? (route.params.workspaceId ?? null) : null,
    settingsSection: route.pathname === "/settings" ? route.params.section : undefined,
  });
  const currentRecentViewKey = currentRecentView ? recentViewKey(currentRecentView) : null;
  const recentViewAvailability = useMemo(
    () => ({
      availableThreadIds: new Set(
        (routeThreads ?? []).map((thread) => thread.id as import("@synara/contracts").ThreadId),
      ),
      availableWorkspaceIds: new Set(workspacePages.map((workspace) => workspace.id)),
      availableSplitViewIds: new Set<string>(),
    }),
    [routeThreads, workspacePages],
  );
  const recentViewEntries = useMemo(
    () =>
      buildRecentViewDisplayEntries({
        recentViews,
        currentView: currentRecentView,
        // ThreadSummary ids are unbranded strings; the snapshot values are real ids.
        threadsById: Object.fromEntries(
          (routeThreads ?? []).map((thread) => [
            thread.id,
            {
              ...thread,
              id: thread.id as import("@synara/contracts").ThreadId,
              projectId: thread.projectId as import("@synara/contracts").ProjectId,
            },
          ]),
        ),
        projects: routeProjects,
        pinnedThreadIds: (routeThreads ?? [])
          .filter((thread) => thread.isPinned)
          .map((thread) => thread.id as import("@synara/contracts").ThreadId),
        workspacePages,
      }),
    [currentRecentViewKey, recentViews, routeProjects, routeThreads, workspacePages],
  );
  useEffect(() => {
    recentViewsRef.current = recentViews;
  }, [recentViews]);
  useEffect(() => {
    recentViewSelectionRef.current = recentViewSelection;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ bridgeCall }) =>
        bridgeCall("shellSetRecentViewNavigationEnabled", {
          enabled: recentViewSelection !== null,
        }),
      )
      .catch(() => undefined);
  }, [recentViewSelection]);
  useEffect(() => {
    if (currentRecentView) recordRecentView(currentRecentView);
  }, [currentRecentViewKey, recordRecentView]);
  useEffect(() => {
    if (routeThreadsPending) return;
    pruneRecentViewsStore(recentViewAvailability);
  }, [pruneRecentViewsStore, recentViewAvailability, routeThreadsPending]);
  const appNotifications = (
    <view
      className={`AppNotificationStack${
        route.pathname === "/components-lab" ? " AppNotificationStack--hidden" : ""
      }`}
    >
      <VoiceNotificationHost />
      <TaskCompletionToastHost
        activeThreadId={activeThreadId}
        threads={routeThreads ?? []}
        onOpenThread={(threadId) => history.push(`/thread/${threadId}`)}
      />
      <ProviderUpdatePrompt onReview={() => history.push("/settings/providers")} />
    </view>
  );
  const transportNotice =
    !componentsLabRoute && (transportState === "reconnecting" || transportState === "offline") ? (
      <view className={`TransportStatusNotice TransportStatusNotice--${transportState}`}>
        <text
          className="TransportStatusNoticeText"
          accessibility-element
          accessibility-label={
            transportState === "reconnecting" ? "Reconnecting to Synara" : "Synara is offline"
          }
          accessibility-trait="updating"
        >
          {transportState === "reconnecting" ? "Reconnecting…" : "Offline"}
        </text>
        {transportState === "offline" ? (
          <Button
            className="TransportStatusRetry"
            variant="ghost"
            size="xs"
            aria-label="Retry connecting to Synara"
            onClick={onRetryTransport}
          >
            Retry
          </Button>
        ) : null}
      </view>
    ) : null;
  const appSnapCoordinator = (
    <AppSnapCoordinator
      activeThreadId={activeThreadId}
      onOpenThread={(threadId) => history.push(`/thread/${threadId}`)}
    />
  );
  const appSnapWelcomeDialog = (
    <AppSnapWelcomeDialogLynx onOpenSettings={() => history.push("/settings/appsnap")} />
  );
  const [explorerQuery, setExplorerQuery] = useState(initialExplorerQuery);
  const [explorerSelectedPath, setExplorerSelectedPath] = useState<string | null>(
    initialExplorerPath,
  );
  const [explorerExpandedDirectories, setExplorerExpandedDirectories] = useState<
    ReadonlySet<string>
  >(() => new Set(initialExplorerExpandedDirectories));
  const previousExplorerThreadIdRef = useRef(activeThreadId);
  const explorerTrimmedQuery = explorerQuery.trim();
  const explorerExpandedDirectoryPaths = Array.from(explorerExpandedDirectories).toSorted();
  const {
    data: activeThreadData,
    error: activeThreadError,
    isPending: activeThreadPending,
  } = useQuery({
    queryKey: ["thread-detail", activeThreadId],
    queryFn: async () => {
      "background only";
      const threadId = activeThreadId;
      if (!threadId) throw new Error("Thread detail requires a thread id.");
      const [data, summary] = await Promise.all([
        fetchThreadTranscriptRows(threadId),
        fetchThreadHeaderSummary(threadId),
      ]);
      return { data, summary };
    },
    enabled: activeThreadId !== null,
    refetchInterval: 500,
    retry: false,
  });
  useEffect(() => {
    if (!activeThreadId) return;
    let active = true;
    let invalidateTimer: ReturnType<typeof setTimeout> | null = null;
    const unsubscribe = subscribeOrchestrationShellEvents((item) => {
      if (
        item.kind !== "snapshot" &&
        (item.kind !== "thread-upserted" || item.thread.id !== activeThreadId)
      )
        return;
      if (invalidateTimer !== null) return;
      invalidateTimer = setTimeout(() => {
        invalidateTimer = null;
        if (!active) return;
        void queryClient.invalidateQueries({
          queryKey: ["thread-detail", activeThreadId],
        });
      }, 50);
    });
    return () => {
      active = false;
      unsubscribe();
      if (invalidateTimer !== null) clearTimeout(invalidateTimer);
    };
  }, [activeThreadId]);
  const resolvedActiveThreadData = activeThreadData;
  // The new-thread landing (the web's draft thread) reports the project its
  // dock works in; a thread route always uses the thread's workspace.
  const [landingDockWorkspaceRoot, setLandingDockWorkspaceRoot] = useState<string | null>(null);
  const workspaceRoot =
    activeThreadId !== null
      ? (resolvedActiveThreadData?.summary?.workspaceRoot ?? null)
      : landingDockWorkspaceRoot;
  const explorerEntriesQuery = useQuery({
    queryKey: ["explorer-entries", activeThreadId, workspaceRoot, explorerTrimmedQuery],
    queryFn: async () => {
      "background only";
      if (!workspaceRoot) return null;
      return fetchExplorerEntries({ workspaceRoot, query: explorerTrimmedQuery });
    },
    enabled: workspaceRoot !== null,
    retry: false,
  });
  const explorerFileQuery = useQuery({
    queryKey: ["explorer-file", activeThreadId, workspaceRoot, explorerSelectedPath],
    queryFn: async () => {
      "background only";
      if (!workspaceRoot || !explorerSelectedPath) return null;
      return fetchExplorerFile({
        workspaceRoot,
        relativePath: explorerSelectedPath,
      });
    },
    enabled:
      workspaceRoot !== null &&
      explorerSelectedPath !== null &&
      !isSupportedLocalPreviewFilePath(explorerSelectedPath),
    retry: false,
  });
  const explorerLocalPreviewQuery = useQuery({
    queryKey: ["explorer-local-preview", activeThreadId, workspaceRoot, explorerSelectedPath],
    queryFn: async () => {
      "background only";
      if (!workspaceRoot || !explorerSelectedPath) return null;
      return fetchExplorerLocalPreviewUrl({
        workspaceRoot,
        relativePath: explorerSelectedPath,
      });
    },
    enabled:
      workspaceRoot !== null &&
      explorerSelectedPath !== null &&
      isSupportedLocalPreviewFilePath(explorerSelectedPath),
    retry: false,
  });
  const explorerPdfMetadataQuery = useQuery({
    queryKey: ["explorer-pdf-metadata", activeThreadId, workspaceRoot, explorerSelectedPath],
    queryFn: async () => {
      "background only";
      if (!workspaceRoot || !explorerSelectedPath) return null;
      return fetchExplorerPdfMetadata({
        workspaceRoot,
        relativePath: explorerSelectedPath,
      });
    },
    enabled:
      workspaceRoot !== null &&
      explorerSelectedPath !== null &&
      isSupportedLocalPdfPath(explorerSelectedPath),
    retry: false,
  });
  const expandedDirectoryKey = explorerExpandedDirectoryPaths.join("\0");
  const explorerDirectoriesQuery = useQuery({
    queryKey: ["explorer-directories", activeThreadId, workspaceRoot, expandedDirectoryKey],
    queryFn: async () => {
      "background only";
      if (!workspaceRoot || explorerTrimmedQuery.length > 0) return [];
      return Promise.all(
        explorerExpandedDirectoryPaths.map(async (path) => {
          try {
            const result = await fetchExplorerDirectory({
              workspaceRoot,
              relativePath: path,
            });
            return [path, result.entries, false] as const;
          } catch {
            return [path, [], true] as const;
          }
        }),
      );
    },
    enabled: workspaceRoot !== null && explorerTrimmedQuery.length === 0,
    retry: false,
  });
  const resolvedActiveThreadPending = resolvedActiveThreadData === undefined && activeThreadPending;
  const { entriesByPath: explorerDirectoryData, errorPaths: explorerDirectoryErrors } =
    projectExplorerDirectories(explorerDirectoriesQuery.data ?? []);
  const explorerDirectoryPending = new Set(
    explorerDirectoriesQuery.isFetching
      ? [...explorerExpandedDirectories].filter(
          (path) => explorerDirectoryData[path] === undefined && !explorerDirectoryErrors.has(path),
        )
      : [],
  );
  // Explorer state belongs to one workspace: a thread, or the landing's project.
  const explorerScopeKey = activeThreadId ?? `landing:${landingDockWorkspaceRoot ?? ""}`;
  useEffect(() => {
    if (previousExplorerThreadIdRef.current === explorerScopeKey) return;
    previousExplorerThreadIdRef.current = explorerScopeKey;
    setExplorerQuery("");
    setExplorerSelectedPath(null);
    setExplorerExpandedDirectories(new Set());
  }, [explorerScopeKey]);
  const [persistedLastRoute, setPersistedLastRoute] = useState<LastThreadRoute | null>(null);
  const [lastRouteHydrated, setLastRouteHydrated] = useState(false);
  const [coldStartRoutePending, setColdStartRoutePending] = useState(true);
  const [studioLandingReady, setStudioLandingReady] = useState(false);
  // Editor entry is an explicit, single-use navigation intent. The startup
  // flag belongs only to the initially addressed thread; ordinary sidebar
  // navigation must never inherit it when ThreadPage remounts for another id.
  const [editorEntryThreadId, setEditorEntryThreadId] = useState<string | null>(() =>
    initialEditorOpen ? activeThreadId : null,
  );
  const [editorModeOpen, setEditorModeOpen] = useState(initialEditorOpen);

  useEffect(() => {
    "background only";
    let active = true;
    void readPersistedLastThreadRouteFallback(readPersistedLastThreadRoute).then((value) => {
      if (!active) return;
      setPersistedLastRoute(value);
      setLastRouteHydrated(true);
    });
    return () => {
      active = false;
    };
  }, []);

  const readLastThreadRoute = useCallback(() => persistedLastRoute, [persistedLastRoute]);
  const resolveRestoreRoute = useCallback(
    () =>
      resolveRestorableThreadRoute({
        lastThreadRoute: persistedLastRoute,
        availableThreadIds: new Set((routeThreads ?? []).map((thread) => thread.id)),
      }),
    [persistedLastRoute, routeThreads],
  );
  const navigateToRestoredThread = useCallback(async (restoredRoute: LastThreadRoute) => {
    "background only";
    setColdStartRoutePending(false);
    history.replace(`/thread/${restoredRoute.threadId}`);
  }, []);
  const createFreshLynxLanding = useCallback(async () => {
    "background only";
    setColdStartRoutePending(false);
    return { ok: true as const };
  }, []);
  useRestoreOrCreateChatRouteController({
    enabled: coldStartRoutePending && route.pathname === "/" && lastRouteHydrated,
    threadsHydrated: !routeThreadsPending,
    threadIds: (routeThreads ?? []).map((thread) => thread.id),
    splitViewsHydrated: true,
    splitViewIds: [],
    readLastThreadRoute,
    resolveRestoreRoute,
    navigateToRoute: navigateToRestoredThread,
    createFreshChat: createFreshLynxLanding,
    refreshEmptySnapshot: refreshLynxRouteSnapshot,
    waitForFallbackDelay: waitForLynxRouteFallback,
  });
  const resolveStudioRoute = useCallback(
    () =>
      resolveStudioRestoreRoute({
        lastThreadRoute: persistedLastRoute,
        projects: routeProjects,
        sortOrder: studioSettings.sidebarThreadSortOrder,
        threads: routeThreads ?? [],
      }),
    [persistedLastRoute, routeProjects, routeThreads, studioSettings.sidebarThreadSortOrder],
  );
  const createFreshStudioLanding = useCallback(async () => {
    "background only";
    setStudioLandingReady(true);
    return { ok: true as const };
  }, []);
  const studioRouteController = useRestoreOrCreateChatRouteController({
    enabled: route.pathname === "/studio" && studioSettings.showStudioSection && lastRouteHydrated,
    threadsHydrated: !routeThreadsPending,
    threadIds: (routeThreads ?? []).map((thread) => thread.id),
    splitViewsHydrated: true,
    splitViewIds: [],
    readLastThreadRoute,
    resolveRestoreRoute: resolveStudioRoute,
    navigateToRoute: navigateToRestoredThread,
    createFreshChat: createFreshStudioLanding,
    refreshEmptySnapshot: refreshLynxRouteSnapshot,
    waitForFallbackDelay: waitForLynxRouteFallback,
  });
  useEffect(() => {
    if (route.pathname === "/studio" && !studioSettings.showStudioSection) {
      history.replace("/");
    }
  }, [route.pathname, studioSettings.showStudioSection]);
  useEffect(() => {
    if (route.pathname.startsWith("/workspace") && !workspaceEnabled) {
      history.replace("/");
    }
  }, [route.pathname, workspaceEnabled]);
  useEffect(() => {
    if (route.pathname !== "/studio") {
      setStudioLandingReady(false);
    }
  }, [route.pathname]);
  useEffect(() => {
    if (route.pathname === "/thread/$threadId" && route.params.threadId === editorEntryThreadId) {
      setEditorEntryThreadId(null);
    }
  }, [editorEntryThreadId, route.params.threadId, route.pathname]);

  const navigate = useCallback((to: string) => {
    const threadMatch = to.match(/^\/thread\/([^/]+)$/);
    if (threadMatch) {
      setPersistedLastRoute({ threadId: threadMatch[1] });
      void persistLastThreadRoute(threadMatch[1]);
    }
    history.push(to);
  }, []);
  const navigateToChat = useCallback(
    (to: string) => {
      setEditorEntryThreadId(null);
      setEditorModeOpen(false);
      navigate(to);
    },
    [navigate],
  );
  const activateRecentView = useCallback(
    (view: RecentView) => {
      if (view.kind === "thread") {
        navigateToChat(`/thread/${view.threadId}`);
        return;
      }
      if (view.kind === "workspace") {
        navigateToChat(`/workspace/${view.workspaceId}`);
        return;
      }
      if (view.kind === "settings") {
        navigateToChat(
          settingsRouteLocation((view.section as SettingsSectionId | undefined) ?? "general"),
        );
        return;
      }
      navigateToChat("/plugins");
    },
    [navigateToChat],
  );
  const commitRecentViewSelection = useCallback(() => {
    const selection = recentViewSelectionRef.current;
    if (!selection) return;
    const views = recentViewsRef.current;
    const view =
      views.find((candidate) => recentViewKey(candidate) === selection.selectedKey) ??
      views[selection.selectedIndex];
    setRecentViewSelection(null);
    if (view) activateRecentView(view);
  }, [activateRecentView]);
  const openOrAdvanceRecentViews = useCallback(
    (direction: "next" | "previous") => {
      const currentSelection = recentViewSelectionRef.current;
      let views = recentViewsRef.current;
      if (currentSelection === null) {
        views = pruneRecentViews(views, recentViewAvailability);
        pruneRecentViewsStore(recentViewAvailability);
      }
      const selectedIndex = resolveRecentViewNavigationIndex({
        recentViews: views,
        currentView: currentRecentView,
        selectedKey: currentSelection?.selectedKey,
        direction,
      });
      if (selectedIndex === null) return;
      const selectedView = views[selectedIndex];
      if (!selectedView) return;
      setRecentViewSelection({
        selectedIndex,
        selectedKey: recentViewKey(selectedView),
      });
    },
    [currentRecentViewKey, pruneRecentViewsStore, recentViewAvailability],
  );
  const renderTitlebarControls = (placement: "open" | "closed") => (
    <DesktopTitlebarControls
      canGoBack={navigation.canGoBack}
      canGoForward={navigation.canGoForward}
      placement={placement}
      onGoBack={() => history.back()}
      onGoForward={() => history.forward()}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
    />
  );
  const openTitlebarControls = renderTitlebarControls("open");
  const closedTitlebarControls = renderTitlebarControls("closed");
  const navigateBackFromSettings = useCallback(() => {
    const target = resolveSettingsBackTarget({
      lastThreadRoute: persistedLastRoute,
      availableThreadIds: new Set((routeThreads ?? []).map((thread) => thread.id)),
      latestThreadId: routeThreads?.[0]?.id ?? null,
    });
    history.push(target.kind === "thread" ? `/thread/${target.threadId}` : "/");
  }, [persistedLastRoute, routeThreads]);
  useEffect(() => {
    "background only";
    let cancelled = false;
    let disposeNavigate: (() => void) | null = null;
    let disposeHistory: (() => void) | null = null;
    let disposeCommand: (() => void) | null = null;
    let disposeRecentViewKey: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ "../platform/bridge")
      .then(({ bridgeCall, onGlobalEvent }) => {
        if (cancelled) return;
        disposeNavigate = onGlobalEvent("shell:navigate", (target: unknown) => {
          if (typeof target === "string" && target.startsWith("/")) {
            history.push(target);
          }
        });
        disposeHistory = onGlobalEvent("shell:navigate-history", (direction: unknown) => {
          if (direction === "back") history.back();
          if (direction === "forward") history.forward();
        });
        disposeCommand = onGlobalEvent("shell:command", (command: unknown) => {
          if (command === "sidebar.toggle") {
            setSidebarOpen((open) => !open);
            return;
          }
          if (command === "sidebar.search") {
            openSearchPalette();
            return;
          }
          if (command === "view.recent.next") {
            openOrAdvanceRecentViews("next");
            return;
          }
          if (command === "view.recent.previous") {
            openOrAdvanceRecentViews("previous");
          }
        });
        disposeRecentViewKey = onGlobalEvent("shell:recent-view-key", (event: unknown) => {
          if (event === "commit") commitRecentViewSelection();
          if (event === "cancel") setRecentViewSelection(null);
        });
        void bridgeCall<{ readonly route?: unknown }>("shellRendererReady")
          .then((reply) => {
            if (typeof reply?.route === "string" && reply.route.startsWith("/")) {
              setRoute(parseRoute(reply.route));
              history.replace(reply.route);
            }
          })
          .catch(() => {
            // A host without route delivery still renders the default route.
          });
      })
      .catch(() => {
        // Memory-history navigation remains available without shell events.
      });
    return () => {
      cancelled = true;
      disposeNavigate?.();
      disposeHistory?.();
      disposeCommand?.();
      disposeRecentViewKey?.();
    };
  }, [commitRecentViewSelection, openOrAdvanceRecentViews, openSearchPalette, setRoute]);

  const explorerDockProps: ExplorerDockProps = {
    explorerEntries: explorerEntriesQuery.data?.entries ?? [],
    explorerEntriesError: explorerEntriesQuery.isError,
    explorerEntriesPending: workspaceRoot !== null && explorerEntriesQuery.isPending,
    explorerEntriesTruncated: explorerEntriesQuery.data?.truncated ?? false,
    explorerDirectoryEntries: explorerDirectoryData,
    explorerDirectoryErrors: explorerDirectoryErrors,
    explorerDirectoryPending: explorerDirectoryPending,
    explorerExpandedDirectories: explorerExpandedDirectories,
    explorerFile: explorerFileQuery.data?.file ?? null,
    explorerFileError: explorerFileQuery.isError,
    explorerFilePending:
      explorerSelectedPath !== null &&
      !isSupportedLocalPreviewFilePath(explorerSelectedPath) &&
      workspaceRoot !== null &&
      explorerFileQuery.isPending,
    explorerFileRetrying: explorerFileQuery.isError && explorerFileQuery.isFetching,
    explorerFileSyntaxHighlight: explorerFileQuery.data?.syntaxHighlight ?? null,
    explorerLocalPreviewUrl: explorerLocalPreviewQuery.data ?? null,
    explorerLocalPreviewError: explorerLocalPreviewQuery.isError,
    explorerLocalPreviewPending:
      explorerSelectedPath !== null &&
      isSupportedLocalPreviewFilePath(explorerSelectedPath) &&
      workspaceRoot !== null &&
      explorerLocalPreviewQuery.isPending,
    explorerPdfPageCount: explorerPdfMetadataQuery.data?.pageCount ?? 0,
    explorerPdfPageHeight: explorerPdfMetadataQuery.data?.height ?? 0,
    explorerPdfPageWidth: explorerPdfMetadataQuery.data?.width ?? 0,
    explorerPdfMetadataError: explorerPdfMetadataQuery.isError,
    explorerPdfMetadataPending:
      explorerSelectedPath !== null &&
      isSupportedLocalPdfPath(explorerSelectedPath) &&
      workspaceRoot !== null &&
      explorerPdfMetadataQuery.isPending,
    explorerQuery: explorerQuery,
    explorerSelectedPath: explorerSelectedPath,
    onExplorerQueryChange: (query) => {
      setExplorerQuery(query);
      setExplorerSelectedPath(null);
    },
    onExplorerRetryFile: () => void explorerFileQuery.refetch(),
    onExplorerSelectPath: setExplorerSelectedPath,
    onExplorerToggleDirectory: (path) =>
      setExplorerExpandedDirectories((current) => toggleExpandedDirectory(current, path)),
  };
  let page: React.ReactNode;
  if (route.pathname === "/components-lab") {
    page = (
      <ComponentsLabPageLynx
        embedded={route.params.embed === "1"}
        selectedStoryId={route.params.story ?? null}
        selectedState={route.params.state ?? null}
        selectedVariant={route.params.variant ?? null}
        onSelectStory={(storyId) =>
          history.push(`/components-lab?story=${encodeURIComponent(storyId)}&state=default`)
        }
        onSelectState={(state) =>
          history.push(
            `/components-lab?story=${encodeURIComponent(route.params.story ?? COMPONENT_LAB_STORIES[0]!.id)}&state=${encodeURIComponent(state)}&variant=${encodeURIComponent(route.params.variant ?? COMPONENT_LAB_STORIES.find((story) => story.id === route.params.story)?.variants[0] ?? "default")}`,
          )
        }
        onSelectVariant={(variant) =>
          history.push(
            `/components-lab?story=${encodeURIComponent(route.params.story ?? COMPONENT_LAB_STORIES[0]!.id)}&state=${encodeURIComponent(route.params.state ?? "default")}&variant=${encodeURIComponent(variant)}`,
          )
        }
      />
    );
  } else if (route.pathname === "/settings") {
    page = (
      <SettingsPage
        key="settings-route-shell"
        initialSection={(route.params.section as SettingsSectionId | undefined) ?? "general"}
        initialTarget={route.params.target ?? initialSettingsTarget}
        onBack={navigateBackFromSettings}
        onNavigate={(section, target) => {
          history.push(settingsRouteLocation(section, target));
        }}
        sidebarOpen={sidebarOpen}
        openTitlebarControls={openTitlebarControls}
        closedTitlebarControls={closedTitlebarControls}
        resolvedTheme={resolvedTheme}
        onAppearanceChange={onAppearanceChange}
        onThemeStateChange={onThemeStateChange}
      />
    );
  } else if (route.pathname === "/thread/$threadId") {
    page = (
      <ThreadPage
        key={route.params.threadId}
        appearance={appearance}
        currentThread={resolvedActiveThreadData?.summary}
        data={resolvedActiveThreadData?.data}
        environmentData={null}
        error={activeThreadError}
        initialEnvironmentOpen={initialEnvironmentOpen}
        initialDiffOpen={initialDiffOpen}
        initialDiffTurnId={initialDiffTurnId}
        initialDiffFilePath={initialDiffFilePath}
        initialDiffFileTreeOpen={initialDiffFileTreeOpen}
        initialEditorOpen={editorEntryThreadId === route.params.threadId}
        initialEditorCenterMode={initialEditorCenterMode}
        initialEditorChatOpen={initialEditorChatOpen}
        initialEditorSearchOpen={initialEditorSearchOpen}
        initialEditorProjectMenuOpen={initialEditorProjectMenuOpen}
        initialWorkingTreeDiff={null}
        initialWorkingTreeDiffUnavailableLabel={null}
        initialRenameOpen={initialRenameOpen}
        initialTerminalOpen={initialTerminalOpen}
        initialTemporaryOpen={
          initialTemporaryOpen || landingTemporaryThreadId === route.params.threadId
        }
        initialExplorerWidth={initialExplorerWidth}
        initialExplorerOpen={initialExplorerOpen}
        initialExplorerPresentationMode={initialExplorerPresentationMode}
        initialExplorerActionMenuOpen={initialExplorerActionMenuOpen}
        initialExplorerCommentLine={initialExplorerCommentLine}
        isPending={resolvedActiveThreadPending}
        {...explorerDockProps}
        onEditorModeChange={setEditorModeOpen}
        onNavigateToThread={(threadId) => {
          setEditorEntryThreadId(threadId);
          navigate(`/thread/${threadId}`);
        }}
        projects={routeProjects}
        threadId={route.params.threadId}
        threads={routeThreads ?? []}
        resolvedTheme={resolvedTheme}
        viewportWidth={viewportWidth}
        viewportHeight={viewportHeight}
      />
    );
  } else if (route.pathname === "/studio") {
    page = studioLandingReady ? (
      <ThreadsLandingPage
        appearance={appearance}
        explorerDockProps={explorerDockProps}
        onDockWorkspaceChange={setLandingDockWorkspaceRoot}
        resolvedTheme={resolvedTheme}
        viewportHeight={viewportHeight}
        viewportWidth={viewportWidth}
        key="studio"
        containerKind="studio"
        onThreadCreated={(threadId, options) => {
          setLandingTemporaryThreadId(options.temporary ? threadId : null);
          navigate(`/thread/${threadId}`);
        }}
      />
    ) : (
      <view className="ThreadsLanding">
        <ThreadsLandingHeader project={null} />
        <view className="ThreadsLandingBody">
          <view className="ThreadsLandingBodyInner">
            <PanelStateMessage
              intent={studioRouteController.errorMessage ? "alert" : "status"}
              announcement={
                studioRouteController.errorMessage ? "Unable to open Studio" : "Opening Studio"
              }
            >
              {studioRouteController.errorMessage ?? "Opening Studio…"}
            </PanelStateMessage>
            {studioRouteController.retry ? (
              <Button variant="outline" onClick={() => studioRouteController.retry?.()}>
                Retry
              </Button>
            ) : null}
          </view>
        </view>
      </view>
    );
  } else if (route.pathname === "/workspace" && workspaceEnabled) {
    const workspaceId = workspacePages[0]?.id ?? null;
    page = workspaceId ? (
      <WorkspacePage
        appearance={appearance}
        workspaceId={workspaceId}
        navigate={(to) => history.replace(to)}
      />
    ) : (
      <ThreadsLandingPage
        appearance={appearance}
        explorerDockProps={explorerDockProps}
        onDockWorkspaceChange={setLandingDockWorkspaceRoot}
        resolvedTheme={resolvedTheme}
        viewportHeight={viewportHeight}
        viewportWidth={viewportWidth}
        onThreadCreated={(threadId, options) => {
          setLandingTemporaryThreadId(options.temporary ? threadId : null);
          navigate(`/thread/${threadId}`);
        }}
      />
    );
  } else if (route.pathname === "/workspace/$workspaceId" && workspaceEnabled) {
    page = (
      <WorkspacePage
        appearance={appearance}
        workspaceId={route.params.workspaceId}
        navigate={(to) => history.replace(to)}
      />
    );
  } else if (route.pathname === "/kanban") {
    page = <ProjectsPage navigate={(to) => history.push(to)} />;
  } else if (route.pathname === "/kanban/$projectId") {
    page = (
      <KanbanProjectPage navigate={(to) => history.push(to)} projectId={route.params.projectId} />
    );
  } else if (route.pathname === "/pull-requests") {
    page = <PullRequestsPage />;
  } else if (route.pathname === "/plugins") {
    page = <PluginLibraryPage />;
  } else if (route.pathname === "/automations") {
    page = <AutomationsPage navigate={(to) => history.push(to)} />;
  } else if (route.pathname === "/automations/$automationId") {
    page = (
      <AutomationsPage
        automationId={route.params.automationId}
        navigate={(to) => history.push(to)}
      />
    );
  } else if (route.pathname === "/update") {
    page = <UpdatePage />;
  } else {
    page = (
      <ThreadsLandingPage
        appearance={appearance}
        explorerDockProps={explorerDockProps}
        onDockWorkspaceChange={setLandingDockWorkspaceRoot}
        resolvedTheme={resolvedTheme}
        viewportHeight={viewportHeight}
        viewportWidth={viewportWidth}
        key={
          route.pathname === "/new-thread/$projectId" ? `project:${route.params.projectId}` : "chat"
        }
        initialProjectId={
          route.pathname === "/new-thread/$projectId" ? route.params.projectId : null
        }
        onThreadCreated={(threadId, options) => {
          setLandingTemporaryThreadId(options.temporary ? threadId : null);
          navigate(`/thread/${threadId}`);
        }}
      />
    );
  }

  const sidebar =
    route.pathname !== "/settings" && route.pathname !== "/components-lab" ? (
      <SidebarDisclosure open={sidebarOpen && !editorModeOpen}>
        <Sidebar
          activeThreadId={route.pathname === "/thread/$threadId" ? route.params.threadId : null}
          draftProjectId={
            route.pathname === "/new-thread/$projectId" ? route.params.projectId : null
          }
          activeWorkspaceId={
            route.pathname === "/workspace/$workspaceId"
              ? route.params.workspaceId
              : (workspacePages[0]?.id ?? null)
          }
          activePath={
            route.pathname === "/kanban/$projectId"
              ? "/kanban"
              : route.pathname === "/workspace/$workspaceId"
                ? "/workspace"
                : route.pathname
          }
          navigate={navigateToChat}
          searchOpen={searchOpen}
          onOpenSearch={openSearchPalette}
          titlebarControls={openTitlebarControls}
        />
      </SidebarDisclosure>
    ) : null;
  if (route.pathname === "/settings") {
    return (
      <>
        {page}
        <SidebarSearchPaletteHost
          activeThreadId={activeThreadId}
          initialQuery={searchInitialQuery}
          navigate={navigateToChat}
          onOpenChange={setSearchPaletteOpen}
          open={searchOpen}
          paletteKey={searchPaletteKey}
        />
        {recentViewSelection ? (
          <RecentViewSwitcherLynx
            entries={recentViewEntries}
            selectedIndex={recentViewSelection.selectedIndex}
          />
        ) : null}
        {appSnapCoordinator}
        {appSnapWelcomeDialog}
        {appNotifications}
      </>
    );
  }
  if (route.pathname === "/components-lab") {
    return (
      <>
        {page}
        <view className="AppNotificationStack AppNotificationStack--hidden" />
      </>
    );
  }
  return (
    <>
      {transportNotice}
      <AppShellFrame key="product-route-shell" sidebar={sidebar}>
        <view
          className={`AppMain AppMain--sidebar-${
            sidebarOpen && !editorModeOpen ? "open" : "closed"
          }`}
        >
          {sidebarOpen || editorModeOpen ? null : closedTitlebarControls}
          {page}
        </view>
      </AppShellFrame>
      <SidebarSearchPaletteHost
        activeThreadId={activeThreadId}
        initialQuery={searchInitialQuery}
        navigate={navigateToChat}
        onOpenChange={setSearchPaletteOpen}
        open={searchOpen}
        paletteKey={searchPaletteKey}
      />
      {recentViewSelection ? (
        <RecentViewSwitcherLynx
          entries={recentViewEntries}
          selectedIndex={recentViewSelection.selectedIndex}
        />
      ) : null}
      {appSnapCoordinator}
      {appSnapWelcomeDialog}
      {appNotifications}
    </>
  );
}
