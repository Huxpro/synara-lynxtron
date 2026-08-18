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

import { createMemoryHistory } from '@tanstack/history';
import {
  useCallback,
  useEffect,
  useInitData,
  useRef,
  useState,
} from '@lynx-js/react';
import type { InputRef } from '@lynx-js/lynx-ui';
import { useQuery } from '@tanstack/react-query';
import type {
  GitReadWorkingTreeDiffResult,
  ProviderApprovalDecision,
  ProviderKind,
  ServerProviderStatus,
} from '@synara/contracts';
import type { SettingsAppearanceValues } from '@synara-web/components/settings/SettingsAppearanceComposition.logic';
import type { ThemeState } from '@synara-web/theme/theme.logic';
import type { SettingsSectionId } from '@synara-web/settingsNavigation';
import type { Project } from '@synara-web/types';
import { useStore } from '@synara-web/store';
import { useWorkspaceStore } from '@synara-web/workspaceStore';
import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsGeneralProjection,
  writeSettingsGeneralProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import { resolveProviderHealthBannerPresentation } from '@synara-web/components/chat/ProviderHealthBanner.logic';
import { findProviderStatus } from '@synara-web/lib/providerAvailability';
import { clampSidebarWidth } from '@synara-web/components/sidebarResize.logic';
import {
  isSupportedLocalPdfPath,
  isSupportedLocalPreviewFilePath,
} from '@synara/shared/localPreviewFiles';
import { VIEWPORT_BREAKPOINTS } from '@synara-web/responsiveLayout.logic';

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
  type ThreadSummary,
} from './queries';
import { resolveStudioRestoreRoute } from './studioRoute.logic';
import {
  parseSettingsRouteLocation,
  settingsRouteLocation,
} from './settingsRoute.logic';
import {
  projectExplorerDirectories,
  toggleExpandedDirectory,
} from './explorerTree.logic';
import { threadRecapRevision } from './environmentRecap.logic';
import type { EnvironmentBootstrapData } from './environmentBootstrap.lynx';
import { Transcript, type TranscriptController } from './Transcript';
import { SettingsPage } from './SettingsPage';
import { UpdatePage } from './UpdatePage';
import {
  KanbanProjectPage,
  ProjectsPage,
  PullRequestsPage,
} from './FeatureListsPage';
import { AutomationsPage } from './AutomationsPage.lynx';
import { PluginLibraryPage } from './PluginLibraryPage.lynx';
import { resolveLandingRoutePresentation } from './landingRoutePresentation.logic';
import { WorkspacePage } from './WorkspacePage.lynx';
import { Composer } from '../components/composer/Composer.lynx';
import { PendingApprovalPanel } from '../components/composer/PendingApprovalPanel.lynx';
import { PendingUserInputPanel } from '../components/composer/PendingUserInputPanel.lynx';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input.lynx';
import { dispatchSynaraCommand } from '../data/synaraClient.lynx';
import { Sidebar } from '../components/sidebar/Sidebar.lynx';
import { CenteredEmptyLanding } from '@synara-web/components/CenteredEmptyLanding';
import { CenteredEmptyLandingStack } from '@synara-web/components/CenteredEmptyLandingStack';
import { AppShellFrame } from '@synara-web/components/AppShellFrame';
import { ChatSurfaceHeaderFrame } from '@synara-web/components/chat/ChatSurfaceHeaderFrame';
import { ChatSurfaceHeaderIdentity } from '@synara-web/components/chat/ChatSurfaceHeaderIdentity';
import { ComposerColumnFrameSurface } from '@synara-web/components/chat/ComposerColumnFrameSurface';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import {
  LandingComposer,
  loadLandingBootstrap,
} from '../components/composer/LandingComposer.lynx';
import { resolveLandingModelProvider } from '../components/composer/landingModelProvider.logic';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ProviderHealthBanner } from '../components/ProviderHealthBanner.lynx';
import { ThreadErrorBanner } from '../components/ThreadErrorBanner.lynx';
import {
  EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS,
  resolveRestorableThreadRoute,
  type LastThreadRoute,
} from '@synara-web/chatRouteRestore';
import { useRestoreOrCreateChatRouteController } from '@synara-web/components/useRestoreOrCreateChatRoute.logic';
import { resolveSettingsBackTarget } from '@synara-web/components/SidebarSettingsBack.logic';
import { resolveThreadPageBodyState } from './threadPageState.logic';
import {
  threadErrorDismissKey,
  visibleThreadError,
} from './threadErrorBanner.logic';
import { resolveDefaultEnvironmentPanelOpen } from '@synara-web/components/ChatView.logic';
import {
  readEditorChatPaneVisible,
  readEditorViewState,
  storeEditorChatPaneVisible,
  storeEditorViewState,
} from '@synara-web/editorViewState';
import { sleepOnHost } from '../platform/timer';
import { EmptyThreadContextTray } from './EmptyThreadContextTray.lynx';
import { ThreadTerminal } from './ThreadTerminal.lynx';
import { DiffDock } from './DiffDock.lynx';
import { ExplorerDock } from './ExplorerDock.lynx';
import { ResizableRightPanel } from './ResizableRightPanel.lynx';
import {
  EDITOR_CHAT_PANE_DEFAULT_WIDTH,
  EDITOR_CHAT_PANE_MAX_WIDTH,
  EDITOR_CHAT_PANE_MIN_WIDTH,
  EDITOR_CHAT_PANE_STORAGE_KEY,
} from '@synara-web/editorViewState';
import {
  EnvironmentPanel,
  EnvironmentToggle,
} from './EnvironmentPanel.lynx';
import { useTemporaryThreadLifecycle } from './temporaryThreadLifecycle.lynx';
import { DesktopTitlebarControls } from '../adapters/DesktopTitlebarControls.lynx';
import { SidebarDisclosure } from './SidebarDisclosure.lynx';
import {
  ClockIcon,
  ChevronDownIcon,
  FolderIcon,
  MessageCircleIcon,
  PlusIcon,
  SearchIcon,
} from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import { webStorage } from '../platform/storage';
import { formatRelativeTime } from '@synara-web/lib/relativeTime';
import { resolveEditorChatHistoryThreads } from './editorChatHistory.logic';
import {
  resolveEditorProjectSwitchOptions,
  resolveEditorProjectSwitchTarget,
} from './editorProjectSwitch.logic';
import {
  resolveMemoryNavigationState,
  type MemoryNavigationState,
} from './routerHistory.logic';
import { readPersistedLastThreadRouteFallback } from './routerPersistence.logic';
import { resolveResponsiveSidebarOpen } from './sidebarVisibility.logic';
import { TaskCompletionToastHost } from './TaskCompletionToastHost.lynx';
import { ProviderUpdatePrompt } from './ProviderUpdatePrompt.lynx';
import { AppSnapCoordinator } from './AppSnapCoordinator.lynx';
export const history = createMemoryHistory({ initialEntries: ['/'] });

