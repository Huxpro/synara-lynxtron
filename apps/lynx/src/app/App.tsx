// P2-V1 vertical slice shell: providers + router outlet.

import { useEffect, useInitData, useMemo, useRef, useState } from "@lynx-js/react";
import { QueryClientProvider } from "@tanstack/react-query";

import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
  readSettingsAppearanceProjection,
  THEME_STORAGE_KEY,
} from "@synara-web/appSettingsStorageProjection.logic";
import type { SettingsAppearanceValues } from "@synara-web/components/settings/SettingsAppearanceComposition.logic";
import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  resolveThemeVariant,
  type ThemeState,
} from "@synara-web/theme/theme.logic";
import {
  isSupportedLocalPdfPath,
  isSupportedLocalPreviewFilePath,
} from "@synara/shared/localPreviewFiles";
import {
  viewportBreakpointClassNames,
  viewportHeightClassNames,
  viewportLayoutClassName,
} from "@synara-web/responsiveLayout.logic";
import { useViewportLayout } from "~/hooks/useViewportLayout";
import {
  readSystemAppearanceResponse,
  readSystemDarkEvent,
  SYSTEM_APPEARANCE_EVENT,
} from "../main/systemAppearanceEvent.logic";
import { readReducedMotionEvent, REDUCED_MOTION_EVENT } from "../main/reducedMotionEvent.logic";
import { bridgeCall, onGlobalEvent } from "../platform/bridge";
import { setLynxReducedMotion } from "../platform/motion.lynx";

import { sliceUiDensityClassName } from "./appDensity.logic";
import { sliceTypographyClassName } from "./appTypography.logic";
import { readPersistedAppearanceFallback } from "./appHydration.logic";
import { resolveSliceThemeVariables, sliceThemeClassName } from "./appTheme.logic";
import { queryClient } from "./queries";
import { SliceRouter } from "./router";
import { retryActiveSynaraQueries } from "./transportRetry.logic";
import { shouldRefetchAfterTransportRecovery } from "./transportRecovery.logic";
import { setLynxThemeState, subscribeLynxThemeState } from "../adapters/useTheme.lynx";
import { useSynaraTransportState } from "../data/useSynaraTransportState.lynx";
import { MenuOverlayProvider } from "../components/ui/menu.lynx";
import { SynaraLogo } from "../adapters/SynaraLogo.lynx";
import "./native-fonts.css";
import "./App.css";

async function readPersistedAppearance(): Promise<{
  readonly appearance: SettingsAppearanceValues;
  readonly themeState: ThemeState;
}> {
  "background only";
  const { hydrateStorage, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await hydrateStorage();
  const { hydrateLynxComposerDraftStore } = await import(
    /* webpackMode: "eager" */ "../adapters/composerDraftStore.lynx"
  );
  const { useTerminalStateStore } = await import(
    /* webpackMode: "eager" */ "@synara-web/terminalStateStore"
  );
  await Promise.all([hydrateLynxComposerDraftStore(), useTerminalStateStore.persist.rehydrate()]);
  const themeRaw = webStorage.getItem(THEME_STORAGE_KEY);
  return {
    appearance: readSettingsAppearanceProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      themeRaw,
    ),
    themeState: parseStoredThemeState(themeRaw),
  };
}

