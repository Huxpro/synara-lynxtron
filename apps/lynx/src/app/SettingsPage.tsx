import { useEffect, useRef, useState } from '@lynx-js/react';

import { SettingsNavigationComposition } from '@synara-web/components/SettingsNavigationComposition';
import { SettingsSidebarChromeComposition } from '@synara-web/components/settings/SettingsSidebarChromeComposition';
import { SettingsAppearanceComposition } from '@synara-web/components/settings/SettingsAppearanceComposition';
import {
  settingsAppearanceValuesEqual,
  type SettingsAppearanceKey,
  type SettingsAppearanceValues,
} from '@synara-web/components/settings/SettingsAppearanceComposition.logic';
import { SettingsGeneralComposition } from '@synara-web/components/settings/SettingsGeneralComposition';
import {
  settingsGeneralValuesEqual,
  type SettingsGeneralKey,
  type SettingsGeneralValues,
} from '@synara-web/components/settings/SettingsGeneralComposition.logic';
import { SettingsGitWritingModelComposition } from '@synara-web/components/settings/SettingsGitWritingModelComposition';
import {
  DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES,
  buildSettingsGitWritingModelOptions,
  readSettingsGitWritingModelValues,
  settingsGitWritingModelValuesEqual,
  type SettingsGitWritingModelOption,
  type SettingsGitWritingModelValues,
} from '@synara-web/components/settings/SettingsGitWritingModelComposition.logic';
import { SettingsProviderUpdateChecksComposition } from '@synara-web/components/settings/SettingsProviderUpdateChecksComposition';
import {
  DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
  readSettingsProviderUpdateChecksValues,
  settingsProviderUpdateChecksValuesEqual,
  type SettingsProviderUpdateChecksValues,
} from '@synara-web/components/settings/SettingsProviderUpdateChecksComposition.logic';
import { SettingsProviderPickerComposition } from '@synara-web/components/settings/SettingsProviderPickerComposition';
import {
  DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
  settingsProviderPickerValuesEqual,
  type SettingsProviderPickerValues,
} from '@synara-web/components/settings/SettingsProviderPickerComposition.logic';
import { SettingsPanelHeaderComposition } from '@synara-web/components/settings/SettingsPanelHeaderComposition';
import { PanelStateMessage } from '@synara-web/components/chat/PanelStateMessage';
import {
  APP_SETTINGS_STORAGE_KEY,
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
  DEFAULT_SETTINGS_GENERAL_VALUES,
  THEME_STORAGE_KEY,
  readSettingsAppearanceProjection,
  readSettingsGeneralProjection,
  readSettingsProviderPickerProjection,
  writeSettingsAppearanceProjection,
  writeSettingsGeneralProjection,
  writeSettingsProviderPickerProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import type { SettingsSectionId } from '@synara-web/settingsNavigation';
import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  serializeThemeState,
  type ThemeState,
} from '@synara-web/theme/theme.logic';
import { resolveSliceThemeVariant } from './appTheme.logic';
import {
  resolveSettingsPersistencePresentation,
  shouldApplySettingsSaveResult,
  type SettingsPersistenceState,
  type SettingsPersistOutcome,
} from './settingsPersistence.logic';
import { Button } from '../components/ui/button';

const SETTINGS_LOCAL_SAVE_ERROR =
  'Changes could not be saved. Your current values are still shown.';
const SETTINGS_SERVER_SAVE_ERROR =
  'Changes were saved locally, but the default thread environment could not be updated on the server.';
const SETTINGS_MODEL_SAVE_ERROR =
  'The Git writing model could not be updated. Your selected value is still shown.';
const SETTINGS_PROVIDER_SAVE_ERROR =
  'The provider update-check preference could not be updated. Your selected value is still shown.';