async function readPersistedLastThreadRoute(): Promise<LastThreadRoute | null> {
  'background only';
  const { hydrateStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await hydrateStorage();
  const { readSidebarUiState } = await import(
    /* webpackMode: "eager" */ '@synara-web/components/Sidebar.uiState'
  );
  return readSidebarUiState().lastThreadRoute;
}

async function persistLastThreadRoute(threadId: string): Promise<void> {
  'background only';
  const { persistSidebarUiState, readSidebarUiState } = await import(
    /* webpackMode: "eager" */ '@synara-web/components/Sidebar.uiState'
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
  const [routePathname] = pathname.split('?', 2);
  const threadMatch = routePathname.match(/^\/thread\/([^/]+)$/);
  if (threadMatch) {
    return { pathname: '/thread/$threadId', params: { threadId: threadMatch[1] } };
  }
  const settingsRoute = parseSettingsRouteLocation(pathname);
  if (settingsRoute) {
    return {
      pathname: '/settings',
      params: {
        ...(settingsRoute.section ? { section: settingsRoute.section } : {}),
        ...(settingsRoute.target ? { target: settingsRoute.target } : {}),
      },
    };
  }
  const newThreadMatch = routePathname.match(/^\/new-thread\/([^/]+)$/);
  if (newThreadMatch) {
    return {
      pathname: '/new-thread/$projectId',
      params: { projectId: decodeURIComponent(newThreadMatch[1]) },
    };
  }
  if (routePathname === '/studio') {
    return { pathname: '/studio', params: {} };
  }
  const workspaceMatch = routePathname.match(/^\/workspace\/([^/]+)$/);
  if (workspaceMatch) {
    return {
      pathname: '/workspace/$workspaceId',
      params: { workspaceId: decodeURIComponent(workspaceMatch[1]) },
    };
  }
  if (routePathname === '/workspace') {
    return { pathname: '/workspace', params: {} };
  }
  if (routePathname === '/kanban') {
    return { pathname: '/kanban', params: {} };
  }
  const kanbanProjectMatch = routePathname.match(/^\/kanban\/([^/]+)$/);
  if (kanbanProjectMatch) {
    return {
      pathname: '/kanban/$projectId',
      params: { projectId: decodeURIComponent(kanbanProjectMatch[1]) },
    };
  }
  if (routePathname === '/pull-requests') {
    return { pathname: '/pull-requests', params: {} };
  }
  if (routePathname === '/plugins') {
    return { pathname: '/plugins', params: {} };
  }
  if (routePathname === '/automations') {
    return { pathname: '/automations', params: {} };
  }
  const automationMatch = routePathname.match(/^\/automations\/([^/]+)$/);
  if (automationMatch) {
    return {
      pathname: '/automations/$automationId',
      params: { automationId: decodeURIComponent(automationMatch[1]) },
    };
  }
  if (routePathname === '/update') {
    return { pathname: '/update', params: {} };
  }
  return { pathname: '/', params: {} };
}

export function useRoute(initialPathname: string | null = null): readonly [
  RouteState,
  (route: RouteState) => void,
] {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRoute(initialPathname ?? history.location.href)
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
  providerStatuses: readonly ServerProviderStatus[]
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
function ThreadsLandingPage(props: {
  readonly containerKind?: 'chat' | 'studio';
  readonly initialProjectId?: string | null;
  readonly onThreadCreated: (threadId: string) => void;
}) {
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(
    props.initialProjectId ?? null
  );
  const initData = useInitData() as {
    readonly initialComposerModelProvider?: unknown;
  };
  const generalSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const initialModelProvider = resolveLandingModelProvider(
    initData.initialComposerModelProvider,
    generalSettings.defaultProvider
  );
  const { data: landingBootstrap } = useQuery({
    queryKey: [
      'landing-composer-bootstrap',
      initialModelProvider,
      props.containerKind ?? 'chat',
    ],
    queryFn: () =>
      loadLandingBootstrap(
        initialModelProvider,
        props.containerKind ?? 'chat'
      ),
    staleTime: 30_000,
  });
  const providerStatuses = landingBootstrap?.serverConfig.providers ?? [];
  const providerHealth = useProviderHealthBanner('codex', providerStatuses);
  const routePresentation = resolveLandingRoutePresentation({
    initialProjectId: selectedProjectId,
    projects: landingBootstrap?.projects ?? [],
  });
  return (
    <view className="ThreadsLanding">
      <ChatSurfaceHeaderFrame className="ThreadsLandingHeader">
        <view className="ThreadsLandingHeaderIdentity">
          <ChatSurfaceHeaderIdentity
            title={routePresentation.headerTitle}
            icon={<OpenAIProviderIcon />}
            iconTitle="Codex"
          />
        </view>
      </ChatSurfaceHeaderFrame>
      <ProviderHealthBanner
        status={providerHealth.status}
        onDismiss={providerHealth.dismiss}
      />
      <scroll-view
        className="ThreadsLandingBody"
        scroll-orientation="vertical"
      >
        <view className="ThreadsLandingBodyInner">
          <CenteredEmptyLandingStack>
            <CenteredEmptyLanding
              projectName={routePresentation.projectName}
            />
            <ComposerColumnFrameSurface>
              <LandingComposer
                containerKind={props.containerKind}
                initialModelProvider={initialModelProvider}
                initialProjectId={selectedProjectId}
                onProjectSelectionChange={setSelectedProjectId}
                onThreadCreated={props.onThreadCreated}
              />
            </ComposerColumnFrameSurface>
          </CenteredEmptyLandingStack>
        </view>
      </scroll-view>
    </view>
  );
}

interface ThreadPageProps {
  readonly appearance: SettingsAppearanceValues;
  readonly currentThread: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
  readonly data: Awaited<ReturnType<typeof fetchThreadTranscriptRows>> | undefined;
  readonly error: unknown;
  readonly environmentData: EnvironmentBootstrapData | null;
  readonly explorerEntries: Awaited<
    ReturnType<typeof fetchExplorerEntries>
  >['entries'];
  readonly explorerEntriesError: boolean;
  readonly explorerEntriesPending: boolean;
  readonly explorerEntriesTruncated: boolean;
  readonly explorerDirectoryEntries: Readonly<
    Record<string, ExplorerEntriesResult['entries']>
  >;
  readonly explorerDirectoryErrors: ReadonlySet<string>;
  readonly explorerDirectoryPending: ReadonlySet<string>;
  readonly explorerExpandedDirectories: ReadonlySet<string>;
  readonly explorerFile: Awaited<
    ReturnType<typeof fetchExplorerFile>
  >['file'] | null;
  readonly explorerFileError: boolean;
  readonly explorerFilePending: boolean;
  readonly explorerFileSyntaxHighlight: Awaited<
    ReturnType<typeof fetchExplorerFile>
  >['syntaxHighlight'];
  readonly explorerLocalPreviewUrl: string | null;
  readonly explorerLocalPreviewError: boolean;
  readonly explorerLocalPreviewPending: boolean;
  readonly explorerPdfPageCount: number;
  readonly explorerPdfMetadataError: boolean;
  readonly explorerPdfMetadataPending: boolean;
  readonly explorerQuery: string;
  readonly explorerSelectedPath: string | null;
  readonly initialEnvironmentOpen: boolean;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: 'file' | 'diff';
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorSearchOpen: boolean;
  readonly initialWorkingTreeDiff: GitReadWorkingTreeDiffResult | null;
  readonly initialWorkingTreeDiffUnavailableLabel: string | null;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialTemporaryOpen: boolean;
  readonly initialExplorerWidth: number | null;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerCommentLine: number | null;
  readonly isPending: boolean;
  readonly onExplorerQueryChange: (query: string) => void;
  readonly onExplorerSelectPath: (path: string) => void;
  readonly onExplorerToggleDirectory: (path: string) => void;
  readonly onNavigateToThread: (threadId: string) => void;
  readonly projects: readonly Project[];
  readonly threadId: string;
  readonly threads: readonly ThreadSummary[];
  readonly resolvedTheme: 'dark' | 'light';
  readonly viewportWidth: number;
}

function ThreadRightDocks(
  props: Pick<
    ThreadPageProps,
    | 'currentThread'
    | 'explorerDirectoryEntries'
    | 'explorerDirectoryErrors'
    | 'explorerDirectoryPending'
    | 'explorerEntries'
    | 'explorerEntriesError'
    | 'explorerEntriesPending'
    | 'explorerEntriesTruncated'
    | 'explorerExpandedDirectories'
    | 'explorerFile'
    | 'explorerFileError'
    | 'explorerFilePending'
    | 'explorerFileSyntaxHighlight'
    | 'explorerLocalPreviewError'
    | 'explorerLocalPreviewPending'
    | 'explorerLocalPreviewUrl'
    | 'explorerPdfPageCount'
    | 'explorerPdfMetadataError'
    | 'explorerPdfMetadataPending'
    | 'explorerQuery'
    | 'explorerSelectedPath'
    | 'initialExplorerWidth'
    | 'initialExplorerCommentLine'
    | 'onExplorerQueryChange'
    | 'onExplorerSelectPath'
    | 'onExplorerToggleDirectory'
    | 'resolvedTheme'
    | 'viewportWidth'
  > & {
    readonly diffOpen: boolean;
    readonly explorerOpen: boolean;
    readonly threadPageWidth: number;
    readonly setDiffDockWidth: (width: number | null) => void;
    readonly setDiffOpen: (open: boolean) => void;
    readonly setExplorerDockWidth: (width: number | null) => void;
    readonly setExplorerOpen: (open: boolean) => void;
  }
) {
  const {
    currentThread,
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
    explorerFileSyntaxHighlight,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerLocalPreviewUrl,
    explorerPdfPageCount,
    explorerPdfMetadataError,
    explorerPdfMetadataPending,
    explorerOpen,
    explorerQuery,
    explorerSelectedPath,
    initialExplorerWidth,
    initialExplorerCommentLine,
    onExplorerQueryChange,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
    resolvedTheme,
    setDiffDockWidth,
    setDiffOpen,
    setExplorerDockWidth,
    setExplorerOpen,
    threadPageWidth,
    viewportWidth,
  } = props;
  const availableWidth = threadPageWidth || viewportWidth;
  return (
    <>
      <DiffDock
        availableWidth={availableWidth}
        open={diffOpen}
        workspaceRoot={currentThread?.workspaceRoot ?? null}
        onClose={() => {
          setDiffOpen(false);
          setDiffDockWidth(null);
        }}
        onWidthChange={setDiffDockWidth}
      />
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
        file={explorerFile}
        fileError={explorerFileError}
        filePending={explorerFilePending}
        fileSyntaxHighlight={explorerFileSyntaxHighlight}
        localPreviewUrl={explorerLocalPreviewUrl}
        localPreviewError={explorerLocalPreviewError}
        localPreviewPending={explorerLocalPreviewPending}
        pdfPageCount={explorerPdfPageCount}
        pdfMetadataError={explorerPdfMetadataError}
        pdfMetadataPending={explorerPdfMetadataPending}
        open={explorerOpen}
        query={explorerQuery}
        selectedPath={explorerSelectedPath}
        threadId={currentThread?.id ?? ''}
        theme={resolvedTheme}
        workspaceRoot={currentThread?.workspaceRoot ?? null}
        onWidthChange={setExplorerDockWidth}
        onQueryChange={onExplorerQueryChange}
        onSelectPath={onExplorerSelectPath}
        onToggleDirectory={onExplorerToggleDirectory}
        onClose={() => {
          setExplorerOpen(false);
          setExplorerDockWidth(null);
        }}
      />
    </>
  );
}

function ThreadPage(props: ThreadPageProps) {
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
    explorerFileSyntaxHighlight,
    explorerLocalPreviewUrl,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerPdfPageCount,
    explorerPdfMetadataError,
    explorerPdfMetadataPending,
    explorerQuery,
    explorerSelectedPath,
    initialEnvironmentOpen,
    initialEditorOpen,
    initialEditorCenterMode,
    initialEditorChatOpen,
    initialEditorSearchOpen,
    initialWorkingTreeDiff,
    initialWorkingTreeDiffUnavailableLabel,
    initialRenameOpen,
    initialTerminalOpen,
    initialTemporaryOpen,
    initialExplorerWidth,
    initialExplorerCommentLine,
    initialExplorerOpen,
    isPending,
    onExplorerQueryChange,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
    onNavigateToThread,
    threadId,
    threads,
    resolvedTheme,
    viewportWidth,
  } = props;
  const { temporary, toggleTemporary } = useTemporaryThreadLifecycle(
    threadId,
    initialTemporaryOpen
  );
  const [providerStatuses, setProviderStatuses] = useState<
    readonly ServerProviderStatus[]
  >([]);
  const environmentSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const [environmentUserOverride, setEnvironmentUserOverride] = useState<
    boolean | null
  >(initialEnvironmentOpen ? true : null);
  const [diffOpen, setDiffOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(initialExplorerOpen);
  const [terminalOpen, setTerminalOpen] = useState(initialTerminalOpen);
  const [editorMode, setEditorMode] = useState(initialEditorOpen);
  const [editorSearchActive, setEditorSearchActive] = useState(
    initialEditorSearchOpen
  );
  const [editorChatOpen, setEditorChatOpen] = useState(
    () => initialEditorChatOpen ?? readEditorChatPaneVisible()
  );
  const [editorChatHistoryOpen, setEditorChatHistoryOpen] = useState(
    initData.initialEditorHistoryOpen === true
  );
  const [editorProjectSwitchOpen, setEditorProjectSwitchOpen] = useState(false);
  const [editorRailNewOpen, setEditorRailNewOpen] = useState(
    initData.initialEditorNewOpen === true
  );
  const [editorRailSurface, setEditorRailSurface] = useState<
    'chat' | 'terminal'
  >(initialEditorOpen && initialTerminalOpen ? 'terminal' : 'chat');
  const [editorRailDraftProjectId, setEditorRailDraftProjectId] = useState<
    string | null
  >(
    initData.initialEditorNewChatOpen === true
      ? currentThread?.projectId ?? null
      : null
  );
  const [editorRailDraftOpen, setEditorRailDraftOpen] = useState(
    initData.initialEditorNewChatOpen === true
  );
  const [editorCenterMode, setEditorCenterMode] = useState<'file' | 'diff'>(
    () =>
      initialEditorCenterMode === 'diff'
        ? 'diff'
        : readEditorViewState(threadId)?.centerMode ?? 'file'
  );
  const [renamingThread, setRenamingThread] = useState(initialRenameOpen);
  const [threadTitleDraft, setThreadTitleDraft] = useState(
    currentThread?.title ?? ''
  );
  const [threadRenamePending, setThreadRenamePending] = useState(false);
  const [threadRenameError, setThreadRenameError] = useState<string | null>(
    null
  );
  const [dismissedThreadErrorKey, setDismissedThreadErrorKey] = useState<
    string | null
  >(null);
  const threadRenameInputRef = useRef<InputRef>(null);
  const threadRenameTouchedRef = useRef(false);
  const [threadPageWidth, setThreadPageWidth] = useState(0);
  const [diffDockWidth, setDiffDockWidth] = useState<number | null>(null);
  const [explorerDockWidth, setExplorerDockWidth] = useState<number | null>(() =>
    initialExplorerOpen && viewportWidth > 0
      ? clampSidebarWidth(
          initialExplorerWidth ?? Math.round(viewportWidth / 2),
          {
            maxWidth: 960,
            minWidth: 480,
            minimumContentWidth: 320,
            viewportWidth,
          }
        )
      : null
  );
  const transcriptControllerRef = useRef<TranscriptController | null>(null);
  const registerTranscriptController = useCallback(
    (controller: TranscriptController | null) => {
      transcriptControllerRef.current = controller;
    },
    []
  );
  const providerHealth = useProviderHealthBanner(
    currentThread?.provider ?? 'codex',
    providerStatuses
  );
  const providerHealthVisible =
    resolveProviderHealthBannerPresentation(providerHealth.status) !== null;
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
    })),
    sortOrder: environmentSettings.sidebarThreadSortOrder,
    threads,
  });
  const editorRailDraftProject =
    editorRailDraftProjectId === null
      ? null
      : props.projects.find(
          (project) => project.id === editorRailDraftProjectId
        ) ?? null;
  const bodyState = resolveThreadPageBodyState({
    isPending,
    error,
    rows: data,
  });
  const resolvedEnvironmentOpen =
    environmentUserOverride ??
    resolveDefaultEnvironmentPanelOpen({
      environmentEnabled: currentThread !== undefined,
      isCenteredEmptyLanding: bodyState.kind === 'empty',
      isTerminalPrimarySurface: false,
      isConstrainedChatLayout: false,
      settingsDefaultOpen: environmentSettings.environmentPanelDefaultOpen,
    });
  const setEnvironmentVisibility = useCallback((open: boolean) => {
    'background only';
    setEnvironmentUserOverride(open);
    void import(/* webpackMode: "eager" */ '../platform/storage')
      .then(({ setPersistedStorageItem, webStorage: storage }) =>
        setPersistedStorageItem(
          APP_SETTINGS_STORAGE_KEY,
          writeSettingsGeneralProjection(
            storage.getItem(APP_SETTINGS_STORAGE_KEY),
            {
              ...readSettingsGeneralProjection(
                storage.getItem(APP_SETTINGS_STORAGE_KEY)
              ),
              environmentPanelDefaultOpen: open,
            }
          )
        )
      )
      .catch(() => {
        // Keep the explicit session override. Settings hydration owns
        // persistence failure and retry presentation.
      });
  }, []);
  const closeEnvironmentForAction = useCallback(() => {
    setEnvironmentUserOverride(false);
  }, []);
  const setExplorerVisibility = useCallback((open: boolean) => {
    closeEnvironmentForAction();
    setDiffOpen(false);
    setDiffDockWidth(null);
    setExplorerDockWidth(null);
    setExplorerOpen(open);
  }, [closeEnvironmentForAction]);
  const openExplorerFileReference = useCallback(
    (relativePath: string) => {
      onExplorerQueryChange('');
      onExplorerSelectPath(relativePath);
      setExplorerVisibility(true);
    },
    [
      onExplorerQueryChange,
      onExplorerSelectPath,
      setExplorerVisibility,
    ]
  );
  const explorerToggle = useLynxInteractiveState({
    baseClassName: 'ThreadFilesToggle',
    accessibleLabel: 'Toggle files panel',
    disabled: !currentThread?.workspaceRoot,
    onActivate: () => setExplorerVisibility(!explorerOpen),
  });
  const rightDockWidth = explorerOpen ? explorerDockWidth : diffDockWidth;
  const [respondingApprovalRequestId, setRespondingApprovalRequestId] =
    useState<string | null>(null);
  const [respondingUserInputRequestId, setRespondingUserInputRequestId] =
    useState<string | null>(null);
  const activePendingApproval = currentThread?.pendingApprovals[0] ?? null;
  const activePendingUserInput = currentThread?.pendingUserInputs[0] ?? null;
  const respondToApproval = async (
    decision: ProviderApprovalDecision,
    lifecycleGeneration?: string
  ) => {
    'background only';
    if (!activePendingApproval || respondingApprovalRequestId !== null) return;
    setRespondingApprovalRequestId(activePendingApproval.requestId);
    try {
      await dispatchSynaraCommand({
        type: 'thread.approval.respond',
        commandId: `lynx-approval-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        threadId: threadId as never,
        requestId: activePendingApproval.requestId,
        ...(lifecycleGeneration ? { lifecycleGeneration } : {}),
        decision,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: ['thread-detail', threadId],
      });
    } finally {
      setRespondingApprovalRequestId(null);
    }
  };
  const respondToUserInput = async (
    answers: Record<string, string | string[] | null>,
    lifecycleGeneration?: string
  ) => {
    'background only';
    if (!activePendingUserInput || respondingUserInputRequestId !== null) return;
    setRespondingUserInputRequestId(activePendingUserInput.requestId);
    try {
      await dispatchSynaraCommand({
        type: 'thread.user-input.respond',
        commandId: `lynx-user-input-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        threadId: threadId as never,
        requestId: activePendingUserInput.requestId,
        ...(lifecycleGeneration ? { lifecycleGeneration } : {}),
        answers,
        createdAt: new Date().toISOString(),
      });
      await queryClient.invalidateQueries({
        queryKey: ['thread-detail', threadId],
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
          responding={
            respondingApprovalRequestId === activePendingApproval.requestId
          }
          onRespond={(decision, lifecycleGeneration) => {
            'background only';
            void respondToApproval(decision, lifecycleGeneration);
          }}
        />
      ) : null}
      {!activePendingApproval && activePendingUserInput ? (
        <PendingUserInputPanel
          key={`${activePendingUserInput.requestId}:${
            activePendingUserInput.lifecycleGeneration ?? 'legacy'
          }`}
          prompt={activePendingUserInput}
          pendingCount={currentThread?.pendingUserInputs.length ?? 0}
          responding={
            respondingUserInputRequestId === activePendingUserInput.requestId
          }
          onRespond={(answers, lifecycleGeneration) => {
            'background only';
            void respondToUserInput(answers, lifecycleGeneration);
          }}
        />
      ) : null}
      <Composer
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
    if (
      currentThread?.title &&
      (!renamingThread || threadTitleDraft.length === 0)
    ) {
      setThreadTitleDraft(currentThread.title);
      if (renamingThread && !threadRenameTouchedRef.current) {
        void threadRenameInputRef.current?.setValue(currentThread.title);
      }
    }
  }, [currentThread?.title, renamingThread, threadTitleDraft.length]);
  const beginThreadRename = () => {
    'background only';
    if (!currentThread || threadRenamePending) return;
    setThreadTitleDraft(currentThread.title);
    threadRenameTouchedRef.current = false;
    setThreadRenameError(null);
    setRenamingThread(true);
  };
  const commitThreadRename = async () => {
    'background only';
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
        type: 'thread.meta.update',
        commandId: `lynx-thread-rename-${Date.now()}-${Math.random()
          .toString(16)
          .slice(2)}`,
        threadId: threadId as never,
        title,
      });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['thread-detail', threadId] }),
        queryClient.invalidateQueries({ queryKey: ['threads'] }),
        queryClient.invalidateQueries({ queryKey: ['sidebar-snapshot'] }),
      ]);
      setRenamingThread(false);
    } catch (error) {
      setThreadRenameError(
        error instanceof Error ? error.message : 'Unable to rename thread.'
      );
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
        defaultValue={threadTitleDraft || currentThread?.title || ''}
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
      title={currentThread?.title ?? 'Thread'}
      icon={<OpenAIProviderIcon provider={currentThread?.provider} />}
      iconTitle={currentThread?.project ?? 'Synara'}
      onRename={currentThread ? beginThreadRename : undefined}
    />
  );
  const chatBody =
    bodyState.kind === 'transcript' ? (
      <ComposerColumnFrameSurface className="ThreadTranscriptColumn">
        <Transcript
          chatFontSizePx={appearance.chatFontSizePx}
          workspaceRoot={currentThread?.workspaceRoot ?? null}
          rows={bodyState.rows}
          threadId={threadId}
          onController={registerTranscriptController}
          onOpenFileReference={openExplorerFileReference}
        />
      </ComposerColumnFrameSurface>
    ) : bodyState.kind === 'empty' ? (
      <CenteredEmptyLandingStack>
        <CenteredEmptyLanding projectName={currentThread?.project} />
        {composer}
        <EmptyThreadContextTray
          branch={currentThread?.branch ?? null}
          envMode={currentThread?.envMode ?? 'local'}
          onTemporaryChange={toggleTemporary}
          projectName={currentThread?.project ?? 'this folder'}
          temporary={temporary}
        />
      </CenteredEmptyLandingStack>
    ) : (
      <view className="ThreadTranscriptState">
        <PanelStateMessage
          fill="flex"
          intent={bodyState.kind === 'loading' ? 'status' : 'alert'}
          announcement={
            bodyState.kind === 'loading'
              ? 'Loading conversation'
              : bodyState.kind === 'offline'
                ? 'Synara is offline. Reconnect to load this conversation.'
                : 'Unable to load this conversation.'
          }
        >
          {bodyState.kind === 'loading'
            ? 'Loading conversation…'
            : bodyState.kind === 'offline'
              ? 'Synara is offline. Reconnect to load this conversation.'
              : 'Unable to load this conversation.'}
        </PanelStateMessage>
      </view>
    );
  const enterEditorMode = () => {
    'background only';
    closeEnvironmentForAction();
    setExplorerOpen(false);
    setDiffOpen(false);
    setTerminalOpen(false);
    setEditorMode(true);
  };
  const exitEditorMode = () => {
    'background only';
    setEditorMode(false);
  };
  const showEditorFiles = () => {
    'background only';
    setEditorSearchActive(false);
    setEditorCenterMode('file');
  };
  const showEditorChanges = () => {
    'background only';
    setEditorSearchActive(false);
    setEditorCenterMode('diff');
  };
  const showEditorSearch = () => {
    'background only';
    setEditorSearchActive(true);
    setEditorCenterMode('file');
  };
  const toggleEditorChat = () => {
    'background only';
    setEditorChatOpen((current) => {
      const next = !current;
      storeEditorChatPaneVisible(next);
      return next;
    });
  };
  const openEditorHistoryThread = (nextThreadId: string) => {
    'background only';
    setEditorChatHistoryOpen(false);
    if (nextThreadId !== threadId) onNavigateToThread(nextThreadId);
  };
  const openEditorTerminal = () => {
    'background only';
    setEditorRailNewOpen(false);
    setEditorRailDraftOpen(false);
    setEditorRailDraftProjectId(null);
    setTerminalOpen(true);
    setEditorRailSurface('terminal');
  };
  const openEditorNewChat = () => {
    'background only';
    setEditorRailNewOpen(false);
    setEditorRailDraftOpen(true);
    setEditorRailDraftProjectId(currentThread?.projectId ?? null);
    setEditorRailSurface('chat');
  };
  const closeEditorTerminal = () => {
    'background only';
    setTerminalOpen(false);
    setEditorRailSurface('chat');
  };
  useEffect(() => {
    if (!editorMode) return;
    storeEditorViewState(threadId, {
      centerMode: editorCenterMode,
      expandedDirectories: [...explorerExpandedDirectories],
    });
  }, [editorCenterMode, editorMode, explorerExpandedDirectories, threadId]);

  if (editorMode && !currentThread) {
    return (
      <view className="ThreadEditorView">
        <view className="ThreadTranscriptState">
          <PanelStateMessage
            fill="flex"
            intent="status"
            announcement="Opening editor view"
          >
            Opening editor view…
          </PanelStateMessage>
        </view>
      </view>
    );
  }

  if (editorMode) {
    return (
      <>
        <view className="ThreadEditorView">
          <view className="ThreadEditorHeader AppWindowDragRegion">
            <view className="ThreadEditorIdentity">
              <text className="ThreadEditorProject">
                {currentThread?.project ?? 'Workspace'}
              </text>
              <text className="ThreadEditorPath">
                {currentThread?.workspaceRoot ?? 'No workspace'}
              </text>
            </view>
            {editorProjectSwitchOptions.length > 0 ? (
              <Button
                aria-label="Switch project"
                className="ThreadEditorProjectSwitchTrigger"
                variant="ghost"
                onClick={() => setEditorProjectSwitchOpen(true)}
              >
                <ChevronDownIcon size={14} color="var(--muted-foreground)" />
              </Button>
            ) : null}
            <text className="ThreadEditorModeLabel">
              {editorCenterMode === 'file' ? 'Files' : 'Changes'}
            </text>
            <Button size="xs" variant="outline" onClick={toggleEditorChat}>
              {editorChatOpen ? 'Hide chat' : 'Show chat'}
            </Button>
            <Button size="xs" variant="outline" onClick={exitEditorMode}>
              Chat
            </Button>
          </view>
          <view className="ThreadEditorBody">
          <view className="ThreadEditorActivityRail">
            <view
              className={`ThreadEditorActivityItem${
                editorCenterMode === 'file' && !editorSearchActive
                  ? ' ThreadEditorActivityItem--active'
                  : ''
              }`}
              accessibility-element
              accessibility-label="Files"
              accessibility-traits="button"
              bindtap={showEditorFiles}
            >
              <FolderIcon size={18} color="var(--foreground)" />
            </view>
            <view
              className={`ThreadEditorActivityItem${
                editorCenterMode === 'diff' && !editorSearchActive
                  ? ' ThreadEditorActivityItem--active'
                  : ''
              }`}
              accessibility-element
              accessibility-label="Changes"
              accessibility-traits="button"
              bindtap={showEditorChanges}
            >
              <text className="ThreadEditorActivityGlyph">±</text>
            </view>
            <view
              className={`ThreadEditorActivityItem${
                editorSearchActive ? ' ThreadEditorActivityItem--active' : ''
              }`}
              accessibility-element
              accessibility-label="Search files"
              accessibility-traits="button"
              bindtap={showEditorSearch}
            >
              <SearchIcon size={18} color="var(--foreground)" />
            </view>
          </view>
          <view
            className={`ThreadEditorCenter${
              editorChatOpen ? '' : ' ThreadEditorCenter--chat-hidden'
            }`}
          >
            {editorCenterMode === 'file' ? (
              <ExplorerDock
              key={`editor-files:${threadId}:${
                currentThread?.workspaceRoot ?? 'pending'
              }`}
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
              file={explorerFile}
              fileError={explorerFileError}
              filePending={explorerFilePending}
              fileSyntaxHighlight={explorerFileSyntaxHighlight}
              localPreviewUrl={explorerLocalPreviewUrl}
              localPreviewError={explorerLocalPreviewError}
              localPreviewPending={explorerLocalPreviewPending}
              pdfPageCount={explorerPdfPageCount}
              pdfMetadataError={explorerPdfMetadataError}
              pdfMetadataPending={explorerPdfMetadataPending}
              open
              presentationMode={editorSearchActive ? 'editor-search' : 'editor'}
              query={explorerQuery}
              selectedPath={explorerSelectedPath}
              threadId={threadId}
              theme={resolvedTheme}
              workspaceRoot={currentThread.workspaceRoot}
              onWidthChange={() => {}}
              onQueryChange={onExplorerQueryChange}
              onSelectPath={onExplorerSelectPath}
              onToggleDirectory={onExplorerToggleDirectory}
              onClose={exitEditorMode}
              />
            ) : (
              <view className="ThreadEditorChanges">
                <DiffDock
                  availableWidth={threadPageWidth || viewportWidth}
                  initialDiff={initialWorkingTreeDiff ?? undefined}
                  initialSelectedFilePath={explorerSelectedPath}
                  unavailableLabel={initialWorkingTreeDiffUnavailableLabel}
                  onClose={() => setEditorCenterMode('file')}
                  onWidthChange={() => undefined}
                  open
                  presentation="editor"
                  workspaceRoot={currentThread?.workspaceRoot ?? null}
                />
              </view>
            )}
          </view>
            <ResizableRightPanel
            availableWidth={threadPageWidth || viewportWidth}
            className={`ThreadEditorChat${
              editorChatOpen ? '' : ' ThreadEditorChat--hidden'
            }`}
            defaultWidth={EDITOR_CHAT_PANE_DEFAULT_WIDTH}
            maxWidth={EDITOR_CHAT_PANE_MAX_WIDTH}
            minimumMainWidth={320}
            minWidth={EDITOR_CHAT_PANE_MIN_WIDTH}
            resizable={
              editorChatOpen && viewportWidth >= VIEWPORT_BREAKPOINTS.lg
            }
            storageKey={EDITOR_CHAT_PANE_STORAGE_KEY}
            >
              <ChatSurfaceHeaderFrame>
                <view className="ThreadHeaderIdentity">
                  {editorRailDraftOpen ? (
                    <ChatSurfaceHeaderIdentity
                      title="New chat"
                      icon={<OpenAIProviderIcon />}
                      iconTitle={currentThread?.project ?? 'Synara'}
                    />
                  ) : (
                    threadHeaderIdentity
                  )}
                </view>
                <Button
                  aria-label="New editor rail item"
                  className="ThreadEditorNewTrigger"
                  variant="ghost"
                  onClick={() => setEditorRailNewOpen(true)}
                >
                  <PlusIcon size={15} color="var(--muted-foreground)" />
                </Button>
                <Button
                  aria-label="Chat history"
                  className="ThreadEditorHistoryTrigger"
                  variant="ghost"
                  onClick={() => setEditorChatHistoryOpen(true)}
                >
                  <ClockIcon size={15} color="var(--muted-foreground)" />
                </Button>
                {terminalOpen ? (
                  <view className="ThreadEditorRailTabs">
                  <Button
                    className={`ThreadEditorRailTab${
                      editorRailSurface === 'chat'
                        ? ' ThreadEditorRailTab--active'
                        : ''
                    }`}
                    variant="ghost"
                    onClick={() => {
                      setEditorRailDraftOpen(false);
                      setEditorRailDraftProjectId(null);
                      setEditorRailSurface('chat');
                    }}
                  >
                    Chat
                  </Button>
                  <Button
                    className={`ThreadEditorRailTab${
                      editorRailSurface === 'terminal'
                        ? ' ThreadEditorRailTab--active'
                        : ''
                    }`}
                    variant="ghost"
                    onClick={() => setEditorRailSurface('terminal')}
                  >
                    Terminal
                  </Button>
                  </view>
                ) : null}
              </ChatSurfaceHeaderFrame>
              <view
                className={`ThreadEditorChatSurface${
                  editorRailSurface === 'chat'
                    ? ''
                    : ' ThreadEditorChatSurface--hidden'
                }`}
              >
                {editorRailDraftOpen ? (
                  <view className="ThreadEditorNewChat">
                    <CenteredEmptyLandingStack>
                      <CenteredEmptyLanding
                        projectName={editorRailDraftProject?.name ?? null}
                      />
                      <ComposerColumnFrameSurface>
                        <LandingComposer
                          initialProjectId={editorRailDraftProject?.id ?? null}
                          onProjectSelectionChange={
                            setEditorRailDraftProjectId
                          }
                          onThreadCreated={(newThreadId) =>
                            onNavigateToThread(newThreadId)
                          }
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
                    {bodyState.kind === 'empty' ? null : composer}
                  </>
                )}
              </view>
              {terminalOpen && currentThread?.workspaceRoot ? (
                <view
                  className={`ThreadEditorTerminalSurface${
                    editorRailSurface === 'terminal'
                      ? ''
                      : ' ThreadEditorTerminalSurface--hidden'
                  }`}
                >
                  <ThreadTerminal
                    autoOpen
                    fontFamily={appearance.terminalFontFamily}
                    fontSizePx={appearance.terminalFontSizePx}
                    open={terminalOpen}
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
            accessibility-traits="dialog"
            bindkeydown={(event: { readonly key?: string }) => {
              'background only';
              if (event.key === 'Escape') setEditorChatHistoryOpen(false);
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
              accessibility-traits="dialog"
            >
              <Button
                aria-label="Close chat history"
                className="ThreadEditorHistoryClose"
                variant="ghost"
                onClick={() => setEditorChatHistoryOpen(false)}
              >
                ×
              </Button>
              <text className="ThreadEditorHistoryHeading">Chat history</text>
              <text className="ThreadEditorHistoryDescription">
                Recent chats in {currentThread?.project ?? 'this project'}.
              </text>
              <scroll-view
                className="ThreadEditorHistoryPanel"
                scroll-orientation="vertical"
              >
              {threads.length === 0 ? (
                <text className="ThreadEditorHistoryEmpty">
                  Loading chat history…
                </text>
              ) : editorChatHistoryThreads.length === 0 ? (
                  <text className="ThreadEditorHistoryEmpty">
                    No chats in this project yet
                  </text>
                ) : (
                  editorChatHistoryThreads.map((historyThread) => (
                    <Button
                      key={historyThread.id}
                      className={`ThreadEditorHistoryItem${
                        historyThread.id === threadId
                          ? ' ThreadEditorHistoryItem--active'
                          : ''
                      }`}
                      variant="ghost"
                      onClick={() => openEditorHistoryThread(historyThread.id)}
                    >
                      <OpenAIProviderIcon provider={historyThread.provider} />
                      <text className="ThreadEditorHistoryTitle">
                        {historyThread.title}
                      </text>
                      <text className="ThreadEditorHistoryMeta">
                        {historyThread.id === threadId
                          ? '✓'
                          : formatRelativeTime(historyThread.updatedAt)}
                      </text>
                    </Button>
                  ))
                )}
              </scroll-view>
            </view>
          </view>
        ) : null}
        {editorProjectSwitchOpen ? (
          <view
            className="ThreadEditorProjectSwitchViewport"
            accessibility-element
            accessibility-label="Switch project dialog"
            accessibility-traits="dialog"
            bindkeydown={(event: { readonly key?: string }) => {
              'background only';
              if (event.key === 'Escape') setEditorProjectSwitchOpen(false);
            }}
            tabindex={0}
          >
            <view
              className="ThreadEditorProjectSwitchBackdrop"
              bindtap={() => setEditorProjectSwitchOpen(false)}
            />
            <view
              className="ThreadEditorProjectSwitchDialog"
              accessibility-element
              accessibility-label="Switch project"
              accessibility-traits="dialog"
            >
              <Button
                aria-label="Close project switcher"
                className="ThreadEditorProjectSwitchClose"
                variant="ghost"
                onClick={() => setEditorProjectSwitchOpen(false)}
              >
                ×
              </Button>
              <text className="ThreadEditorProjectSwitchHeading">
                Switch project
              </text>
              <text className="ThreadEditorProjectSwitchDescription">
                Open the latest chat or start a new one.
              </text>
              <scroll-view
                className="ThreadEditorProjectSwitchPanel"
                scroll-orientation="vertical"
              >
                {editorProjectSwitchOptions.map((option) => (
                  <Button
                    key={option.id}
                    className={`ThreadEditorProjectSwitchItem${
                      option.selected
                        ? ' ThreadEditorProjectSwitchItem--active'
                        : ''
                    }`}
                    variant="ghost"
                    onClick={() => {
                      setEditorProjectSwitchOpen(false);
                      const target =
                        resolveEditorProjectSwitchTarget(option);
                      if (target.kind === 'current') return;
                      if (target.kind === 'thread') {
                        setEditorRailDraftOpen(false);
                        setEditorRailDraftProjectId(null);
                        onNavigateToThread(target.threadId);
                      } else {
                        setEditorRailDraftOpen(true);
                        setEditorRailDraftProjectId(target.projectId);
                        setEditorChatOpen(true);
                        setEditorRailSurface('chat');
                      }
                    }}
                  >
                    <text className="ThreadEditorProjectSwitchTitle">
                      {option.title}
                    </text>
                    <text className="ThreadEditorProjectSwitchMeta">
                      {option.selected
                        ? '✓'
                        : option.threadId
                          ? 'Open'
                          : 'New chat'}
                    </text>
                  </Button>
                ))}
              </scroll-view>
            </view>
          </view>
        ) : null}
        {editorRailNewOpen ? (
          <view
            className="ThreadEditorNewViewport"
            accessibility-element
            accessibility-label="New editor rail item dialog"
            accessibility-traits="dialog"
            bindkeydown={(event: { readonly key?: string }) => {
              'background only';
              if (event.key === 'Escape') setEditorRailNewOpen(false);
            }}
            tabindex={0}
          >
            <view
              className="ThreadEditorNewBackdrop"
              bindtap={() => setEditorRailNewOpen(false)}
            />
            <view className="ThreadEditorNewDialog">
              <text className="ThreadEditorNewHeading">
                New editor rail item
              </text>
              <Button
                className="ThreadEditorNewItem"
                variant="ghost"
                onClick={openEditorNewChat}
              >
                <MessageCircleIcon
                  size={15}
                  color="var(--muted-foreground)"
                />
                New chat
              </Button>
              <Button
                className="ThreadEditorNewItem"
                variant="ghost"
                disabled={!currentThread?.workspaceRoot}
                onClick={openEditorTerminal}
              >
                <text className="ThreadEditorNewTerminalGlyph">&gt;_</text>
                New terminal
              </Button>
            </view>
          </view>
        ) : null}
      </>
    );
  }

  return (
    <view
      className={`Page ThreadPage${
        resolvedEnvironmentOpen ? ' ThreadPage--environment-open' : ''
      }${diffOpen ? ' ThreadPage--diff-open' : ''}${
        explorerOpen ? ' ThreadPage--explorer-open' : ''
      }${
        providerHealthVisible ? ' ThreadPage--provider-health-visible' : ''
      }`}
      bindlayoutchange={(event: {
        readonly detail?: { readonly width?: number };
      }) => {
        const width = event.detail?.width;
        if (typeof width === 'number' && width > 0) setThreadPageWidth(width);
      }}
      style={
        (diffOpen || explorerOpen) && rightDockWidth !== null
          ? { paddingRight: `${rightDockWidth}px` }
          : undefined
      }
    >
      <ChatSurfaceHeaderFrame className="ThreadPageHeader">
        <view className="ThreadHeaderIdentity">
          {threadHeaderIdentity}
        </view>
        <view className="ThreadHeaderControls">
          <Button
            variant="ghost"
            size="xs"
            disabled={!currentThread?.workspaceRoot}
            onClick={() => {
              closeEnvironmentForAction();
              setExplorerOpen(false);
              setDiffOpen(false);
              setTerminalOpen((open) => !open);
            }}
          >
            Terminal
          </Button>
          <Button
            variant="ghost"
            size="xs"
            disabled={!currentThread?.workspaceRoot}
            onClick={enterEditorMode}
          >
            Editor
          </Button>
          <view
            className={`${explorerToggle.className}${
              explorerOpen ? ' ThreadFilesToggle--active' : ''
            }${explorerToggle.disabled ? ' ui-disabled' : ''}`}
            {...explorerToggle.eventProps}
          >
            <FolderIcon size={16} color="var(--muted-foreground)" />
          </view>
          <EnvironmentToggle
            open={resolvedEnvironmentOpen}
            onChange={setEnvironmentVisibility}
          />
        </view>
      </ChatSurfaceHeaderFrame>
      <ThreadErrorBanner
        error={visibleThreadError({
          dismissedKey: dismissedThreadErrorKey,
          error: currentThread?.error,
          revision: currentThread?.errorRevision,
        })}
        onDismiss={() => {
          setDismissedThreadErrorKey(
            threadErrorDismissKey({
              error: currentThread?.error,
              revision: currentThread?.errorRevision,
            })
          );
        }}
      />
      <ProviderHealthBanner
        status={providerHealth.status}
        onDismiss={providerHealth.dismiss}
      />
      {chatBody}
      {bodyState.kind === 'empty' ? null : (
        <view className="ThreadComposerDock">{composer}</view>
      )}
      {currentThread?.workspaceRoot ? (
        <ThreadTerminal
          autoOpen
          fontFamily={appearance.terminalFontFamily}
          fontSizePx={appearance.terminalFontSizePx}
          open={terminalOpen}
          threadId={threadId}
          workspaceRoot={currentThread.workspaceRoot}
          onOpenChange={setTerminalOpen}
        />
      ) : null}
      {currentThread ? (
        <EnvironmentPanel
          bootstrapOnly={
            initialEnvironmentOpen && environmentData !== null
          }
          initialData={environmentData}
          open={resolvedEnvironmentOpen}
          threadId={threadId}
          projectId={currentThread.projectId}
          pinnedMessages={currentThread.pinnedMessages}
          pinnedMessageTextById={currentThread.pinnedMessageTextById}
          threadMarkers={currentThread.threadMarkers}
          pullRequest={currentThread.lastKnownPr}
          provider={currentThread.provider ?? 'codex'}
          recapRevision={threadRecapRevision(
            data ?? [],
            currentThread.latestTurnState
          )}
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
            setExplorerDockWidth(null);
            setDiffDockWidth(null);
            setDiffOpen(true);
          }}
          onOpenEditorView={enterEditorMode}
          onOpenSettings={() => {
            closeEnvironmentForAction();
            history.push('/settings/general');
          }}
        />
      ) : null}
      <ThreadRightDocks
        currentThread={currentThread}
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
        explorerFileSyntaxHighlight={explorerFileSyntaxHighlight}
        explorerLocalPreviewError={explorerLocalPreviewError}
        explorerLocalPreviewPending={explorerLocalPreviewPending}
        explorerLocalPreviewUrl={explorerLocalPreviewUrl}
        explorerPdfPageCount={explorerPdfPageCount}
        explorerPdfMetadataError={explorerPdfMetadataError}
        explorerPdfMetadataPending={explorerPdfMetadataPending}
        explorerOpen={explorerOpen}
        explorerQuery={explorerQuery}
        explorerSelectedPath={explorerSelectedPath}
        initialExplorerWidth={initialExplorerWidth}
        initialExplorerCommentLine={initialExplorerCommentLine}
        onExplorerQueryChange={onExplorerQueryChange}
        onExplorerSelectPath={onExplorerSelectPath}
        onExplorerToggleDirectory={onExplorerToggleDirectory}
        resolvedTheme={resolvedTheme}
        setDiffDockWidth={setDiffDockWidth}
        setDiffOpen={setDiffOpen}
        setExplorerDockWidth={setExplorerDockWidth}
        setExplorerOpen={setExplorerOpen}
        threadPageWidth={threadPageWidth}
        viewportWidth={viewportWidth}
      />
    </view>
  );
}

