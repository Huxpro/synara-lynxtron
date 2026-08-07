import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from '@lynx-js/react';

import { SettingsNavigationComposition } from '@synara-web/components/SettingsNavigationComposition';
import { SettingsSidebarChromeComposition } from '@synara-web/components/settings/SettingsSidebarChromeComposition';
import { AppShellFrame } from '@synara-web/components/AppShellFrame';
import { SettingsAppearanceComposition } from '@synara-web/components/settings/SettingsAppearanceComposition';
import {
  settingsAppearanceValuesEqual,
  type SettingsAppearanceKey,
  type SettingsAppearanceValues,
} from '@synara-web/components/settings/SettingsAppearanceComposition.logic';
import {
  SettingsBehaviorPanel,
  type BehaviorSettingKey,
} from '@synara-web/components/settings/SettingsBehaviorPanel';
import { KeyboardShortcutsSettingsComposition } from '@synara-web/components/settings/KeyboardShortcutsSettingsComposition';
import {
  SettingsNotificationsPanel,
  type NotificationSettingKey,
} from '@synara-web/components/settings/SettingsNotificationsPanel';
import {
  DEFAULT_NOTIFICATION_SETTINGS_VALUES,
  notificationSettingsValuesEqual,
  type NotificationSettingsValues,
} from '@synara-web/components/settings/SettingsNotificationsPanel.logic';
import {
  DEFAULT_BEHAVIOR_SETTINGS_VALUES,
  behaviorSettingsValuesEqual,
  type BehaviorSettingsValues,
} from '@synara-web/components/settings/SettingsBehaviorPanel.logic';
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
  readSettingsBehaviorProjection,
  readSettingsGeneralProjection,
  readSettingsNotificationsProjection,
  readSettingsProviderPickerProjection,
  writeSettingsAppearanceProjection,
  writeSettingsBehaviorProjection,
  writeSettingsGeneralProjection,
  writeSettingsNotificationsProjection,
  writeSettingsProviderPickerProjection,
} from '@synara-web/appSettingsStorageProjection.logic';
import type { SettingsSectionId } from '@synara-web/settingsNavigation';
import type { SettingsSearchEntry } from '@synara-web/settingsSearchIndex';
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
import { SettingsGeneralBooleanControlElement } from '../adapters/SettingsGeneralCompositionElements.lynx';
import { SettingsResetIcon } from '../adapters/SettingsResetIcon.lynx';
import type {
  ResolvedKeybindingsConfig,
  ServerSettingsView,
} from '@synara/contracts';
import { SettingsUsagePanel } from './SettingsUsagePanel';
import { SettingsProfilePanel } from './SettingsProfilePanel.lynx';
import { SettingsProviderToolsPanel } from './SettingsProviderToolsPanel.lynx';
import { SettingsArchivedPanel } from './SettingsArchivedPanel.lynx';
import { SettingsCustomModelsPanel } from './SettingsCustomModelsPanel.lynx';
import { SettingsWorktreesPanel } from './SettingsWorktreesPanel.lynx';
import { SettingsSkillsPanel } from './SettingsSkillsPanel.lynx';
import { SettingsAdvancedPanel } from './SettingsAdvancedPanel.lynx';
import { SettingsIntegrationsPanel } from './SettingsIntegrationsPanel.lynx';
import { SettingsAppSnapPanel } from './SettingsAppSnapPanel.lynx';
import { SettingsSearchResults } from './SettingsSearchResults.lynx';
import { SidebarDisclosure } from './SidebarDisclosure.lynx';
import { rankLynxSettingsSearchEntries } from './settingsSearch.logic';
import { settingsSearchEntryTarget } from '@synara-web/settingsSearchIndex';
import { scrollLynxElementIntoViewById } from '../components/ui/scrollIntoView.lynx';

const SETTINGS_LOCAL_SAVE_ERROR =
  'Changes could not be saved. Your current values are still shown.';
const SETTINGS_SERVER_SAVE_ERROR =
  'Changes were saved locally, but the default thread environment could not be updated on the server.';
const SETTINGS_MODEL_SAVE_ERROR =
  'The Git writing model could not be updated. Your selected value is still shown.';
const SETTINGS_PROVIDER_SAVE_ERROR =
  'The provider update-check preference could not be updated. Your selected value is still shown.';
