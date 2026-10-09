import { useCallback, useEffect, useState } from "@lynx-js/react";

async function readPersistedActivityViewEnabled(): Promise<boolean> {
  "background only";
  const { hydrateStorage } = await import(/* webpackMode: "eager" */ "../platform/storage");
  await hydrateStorage();
  const { readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  return readSidebarUiState().activityViewEnabled;
}

async function persistActivityViewEnabled(activityViewEnabled: boolean): Promise<void> {
  "background only";
  const { persistSidebarUiState, readSidebarUiState } = await import(
    /* webpackMode: "eager" */ "@synara-web/components/Sidebar.uiState"
  );
  persistSidebarUiState({ ...readSidebarUiState(), activityViewEnabled });
}

/**
 * The sidebar's Activity view toggle, persisted in the shared sidebar UI state. The route
 * shell owns it so the ⌘⌥U menu command and the header bell drive the same state.
 */
export function usePersistedActivityViewEnabled(): readonly [boolean, (enabled: boolean) => void] {
  const [activityViewEnabled, setActivityViewEnabledState] = useState(false);
  useEffect(() => {
    "background only";
    void readPersistedActivityViewEnabled()
      .then(setActivityViewEnabledState)
      .catch(() => {
        // Without persisted state the sidebar starts in the classic view.
      });
  }, []);
  const setActivityViewEnabled = useCallback((enabled: boolean) => {
    "background only";
    setActivityViewEnabledState(enabled);
    void persistActivityViewEnabled(enabled).catch(() => undefined);
  }, []);
  return [activityViewEnabled, setActivityViewEnabled];
}