export function SliceRouter({
  appearance,
  initialEditorOpen,
  initialEditorCenterMode,
  initialEditorChatOpen,
  initialEditorSearchOpen,
  initialEnvironmentOpen,
  initialRenameOpen,
  initialTerminalOpen,
  initialTemporaryOpen,
  initialSettingsTarget,
  initialWorkspaceVisible,
  initialRoute,
  initialThreadBootstrap,
  initialExplorerOpen,
  initialExplorerCommentLine,
  initialExplorerExpandedDirectories,
  initialExplorerPath,
  initialExplorerQuery,
  initialExplorerWidth,
  resolvedTheme,
  viewportWidth,
  onAppearanceChange,
  onThemeStateChange,
}: {
  readonly appearance: SettingsAppearanceValues;
  readonly initialEditorOpen: boolean;
  readonly initialEditorCenterMode: 'file' | 'diff';
  readonly initialEditorChatOpen: boolean | null;
  readonly initialEditorSearchOpen: boolean;
  readonly initialEnvironmentOpen: boolean;
  readonly initialRenameOpen: boolean;
  readonly initialTerminalOpen: boolean;
  readonly initialTemporaryOpen: boolean;
  readonly initialSettingsTarget: string | null;
  readonly initialWorkspaceVisible: boolean;
  readonly initialRoute: string | null;
  readonly initialThreadBootstrap: {
    readonly data: Awaited<ReturnType<typeof fetchThreadTranscriptRows>>;
    readonly environment: EnvironmentBootstrapData | null;
    readonly explorerEntries: {
      readonly value: Awaited<ReturnType<typeof fetchExplorerEntries>> | null;
      readonly error: boolean;
    };
    readonly explorerFile: {
      readonly value: Awaited<ReturnType<typeof fetchExplorerFile>> | null;
      readonly error: boolean;
    };
    readonly explorerLocalPreview: {
      readonly value: string | null;
      readonly error: boolean;
    };
    readonly explorerPdfMetadata: {
      readonly value: Awaited<ReturnType<typeof fetchExplorerPdfMetadata>> | null;
      readonly error: boolean;
    };
    readonly explorerDirectories: readonly (readonly [
      string,
      ExplorerEntriesResult['entries'],
      boolean,
    ])[];
    readonly workingTreeDiff: GitReadWorkingTreeDiffResult | null;
    readonly workingTreeDiffUnavailableLabel: string | null;
    readonly summary: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
    readonly threadId: string;
  } | null;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerCommentLine: number | null;
  readonly initialExplorerExpandedDirectories: readonly string[];
  readonly initialExplorerPath: string | null;
  readonly initialExplorerQuery: string;
  readonly initialExplorerWidth: number | null;
  readonly resolvedTheme: 'dark' | 'light';
  readonly viewportWidth: number;
  readonly onAppearanceChange: (appearance: SettingsAppearanceValues) => void;
  readonly onThemeStateChange: (state: ThemeState) => void;
}) {
  const [route, setRoute] = useRoute(initialRoute);
  const navigation = useMemoryNavigationState();
  useEffect(() => {
    'background only';
    let cancelled = false;
    let unsubscribe: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ '../platform/bridge')
      .then(({ bridgeCall }) => {
        if (cancelled) return;
        const publishRoute = () => {
          void bridgeCall('shellRouteChanged', {
            route: history.location.href,
          }).catch(() => {
            // Web and older hosts do not need the desktop reload route mirror.
          });
        };
        publishRoute();
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
  const [sidebarUserOverride, setSidebarUserOverride] = useState<
    boolean | null
  >(null);
  const sidebarOpen = resolveResponsiveSidebarOpen({
    userOverride: sidebarUserOverride,
    viewportWidth,
    desktopMinimumWidth: VIEWPORT_BREAKPOINTS.md,
  });
  const setSidebarOpen = useCallback(
    (next: boolean | ((current: boolean) => boolean)) => {
      setSidebarUserOverride(
        typeof next === 'function' ? next(sidebarOpen) : next
      );
    },
    [sidebarOpen]
  );
  const {
    data: routeThreads,
    isPending: routeThreadsPending,
  } = useQuery({
    queryKey: ['threads'],
    queryFn: fetchThreads,
    refetchInterval: 5_000,
  });
  const routeProjects = useStore((state) => state.projects);
  const workspacePages = useWorkspaceStore((state) => state.workspacePages);
  const studioSettings = readSettingsGeneralProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY)
  );
  const workspaceEnabled =
    initialWorkspaceVisible || studioSettings.showWorkspaceSection;
  const activeThreadId =
    route.pathname === '/thread/$threadId'
      ? route.params.threadId
      : initialRoute
        ? parseRoute(initialRoute).params.threadId ?? null
        : null;
  const taskCompletionToast = (
    <TaskCompletionToastHost
      activeThreadId={activeThreadId}
      threads={routeThreads ?? []}
      onOpenThread={(threadId) => history.push(`/thread/${threadId}`)}
    />
  );
  const appSnapCoordinator = (
    <AppSnapCoordinator
      activeThreadId={activeThreadId}
      onOpenThread={(threadId) => history.push(`/thread/${threadId}`)}
    />
  );
  const providerUpdatePrompt = (
    <ProviderUpdatePrompt
      onReview={() => history.push('/settings/providers')}
    />
  );
  const [explorerQuery, setExplorerQuery] = useState(initialExplorerQuery);
  const [explorerSelectedPath, setExplorerSelectedPath] = useState<
    string | null
  >(initialExplorerPath);
  const [explorerExpandedDirectories, setExplorerExpandedDirectories] =
    useState<ReadonlySet<string>>(
      () => new Set(initialExplorerExpandedDirectories)
    );
  const previousExplorerThreadIdRef = useRef(activeThreadId);
  const explorerTrimmedQuery = explorerQuery.trim();
  const explorerExpandedDirectoryPaths =
    Array.from(explorerExpandedDirectories).toSorted();
  const {
    data: activeThreadData,
    error: activeThreadError,
    isFetching: activeThreadFetching,
    isPending: activeThreadPending,
  } = useQuery({
    queryKey: [
      'thread-detail',
      activeThreadId,
      explorerTrimmedQuery,
      explorerSelectedPath,
      explorerExpandedDirectoryPaths.join('\0'),
    ],
    queryFn: async () => {
      'background only';
      const threadId = activeThreadId;
      if (!threadId) throw new Error('Thread detail requires a thread id.');
      const [data, summary] = await Promise.all([
        fetchThreadTranscriptRows(threadId),
        fetchThreadHeaderSummary(threadId),
      ]);
      const explorerEntries = summary?.workspaceRoot
        ? await fetchExplorerEntries({
            workspaceRoot: summary.workspaceRoot,
            query: explorerTrimmedQuery,
          }).then(
            (value) => ({ value, error: false }),
            () => ({ value: null, error: true })
          )
        : { value: null, error: false };
      const explorerFile =
        summary?.workspaceRoot &&
        explorerSelectedPath &&
        !isSupportedLocalPreviewFilePath(explorerSelectedPath)
          ? await fetchExplorerFile({
              workspaceRoot: summary.workspaceRoot,
              relativePath: explorerSelectedPath,
            }).then(
              (value) => ({ value, error: false }),
              () => ({ value: null, error: true })
            )
          : { value: null, error: false };
      const explorerLocalPreview =
        summary?.workspaceRoot &&
        explorerSelectedPath &&
        isSupportedLocalPreviewFilePath(explorerSelectedPath)
          ? await fetchExplorerLocalPreviewUrl({
              workspaceRoot: summary.workspaceRoot,
              relativePath: explorerSelectedPath,
            }).then(
              (value) => ({ value, error: false }),
              () => ({ value: null, error: true })
            )
          : { value: null, error: false };
      const explorerPdfMetadata =
        summary?.workspaceRoot &&
        explorerSelectedPath &&
        isSupportedLocalPdfPath(explorerSelectedPath)
          ? await fetchExplorerPdfMetadata({
              workspaceRoot: summary.workspaceRoot,
              relativePath: explorerSelectedPath,
            }).then(
              (value) => ({ value, error: false }),
              () => ({ value: null, error: true })
            )
          : { value: null, error: false };
      const explorerDirectories =
        summary?.workspaceRoot && explorerTrimmedQuery.length === 0
          ? await Promise.all(
              explorerExpandedDirectoryPaths.map(async (path) => {
                try {
                  const result = await fetchExplorerDirectory({
                    workspaceRoot: summary.workspaceRoot!,
                    relativePath: path,
                  });
                  return [path, result.entries, false] as const;
                } catch {
                  return [path, [], true] as const;
                }
              })
            )
          : [];
      return {
        data,
        environment: null,
        explorerDirectories,
        explorerEntries,
        explorerFile,
        explorerLocalPreview,
        explorerPdfMetadata,
        summary,
      };
    },
    enabled: activeThreadId !== null,
    refetchInterval: 500,
    retry: false,
  });
  const matchingInitialThreadBootstrap =
    initialThreadBootstrap?.threadId === activeThreadId
      ? initialThreadBootstrap
      : null;
  const resolvedActiveThreadData = activeThreadData
    ? {
        ...activeThreadData,
        environment:
          activeThreadData.environment ??
          matchingInitialThreadBootstrap?.environment ??
          null,
        explorerEntries:
          activeThreadData.explorerEntries.value ||
          activeThreadData.explorerEntries.error
            ? activeThreadData.explorerEntries
            : matchingInitialThreadBootstrap?.explorerEntries ??
              activeThreadData.explorerEntries,
        explorerFile:
          activeThreadData.explorerFile.value ||
          activeThreadData.explorerFile.error
            ? activeThreadData.explorerFile
            : matchingInitialThreadBootstrap?.explorerFile ??
              activeThreadData.explorerFile,
        explorerLocalPreview:
          activeThreadData.explorerLocalPreview.value ||
          activeThreadData.explorerLocalPreview.error
            ? activeThreadData.explorerLocalPreview
            : matchingInitialThreadBootstrap?.explorerLocalPreview ??
              activeThreadData.explorerLocalPreview,
        explorerPdfMetadata:
          activeThreadData.explorerPdfMetadata.value ||
          activeThreadData.explorerPdfMetadata.error
            ? activeThreadData.explorerPdfMetadata
            : matchingInitialThreadBootstrap?.explorerPdfMetadata ??
              activeThreadData.explorerPdfMetadata,
        explorerDirectories: activeThreadData.explorerDirectories,
        workingTreeDiff:
          matchingInitialThreadBootstrap?.workingTreeDiff ?? null,
        workingTreeDiffUnavailableLabel:
          matchingInitialThreadBootstrap?.workingTreeDiffUnavailableLabel ??
          null,
      }
    : matchingInitialThreadBootstrap ?? undefined;
  const resolvedActiveThreadPending =
    resolvedActiveThreadData === undefined && activeThreadPending;
  const {
    entriesByPath: explorerDirectoryData,
    errorPaths: explorerDirectoryErrors,
  } = projectExplorerDirectories(
    resolvedActiveThreadData?.explorerDirectories ?? []
  );
  const explorerDirectoryPending = new Set(
    activeThreadFetching
      ? [...explorerExpandedDirectories].filter(
          (path) =>
            explorerDirectoryData[path] === undefined &&
            !explorerDirectoryErrors.has(path)
        )
      : []
  );
  useEffect(() => {
    if (previousExplorerThreadIdRef.current === activeThreadId) return;
    previousExplorerThreadIdRef.current = activeThreadId;
    setExplorerQuery('');
    setExplorerSelectedPath(null);
    setExplorerExpandedDirectories(new Set());
  }, [activeThreadId]);
  const [persistedLastRoute, setPersistedLastRoute] =
    useState<LastThreadRoute | null>(null);
  const [lastRouteHydrated, setLastRouteHydrated] = useState(false);
  const [coldStartRoutePending, setColdStartRoutePending] = useState(true);
  const [studioLandingReady, setStudioLandingReady] = useState(false);
  const [editorContinuationThreadId, setEditorContinuationThreadId] =
    useState<string | null>(null);

  useEffect(() => {
    'background only';
    let active = true;
    void readPersistedLastThreadRouteFallback(readPersistedLastThreadRoute).then(
      (value) => {
        if (!active) return;
        setPersistedLastRoute(value);
        setLastRouteHydrated(true);
      }
    );
    return () => {
      active = false;
    };
  }, []);

  const readLastThreadRoute = useCallback(
    () => persistedLastRoute,
    [persistedLastRoute]
  );
  const resolveRestoreRoute = useCallback(
    () =>
      resolveRestorableThreadRoute({
        lastThreadRoute: persistedLastRoute,
        availableThreadIds: new Set(
          (routeThreads ?? []).map((thread) => thread.id)
        ),
      }),
    [persistedLastRoute, routeThreads]
  );
  const navigateToRestoredThread = useCallback(
    async (restoredRoute: LastThreadRoute) => {
      'background only';
      setColdStartRoutePending(false);
      history.replace(`/thread/${restoredRoute.threadId}`);
    },
    []
  );
  const createFreshLynxLanding = useCallback(async () => {
    'background only';
    setColdStartRoutePending(false);
    return { ok: true as const };
  }, []);
  useRestoreOrCreateChatRouteController({
    enabled:
      coldStartRoutePending && route.pathname === '/' && lastRouteHydrated,
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
    [
      persistedLastRoute,
      routeProjects,
      routeThreads,
      studioSettings.sidebarThreadSortOrder,
    ]
  );
  const createFreshStudioLanding = useCallback(async () => {
    'background only';
    setStudioLandingReady(true);
    return { ok: true as const };
  }, []);
  const studioRouteController = useRestoreOrCreateChatRouteController({
    enabled:
      route.pathname === '/studio' &&
      studioSettings.showStudioSection &&
      lastRouteHydrated,
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
    if (
      route.pathname === '/studio' &&
      !studioSettings.showStudioSection
    ) {
      history.replace('/');
    }
  }, [route.pathname, studioSettings.showStudioSection]);
  useEffect(() => {
    if (
      route.pathname.startsWith('/workspace') &&
      !workspaceEnabled
    ) {
      history.replace('/');
    }
  }, [route.pathname, workspaceEnabled]);
  useEffect(() => {
    if (route.pathname !== '/studio') {
      setStudioLandingReady(false);
    }
  }, [route.pathname]);
  useEffect(() => {
    if (
      route.pathname === '/thread/$threadId' &&
      route.params.threadId === editorContinuationThreadId
    ) {
      setEditorContinuationThreadId(null);
    }
  }, [editorContinuationThreadId, route.params.threadId, route.pathname]);

  const navigate = useCallback((to: string) => {
    const threadMatch = to.match(/^\/thread\/([^/]+)$/);
    if (threadMatch) {
      setPersistedLastRoute({ threadId: threadMatch[1] });
      void persistLastThreadRoute(threadMatch[1]);
    }
    history.push(to);
  }, []);
  const renderTitlebarControls = (
    placement: 'open' | 'closed'
  ) => (
    <DesktopTitlebarControls
      canGoBack={navigation.canGoBack}
      canGoForward={navigation.canGoForward}
      placement={placement}
      onGoBack={() => history.back()}
      onGoForward={() => history.forward()}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
    />
  );
  const openTitlebarControls = renderTitlebarControls('open');
  const closedTitlebarControls = renderTitlebarControls('closed');
  const navigateBackFromSettings = useCallback(() => {
    const target = resolveSettingsBackTarget({
      lastThreadRoute: persistedLastRoute,
      availableThreadIds: new Set(
        (routeThreads ?? []).map((thread) => thread.id)
      ),
      latestThreadId: routeThreads?.[0]?.id ?? null,
    });
    history.push(
      target.kind === 'thread' ? `/thread/${target.threadId}` : '/'
    );
  }, [persistedLastRoute, routeThreads]);
  useEffect(() => {
    'background only';
    let cancelled = false;
    let disposeNavigate: (() => void) | null = null;
    let disposeHistory: (() => void) | null = null;
    let disposeCommand: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ '../platform/bridge')
      .then(({ bridgeCall, onGlobalEvent }) => {
        if (cancelled) return;
        disposeNavigate = onGlobalEvent('shell:navigate', (target: unknown) => {
          if (typeof target === 'string' && target.startsWith('/')) {
            history.push(target);
          }
        });
        disposeHistory = onGlobalEvent(
          'shell:navigate-history',
          (direction: unknown) => {
            if (direction === 'back') history.back();
            if (direction === 'forward') history.forward();
          }
        );
        disposeCommand = onGlobalEvent(
          'shell:command',
          (command: unknown) => {
            if (command === 'sidebar.toggle') {
              setSidebarOpen((open) => !open);
            }
          }
        );
        void bridgeCall<{ readonly route?: unknown }>('shellRendererReady')
          .then((reply) => {
            if (
              typeof reply?.route === 'string' &&
              reply.route.startsWith('/')
            ) {
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
    };
  }, [setRoute]);

  let page: React.ReactNode;
  if (route.pathname === '/settings') {
    page = (
      <SettingsPage
        initialSection={
          (route.params.section as SettingsSectionId | undefined) ?? 'general'
        }
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
  } else if (route.pathname === '/thread/$threadId') {
    page = (
      <ThreadPage
        key={route.params.threadId}
        appearance={appearance}
        currentThread={resolvedActiveThreadData?.summary}
        data={resolvedActiveThreadData?.data}
        environmentData={resolvedActiveThreadData?.environment ?? null}
        error={activeThreadError}
        explorerEntries={
          resolvedActiveThreadData?.explorerEntries.value?.entries ?? []
        }
        explorerEntriesError={
          resolvedActiveThreadData?.explorerEntries.error ?? false
        }
        explorerEntriesPending={resolvedActiveThreadPending}
        explorerEntriesTruncated={
          resolvedActiveThreadData?.explorerEntries.value?.truncated ?? false
        }
        explorerDirectoryEntries={explorerDirectoryData}
        explorerDirectoryErrors={explorerDirectoryErrors}
        explorerDirectoryPending={explorerDirectoryPending}
        explorerExpandedDirectories={explorerExpandedDirectories}
        explorerFile={
          resolvedActiveThreadData?.explorerFile.value?.file ?? null
        }
        explorerFileError={
          resolvedActiveThreadData?.explorerFile.error ?? false
        }
        explorerFilePending={
          explorerSelectedPath !== null &&
          !isSupportedLocalPreviewFilePath(explorerSelectedPath) &&
          resolvedActiveThreadPending
        }
        explorerFileSyntaxHighlight={
          resolvedActiveThreadData?.explorerFile.value?.syntaxHighlight ?? null
        }
        explorerLocalPreviewUrl={
          resolvedActiveThreadData?.explorerLocalPreview.value ?? null
        }
        explorerLocalPreviewError={
          resolvedActiveThreadData?.explorerLocalPreview.error ?? false
        }
        explorerLocalPreviewPending={
          explorerSelectedPath !== null &&
          isSupportedLocalPreviewFilePath(explorerSelectedPath) &&
          resolvedActiveThreadPending
        }
        explorerPdfPageCount={
          resolvedActiveThreadData?.explorerPdfMetadata.value?.pageCount ?? 0
        }
        explorerPdfMetadataError={
          resolvedActiveThreadData?.explorerPdfMetadata.error ?? false
        }
        explorerPdfMetadataPending={
          explorerSelectedPath !== null &&
          isSupportedLocalPdfPath(explorerSelectedPath) &&
          resolvedActiveThreadPending
        }
        explorerQuery={explorerQuery}
        explorerSelectedPath={explorerSelectedPath}
        initialEnvironmentOpen={initialEnvironmentOpen}
        initialEditorOpen={
          initialEditorOpen ||
          editorContinuationThreadId === route.params.threadId
        }
        initialEditorCenterMode={initialEditorCenterMode}
        initialEditorChatOpen={initialEditorChatOpen}
        initialEditorSearchOpen={initialEditorSearchOpen}
        initialWorkingTreeDiff={
          resolvedActiveThreadData?.workingTreeDiff ?? null
        }
        initialWorkingTreeDiffUnavailableLabel={
          resolvedActiveThreadData?.workingTreeDiffUnavailableLabel ?? null
        }
        initialRenameOpen={initialRenameOpen}
        initialTerminalOpen={initialTerminalOpen}
        initialTemporaryOpen={initialTemporaryOpen}
        initialExplorerWidth={initialExplorerWidth}
        initialExplorerOpen={initialExplorerOpen}
        initialExplorerCommentLine={initialExplorerCommentLine}
        isPending={resolvedActiveThreadPending}
        onExplorerQueryChange={(query) => {
          setExplorerQuery(query);
          setExplorerSelectedPath(null);
        }}
        onExplorerSelectPath={setExplorerSelectedPath}
        onExplorerToggleDirectory={(path) =>
          setExplorerExpandedDirectories((current) =>
            toggleExpandedDirectory(current, path)
          )
        }
        onNavigateToThread={(threadId) => {
          setEditorContinuationThreadId(threadId);
          navigate(`/thread/${threadId}`);
        }}
        projects={routeProjects}
        threadId={route.params.threadId}
        threads={routeThreads ?? []}
        resolvedTheme={resolvedTheme}
        viewportWidth={viewportWidth}
      />
    );
  } else if (route.pathname === '/studio') {
    page = studioLandingReady ? (
      <ThreadsLandingPage
        key="studio"
        containerKind="studio"
        onThreadCreated={(threadId) => navigate(`/thread/${threadId}`)}
      />
    ) : (
      <view className="ThreadsLanding">
        <view className="ThreadsLandingBody">
          <view className="ThreadsLandingBodyInner">
            <PanelStateMessage
              intent={studioRouteController.errorMessage ? 'alert' : 'status'}
              announcement={
                studioRouteController.errorMessage
                  ? 'Unable to open Studio'
                  : 'Opening Studio'
              }
            >
              {studioRouteController.errorMessage ?? 'Opening Studio…'}
            </PanelStateMessage>
            {studioRouteController.retry ? (
              <Button
                variant="outline"
                onClick={() => studioRouteController.retry?.()}
              >
                Retry
              </Button>
            ) : null}
          </view>
        </view>
      </view>
    );
  } else if (
    route.pathname === '/workspace' &&
    workspaceEnabled
  ) {
    const workspaceId = workspacePages[0]?.id ?? null;
    page = workspaceId ? (
      <WorkspacePage
        appearance={appearance}
        workspaceId={workspaceId}
        navigate={(to) => history.replace(to)}
      />
    ) : (
      <ThreadsLandingPage
        onThreadCreated={(threadId) => navigate(`/thread/${threadId}`)}
      />
    );
  } else if (
    route.pathname === '/workspace/$workspaceId' &&
    workspaceEnabled
  ) {
    page = (
      <WorkspacePage
        appearance={appearance}
        workspaceId={route.params.workspaceId}
        navigate={(to) => history.replace(to)}
      />
    );
  } else if (route.pathname === '/kanban') {
    page = <ProjectsPage navigate={(to) => history.push(to)} />;
  } else if (route.pathname === '/kanban/$projectId') {
    page = (
      <KanbanProjectPage
        navigate={(to) => history.push(to)}
        projectId={route.params.projectId}
      />
    );
  } else if (route.pathname === '/pull-requests') {
    page = <PullRequestsPage />;
  } else if (route.pathname === '/plugins') {
    page = <PluginLibraryPage />;
  } else if (route.pathname === '/automations') {
    page = <AutomationsPage navigate={(to) => history.push(to)} />;
  } else if (route.pathname === '/automations/$automationId') {
    page = (
      <AutomationsPage
        automationId={route.params.automationId}
        navigate={(to) => history.push(to)}
      />
    );
  } else if (route.pathname === '/update') {
    page = <UpdatePage />;
  } else {
    page = (
      <ThreadsLandingPage
        key={
          route.pathname === '/new-thread/$projectId'
            ? `project:${route.params.projectId}`
            : 'chat'
        }
        initialProjectId={
          route.pathname === '/new-thread/$projectId'
            ? route.params.projectId
            : null
        }
        onThreadCreated={(threadId) => navigate(`/thread/${threadId}`)}
      />
    );
  }

  const sidebar =
    route.pathname !== '/settings' ? (
      <SidebarDisclosure open={sidebarOpen}>
        <Sidebar
          activeThreadId={
            route.pathname === '/thread/$threadId' ? route.params.threadId : null
          }
          activeWorkspaceId={
            route.pathname === '/workspace/$workspaceId'
              ? route.params.workspaceId
              : workspacePages[0]?.id ?? null
          }
          activePath={
            route.pathname === '/kanban/$projectId'
              ? '/kanban'
              : route.pathname === '/workspace/$workspaceId'
                ? '/workspace'
                : route.pathname
          }
          navigate={navigate}
          titlebarControls={openTitlebarControls}
        />
      </SidebarDisclosure>
    ) : null;
  if (route.pathname === '/settings') {
    return (
      <>
        {page}
        {appSnapCoordinator}
        {taskCompletionToast}
        {providerUpdatePrompt}
      </>
    );
  }
  return (
    <>
      <AppShellFrame sidebar={sidebar}>
        <view
          className={`AppMain AppMain--sidebar-${
            sidebarOpen ? 'open' : 'closed'
          }`}
        >
          {sidebarOpen ? null : closedTitlebarControls}
          {page}
        </view>
      </AppShellFrame>
      {appSnapCoordinator}
      {taskCompletionToast}
      {providerUpdatePrompt}
    </>
  );
}