const SETTINGS_BEHAVIOR_SAVE_ERROR =
  'Changes were saved locally, but assistant streaming could not be updated on the server.';
const EMPTY_KEYBINDINGS: ResolvedKeybindingsConfig = [];

function renderSettingsResetAction(args: {
  readonly changed: boolean;
  readonly label: string;
  readonly onReset: () => void;
}) {
  return args.changed ? (
    <Button
      variant="ghost"
      size="icon-xs"
      aria-label={`Reset ${args.label} to default`}
      onClick={args.onReset}
    >
      <SettingsResetIcon />
    </Button>
  ) : null;
}

async function readSettings(retry: boolean): Promise<{
  readonly general: SettingsGeneralValues;
  readonly appearance: SettingsAppearanceValues;
  readonly behavior: BehaviorSettingsValues;
  readonly notifications: NotificationSettingsValues;
  readonly models: SettingsGitWritingModelValues;
  readonly providers: SettingsProviderUpdateChecksValues;
  readonly providerPicker: SettingsProviderPickerValues;
  readonly modelOptions: readonly SettingsGitWritingModelOption[];
  readonly keybindings: ResolvedKeybindingsConfig;
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
    { fetchServerConfig, fetchServerSettings },
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
  const serverConfig = await fetchServerConfig().catch(() => null);
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
    behavior: readSettingsBehaviorProjection(
      appSettingsRaw,
      serverSettings?.enableAssistantStreaming
    ),
    notifications: readSettingsNotificationsProjection(appSettingsRaw),
    models: readSettingsGitWritingModelValues(serverSettings),
    providers: readSettingsProviderUpdateChecksValues(serverSettings),
    providerPicker: readSettingsProviderPickerProjection(appSettingsRaw),
    modelOptions: buildSettingsGitWritingModelOptions({
      settings: serverSettings,
      selected: readSettingsGitWritingModelValues(serverSettings),
    }),
    keybindings: serverConfig?.keybindings ?? EMPTY_KEYBINDINGS,
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

async function persistBehaviorSettings(
  values: BehaviorSettingsValues,
  updateServerStreaming: boolean
): Promise<SettingsPersistOutcome> {
  'background only';
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsBehaviorProjection(
      webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
      values
    )
  );
  if (updateServerStreaming) {
    const { updateServerSettings } = await import(
      /* webpackMode: "eager" */ '../data/synaraClient'
    );
    try {
      await updateServerSettings({
        enableAssistantStreaming: values.enableAssistantStreaming,
      });
    } catch {
      return { kind: 'partial', message: SETTINGS_BEHAVIOR_SAVE_ERROR };
    }
  }
  return { kind: 'saved' };
}