export function App() {
  const initData = useInitData() as {
    readonly initialDiffOpen?: unknown;
    readonly initialDiffTurnId?: unknown;
    readonly initialDiffFilePath?: unknown;
    readonly initialDiffFileTreeOpen?: unknown;
    readonly initialSystemDark?: unknown;
    readonly initialThemeMode?: unknown;
    readonly initialEnvironmentOpen?: unknown;
    readonly initialEditorOpen?: unknown;
    readonly initialEditorCenterMode?: unknown;
    readonly initialEditorChatOpen?: unknown;
    readonly initialEditorSearchOpen?: unknown;
    readonly initialEditorProjectMenuOpen?: unknown;
    readonly initialRenameOpen?: unknown;
    readonly initialTerminalOpen?: unknown;
    readonly initialTemporaryOpen?: unknown;
    readonly initialSettingsTarget?: unknown;
    readonly initialExplorerOpen?: unknown;
    readonly initialExplorerPresentationMode?: unknown;
    readonly initialExplorerActionMenuOpen?: unknown;
    readonly initialExplorerCommentLine?: unknown;
    readonly initialExplorerPath?: unknown;
    readonly initialExplorerQuery?: unknown;
    readonly initialExplorerExpandedDirectories?: unknown;
    readonly initialExplorerWidth?: unknown;
    readonly initialRoute?: unknown;
    readonly initialReducedMotion?: unknown;
  };
  const [systemDark, setSystemDark] = useState(initData.initialSystemDark === true);
  const initialThemeMode =
    initData.initialThemeMode === "light" || initData.initialThemeMode === "dark"
      ? initData.initialThemeMode
      : null;
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(
    initData.initialReducedMotion === true,
  );
  const initialEnvironmentOpen = initData.initialEnvironmentOpen === true;
  const initialDiffOpen = initData.initialDiffOpen === true;
  const initialDiffTurnId =
    typeof initData.initialDiffTurnId === "string" && initData.initialDiffTurnId.trim()
      ? initData.initialDiffTurnId.trim()
      : null;
  const initialDiffFilePath =
    typeof initData.initialDiffFilePath === "string" && initData.initialDiffFilePath.trim()
      ? initData.initialDiffFilePath.trim()
      : null;
  const initialDiffFileTreeOpen = initData.initialDiffFileTreeOpen === true;
  const initialEditorOpen = initData.initialEditorOpen === true;
  const initialEditorCenterMode =
    initData.initialEditorCenterMode === "diff" || initData.initialEditorCenterMode === "file"
      ? initData.initialEditorCenterMode
      : null;
  const initialEditorChatOpen =
    typeof initData.initialEditorChatOpen === "boolean" ? initData.initialEditorChatOpen : null;
  const initialEditorSearchOpen = initData.initialEditorSearchOpen === true;
  const initialEditorProjectMenuOpen = initData.initialEditorProjectMenuOpen === true;
  const initialRenameOpen = initData.initialRenameOpen === true;
  const initialTerminalOpen = initData.initialTerminalOpen === true;
  const initialTemporaryOpen = initData.initialTemporaryOpen === true;
  const initialSettingsTarget =
    typeof initData.initialSettingsTarget === "string" && initData.initialSettingsTarget.trim()
      ? initData.initialSettingsTarget.trim()
      : null;
  const initialRoute =
    typeof initData.initialRoute === "string" && initData.initialRoute.startsWith("/")
      ? initData.initialRoute
      : null;
  const initialExplorerOpen = initData.initialExplorerOpen === true;
  const initialExplorerPresentationMode =
    initData.initialExplorerPresentationMode === "single-file" ? "single-file" : "dock";
  const initialExplorerActionMenuOpen = initData.initialExplorerActionMenuOpen === true;
  const initialExplorerCommentLine =
    typeof initData.initialExplorerCommentLine === "number" &&
    Number.isInteger(initData.initialExplorerCommentLine) &&
    initData.initialExplorerCommentLine > 0
      ? initData.initialExplorerCommentLine
      : null;
  const initialExplorerPath =
    typeof initData.initialExplorerPath === "string" ? initData.initialExplorerPath : null;
  const initialExplorerQuery =
    typeof initData.initialExplorerQuery === "string" ? initData.initialExplorerQuery : "";
  const initialExplorerExpandedDirectories = Array.isArray(
    initData.initialExplorerExpandedDirectories,
  )
    ? initData.initialExplorerExpandedDirectories.filter(
        (path): path is string => typeof path === "string" && path.length > 0,
      )
    : [];
  const initialExplorerWidth =
    typeof initData.initialExplorerWidth === "number" &&
    Number.isFinite(initData.initialExplorerWidth)
      ? initData.initialExplorerWidth
      : null;
  const [storageReady, setStorageReady] = useState(false);
  const [appearance, setAppearance] = useState<SettingsAppearanceValues>(
    DEFAULT_SETTINGS_APPEARANCE_VALUES,
  );
  const [themeState, setThemeState] = useState<ThemeState>(() =>
    initialThemeMode === null
      ? DEFAULT_THEME_STATE
      : { ...DEFAULT_THEME_STATE, mode: initialThemeMode },
  );
  const viewportLayout = useViewportLayout();
  const transportState = useSynaraTransportState();
  const previousTransportStateRef = useRef(transportState);
  const themeVariables = useMemo(
    () => resolveSliceThemeVariables(themeState, systemDark),
    [systemDark, themeState],
  );

  useEffect(() => {
    "background only";
    let active = true;
    void readPersistedAppearanceFallback(readPersistedAppearance).then((persisted) => {
      if (!active) return;
      setAppearance(persisted.appearance);
      if (initialThemeMode === null) setThemeState(persisted.themeState);
      setStorageReady(true);
    });
    return () => {
      active = false;
    };
  }, [initialThemeMode]);

  useEffect(() => {
    "background only";
    setLynxThemeState(themeState, systemDark);
  }, [systemDark, themeState]);
  useEffect(() => {
    "background only";
    let disposed = false;
    let receivedTransition = false;
    const dispose = onGlobalEvent(SYSTEM_APPEARANCE_EVENT, (value: unknown) => {
      const next = readSystemDarkEvent(value);
      if (next === null) return;
      receivedTransition = true;
      setSystemDark(next);
    });
    void bridgeCall("runtimeGetSystemAppearance")
      .then((value) => {
        const next = readSystemAppearanceResponse(value);
        if (!disposed && !receivedTransition && next !== null) {
          setSystemDark(next);
        }
      })
      .catch(() => {
        // The load-time snapshot remains authoritative when the host cannot
        // provide a current appearance reading.
      });
    return () => {
      disposed = true;
      dispose();
    };
  }, []);
  useEffect(() => {
    "background only";
    setLynxReducedMotion(prefersReducedMotion);
  }, [prefersReducedMotion]);
  useEffect(() => {
    "background only";
    return onGlobalEvent(REDUCED_MOTION_EVENT, (value: unknown) => {
      const next = readReducedMotionEvent(value);
      if (next !== null) setPrefersReducedMotion(next);
    });
  }, []);
  useEffect(() => {
    "background only";
    return subscribeLynxThemeState(setThemeState);
  }, []);
  useEffect(() => {
    "background only";
    const previous = previousTransportStateRef.current;
    previousTransportStateRef.current = transportState;
    if (shouldRefetchAfterTransportRecovery(previous, transportState)) {
      void retryActiveSynaraQueries(queryClient);
    }
  }, [transportState]);
  useEffect(() => {
    "background only";
    if (!storageReady) return;
    void bridgeCall("shellUiReady", { route: initialRoute ?? "/" }).catch(() => undefined);
  }, [initialRoute, storageReady]);

  return (
    <QueryClientProvider client={queryClient}>
      <view
        className={[
          "SliceRoot",
          sliceThemeClassName(themeState, systemDark),
          sliceUiDensityClassName(appearance.uiDensity),
          sliceTypographyClassName(appearance.chatFontSizePx),
          viewportLayoutClassName(viewportLayout),
          viewportBreakpointClassNames(viewportLayout),
          viewportHeightClassNames(viewportLayout),
        ]
          .filter(Boolean)
          .join(" ")}
        data-viewport-width={viewportLayout.width}
        data-viewport-height={viewportLayout.height}
        style={themeVariables}
      >
        <MenuOverlayProvider>
          {storageReady ? (
            <SliceRouter
              transportState={transportState}
              onRetryTransport={() => void retryActiveSynaraQueries(queryClient)}
              initialDiffOpen={initialDiffOpen}
              initialDiffTurnId={initialDiffTurnId}
              initialDiffFilePath={initialDiffFilePath}
              initialDiffFileTreeOpen={initialDiffFileTreeOpen}
              initialEnvironmentOpen={initialEnvironmentOpen}
              initialEditorOpen={initialEditorOpen}
              initialEditorCenterMode={initialEditorCenterMode}
              initialEditorChatOpen={initialEditorChatOpen}
              initialEditorSearchOpen={initialEditorSearchOpen}
              initialEditorProjectMenuOpen={initialEditorProjectMenuOpen}
              initialRenameOpen={initialRenameOpen}
              initialTerminalOpen={initialTerminalOpen}
              initialTemporaryOpen={initialTemporaryOpen}
              initialSettingsTarget={initialSettingsTarget}
              initialRoute={initialRoute}
              initialExplorerOpen={initialExplorerOpen}
              initialExplorerPresentationMode={initialExplorerPresentationMode}
              initialExplorerActionMenuOpen={initialExplorerActionMenuOpen}
              initialExplorerCommentLine={initialExplorerCommentLine}
              initialExplorerPath={initialExplorerPath}
              initialExplorerQuery={initialExplorerQuery}
              initialExplorerExpandedDirectories={initialExplorerExpandedDirectories}
              initialExplorerWidth={initialExplorerWidth}
              appearance={appearance}
              resolvedTheme={resolveThemeVariant(themeState.mode, systemDark)}
              viewportWidth={viewportLayout.width}
              viewportHeight={viewportLayout.height}
              onAppearanceChange={setAppearance}
              onThemeStateChange={setThemeState}
            />
          ) : (
            <view
              className="AppHydrationState"
              accessibility-element
              accessibility-label="Synara is starting"
              accessibility-trait="updating"
            >
              <SynaraLogo className="AppHydrationLogo" aria-label="Synara" />
            </view>
          )}
        </MenuOverlayProvider>
      </view>
    </QueryClientProvider>
  );
}
