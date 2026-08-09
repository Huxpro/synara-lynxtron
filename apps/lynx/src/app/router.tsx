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
import { useCallback, useEffect, useRef, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { ProviderKind, ServerProviderStatus } from '@synara/contracts';
import type { UiDensity } from '@synara-web/lib/appDensity';
import type { ThemeState } from '@synara-web/theme/theme.logic';
import type { SettingsSectionId } from '@synara-web/settingsNavigation';
import { resolveProviderHealthBannerPresentation } from '@synara-web/components/chat/ProviderHealthBanner.logic';
import { findProviderStatus } from '@synara-web/lib/providerAvailability';
import { clampSidebarWidth } from '@synara-web/components/sidebarResize.logic';
import { isSupportedLocalPreviewFilePath } from '@synara/shared/localPreviewFiles';

import {
  fetchExplorerDirectory,
  fetchExplorerEntries,
  fetchExplorerFile,
  fetchExplorerLocalPreviewUrl,
  fetchThreadHeaderSummary,
  fetchThreadTranscriptRows,
  fetchThreads,
  type ExplorerEntriesResult,
} from './queries';
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
import { Composer } from '../components/composer/Composer.lynx';
import { Sidebar } from '../components/sidebar/Sidebar.lynx';
import { CenteredEmptyLanding } from '@synara-web/components/CenteredEmptyLanding';
import { CenteredEmptyLandingStack } from '@synara-web/components/CenteredEmptyLandingStack';
import { AppShellFrame } from '@synara-web/components/AppShellFrame';
import { ChatSurfaceHeaderFrame } from '@synara-web/components/chat/ChatSurfaceHeaderFrame';
import { ChatSurfaceHeaderIdentity } from '@synara-web/components/chat/ChatSurfaceHeaderIdentity';
import { ComposerColumnFrameSurface } from '@synara-web/components/chat/ComposerColumnFrameSurface';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import { LandingComposer } from '../components/composer/LandingComposer.lynx';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import { ProviderHealthBanner } from '../components/ProviderHealthBanner.lynx';
import {
  EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS,
  resolveRestorableThreadRoute,
  type LastThreadRoute,
} from '@synara-web/chatRouteRestore';
import { useRestoreOrCreateChatRouteController } from '@synara-web/components/useRestoreOrCreateChatRoute.logic';
import { resolveSettingsBackTarget } from '@synara-web/components/SidebarSettingsBack.logic';
import { resolveThreadPageBodyState } from './threadPageState.logic';
import { sleepOnHost } from '../platform/timer';
import { EmptyThreadContextTray } from './EmptyThreadContextTray.lynx';
import { DiffDock } from './DiffDock.lynx';
import { ExplorerDock } from './ExplorerDock.lynx';
import {
  EnvironmentPanel,
  EnvironmentToggle,
} from './EnvironmentPanel.lynx';
import { useTemporaryThreadLifecycle } from './temporaryThreadLifecycle.lynx';
import { DesktopTitlebarControls } from '../adapters/DesktopTitlebarControls.lynx';
import { SidebarDisclosure } from './SidebarDisclosure.lynx';
import { FolderIcon } from '../lib/icons.lynx';
import { useLynxInteractiveState } from '../adapters/useLynxInteractiveState';
import {
  resolveMemoryNavigationState,
  type MemoryNavigationState,
} from './routerHistory.logic';
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
  const threadMatch = pathname.match(/^\/thread\/([^/]+)$/);
  if (threadMatch) {
    return { pathname: '/thread/$threadId', params: { threadId: threadMatch[1] } };
  }
  const settingsMatch = pathname.match(/^\/settings(?:\/([^/]+))?$/);
  if (settingsMatch) {
    return {
      pathname: '/settings',
      params: settingsMatch[1] ? { section: settingsMatch[1] } : {},
    };
  }
  const newThreadMatch = pathname.match(/^\/new-thread\/([^/]+)$/);
  if (newThreadMatch) {
    return {
      pathname: '/new-thread/$projectId',
      params: { projectId: decodeURIComponent(newThreadMatch[1]) },
    };
  }
  if (pathname === '/studio') {
    return { pathname: '/studio', params: {} };
  }
  if (pathname === '/kanban') {
    return { pathname: '/kanban', params: {} };
  }
  const kanbanProjectMatch = pathname.match(/^\/kanban\/([^/]+)$/);
  if (kanbanProjectMatch) {
    return {
      pathname: '/kanban/$projectId',
      params: { projectId: decodeURIComponent(kanbanProjectMatch[1]) },
    };
  }
  if (pathname === '/pull-requests') {
    return { pathname: '/pull-requests', params: {} };
  }
  if (pathname === '/update') {
    return { pathname: '/update', params: {} };
  }
  return { pathname: '/', params: {} };
}

