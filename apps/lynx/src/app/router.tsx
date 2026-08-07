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
import { useCallback, useEffect, useState } from '@lynx-js/react';
import { useQuery } from '@tanstack/react-query';
import type { ProviderKind, ServerProviderStatus } from '@synara/contracts';
import type { UiDensity } from '@synara-web/lib/appDensity';
import type { ThemeState } from '@synara-web/theme/theme.logic';
import type { SettingsSectionId } from '@synara-web/settingsNavigation';
import { resolveProviderHealthBannerPresentation } from '@synara-web/components/chat/ProviderHealthBanner.logic';
import { findProviderStatus } from '@synara-web/lib/providerAvailability';

import {
  fetchThreadHeaderSummary,
  fetchThreadTranscriptRows,
  fetchThreads,
} from './queries';
import { Transcript } from './Transcript';
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
import { useTemporaryThreadLifecycle } from './temporaryThreadLifecycle.lynx';
import { DesktopTitlebarControls } from '../adapters/DesktopTitlebarControls.lynx';
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

export function useRoute(): RouteState {
  const [route, setRoute] = useState<RouteState>(() => parseRoute(history.location.pathname));
  useEffect(() => {
    return history.subscribe(({ location }) => {
      setRoute(parseRoute(location.pathname));
    });
  }, []);
  return route;
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
      <view className="ThreadsLandingBody">
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
    </view>
  );
}

function useThreadTranscriptPolling(threadId: string) {
  const [state, setState] = useState<{
    readonly data: Awaited<ReturnType<typeof fetchThreadTranscriptRows>> | undefined;
    readonly error: unknown;
    readonly isPending: boolean;
    readonly summary: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
  }>({
    data: undefined,
    error: null,
    isPending: true,
    summary: undefined,
  });

  useEffect(() => {
    'background only';
    let cancelled = false;

    async function pollTranscript() {
      'background only';
      while (!cancelled) {
        try {
          const rows = await fetchThreadTranscriptRows(threadId);
          const summary = await fetchThreadHeaderSummary(threadId);
          if (!cancelled) {
            setState((current) =>
              current.data === rows &&
              current.error === null &&
              current.summary?.id === summary?.id &&
              current.summary?.title === summary?.title &&
              current.summary?.project === summary?.project &&
              current.summary?.provider === summary?.provider &&
              current.summary?.runtimeMode === summary?.runtimeMode &&
              current.summary?.interactionMode === summary?.interactionMode &&
              current.summary?.sessionStatus === summary?.sessionStatus &&
              current.summary?.activeTurnId === summary?.activeTurnId &&
              current.summary?.workspaceRoot === summary?.workspaceRoot
                ? current
                : {
                    data: rows,
                    error: null,
                    isPending: false,
                    summary,
                  }
            );
          }
        } catch (error) {
          if (!cancelled) {
            setState((current) => ({
              data: current.data,
              error,
              isPending: false,
              summary: current.summary,
            }));
          }
        }
        if (!cancelled) await sleepOnHost(500);
      }
    }

    void pollTranscript();
    return () => {
      cancelled = true;
    };
  }, [threadId]);

  return state;
}

function ThreadPage(props: { threadId: string }) {
  const { threadId } = props;
  const { temporary, toggleTemporary } =
    useTemporaryThreadLifecycle(threadId);
  const [providerStatuses, setProviderStatuses] = useState<
    readonly ServerProviderStatus[]
  >([]);
  const {
    data,
    error,
    isPending,
    summary: currentThread,
  } = useThreadTranscriptPolling(threadId);
  const providerHealth = useProviderHealthBanner(
    currentThread?.provider ?? 'codex',
    providerStatuses
  );
  const bodyState = resolveThreadPageBodyState({
    isPending,
    error,
    rows: data,
  });
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
    <view className="Page ThreadPage">
      <ChatSurfaceHeaderFrame>
        <ChatSurfaceHeaderIdentity
          title={currentThread?.title ?? 'Thread'}
          icon={<OpenAIProviderIcon provider={currentThread?.provider} />}
          iconTitle={currentThread?.project ?? 'Synara'}
        />
      </ChatSurfaceHeaderFrame>
      <ProviderHealthBanner
        status={providerHealth.status}
        onDismiss={providerHealth.dismiss}
      />
      {bodyState.kind === 'transcript' ? (
        <ComposerColumnFrameSurface className="ThreadTranscriptColumn">
          <Transcript rows={bodyState.rows} />
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
    </view>
  );
}

export function SliceRouter({
  onThemeStateChange,
  onUiDensityChange,
}: {
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onUiDensityChange: (density: UiDensity) => void;
}) {
  const route = useRoute();
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
  const titlebarControls = (
    <DesktopTitlebarControls
      canGoBack={navigation.canGoBack}
      canGoForward={navigation.canGoForward}
      placement={sidebarOpen ? 'open' : 'closed'}
      onGoBack={() => history.back()}
      onGoForward={() => history.forward()}
      onToggleSidebar={() => setSidebarOpen((open) => !open)}
    />
  );
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
        void bridgeCall('shellRendererReady').catch(() => {
          // The Lynx Web host has no desktop shell route queue.
        });
      }
    );
    return () => {
      cancelled = true;
      disposeNavigate?.();
      disposeHistory?.();
      disposeCommand?.();
    };
  }, []);

  if (route.pathname === '/settings') {
    return (
      <SettingsPage
        initialSection={
          (route.params.section as SettingsSectionId | undefined) ?? 'general'
        }
        onBack={navigateBackFromSettings}
        onThemeStateChange={onThemeStateChange}
        onUiDensityChange={onUiDensityChange}
      />
    );
  }
  let page: React.ReactNode;
  if (route.pathname === '/thread/$threadId') {
    page = (
      <ThreadPage
        key={route.params.threadId}
        threadId={route.params.threadId}
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

  const sidebar = sidebarOpen ? (
    <Sidebar
        activeThreadId={
          route.pathname === '/thread/$threadId' ? route.params.threadId : null
        }
        activePath={
          route.pathname === '/kanban/$projectId' ? '/kanban' : route.pathname
        }
        navigate={navigate}
        titlebarControls={titlebarControls}
      />
  ) : null;
  return (
    <AppShellFrame sidebar={sidebar}>
      <view
        className={`AppMain${
          sidebarOpen ? '' : ' AppMain--sidebar-closed'
        }`}
      >
        {sidebarOpen ? null : titlebarControls}
        {page}
      </view>
    </AppShellFrame>
  );
}
