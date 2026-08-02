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
import type { UiDensity } from '@synara-web/lib/appDensity';
import type { ThemeState } from '@synara-web/theme/theme.logic';

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
import { ChatEmptyStateHero } from '@synara-web/components/chat/ChatEmptyStateHero';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import { LandingComposer } from '../components/composer/LandingComposer.lynx';
import { OpenAIProviderIcon } from '../components/OpenAIProviderIcon.lynx';
import {
  EMPTY_ROUTE_RESTORE_FALLBACK_DELAY_MS,
  resolveRestorableThreadRoute,
  type LastThreadRoute,
} from '@synara-web/chatRouteRestore';
import { useRestoreOrCreateChatRouteController } from '@synara-web/components/useRestoreOrCreateChatRoute.logic';
import { resolveSettingsBackTarget } from '@synara-web/components/SidebarSettingsBack.logic';
import { resolveThreadPageBodyState } from './threadPageState.logic';
import { sleepOnHost } from '../platform/timer';
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
  if (pathname === '/settings') {
    return { pathname: '/settings', params: {} };
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

// --- pages ----------------------------------------------------------------------
function ThreadsLandingPage(props: {
  readonly onThreadCreated: (threadId: string) => void;
}) {
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
      <view className="ThreadsLandingBody">
        <CenteredEmptyLandingStack>
          <CenteredEmptyLanding />
          <ComposerColumnFrameSurface>
            <LandingComposer onThreadCreated={props.onThreadCreated} />
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
  const {
    data,
    error,
    isPending,
    summary: currentThread,
  } = useThreadTranscriptPolling(threadId);
  const bodyState = resolveThreadPageBodyState({
    isPending,
    error,
    rows: data,
  });
  return (
    <view className="Page ThreadPage">
      <ChatSurfaceHeaderFrame>
        <ChatSurfaceHeaderIdentity
          title={currentThread?.title ?? 'Thread'}
          icon={<OpenAIProviderIcon provider={currentThread?.provider} />}
          iconTitle={currentThread?.project ?? 'Synara'}
        />
      </ChatSurfaceHeaderFrame>
      {bodyState.kind === 'transcript' ? (
        <ComposerColumnFrameSurface className="ThreadTranscriptColumn">
          <Transcript rows={bodyState.rows} />
        </ComposerColumnFrameSurface>
      ) : bodyState.kind === 'empty' ? (
        <view className="ThreadTranscriptState">
          <ChatEmptyStateHero projectName={currentThread?.project} />
        </view>
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
      <ComposerColumnFrameSurface>
        <Composer
          threadId={threadId}
          modelSelection={currentThread?.modelSelection}
          runtimeMode={currentThread?.runtimeMode}
          interactionMode={currentThread?.interactionMode}
          sessionStatus={currentThread?.sessionStatus ?? null}
          activeTurnId={currentThread?.activeTurnId ?? null}
          workspaceRoot={currentThread?.workspaceRoot ?? null}
        />
      </ComposerColumnFrameSurface>
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
    let dispose: (() => void) | null = null;
    void import(/* webpackMode: "eager" */ '../platform/bridge').then(
      ({ bridgeCall, onGlobalEvent }) => {
        if (cancelled) return;
        dispose = onGlobalEvent('shell:navigate', (target: unknown) => {
          if (typeof target === 'string' && target.startsWith('/')) {
            history.push(target);
          }
        });
        void bridgeCall('shellRendererReady').catch(() => {
          // The Lynx Web host has no desktop shell route queue.
        });
      }
    );
    return () => {
      cancelled = true;
      dispose?.();
    };
  }, []);

  if (route.pathname === '/settings') {
    return (
      <SettingsPage
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
    page = <ThreadsLandingPage onThreadCreated={(threadId) => navigate(`/thread/${threadId}`)} />;
  }

  const sidebar = (
    <Sidebar
        activeThreadId={
          route.pathname === '/thread/$threadId' ? route.params.threadId : null
        }
        activePath={
          route.pathname === '/kanban/$projectId' ? '/kanban' : route.pathname
        }
        navigate={navigate}
      />
  );
  return (
    <AppShellFrame sidebar={sidebar}>
      <view className="AppMain">{page}</view>
    </AppShellFrame>
  );
}