async function readSettings(retry: boolean): Promise<{
  readonly general: SettingsGeneralValues;
  readonly appearance: SettingsAppearanceValues;
  readonly models: SettingsGitWritingModelValues;
  readonly providers: SettingsProviderUpdateChecksValues;
  readonly providerPicker: SettingsProviderPickerValues;
  readonly modelOptions: readonly SettingsGitWritingModelOption[];
  readonly themeState: ThemeState;
}> {
  'background only';
  const [
    {
      getStorageHydrationError,
      hydrateStorage,
      retryHydrateStorage,
      webStorage,
    },
    { fetchServerSettings },
  ] =
    await Promise.all([
      import(/* webpackMode: "eager" */ '../platform/storage'),
      import(/* webpackMode: "eager" */ '../data/synaraClient'),
    ]);
  if (retry) {
    await retryHydrateStorage();
  } else {
    await hydrateStorage();
  }
  const hydrationError = getStorageHydrationError();
  if (hydrationError) throw hydrationError;
  const serverSettings = await fetchServerSettings().catch(() => null);
  const appSettingsRaw = webStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  const themeRaw = webStorage.getItem(THEME_STORAGE_KEY);
  return {
    general: readSettingsGeneralProjection(
      appSettingsRaw,
      serverSettings?.defaultThreadEnvMode
    ),
    appearance: readSettingsAppearanceProjection(
      appSettingsRaw,
      themeRaw
    ),
    models: readSettingsGitWritingModelValues(serverSettings),
    providers: readSettingsProviderUpdateChecksValues(serverSettings),
    providerPicker: readSettingsProviderPickerProjection(appSettingsRaw),
    modelOptions: buildSettingsGitWritingModelOptions({
      settings: serverSettings,
      selected: readSettingsGitWritingModelValues(serverSettings),
    }),
    themeState: parseStoredThemeState(themeRaw),
  };
}

async function persistProviderUpdateChecks(
  values: SettingsProviderUpdateChecksValues
): Promise<SettingsPersistOutcome> {
  'background only';
  const { updateServerSettings } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  try {
    await updateServerSettings(values);
    return { kind: 'saved' };
  } catch {
    return { kind: 'partial', message: SETTINGS_PROVIDER_SAVE_ERROR };
  }
}

async function persistProviderPicker(
  values: SettingsProviderPickerValues
): Promise<void> {
  'background only';
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsProviderPickerProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      values
    )
  );
}

async function persistGitWritingModel(
  values: SettingsGitWritingModelValues
): Promise<SettingsPersistOutcome> {
  'background only';
  const { updateServerSettings } = await import(
    /* webpackMode: "eager" */ '../data/synaraClient'
  );
  try {
    await updateServerSettings({
      textGenerationModelSelection: values,
    });
    return { kind: 'saved' };
  } catch {
    return { kind: 'partial', message: SETTINGS_MODEL_SAVE_ERROR };
  }
}

async function persistSettings(
  settings: SettingsGeneralValues,
  updateServerThreadMode: boolean
): Promise<SettingsPersistOutcome> {
  'background only';
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsGeneralProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      settings
    )
  );
  if (updateServerThreadMode) {
    const { updateServerSettings } = await import(
      /* webpackMode: "eager" */ '../data/synaraClient'
    );
    try {
      await updateServerSettings({
        defaultThreadEnvMode: settings.defaultThreadEnvMode,
      });
    } catch {
      return { kind: 'partial', message: SETTINGS_SERVER_SAVE_ERROR };
    }
  }
  return { kind: 'saved' };
}

async function persistAppearanceSettings(
  settings: SettingsAppearanceValues,
  themeStateOverride?: ThemeState
): Promise<void> {
  'background only';
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  const next = writeSettingsAppearanceProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    webStorage.getItem(THEME_STORAGE_KEY),
    settings
  );
  await setPersistedStorageItem(APP_SETTINGS_STORAGE_KEY, next.appSettingsRaw);
  await setPersistedStorageItem(
    THEME_STORAGE_KEY,
    themeStateOverride
      ? serializeThemeState(themeStateOverride)
      : next.themeRaw
  );
}

async function persistThemeState(themeState: ThemeState): Promise<void> {
  'background only';
  const { setPersistedStorageItem } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await setPersistedStorageItem(
    THEME_STORAGE_KEY,
    serializeThemeState(themeState)
  );
}

