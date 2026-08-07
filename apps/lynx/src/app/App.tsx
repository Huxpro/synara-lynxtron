// P2-V1 vertical slice shell: providers + router outlet.

import { useEffect, useState } from '@lynx-js/react';
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
  type ThemeState,
} from '@synara-web/theme/theme.logic';
import {
  viewportBreakpointClassNames,
  viewportLayoutClassName,
} from '@synara-web/responsiveLayout.logic';
import { useViewportLayout } from '~/hooks/useViewportLayout';

import { sliceUiDensityClassName } from './appDensity.logic';
import { sliceThemeClassName } from './appTheme.logic';
import { queryClient } from './queries';
import { SliceRouter } from './router';
import { retryActiveSynaraQueries } from './transportRetry.logic';
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
  await hydrateLynxComposerDraftStore();
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
  const [storageReady, setStorageReady] = useState(false);
  const [uiDensity, setUiDensity] =
    useState<UiDensity>(DEFAULT_UI_DENSITY);
  const [themeState, setThemeState] =
    useState<ThemeState>(DEFAULT_THEME_STATE);
  const viewportLayout = useViewportLayout();
  const transportState = useSynaraTransportState();

  useEffect(() => {
    'background only';
    let active = true;
    void readPersistedAppearance().then((value) => {
      if (!active) return;
      setUiDensity(value.uiDensity);
      setThemeState(value.themeState);
      setStorageReady(true);
    });
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    'background only';
    setLynxThemeState(themeState);
  }, [themeState]);
  useEffect(() => {
    'background only';
    return subscribeLynxThemeState(setThemeState);
  }, []);

  return (
    <QueryClientProvider client={queryClient}>
      <view
        className={`SliceRoot ${sliceThemeClassName(themeState)} ${sliceUiDensityClassName(uiDensity)} ${viewportLayoutClassName(viewportLayout)} ${viewportBreakpointClassNames(viewportLayout)}`}
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