export function useRoute(initialPathname: string | null = null): readonly [
  RouteState,
  (route: RouteState) => void,
] {
  const [route, setRoute] = useState<RouteState>(() =>
    parseRoute(initialPathname ?? history.location.pathname)
  );
  useEffect(() => {
    return history.subscribe(({ location }) => {
      setRoute(parseRoute(location.pathname));
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
  readonly initialProjectId?: string | null;
  readonly onThreadCreated: (threadId: string) => void;
}) {
  const [providerStatuses, setProviderStatuses] = useState<
    readonly ServerProviderStatus[]
  >([]);
  const providerHealth = useProviderHealthBanner('codex', providerStatuses);
  return (
    <view className="ThreadsLanding">
      <ChatSurfaceHeaderFrame>
        <view className="ThreadsLandingHeaderIdentity">
          <ChatSurfaceHeaderIdentity
            title="New Chat"
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
            <CenteredEmptyLanding />
            <ComposerColumnFrameSurface>
              <LandingComposer
                initialProjectId={props.initialProjectId}
                onProviderStatusesChange={setProviderStatuses}
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
  readonly currentThread: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
  readonly data: Awaited<ReturnType<typeof fetchThreadTranscriptRows>> | undefined;
  readonly error: unknown;
  readonly environmentData: EnvironmentBootstrapData | null;
  readonly explorerEntries: Awaited<
    ReturnType<typeof fetchExplorerEntries>
  >['entries'];
  readonly explorerEntriesError: boolean;
  readonly explorerEntriesPending: boolean;
  readonly explorerDirectoryEntries: Readonly<
    Record<string, ExplorerEntriesResult['entries']>
  >;
  readonly explorerDirectoryErrors: ReadonlySet<string>;
  readonly explorerDirectoryPending: ReadonlySet<string>;
  readonly explorerExpandedDirectories: ReadonlySet<string>;
  readonly explorerFile: Awaited<ReturnType<typeof fetchExplorerFile>> | null;
  readonly explorerFileError: boolean;
  readonly explorerFilePending: boolean;
  readonly explorerLocalPreviewUrl: string | null;
  readonly explorerLocalPreviewError: boolean;
  readonly explorerLocalPreviewPending: boolean;
  readonly explorerQuery: string;
  readonly explorerSelectedPath: string | null;
  readonly initialEnvironmentOpen: boolean;
  readonly initialExplorerWidth: number | null;
  readonly initialExplorerOpen: boolean;
  readonly isPending: boolean;
  readonly onExplorerQueryChange: (query: string) => void;
  readonly onExplorerSelectPath: (path: string) => void;
  readonly onExplorerToggleDirectory: (path: string) => void;
  readonly threadId: string;
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
    | 'explorerExpandedDirectories'
    | 'explorerFile'
    | 'explorerFileError'
    | 'explorerFilePending'
    | 'explorerLocalPreviewError'
    | 'explorerLocalPreviewPending'
    | 'explorerLocalPreviewUrl'
    | 'explorerQuery'
    | 'explorerSelectedPath'
    | 'initialExplorerWidth'
    | 'onExplorerQueryChange'
    | 'onExplorerSelectPath'
    | 'onExplorerToggleDirectory'
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
    explorerExpandedDirectories,
    explorerFile,
    explorerFileError,
    explorerFilePending,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerLocalPreviewUrl,
    explorerOpen,
    explorerQuery,
    explorerSelectedPath,
    initialExplorerWidth,
    onExplorerQueryChange,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
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
        directoryEntries={explorerDirectoryEntries}
        directoryErrors={explorerDirectoryErrors}
        directoryPending={explorerDirectoryPending}
        expandedDirectories={explorerExpandedDirectories}
        initialWidth={initialExplorerWidth}
        file={explorerFile}
        fileError={explorerFileError}
        filePending={explorerFilePending}
        localPreviewUrl={explorerLocalPreviewUrl}
        localPreviewError={explorerLocalPreviewError}
        localPreviewPending={explorerLocalPreviewPending}
        open={explorerOpen}
        query={explorerQuery}
        selectedPath={explorerSelectedPath}
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
  const {
    currentThread,
    data,
    error,
    environmentData,
    explorerEntries,
    explorerEntriesError,
    explorerEntriesPending,
    explorerDirectoryEntries,
    explorerDirectoryErrors,
    explorerDirectoryPending,
    explorerExpandedDirectories,
    explorerFile,
    explorerFileError,
    explorerFilePending,
    explorerLocalPreviewUrl,
    explorerLocalPreviewError,
    explorerLocalPreviewPending,
    explorerQuery,
    explorerSelectedPath,
    initialEnvironmentOpen,
    initialExplorerWidth,
    initialExplorerOpen,
    isPending,
    onExplorerQueryChange,
    onExplorerSelectPath,
    onExplorerToggleDirectory,
    threadId,
    viewportWidth,
  } = props;
  const { temporary, toggleTemporary } =
    useTemporaryThreadLifecycle(threadId);
  const [providerStatuses, setProviderStatuses] = useState<
    readonly ServerProviderStatus[]
  >([]);
  const [environmentOpen, setEnvironmentOpen] = useState(
    initialEnvironmentOpen
  );
  const [diffOpen, setDiffOpen] = useState(false);
  const [explorerOpen, setExplorerOpen] = useState(initialExplorerOpen);
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
  const bodyState = resolveThreadPageBodyState({
    isPending,
    error,
    rows: data,
  });
  const setExplorerVisibility = useCallback((open: boolean) => {
    setEnvironmentOpen(false);
    setDiffOpen(false);
    setDiffDockWidth(null);
    setExplorerDockWidth(null);
    setExplorerOpen(open);
  }, []);
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
  const composer = (
    <ComposerColumnFrameSurface>
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
  return (
    <view
      className={`Page ThreadPage${
        environmentOpen ? ' ThreadPage--environment-open' : ''
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
      <ChatSurfaceHeaderFrame>
        <view className="ThreadHeaderIdentity">
          <ChatSurfaceHeaderIdentity
            title={currentThread?.title ?? 'Thread'}
            icon={<OpenAIProviderIcon provider={currentThread?.provider} />}
            iconTitle={currentThread?.project ?? 'Synara'}
          />
        </view>
        <view className="ThreadHeaderControls">
          <view
            className={`${explorerToggle.className}${
              explorerOpen ? ' ThreadFilesToggle--active' : ''
            }${explorerToggle.disabled ? ' ui-disabled' : ''}`}
            {...explorerToggle.eventProps}
          >
            <FolderIcon size={16} color="var(--muted-foreground)" />
          </view>
          <EnvironmentToggle
            open={environmentOpen}
            onChange={setEnvironmentOpen}
          />
        </view>
      </ChatSurfaceHeaderFrame>
      <ProviderHealthBanner
        status={providerHealth.status}
        onDismiss={providerHealth.dismiss}
      />
      {bodyState.kind === 'transcript' ? (
        <ComposerColumnFrameSurface className="ThreadTranscriptColumn">
          <Transcript
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
      )}
      {bodyState.kind === 'empty' ? null : composer}
      {currentThread ? (
        <EnvironmentPanel
          bootstrapOnly={
            initialEnvironmentOpen && environmentData !== null
          }
          initialData={environmentData}
          open={environmentOpen}
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
            setEnvironmentOpen(false);
            setExplorerOpen(false);
            setExplorerDockWidth(null);
            setDiffDockWidth(null);
            setDiffOpen(true);
          }}
          onOpenEditorView={() => setExplorerVisibility(true)}
          onOpenSettings={() => {
            setEnvironmentOpen(false);
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
        explorerExpandedDirectories={explorerExpandedDirectories}
        explorerFile={explorerFile}
        explorerFileError={explorerFileError}
        explorerFilePending={explorerFilePending}
        explorerLocalPreviewError={explorerLocalPreviewError}
        explorerLocalPreviewPending={explorerLocalPreviewPending}
        explorerLocalPreviewUrl={explorerLocalPreviewUrl}
        explorerOpen={explorerOpen}
        explorerQuery={explorerQuery}
        explorerSelectedPath={explorerSelectedPath}
        initialExplorerWidth={initialExplorerWidth}
        onExplorerQueryChange={onExplorerQueryChange}
        onExplorerSelectPath={onExplorerSelectPath}
        onExplorerToggleDirectory={onExplorerToggleDirectory}
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
  initialEnvironmentOpen,
  initialRoute,
  initialThreadBootstrap,
  initialExplorerOpen,
  initialExplorerExpandedDirectories,
  initialExplorerPath,
  initialExplorerQuery,
  initialExplorerWidth,
  viewportWidth,
  onThemeStateChange,
  onUiDensityChange,
}: {
  readonly initialEnvironmentOpen: boolean;
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
    readonly explorerDirectories: readonly (readonly [
      string,
      ExplorerEntriesResult['entries'],
      boolean,
    ])[];
    readonly summary: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
    readonly threadId: string;
  } | null;
  readonly initialExplorerOpen: boolean;
  readonly initialExplorerExpandedDirectories: readonly string[];
  readonly initialExplorerPath: string | null;
  readonly initialExplorerQuery: string;
  readonly initialExplorerWidth: number | null;
  readonly viewportWidth: number;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onUiDensityChange: (density: UiDensity) => void;
}) {
  const [route, setRoute] = useRoute(initialRoute);
  const navigation = useMemoryNavigationState();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const {
    data: routeThreads,
    isPending: routeThreadsPending,
  } = useQuery({
    queryKey: ['threads'],
    queryFn: fetchThreads,
    refetchInterval: 5_000,
  });
  const activeThreadId =
    route.pathname === '/thread/$threadId'
      ? route.params.threadId
      : initialRoute
        ? parseRoute(initialRoute).params.threadId ?? null
        : null;
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
        explorerDirectories: activeThreadData.explorerDirectories,
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

  useEffect(() => {
    'background only';
    let active = true;
    void readPersistedLastThreadRoute().then((value) => {
      if (!active) return;
      setPersistedLastRoute(value);
      setLastRouteHydrated(true);
    });
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
    void import(/* webpackMode: "eager" */ '../platform/bridge').then(
      ({ bridgeCall, onGlobalEvent }) => {
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
      }
    );
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
        onBack={navigateBackFromSettings}
        sidebarOpen={sidebarOpen}
        openTitlebarControls={openTitlebarControls}
        closedTitlebarControls={closedTitlebarControls}
        onThemeStateChange={onThemeStateChange}
        onUiDensityChange={onUiDensityChange}
      />
    );
  } else if (route.pathname === '/thread/$threadId') {
    page = (
      <ThreadPage
        key={route.params.threadId}
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
        explorerDirectoryEntries={explorerDirectoryData}
        explorerDirectoryErrors={explorerDirectoryErrors}
        explorerDirectoryPending={explorerDirectoryPending}
        explorerExpandedDirectories={explorerExpandedDirectories}
        explorerFile={resolvedActiveThreadData?.explorerFile.value ?? null}
        explorerFileError={
          resolvedActiveThreadData?.explorerFile.error ?? false
        }
        explorerFilePending={
          explorerSelectedPath !== null &&
          !isSupportedLocalPreviewFilePath(explorerSelectedPath) &&
          resolvedActiveThreadPending
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
        explorerQuery={explorerQuery}
        explorerSelectedPath={explorerSelectedPath}
        initialEnvironmentOpen={initialEnvironmentOpen}
        initialExplorerWidth={initialExplorerWidth}
        initialExplorerOpen={initialExplorerOpen}
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
        threadId={route.params.threadId}
        viewportWidth={viewportWidth}
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
          activePath={
            route.pathname === '/kanban/$projectId' ? '/kanban' : route.pathname
          }
          navigate={navigate}
          titlebarControls={openTitlebarControls}
        />
      </SidebarDisclosure>
    ) : null;
  if (route.pathname === '/settings') {
    return page;
  }
  return (
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
  );
}