export function SettingsPage({
  onBack,
  onThemeStateChange,
  onUiDensityChange,
}: {
  readonly onBack: () => void;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onUiDensityChange: (
    density: SettingsAppearanceValues['uiDensity']
  ) => void;
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_GENERAL_VALUES);
  const [appearance, setAppearance] = useState(
    DEFAULT_SETTINGS_APPEARANCE_VALUES
  );
  const [models, setModels] = useState(
    DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES
  );
  const [providers, setProviders] = useState(
    DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES
  );
  const [providerPicker, setProviderPicker] = useState(
    DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES
  );
  const [modelOptions, setModelOptions] = useState<
    readonly SettingsGitWritingModelOption[]
  >([]);
  const [themeState, setThemeState] = useState(DEFAULT_THEME_STATE);
  const [hydrationState, setHydrationState] = useState<
    'loading' | 'ready' | 'error'
  >('loading');
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [persistenceState, setPersistenceState] =
    useState<SettingsPersistenceState>({ kind: 'loaded' });
  const saveOperationIdRef = useRef(0);
  const retrySaveRef = useRef<
    (() => Promise<SettingsPersistOutcome | void>) | null
  >(null);
  const [section, setSection] = useState<SettingsSectionId>('general');
  const ready = hydrationState === 'ready';

  useEffect(() => {
    'background only';
    let active = true;
    setHydrationState('loading');
    void readSettings(loadAttempt > 0)
      .then((value) => {
        if (!active) return;
        setSettings(value.general);
        setAppearance(value.appearance);
        setModels(value.models);
        setProviders(value.providers);
        setProviderPicker(value.providerPicker);
        setModelOptions(value.modelOptions);
        setThemeState(value.themeState);
        onThemeStateChange(value.themeState);
        onUiDensityChange(value.appearance.uiDensity);
        setPersistenceState({ kind: 'loaded' });
        setHydrationState('ready');
      })
      .catch(() => {
        if (!active) return;
        setHydrationState('error');
      });
    return () => {
      active = false;
    };
  }, [loadAttempt, onThemeStateChange, onUiDensityChange]);

  function runSave(
    operation: () => Promise<SettingsPersistOutcome | void>
  ) {
    'background only';
    retrySaveRef.current = operation;
    const operationId = saveOperationIdRef.current + 1;
    saveOperationIdRef.current = operationId;
    setPersistenceState({ kind: 'saving' });
    void operation()
      .then((outcome) => {
        if (
          !shouldApplySettingsSaveResult(
            saveOperationIdRef.current,
            operationId
          )
        ) {
          return;
        }
        if (outcome?.kind === 'partial') {
          setPersistenceState({ kind: 'error', message: outcome.message });
        } else {
          retrySaveRef.current = null;
          setPersistenceState({ kind: 'saved' });
        }
      })
      .catch(() => {
        if (
          shouldApplySettingsSaveResult(
            saveOperationIdRef.current,
            operationId
          )
        ) {
          setPersistenceState({
            kind: 'error',
            message: SETTINGS_LOCAL_SAVE_ERROR,
          });
        }
      });
  }

  function retryLastSave() {
    'background only';
    const operation = retrySaveRef.current;
    if (operation) runSave(operation);
  }

  function update<Key extends SettingsGeneralKey>(
    key: Key,
    value: SettingsGeneralValues[Key]
  ) {
    'background only';
    if (!ready) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    runSave(() => persistSettings(next, key === 'defaultThreadEnvMode'));
  }

  function restoreDefaults() {
    'background only';
    if (section === 'general') {
      setSettings(DEFAULT_SETTINGS_GENERAL_VALUES);
      runSave(() => persistSettings(DEFAULT_SETTINGS_GENERAL_VALUES, true));
      return;
    }
    if (section === 'appearance') {
      setAppearance(DEFAULT_SETTINGS_APPEARANCE_VALUES);
      setThemeState(DEFAULT_THEME_STATE);
      onThemeStateChange(DEFAULT_THEME_STATE);
      onUiDensityChange(DEFAULT_SETTINGS_APPEARANCE_VALUES.uiDensity);
      runSave(() =>
        persistAppearanceSettings(
          DEFAULT_SETTINGS_APPEARANCE_VALUES,
          DEFAULT_THEME_STATE
        )
      );
      return;
    }
    if (section === 'models') {
      setModels(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES);
      runSave(() =>
        persistGitWritingModel(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES)
      );
      return;
    }
    setProviders(DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES);
    setProviderPicker(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES);
    runSave(async () => {
      const [serverOutcome] = await Promise.all([
        persistProviderUpdateChecks(
          DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES
        ),
        persistProviderPicker(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES),
      ]);
      return serverOutcome;
    });
  }

  function updateModels(next: SettingsGitWritingModelValues) {
    'background only';
    if (!ready) return;
    setModels(next);
    runSave(() => persistGitWritingModel(next));
  }

  function updateProviders(next: SettingsProviderUpdateChecksValues) {
    'background only';
    if (!ready) return;
    setProviders(next);
    runSave(() => persistProviderUpdateChecks(next));
  }

  function updateProviderPicker(next: SettingsProviderPickerValues) {
    'background only';
    if (!ready) return;
    setProviderPicker(next);
    runSave(() => persistProviderPicker(next));
  }

  function updateAppearance<Key extends SettingsAppearanceKey>(
    key: Key,
    value: SettingsAppearanceValues[Key]
  ) {
    'background only';
    if (!ready) return;
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    let nextThemeState = themeState;
    if (key === 'uiDensity') {
      onUiDensityChange(next.uiDensity);
    }
    if (key === 'themeMode') {
      nextThemeState = {
        ...themeState,
        mode: value as ThemeState['mode'],
      };
    } else if (key === 'systemUiFont') {
      nextThemeState = {
        ...themeState,
        systemUiFont: Boolean(value),
      };
    }
    if (nextThemeState !== themeState) {
      setThemeState(nextThemeState);
      onThemeStateChange(nextThemeState);
    }
    runSave(() => persistAppearanceSettings(next, nextThemeState));
  }

  function updateThemeState(next: ThemeState) {
    'background only';
    if (!ready) return;
    setThemeState(next);
    onThemeStateChange(next);
    setAppearance({
      ...appearance,
      themeMode: next.mode,
      systemUiFont: next.systemUiFont,
    });
    runSave(() => persistThemeState(next));
  }

  const resolvedTheme = resolveSliceThemeVariant(themeState);
  const persistencePresentation =
    resolveSettingsPersistencePresentation(persistenceState);

  return (
    <view className={`SettingsPage SettingsPage--theme-${resolvedTheme}`}>
      <view className="SettingsSidebar">
        <SettingsSidebarChromeComposition
          onBack={onBack}
          searchCapability="unavailable"
        />
        <SettingsNavigationComposition
          activeSection={section}
          availableSections={['general', 'appearance', 'models', 'providers']}
          onSelectSection={setSection}
        />
      </view>

      <scroll-view className="SettingsContent" scroll-orientation="vertical">
        <view className="SettingsContentInner">
          <SettingsPanelHeaderComposition
            section={section}
            restoreDisabled={
              !ready ||
              (section === 'general'
                ? settingsGeneralValuesEqual(
                    settings,
                    DEFAULT_SETTINGS_GENERAL_VALUES
                  )
                : section === 'appearance'
                  ? settingsAppearanceValuesEqual(
                      appearance,
                      DEFAULT_SETTINGS_APPEARANCE_VALUES
                    )
                  : section === 'models'
                    ? settingsGitWritingModelValuesEqual(
                        models,
                        DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES
                      )
                    : settingsProviderUpdateChecksValuesEqual(
                          providers,
                          DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES
                        ) &&
                        settingsProviderPickerValuesEqual(
                          providerPicker,
                          DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES
                        ))
            }
            onRestore={restoreDefaults}
          />

          {ready ? (
            <>
              {section === 'general' ? (
                <SettingsGeneralComposition
                  values={settings}
                  defaults={DEFAULT_SETTINGS_GENERAL_VALUES}
                  onChange={update}
                />
              ) : section === 'appearance' ? (
                <SettingsAppearanceComposition
                  values={appearance}
                  defaults={DEFAULT_SETTINGS_APPEARANCE_VALUES}
                  resolvedTheme={resolvedTheme}
                  showFontSmoothing
                  themeState={themeState}
                  onThemeStateChange={updateThemeState}
                  onChange={updateAppearance}
                />
              ) : section === 'models' ? (
                <SettingsGitWritingModelComposition
                  values={models}
                  defaults={DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES}
                  options={modelOptions}
                  onChange={updateModels}
                />
              ) : (
                <>
                  <SettingsProviderUpdateChecksComposition
                    values={providers}
                    defaults={DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES}
                    onChange={updateProviders}
                  />
                  <SettingsProviderPickerComposition
                    values={providerPicker}
                    defaults={DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES}
                    onChange={updateProviderPicker}
                  />
                </>
              )}
              <PanelStateMessage
                density="compact"
                className="SettingsSavedState"
                intent={persistencePresentation.intent}
                announcement={persistencePresentation.announcement}
              >
                {persistencePresentation.message}
              </PanelStateMessage>
              {persistenceState.kind === 'error' ? (
                <Button
                  variant="outline"
                  aria-label="Retry saving preferences"
                  onClick={retryLastSave}
                >
                  Retry
                </Button>
              ) : null}
            </>
          ) : (
            <view className="SettingsHydrationState">
              <PanelStateMessage
                fill="flex"
                intent={hydrationState === 'loading' ? 'status' : 'alert'}
                announcement={
                  hydrationState === 'loading'
                    ? 'Loading preferences'
                    : 'Preferences could not be loaded'
                }
              >
                {hydrationState === 'loading'
                  ? 'Loading preferences…'
                  : 'Preferences could not be loaded. Retry to use your saved settings.'}
              </PanelStateMessage>
              {hydrationState === 'error' ? (
                <Button
                  variant="outline"
                  aria-label="Retry loading preferences"
                  onClick={() => setLoadAttempt((current) => current + 1)}
                >
                  Retry
                </Button>
              ) : null}
            </view>
          )}
        </view>
      </scroll-view>
    </view>
  );
}