async function persistNotificationSettings(
  values: NotificationSettingsValues
): Promise<void> {
  'background only';
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ '../platform/storage'
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsNotificationsProjection(
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
  initialSection = 'general',
  onBack,
  sidebarOpen,
  openTitlebarControls,
  closedTitlebarControls,
  onThemeStateChange,
  onUiDensityChange,
}: {
  readonly initialSection?: SettingsSectionId;
  readonly onBack: () => void;
  readonly sidebarOpen: boolean;
  readonly openTitlebarControls: ReactNode;
  readonly closedTitlebarControls: ReactNode;
  readonly onThemeStateChange: (state: ThemeState) => void;
  readonly onUiDensityChange: (
    density: SettingsAppearanceValues['uiDensity']
  ) => void;
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_GENERAL_VALUES);
  const [appearance, setAppearance] = useState(
    DEFAULT_SETTINGS_APPEARANCE_VALUES
  );
  const [behavior, setBehavior] = useState(
    DEFAULT_BEHAVIOR_SETTINGS_VALUES
  );
  const [notifications, setNotifications] = useState(
    DEFAULT_NOTIFICATION_SETTINGS_VALUES
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
  const [keybindings, setKeybindings] =
    useState<ResolvedKeybindingsConfig>(EMPTY_KEYBINDINGS);
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
  const [section, setSection] = useState<SettingsSectionId>(initialSection);
  const [searchQuery, setSearchQuery] = useState('');
  const [pendingSearchTarget, setPendingSearchTarget] = useState<string | null>(
    null
  );
  const ready = hydrationState === 'ready';
  const searchResults = rankLynxSettingsSearchEntries(searchQuery);

  function selectSearchResult(entry: SettingsSearchEntry) {
    setSection(entry.section);
    setPendingSearchTarget(settingsSearchEntryTarget(entry));
    setSearchQuery('');
  }
  useEffect(() => {
    if (!pendingSearchTarget || !ready) return;
    scrollLynxElementIntoViewById(pendingSearchTarget);
    setPendingSearchTarget(null);
  }, [pendingSearchTarget, ready, section]);

  useEffect(() => {
    'background only';
    let active = true;
    setHydrationState('loading');
    void readSettings(loadAttempt > 0)
      .then((value) => {
        if (!active) return;
        setSettings(value.general);
        setAppearance(value.appearance);
        setBehavior(value.behavior);
        setNotifications(value.notifications);
        setModels(value.models);
        setProviders(value.providers);
        setProviderPicker(value.providerPicker);
        setModelOptions(value.modelOptions);
        setKeybindings(value.keybindings);
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
    if (section === 'behavior') {
      setBehavior(DEFAULT_BEHAVIOR_SETTINGS_VALUES);
      runSave(() =>
        persistBehaviorSettings(DEFAULT_BEHAVIOR_SETTINGS_VALUES, true)
      );
      return;
    }
    if (section === 'notifications') {
      setNotifications(DEFAULT_NOTIFICATION_SETTINGS_VALUES);
      runSave(() =>
        persistNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS_VALUES)
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

  function applyModelSettings(next: ServerSettingsView) {
    const selected = readSettingsGitWritingModelValues(next);
    setModels(selected);
    setModelOptions(
      buildSettingsGitWritingModelOptions({
        settings: next,
        selected,
      })
    );
  }

  function updateBehavior(
    key: BehaviorSettingKey,
    value: boolean
  ) {
    'background only';
    if (!ready) return;
    const next = { ...behavior, [key]: value };
    setBehavior(next);
    runSave(() =>
      persistBehaviorSettings(next, key === 'enableAssistantStreaming')
    );
  }

  function updateNotifications(
    key: NotificationSettingKey,
    value: boolean
  ) {
    'background only';
    if (!ready) return;
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    runSave(() => persistNotificationSettings(next));
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

  const settingsSidebar = (
    <SidebarDisclosure open={sidebarOpen}>
      <view className="SettingsSidebar">
        <view className="SettingsSidebarTitlebar AppWindowDragRegion">
          {openTitlebarControls}
        </view>
        <scroll-view
          className="SettingsSidebarBody"
          scroll-orientation="vertical"
        >
          <view className="SettingsSidebarBodyInner">
          <SettingsSidebarChromeComposition
            onBack={onBack}
            searchCapability="available"
            searchValue={searchQuery}
            onSearchValueChange={setSearchQuery}
            onSubmitSearch={() => {
              const topMatch = searchResults[0];
              if (topMatch) selectSearchResult(topMatch);
            }}
            onEscapeSearch={() => setSearchQuery('')}
          />
          {searchQuery.trim() ? (
            <SettingsSearchResults
              results={searchResults}
              onSelect={selectSearchResult}
            />
          ) : (
            <SettingsNavigationComposition
              activeSection={section}
              availableSections={[
                'general',
                'profile',
                'appearance',
                'notifications',
                'behavior',
                'appsnap',
                'shortcuts',
                'worktrees',
                'archived',
                'models',
                'providers',
                'skills',
                'usage',
                'integrations',
                'advanced',
              ]}
              onSelectSection={setSection}
            />
          )}
          </view>
        </scroll-view>
      </view>
    </SidebarDisclosure>
  );

  return (
    <AppShellFrame sidebar={settingsSidebar}>
      <view
        className={`SettingsPage SettingsPage--theme-${resolvedTheme}${
          sidebarOpen ? '' : ' SettingsPage--sidebar-closed'
        }`}
      >
        {sidebarOpen ? null : closedTitlebarControls}
        <scroll-view className="SettingsContent" scroll-orientation="vertical">
        <view
          className={`SettingsContentInner${
            section === 'profile' ? ' SettingsContentInner--profile' : ''
          }`}
        >
          {section !== 'profile' ? (
            <SettingsPanelHeaderComposition
              section={section}
              restoreDisabled={
                !ready ||
                (section === 'shortcuts' ||
                  section === 'usage' ||
                  section === 'appsnap' ||
                  section === 'worktrees' ||
                  section === 'skills' ||
                  section === 'integrations' ||
                  section === 'advanced' ||
                  section === 'archived') ||
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
                    : section === 'behavior'
                      ? behaviorSettingsValuesEqual(
                          behavior,
                          DEFAULT_BEHAVIOR_SETTINGS_VALUES
                        )
                      : section === 'notifications'
                        ? notificationSettingsValuesEqual(
                            notifications,
                            DEFAULT_NOTIFICATION_SETTINGS_VALUES
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
          ) : null}

          {ready ? (
            <>
              {section === 'general' ? (
                <SettingsGeneralComposition
                  values={settings}
                  defaults={DEFAULT_SETTINGS_GENERAL_VALUES}
                  onChange={update}
                />
              ) : section === 'profile' ? (
                <SettingsProfilePanel />
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
              ) : section === 'behavior' ? (
                <SettingsBehaviorPanel
                  settings={behavior}
                  defaults={DEFAULT_BEHAVIOR_SETTINGS_VALUES}
                  updateSetting={updateBehavior}
                  renderControl={({
                    checked,
                    ariaLabel,
                    onCheckedChange,
                  }) => (
                    <SettingsGeneralBooleanControlElement
                      checked={checked}
                      ariaLabel={ariaLabel}
                      onChange={onCheckedChange}
                    />
                  )}
                  renderResetAction={renderSettingsResetAction}
                />
              ) : section === 'appsnap' ? (
                <SettingsAppSnapPanel />
              ) : section === 'notifications' ? (
                <SettingsNotificationsPanel
                  settings={notifications}
                  defaults={DEFAULT_NOTIFICATION_SETTINGS_VALUES}
                  activityStatus="In-app activity toasts are unavailable in this runtime."
                  desktopStatus="System notifications are unavailable in this runtime."
                  updateSetting={updateNotifications}
                  renderControl={({
                    checked,
                    ariaLabel,
                    onCheckedChange,
                  }) => (
                    <SettingsGeneralBooleanControlElement
                      checked={checked}
                      disabled
                      ariaLabel={ariaLabel}
                      onChange={onCheckedChange}
                    />
                  )}
                  renderResetAction={renderSettingsResetAction}
                />
              ) : section === 'shortcuts' ? (
                <KeyboardShortcutsSettingsComposition
                  keybindings={keybindings}
                />
              ) : section === 'usage' ? (
                <SettingsUsagePanel />
              ) : section === 'worktrees' ? (
                <SettingsWorktreesPanel />
              ) : section === 'skills' ? (
                <SettingsSkillsPanel />
              ) : section === 'advanced' ? (
                <SettingsAdvancedPanel />
              ) : section === 'integrations' ? (
                <SettingsIntegrationsPanel />
              ) : section === 'archived' ? (
                <SettingsArchivedPanel />
              ) : section === 'models' ? (
                <view className="SettingsModelsStack">
                  <SettingsGitWritingModelComposition
                    values={models}
                    defaults={DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES}
                    options={modelOptions}
                    onChange={updateModels}
                  />
                  <SettingsCustomModelsPanel
                    onSettingsChange={applyModelSettings}
                  />
                </view>
              ) : section === 'providers' ? (
                <>
                  <SettingsProviderToolsPanel
                    hiddenProviders={providerPicker.hiddenProviders}
                    enableProviderUpdateChecks={
                      providers.enableProviderUpdateChecks
                    }
                    defaultEnableProviderUpdateChecks={
                      DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES.enableProviderUpdateChecks
                    }
                    onEnableProviderUpdateChecksChange={(
                      enableProviderUpdateChecks
                    ) =>
                      updateProviders({ enableProviderUpdateChecks })
                    }
                    providerPicker={
                      <SettingsProviderPickerComposition
                        values={providerPicker}
                        defaults={DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES}
                        onChange={updateProviderPicker}
                      />
                    }
                  />
                </>
              ) : null}
              {section !== 'profile' &&
              section !== 'appsnap' &&
              section !== 'worktrees' &&
              section !== 'skills' &&
              section !== 'advanced' &&
              section !== 'integrations' &&
              section !== 'archived' ? (
                <PanelStateMessage
                  density="compact"
                  className="SettingsSavedState"
                  intent={persistencePresentation.intent}
                  announcement={persistencePresentation.announcement}
                >
                  {persistencePresentation.message}
                </PanelStateMessage>
              ) : null}
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
    </AppShellFrame>
  );
}
