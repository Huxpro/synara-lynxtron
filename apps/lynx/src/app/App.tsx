// P2-V1 vertical slice shell: providers + router outlet.

import { useEffect, useInitData, useRef, useState } from '@lynx-js/react';
import { QueryClientProvider } from '@tanstack/react-query';

import {
  APP_SETTINGS_STORAGE_KEY,
  readSettingsAppearanceProjection,
  THEME_STORAGE_KEY,
} from '@synara-web/appSettingsStorageProjection.logic';
import {
  DEFAULT_UI_DENSITY,
  type UiDensity,
} from '@synara-web/lib/appDensity';
import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  resolveThemeVariant,
  type ThemeState,
} from '@synara-web/theme/theme.logic';
import {
  isSupportedLocalPdfPath,
  isSupportedLocalPreviewFilePath,
} from '@synara/shared/localPreviewFiles';
import {
  viewportBreakpointClassNames,
  viewportHeightClassNames,
  viewportLayoutClassName,
} from '@synara-web/responsiveLayout.logic';
import { useViewportLayout } from '~/hooks/useViewportLayout';

import { sliceUiDensityClassName } from './appDensity.logic';
import { sliceThemeClassName } from './appTheme.logic';
import {
  fetchEnvironmentBootstrapData,
  type EnvironmentBootstrapData,
} from './environmentBootstrap.lynx';
import {
  fetchExplorerDirectory,
  fetchExplorerEntries,
  fetchExplorerFile,
  fetchExplorerLocalPreviewUrl,
  fetchExplorerPdfMetadata,
  fetchSidebarSnapshot,
  fetchThreadHeaderSummary,
  fetchThreadTranscriptRows,
  queryClient,
} from './queries';
import { SliceRouter } from './router';
import { retryActiveSynaraQueries } from './transportRetry.logic';
import { shouldRefetchAfterTransportRecovery } from './transportRecovery.logic';
import {
  setLynxThemeState,
  subscribeLynxThemeState,
} from '../adapters/useTheme.lynx';
import { useSynaraTransportState } from '../data/useSynaraTransportState.lynx';
import { Button } from '../components/ui/button';
import './App.css';

async function readPersistedAppearance(): Promise<{
  readonly themeState: ThemeState;
  readonly uiDensity: UiDensity;
}> {
  'background only';
  const { hydrateStorage, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await hydrateStorage();
  const { hydrateLynxComposerDraftStore } = await import(
    /* webpackMode: "eager" */ '../adapters/composerDraftStore.lynx'
  );
  const { useWorkspaceStore } = await import(
    /* webpackMode: "eager" */ '@synara-web/workspaceStore'
  );
  await Promise.all([
    hydrateLynxComposerDraftStore(),
    useWorkspaceStore.persist.rehydrate(),
  ]);
  const themeRaw = webStorage.getItem(THEME_STORAGE_KEY);
  return {
    themeState: parseStoredThemeState(themeRaw),
    uiDensity: readSettingsAppearanceProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      themeRaw
    ).uiDensity,
  };
}

export function App() {
  const initData = useInitData() as {
    readonly initialSystemDark?: unknown;
    readonly initialEnvironmentOpen?: unknown;
    readonly initialTerminalOpen?: unknown;
    readonly initialTemporaryOpen?: unknown;
    readonly initialExplorerOpen?: unknown;
    readonly initialExplorerCommentLine?: unknown;
    readonly initialExplorerPath?: unknown;
    readonly initialExplorerQuery?: unknown;
    readonly initialExplorerExpandedDirectories?: unknown;
    readonly initialExplorerWidth?: unknown;
    readonly initialRoute?: unknown;
  };
  const systemDark = initData.initialSystemDark === true;
  const initialEnvironmentOpen = initData.initialEnvironmentOpen === true;
  const initialTerminalOpen = initData.initialTerminalOpen === true;
  const initialTemporaryOpen = initData.initialTemporaryOpen === true;
  const initialRoute =
    typeof initData.initialRoute === 'string' &&
    initData.initialRoute.startsWith('/')
      ? initData.initialRoute
      : null;
  const initialExplorerOpen = initData.initialExplorerOpen === true;
  const initialExplorerCommentLine =
    typeof initData.initialExplorerCommentLine === 'number' &&
    Number.isInteger(initData.initialExplorerCommentLine) &&
    initData.initialExplorerCommentLine > 0
      ? initData.initialExplorerCommentLine
      : null;
  const initialExplorerPath =
    typeof initData.initialExplorerPath === 'string'
      ? initData.initialExplorerPath
      : null;
  const initialExplorerQuery =
    typeof initData.initialExplorerQuery === 'string'
      ? initData.initialExplorerQuery
      : '';
  const initialExplorerExpandedDirectories = Array.isArray(
    initData.initialExplorerExpandedDirectories
  )
    ? initData.initialExplorerExpandedDirectories.filter(
        (path): path is string => typeof path === 'string' && path.length > 0
      )
    : [];
  const initialExplorerWidth =
    typeof initData.initialExplorerWidth === 'number' &&
    Number.isFinite(initData.initialExplorerWidth)
      ? initData.initialExplorerWidth
      : null;
  const [storageReady, setStorageReady] = useState(false);
  const [initialThreadBootstrap, setInitialThreadBootstrap] = useState<{
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
      Awaited<ReturnType<typeof fetchExplorerDirectory>>['entries'],
      boolean,
    ])[];
    readonly summary: Awaited<ReturnType<typeof fetchThreadHeaderSummary>>;
    readonly threadId: string;
  } | null>(null);
  const [uiDensity, setUiDensity] =
    useState<UiDensity>(DEFAULT_UI_DENSITY);
  const [themeState, setThemeState] =
    useState<ThemeState>(DEFAULT_THEME_STATE);
  const viewportLayout = useViewportLayout();
  const transportState = useSynaraTransportState();
  const previousTransportStateRef = useRef(transportState);

  useEffect(() => {
    'background only';
    let active = true;
    const threadMatch = initialRoute?.match(/^\/thread\/([^/]+)$/);
    void Promise.all([
      readPersistedAppearance(),
      threadMatch
        ? fetchSidebarSnapshot()
            .then((snapshot) => {
              queryClient.setQueryData(['sidebar-snapshot'], snapshot);
              return Promise.all([
                fetchThreadTranscriptRows(threadMatch[1]),
                fetchThreadHeaderSummary(threadMatch[1]),
              ]);
            })
            .then(async ([data, summary]) => {
              const explorerEntries = summary?.workspaceRoot
                ? await fetchExplorerEntries({
                    workspaceRoot: summary.workspaceRoot,
                    query: initialExplorerQuery.trim(),
                  }).then(
                    (value) => ({ value, error: false }),
                    () => ({ value: null, error: true })
                  )
                : { value: null, error: false };
              const explorerFile =
                summary?.workspaceRoot &&
                initialExplorerPath &&
                !isSupportedLocalPreviewFilePath(initialExplorerPath)
                  ? await fetchExplorerFile({
                      workspaceRoot: summary.workspaceRoot,
                      relativePath: initialExplorerPath,
                    }).then(
                      (value) => ({ value, error: false }),
                      () => ({ value: null, error: true })
                    )
                  : { value: null, error: false };
              const explorerLocalPreview =
                summary?.workspaceRoot &&
                initialExplorerPath &&
                isSupportedLocalPreviewFilePath(initialExplorerPath)
                  ? await fetchExplorerLocalPreviewUrl({
                      workspaceRoot: summary.workspaceRoot,
                      relativePath: initialExplorerPath,
                    }).then(
                      (value) => ({ value, error: false }),
                      () => ({ value: null, error: true })
                    )
                  : { value: null, error: false };
              const explorerPdfMetadata =
                summary?.workspaceRoot &&
                initialExplorerPath &&
                isSupportedLocalPdfPath(initialExplorerPath)
                  ? await fetchExplorerPdfMetadata({
                      workspaceRoot: summary.workspaceRoot,
                      relativePath: initialExplorerPath,
                    }).then(
                      (value) => ({ value, error: false }),
                      () => ({ value: null, error: true })
                    )
                  : { value: null, error: false };
              const explorerDirectories =
                summary?.workspaceRoot && !initialExplorerQuery.trim()
                  ? await Promise.all(
                      initialExplorerExpandedDirectories.map(async (path) => {
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
              const environment =
                initialEnvironmentOpen && summary?.workspaceRoot
                  ? await fetchEnvironmentBootstrapData(summary.workspaceRoot)
                  : null;
              return {
                data,
                environment,
                explorerDirectories,
                explorerEntries,
                explorerFile,
                explorerLocalPreview,
                explorerPdfMetadata,
                summary,
                threadId: threadMatch[1],
              };
            })
            .catch(() => null)
        : null,
    ]).then(([appearance, thread]) => {
      if (!active) return;
      setUiDensity(appearance.uiDensity);
      setThemeState(appearance.themeState);
      if (threadMatch && thread) {
        setInitialThreadBootstrap({
          ...thread,
        });
      }
      setStorageReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    'background only';
    setLynxThemeState(themeState, systemDark);
  }, [systemDark, themeState]);
  useEffect(() => {
    'background only';
    return subscribeLynxThemeState(setThemeState);
  }, []);
  useEffect(() => {
    'background only';
    const previous = previousTransportStateRef.current;
    previousTransportStateRef.current = transportState;
    if (shouldRefetchAfterTransportRecovery(previous, transportState)) {
      void retryActiveSynaraQueries(queryClient);
    }
  }, [transportState]);

  return (
    <QueryClientProvider client={queryClient}>
      <view
        className={[
          'SliceRoot',
          sliceThemeClassName(themeState, systemDark),
          sliceUiDensityClassName(uiDensity),
          viewportLayoutClassName(viewportLayout),
          viewportBreakpointClassNames(viewportLayout),
          viewportHeightClassNames(viewportLayout),
        ]
          .filter(Boolean)
          .join(' ')}
        data-viewport-width={viewportLayout.width}
        data-viewport-height={viewportLayout.height}
      >
        {transportState === 'reconnecting' || transportState === 'offline' ? (
          <view
            className={`TransportStatusNotice TransportStatusNotice--${transportState}`}
          >
            <text
              className="TransportStatusNoticeText"
              accessibility-element
              accessibility-label={
                transportState === 'reconnecting'
                  ? 'Reconnecting to Synara'
                  : 'Synara is offline'
              }
              accessibility-traits="updating"
            >
              {transportState === 'reconnecting'
                ? 'Reconnecting…'
                : 'Synara is offline.'}
            </text>
            {transportState === 'offline' ? (
              <Button
                className="TransportStatusRetry"
                variant="ghost"
                size="xs"
                aria-label="Retry connecting to Synara"
                onClick={() => {
                  'background only';
                  void retryActiveSynaraQueries(queryClient);
                }}
              >
                Retry
              </Button>
            ) : null}
          </view>
        ) : null}
        {storageReady ? (
          <SliceRouter
            initialEnvironmentOpen={initialEnvironmentOpen}
            initialTerminalOpen={initialTerminalOpen}
            initialTemporaryOpen={initialTemporaryOpen}
            initialRoute={initialRoute}
            initialThreadBootstrap={initialThreadBootstrap}
            initialExplorerOpen={initialExplorerOpen}
            initialExplorerCommentLine={initialExplorerCommentLine}
            initialExplorerPath={initialExplorerPath}
            initialExplorerQuery={initialExplorerQuery}
            initialExplorerExpandedDirectories={
              initialExplorerExpandedDirectories
            }
            initialExplorerWidth={initialExplorerWidth}
            resolvedTheme={resolveThemeVariant(themeState.mode, systemDark)}
            viewportWidth={viewportLayout.width}
            onThemeStateChange={setThemeState}
            onUiDensityChange={setUiDensity}
          />
        ) : (
          <view className="AppHydrationState">
            <text>Preparing Synara…</text>
          </view>
        )}
      </view>
    </QueryClientProvider>
  );
}
