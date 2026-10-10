import { runOnMainThread, useEffect, useRef, useState, type ReactNode } from "@lynx-js/react";

import { SettingsNavigationComposition } from "@synara-web/components/SettingsNavigationComposition";
import { SettingsSidebarChromeComposition } from "@synara-web/components/settings/SettingsSidebarChromeComposition";
import { AppShellFrame } from "@synara-web/components/AppShellFrame";
import {
  settingsAppearanceValuesEqual,
  type SettingsAppearanceKey,
  type SettingsAppearanceValues,
} from "@synara-web/components/settings/SettingsAppearanceComposition.logic";
import {
  SettingsBehaviorPanel,
  type BehaviorSettingKey,
} from "@synara-web/components/settings/SettingsBehaviorPanel";
import { KeyboardShortcutsSettingsComposition } from "@synara-web/components/settings/KeyboardShortcutsSettingsComposition";
import {
  SettingsNotificationsPanel,
  type NotificationSettingKey,
} from "@synara-web/components/settings/SettingsNotificationsPanel";
import {
  DEFAULT_NOTIFICATION_SETTINGS_VALUES,
  notificationSettingsValuesEqual,
  type NotificationSettingsValues,
} from "@synara-web/components/settings/SettingsNotificationsPanel.logic";
import {
  DEFAULT_BEHAVIOR_SETTINGS_VALUES,
  behaviorSettingsValuesEqual,
  type BehaviorSettingsValues,
} from "@synara-web/components/settings/SettingsBehaviorPanel.logic";
import {
  settingsGeneralValuesEqual,
  type SettingsGeneralKey,
  type SettingsGeneralValues,
} from "@synara-web/components/settings/SettingsGeneralComposition.logic";
import { SettingsGitWritingModelComposition } from "@synara-web/components/settings/SettingsGitWritingModelComposition";
import {
  DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES,
  buildSettingsGitWritingModelOptions,
  readSettingsGitWritingModelValues,
  settingsGitWritingModelValuesEqual,
  type SettingsGitWritingModelOption,
  type SettingsGitWritingModelValues,
} from "@synara-web/components/settings/SettingsGitWritingModelComposition.logic";
import {
  DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
  readSettingsProviderUpdateChecksValues,
  settingsProviderUpdateChecksValuesEqual,
  type SettingsProviderUpdateChecksValues,
} from "@synara-web/components/settings/SettingsProviderUpdateChecksComposition.logic";
import { SettingsProviderPickerComposition } from "@synara-web/components/settings/SettingsProviderPickerComposition";
import {
  DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
  settingsProviderPickerValuesEqual,
  type SettingsProviderPickerValues,
} from "@synara-web/components/settings/SettingsProviderPickerComposition.logic";
import { SettingsPanelHeaderComposition } from "@synara-web/components/settings/SettingsPanelHeaderComposition";
import { PanelStateMessage } from "@synara-web/components/chat/PanelStateMessage";
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
} from "@synara-web/appSettingsStorageProjection.logic";
import type { SettingsSectionId } from "@synara-web/settingsNavigation";
import type { SettingsSearchEntry } from "@synara-web/settingsSearchIndex";
import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  serializeThemeState,
  type ThemeState,
} from "@synara-web/theme/theme.logic";
import {
  resolveSettingsPersistencePresentation,
  shouldApplySettingsSaveResult,
  type SettingsPersistenceState,
  type SettingsPersistOutcome,
} from "./settingsPersistence.logic";
import { Button } from "../components/ui/button";
import { IconButton } from "../components/ui/icon-button.lynx";
import { SettingsGeneralBooleanControlElement } from "../adapters/SettingsGeneralCompositionElements.lynx";
import { SettingsResetIcon } from "../adapters/SettingsResetIcon.lynx";
import type {
  ResolvedKeybindingsConfig,
  ServerSettingsPatch,
  ServerSettingsView,
} from "@synara/contracts";
import { SettingsUsagePanel } from "./SettingsUsagePanel";
import { SettingsAppearancePanel } from "./SettingsAppearancePanel.lynx";
import { SettingsProfilePanel } from "./SettingsProfilePanel.lynx";
import { SettingsProviderToolsPanel } from "./SettingsProviderToolsPanel.lynx";
import { SettingsArchivedPanel } from "./SettingsArchivedPanel.lynx";
import { SettingsCustomModelsPanel } from "./SettingsCustomModelsPanel.lynx";
import { SettingsWorktreesPanel } from "./SettingsWorktreesPanel.lynx";
import { SettingsSkillsPanel } from "./SettingsSkillsPanel.lynx";
import { SettingsAdvancedPanel } from "./SettingsAdvancedPanel.lynx";
import { SettingsIntegrationsPanel } from "./SettingsIntegrationsPanel.lynx";
import { SettingsAppSnapPanel } from "./SettingsAppSnapPanel.lynx";
import { sleepOnHost } from "../platform/timer";
import { SettingsSearchResults } from "./SettingsSearchResults.lynx";
import { AppRailShell } from "../components/sidebar/AppRail.lynx";
import { SettingsGeneralPanel } from "./SettingsGeneralPanel.lynx";
import {
  DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE,
  writeArchiveDeletesOrphanedWorktree,
} from "./archiveWorktreeSetting.logic";
import { SidebarDisclosure } from "./SidebarDisclosure.lynx";
import { rankLynxSettingsSearchEntries } from "./settingsSearch.logic";
import { settingsSearchEntryTarget } from "@synara-web/settingsSearchIndex";

const SETTINGS_LOCAL_SAVE_ERROR =
  "Changes could not be saved. Your current values are still shown.";
const SETTINGS_SERVER_SAVE_ERROR =
  "Changes were saved locally, but the default thread environment could not be updated on the server.";
const SETTINGS_MODEL_SAVE_ERROR =
  "The Git writing model could not be updated. Your selected value is still shown.";
const SETTINGS_PROVIDER_SAVE_ERROR =
  "The provider update-check preference could not be updated. Your selected value is still shown.";
const SETTINGS_BEHAVIOR_SAVE_ERROR =
  "Changes were saved locally, but assistant streaming could not be updated on the server.";
const EMPTY_KEYBINDINGS: ResolvedKeybindingsConfig = [];

function renderSettingsResetAction(args: {
  readonly changed: boolean;
  readonly label: string;
  readonly onReset: () => void;
}) {
  return args.changed ? (
    <IconButton label={`Reset ${args.label} to default`} onClick={args.onReset}>
      <SettingsResetIcon />
    </IconButton>
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
  "background only";
  const [
    { getStorageHydrationError, hydrateStorage, retryHydrateStorage, webStorage },
    { readServerConfig, readServerSettings },
    { queryClient },
  ] = await Promise.all([
    import(/* webpackMode: "eager" */ "../platform/storage"),
    import(/* webpackMode: "eager" */ "./settingsServerData.lynx"),
    import(/* webpackMode: "eager" */ "./queries"),
  ]);
  if (retry) {
    await retryHydrateStorage();
  } else {
    await hydrateStorage();
  }
  const hydrationError = getStorageHydrationError();
  if (hydrationError) throw hydrationError;
  const serverSettings = await readServerSettings(queryClient).catch(() => null);
  const serverConfig = await readServerConfig(queryClient).catch(() => null);
  const appSettingsRaw = webStorage.getItem(APP_SETTINGS_STORAGE_KEY);
  const themeRaw = webStorage.getItem(THEME_STORAGE_KEY);
  return {
    ...readServerBackedSettings(appSettingsRaw, serverSettings),
    appearance: readSettingsAppearanceProjection(appSettingsRaw, themeRaw),
    notifications: readSettingsNotificationsProjection(appSettingsRaw),
    providerPicker: readSettingsProviderPickerProjection(appSettingsRaw),
    keybindings: serverConfig?.keybindings ?? EMPTY_KEYBINDINGS,
    themeState: parseStoredThemeState(themeRaw),
  };
}

/** The Settings values that come from server settings (the rest are stored locally). */
function readServerBackedSettings(
  appSettingsRaw: string | null,
  serverSettings: ServerSettingsView | null,
) {
  return {
    general: readSettingsGeneralProjection(appSettingsRaw, serverSettings?.defaultThreadEnvMode),
    behavior: readSettingsBehaviorProjection(
      appSettingsRaw,
      serverSettings?.enableAssistantStreaming,
    ),
    models: readSettingsGitWritingModelValues(serverSettings),
    providers: readSettingsProviderUpdateChecksValues(serverSettings),
    modelOptions: buildSettingsGitWritingModelOptions({
      settings: serverSettings,
      selected: readSettingsGitWritingModelValues(serverSettings),
    }),
  };
}

/** Server-settings write through the upstream facade and settings query. */
async function saveServerSettings(patch: ServerSettingsPatch): Promise<void> {
  "background only";
  const [{ writeServerSettings }, { queryClient }] = await Promise.all([
    import(/* webpackMode: "eager" */ "./settingsServerData.lynx"),
    import(/* webpackMode: "eager" */ "./queries"),
  ]);
  await writeServerSettings(queryClient, patch);
}

async function persistProviderUpdateChecks(
  values: SettingsProviderUpdateChecksValues,
): Promise<SettingsPersistOutcome> {
  "background only";
  try {
    await saveServerSettings(values);
    return { kind: "saved" };
  } catch {
    return { kind: "partial", message: SETTINGS_PROVIDER_SAVE_ERROR };
  }
}

async function persistProviderPicker(values: SettingsProviderPickerValues): Promise<void> {
  "background only";
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsProviderPickerProjection(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), values),
  );
}

async function persistBehaviorSettings(
  values: BehaviorSettingsValues,
  updateServerStreaming: boolean,
): Promise<SettingsPersistOutcome> {
  "background only";
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsBehaviorProjection(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), values),
  );
  if (updateServerStreaming) {
    try {
      await saveServerSettings({
        enableAssistantStreaming: values.enableAssistantStreaming,
      });
    } catch {
      return { kind: "partial", message: SETTINGS_BEHAVIOR_SAVE_ERROR };
    }
  }
  return { kind: "saved" };
}

async function persistNotificationSettings(values: NotificationSettingsValues): Promise<void> {
  "background only";
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsNotificationsProjection(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), values),
  );
}

async function persistGitWritingModel(
  values: SettingsGitWritingModelValues,
): Promise<SettingsPersistOutcome> {
  "background only";
  try {
    await saveServerSettings({
      textGenerationModelSelection: values,
    });
    return { kind: "saved" };
  } catch {
    return { kind: "partial", message: SETTINGS_MODEL_SAVE_ERROR };
  }
}

async function persistSettings(
  settings: SettingsGeneralValues,
  updateServerThreadMode: boolean,
): Promise<SettingsPersistOutcome> {
  "background only";
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await setPersistedStorageItem(
    APP_SETTINGS_STORAGE_KEY,
    writeSettingsGeneralProjection(webStorage.getItem(APP_SETTINGS_STORAGE_KEY), settings),
  );
  if (updateServerThreadMode) {
    try {
      await saveServerSettings({
        defaultThreadEnvMode: settings.defaultThreadEnvMode,
      });
    } catch {
      return { kind: "partial", message: SETTINGS_SERVER_SAVE_ERROR };
    }
  }
  return { kind: "saved" };
}

async function persistAppearanceSettings(
  settings: SettingsAppearanceValues,
  themeStateOverride?: ThemeState,
): Promise<void> {
  "background only";
  const { setPersistedStorageItem, webStorage } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  const next = writeSettingsAppearanceProjection(
    webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
    webStorage.getItem(THEME_STORAGE_KEY),
    settings,
  );
  await setPersistedStorageItem(APP_SETTINGS_STORAGE_KEY, next.appSettingsRaw);
  await setPersistedStorageItem(
    THEME_STORAGE_KEY,
    themeStateOverride ? serializeThemeState(themeStateOverride) : next.themeRaw,
  );
}

async function persistThemeState(themeState: ThemeState): Promise<void> {
  "background only";
  const { setPersistedStorageItem } = await import(
    /* webpackMode: "eager" */ "../platform/storage"
  );
  await setPersistedStorageItem(THEME_STORAGE_KEY, serializeThemeState(themeState));
}

function scrollSettingsTargetOnMainThread(targetId: string): boolean {
  "main thread";
  const target = lynx.querySelector(`#${targetId}`);
  if (!target) return false;
  target.invoke("scrollIntoView", {
    scrollIntoViewOptions: {
      block: "start",
      inline: "start",
    },
  });
  return true;
}

async function scrollSettingsTargetWhenReady(targetId: string): Promise<boolean> {
  let found = false;
  await sleepOnHost(100);
  for (let attempt = 0; attempt < 3; attempt += 1) {
    // runOnMainThread cannot infer the worklet's return type (it resolves to `{}`).
    found = (await runOnMainThread(scrollSettingsTargetOnMainThread)(targetId)) === true || found;
    if (attempt < 2) await sleepOnHost(100);
  }
  return found;
}

export function SettingsPage({
  initialSection = "general",
  initialTarget = null,
  onBack,
  onNavigate,
  sidebarOpen,
  openTitlebarControls,
  resolvedTheme,
  onAppearanceChange,
  onThemeStateChange,
}: {
  readonly initialSection?: SettingsSectionId;
  readonly initialTarget?: string | null;
  readonly onBack: () => void;
  readonly onNavigate: (section: SettingsSectionId, target?: string | null) => void;
  readonly sidebarOpen: boolean;
  readonly openTitlebarControls: ReactNode;
  readonly resolvedTheme: "dark" | "light";
  readonly onAppearanceChange: (appearance: SettingsAppearanceValues) => void;
  readonly onThemeStateChange: (state: ThemeState) => void;
}) {
  const [settings, setSettings] = useState(DEFAULT_SETTINGS_GENERAL_VALUES);
  const [generalResetRevision, setGeneralResetRevision] = useState(0);
  const [appearance, setAppearance] = useState(DEFAULT_SETTINGS_APPEARANCE_VALUES);
  const [behavior, setBehavior] = useState(DEFAULT_BEHAVIOR_SETTINGS_VALUES);
  const [notifications, setNotifications] = useState(DEFAULT_NOTIFICATION_SETTINGS_VALUES);
  const [notificationSupported, setNotificationSupported] = useState<boolean | null>(null);
  const [notificationTestStatus, setNotificationTestStatus] = useState<string | null>(null);
  const [models, setModels] = useState(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES);
  const [providers, setProviders] = useState(DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES);
  const [providerPicker, setProviderPicker] = useState(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES);
  const [modelOptions, setModelOptions] = useState<readonly SettingsGitWritingModelOption[]>([]);
  const [keybindings, setKeybindings] = useState<ResolvedKeybindingsConfig>(EMPTY_KEYBINDINGS);
  const [themeState, setThemeState] = useState(DEFAULT_THEME_STATE);
  const [hydrationState, setHydrationState] = useState<"loading" | "ready" | "error">("loading");
  const [loadAttempt, setLoadAttempt] = useState(0);
  const [persistenceState, setPersistenceState] = useState<SettingsPersistenceState>({
    kind: "loaded",
  });
  const saveOperationIdRef = useRef(0);
  const retrySaveRef = useRef<(() => Promise<SettingsPersistOutcome | void>) | null>(null);
  const [section, setSection] = useState<SettingsSectionId>(initialSection);
  const [searchQuery, setSearchQuery] = useState("");
  const [pendingSearchTarget, setPendingSearchTarget] = useState<string | null>(initialTarget);
  const ready = hydrationState === "ready";
  const searchResults = rankLynxSettingsSearchEntries(searchQuery);

  useEffect(() => {
    setSection(initialSection);
    setPendingSearchTarget(initialTarget);
    setSearchQuery("");
  }, [initialSection, initialTarget]);

  function selectSearchResult(entry: SettingsSearchEntry) {
    const target = settingsSearchEntryTarget(entry);
    onNavigate(entry.section, target);
    setSearchQuery("");
  }
  useEffect(() => {
    if (!pendingSearchTarget || !ready) return;
    let active = true;
    void scrollSettingsTargetWhenReady(pendingSearchTarget).finally(() => {
      if (active) setPendingSearchTarget(null);
    });
    return () => {
      active = false;
    };
  }, [pendingSearchTarget, ready, section]);

  useEffect(() => {
    "background only";
    let active = true;
    setHydrationState("loading");
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
        onAppearanceChange(value.appearance);
        onThemeStateChange(value.themeState);
        setPersistenceState({ kind: "loaded" });
        setHydrationState("ready");
      })
      .catch(() => {
        if (!active) return;
        setHydrationState("error");
      });
    return () => {
      active = false;
    };
  }, [loadAttempt, onAppearanceChange, onThemeStateChange]);

  // Server settings changed elsewhere (another client, another window) show up
  // live, as they do on the web, instead of only on the next page load.
  useEffect(() => {
    "background only";
    if (hydrationState !== "ready") return;
    let active = true;
    let unsubscribe: (() => void) | null = null;
    void Promise.all([
      import(/* webpackMode: "eager" */ "../platform/storage"),
      import(/* webpackMode: "eager" */ "@synara-web/wsNativeApi"),
    ]).then(([{ webStorage }, { onServerSettingsUpdated }]) => {
      if (!active) return;
      // The facade's settings push: the current view first, then every change.
      unsubscribe = onServerSettingsUpdated((payload) => {
        const next = readServerBackedSettings(
          webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
          payload.settings,
        );
        setSettings(next.general);
        setBehavior(next.behavior);
        setModels(next.models);
        setProviders(next.providers);
        setModelOptions(next.modelOptions);
      });
    });
    return () => {
      active = false;
      unsubscribe?.();
    };
  }, [hydrationState]);

  useEffect(() => {
    "background only";
    let active = true;
    void import(/* webpackMode: "eager" */ "../platform/notifications")
      .then(({ isSystemNotificationSupported }) => isSystemNotificationSupported())
      .then((supported) => {
        if (active) setNotificationSupported(supported);
      })
      .catch(() => {
        if (active) setNotificationSupported(false);
      });
    return () => {
      active = false;
    };
  }, []);

  function runSave(operation: () => Promise<SettingsPersistOutcome | void>) {
    "background only";
    retrySaveRef.current = operation;
    const operationId = saveOperationIdRef.current + 1;
    saveOperationIdRef.current = operationId;
    setPersistenceState({ kind: "saving" });
    void operation()
      .then((outcome) => {
        if (!shouldApplySettingsSaveResult(saveOperationIdRef.current, operationId)) {
          return;
        }
        if (outcome?.kind === "partial") {
          setPersistenceState({ kind: "error", message: outcome.message });
        } else {
          retrySaveRef.current = null;
          setPersistenceState({ kind: "saved" });
        }
      })
      .catch(() => {
        if (shouldApplySettingsSaveResult(saveOperationIdRef.current, operationId)) {
          setPersistenceState({
            kind: "error",
            message: SETTINGS_LOCAL_SAVE_ERROR,
          });
        }
      });
  }

  function retryLastSave() {
    "background only";
    const operation = retrySaveRef.current;
    if (operation) runSave(operation);
  }

  function update<Key extends SettingsGeneralKey>(key: Key, value: SettingsGeneralValues[Key]) {
    "background only";
    if (!ready) return;
    const next = { ...settings, [key]: value };
    setSettings(next);
    runSave(() => persistSettings(next, key === "defaultThreadEnvMode"));
  }

  function restoreDefaults() {
    "background only";
    if (section === "general") {
      setSettings(DEFAULT_SETTINGS_GENERAL_VALUES);
      runSave(async () => {
        const outcome = await persistSettings(DEFAULT_SETTINGS_GENERAL_VALUES, true);
        // The General panel stores "Delete worktree on archive" itself; reset it with the rest.
        const { setPersistedStorageItem, webStorage } = await import(
          /* webpackMode: "eager" */ "../platform/storage"
        );
        await setPersistedStorageItem(
          APP_SETTINGS_STORAGE_KEY,
          writeArchiveDeletesOrphanedWorktree(
            webStorage.getItem(APP_SETTINGS_STORAGE_KEY),
            DEFAULT_ARCHIVE_DELETES_ORPHANED_WORKTREE,
          ),
        );
        setGeneralResetRevision((revision) => revision + 1);
        return outcome;
      });
      return;
    }
    if (section === "appearance") {
      setAppearance(DEFAULT_SETTINGS_APPEARANCE_VALUES);
      setThemeState(DEFAULT_THEME_STATE);
      onAppearanceChange(DEFAULT_SETTINGS_APPEARANCE_VALUES);
      onThemeStateChange(DEFAULT_THEME_STATE);
      runSave(() =>
        persistAppearanceSettings(DEFAULT_SETTINGS_APPEARANCE_VALUES, DEFAULT_THEME_STATE),
      );
      return;
    }
    if (section === "behavior") {
      setBehavior(DEFAULT_BEHAVIOR_SETTINGS_VALUES);
      runSave(() => persistBehaviorSettings(DEFAULT_BEHAVIOR_SETTINGS_VALUES, true));
      return;
    }
    if (section === "notifications") {
      setNotifications(DEFAULT_NOTIFICATION_SETTINGS_VALUES);
      runSave(() => persistNotificationSettings(DEFAULT_NOTIFICATION_SETTINGS_VALUES));
      return;
    }
    if (section === "models") {
      setModels(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES);
      runSave(() => persistGitWritingModel(DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES));
      return;
    }
    setProviders(DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES);
    setProviderPicker(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES);
    runSave(async () => {
      const [serverOutcome] = await Promise.all([
        persistProviderUpdateChecks(DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES),
        persistProviderPicker(DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES),
      ]);
      return serverOutcome;
    });
  }

  function updateModels(next: SettingsGitWritingModelValues) {
    "background only";
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
      }),
    );
  }

  function updateBehavior(key: BehaviorSettingKey, value: boolean) {
    "background only";
    if (!ready) return;
    const next = { ...behavior, [key]: value };
    setBehavior(next);
    runSave(() => persistBehaviorSettings(next, key === "enableAssistantStreaming"));
  }

  function updateNotifications(key: NotificationSettingKey, value: boolean) {
    "background only";
    if (!ready) return;
    const next = { ...notifications, [key]: value };
    setNotifications(next);
    runSave(() => persistNotificationSettings(next));
  }

  function sendTestNotification() {
    "background only";
    setNotificationTestStatus(null);
    void import(/* webpackMode: "eager" */ "../platform/notifications")
      .then(({ showSystemNotification }) =>
        showSystemNotification({
          title: "Synara notifications",
          body: "Notification test for chats and terminal agents.",
        }),
      )
      .then((shown) =>
        setNotificationTestStatus(
          shown
            ? "Test notification sent."
            : "System notifications are unavailable in this runtime.",
        ),
      )
      .catch(() =>
        setNotificationTestStatus("System notifications are unavailable in this runtime."),
      );
  }

  function updateProviders(next: SettingsProviderUpdateChecksValues) {
    "background only";
    if (!ready) return;
    setProviders(next);
    runSave(() => persistProviderUpdateChecks(next));
  }

  function updateProviderPicker(next: SettingsProviderPickerValues) {
    "background only";
    if (!ready) return;
    setProviderPicker(next);
    runSave(() => persistProviderPicker(next));
  }

  function updateAppearance<Key extends SettingsAppearanceKey>(
    key: Key,
    value: SettingsAppearanceValues[Key],
  ) {
    "background only";
    if (!ready) return;
    const next = { ...appearance, [key]: value };
    setAppearance(next);
    onAppearanceChange(next);
    let nextThemeState = themeState;
    if (key === "themeMode") {
      nextThemeState = {
        ...themeState,
        mode: value as ThemeState["mode"],
      };
    } else if (key === "systemUiFont") {
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
    "background only";
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

  const persistencePresentation = resolveSettingsPersistencePresentation(persistenceState);

  const settingsSidebar = (
    <AppRailShell titlebarControls={openTitlebarControls} onHome={onBack}>
      <SidebarDisclosure open={sidebarOpen}>
        <view className="SettingsSidebar">
          <view className="SettingsSidebarFixedChrome">
            <SettingsSidebarChromeComposition
              onBack={onBack}
              searchCapability="available"
              searchValue={searchQuery}
              onSearchValueChange={setSearchQuery}
              onSubmitSearch={() => {
                const topMatch = searchResults[0];
                if (topMatch) selectSearchResult(topMatch);
              }}
              onEscapeSearch={() => setSearchQuery("")}
            />
          </view>
          <scroll-view className="SettingsSidebarBody" scroll-orientation="vertical">
            <view className="SettingsSidebarBodyInner">
              {searchQuery.trim() ? (
                <SettingsSearchResults results={searchResults} onSelect={selectSearchResult} />
              ) : (
                <SettingsNavigationComposition
                  activeSection={section}
                  availableSections={[
                    "general",
                    "profile",
                    "appearance",
                    "notifications",
                    "behavior",
                    "appsnap",
                    "shortcuts",
                    "worktrees",
                    "archived",
                    "models",
                    "providers",
                    "skills",
                    "usage",
                    "integrations",
                    "advanced",
                  ]}
                  onSelectSection={(nextSection) => onNavigate(nextSection)}
                />
              )}
            </view>
          </scroll-view>
        </view>
      </SidebarDisclosure>
    </AppRailShell>
  );

  return (
    <AppShellFrame sidebar={settingsSidebar}>
      <view
        className={`SettingsPage SettingsPage--theme-${resolvedTheme} SettingsPage--sidebar-${
          sidebarOpen ? "open" : "closed"
        }`}
      >
        <scroll-view
          id="settings-content-scroll"
          className="SettingsContent"
          scroll-orientation="vertical"
        >
          <view
            className={`SettingsContentInner${
              section === "profile" ? " SettingsContentInner--profile" : ""
            }`}
          >
            {section !== "profile" ? (
              <SettingsPanelHeaderComposition
                section={section}
                restoreDisabled={
                  !ready ||
                  section === "shortcuts" ||
                  section === "usage" ||
                  section === "appsnap" ||
                  section === "worktrees" ||
                  section === "skills" ||
                  section === "integrations" ||
                  section === "advanced" ||
                  section === "archived" ||
                  (section === "general"
                    ? settingsGeneralValuesEqual(settings, DEFAULT_SETTINGS_GENERAL_VALUES)
                    : section === "appearance"
                      ? settingsAppearanceValuesEqual(
                          appearance,
                          DEFAULT_SETTINGS_APPEARANCE_VALUES,
                        )
                      : section === "behavior"
                        ? behaviorSettingsValuesEqual(behavior, DEFAULT_BEHAVIOR_SETTINGS_VALUES)
                        : section === "notifications"
                          ? notificationSettingsValuesEqual(
                              notifications,
                              DEFAULT_NOTIFICATION_SETTINGS_VALUES,
                            )
                          : section === "models"
                            ? settingsGitWritingModelValuesEqual(
                                models,
                                DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES,
                              )
                            : settingsProviderUpdateChecksValuesEqual(
                                providers,
                                DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES,
                              ) &&
                              settingsProviderPickerValuesEqual(
                                providerPicker,
                                DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
                              ))
                }
                onRestore={restoreDefaults}
              />
            ) : null}

            {ready ? (
              <>
                {section === "general" ? (
                  <SettingsGeneralPanel
                    values={settings}
                    defaults={DEFAULT_SETTINGS_GENERAL_VALUES}
                    onChange={update}
                    resetRevision={generalResetRevision}
                  />
                ) : section === "profile" ? (
                  <SettingsProfilePanel />
                ) : section === "appearance" ? (
                  <SettingsAppearancePanel
                    values={appearance}
                    defaults={DEFAULT_SETTINGS_APPEARANCE_VALUES}
                    resolvedTheme={resolvedTheme}
                    themeState={themeState}
                    onThemeStateChange={updateThemeState}
                    onChange={updateAppearance}
                  />
                ) : section === "behavior" ? (
                  <SettingsBehaviorPanel
                    settings={behavior}
                    defaults={DEFAULT_BEHAVIOR_SETTINGS_VALUES}
                    updateSetting={updateBehavior}
                    renderControl={({ checked, ariaLabel, onCheckedChange }) => (
                      <SettingsGeneralBooleanControlElement
                        checked={checked}
                        ariaLabel={ariaLabel}
                        onChange={onCheckedChange}
                      />
                    )}
                    renderResetAction={renderSettingsResetAction}
                  />
                ) : section === "appsnap" ? (
                  <SettingsAppSnapPanel />
                ) : section === "notifications" ? (
                  <SettingsNotificationsPanel
                    settings={notifications}
                    defaults={DEFAULT_NOTIFICATION_SETTINGS_VALUES}
                    activityStatus="In-app activity toasts are shown for off-screen chats."
                    desktopStatus={
                      notificationTestStatus ??
                      (notificationSupported === true
                        ? "Desktop app notifications use your operating system notification center."
                        : notificationSupported === null
                          ? "Checking system notification support…"
                          : "System notifications are unavailable in this runtime.")
                    }
                    updateSetting={updateNotifications}
                    renderControl={({ key, checked, ariaLabel, onCheckedChange }) =>
                      key === "enableSystemTaskCompletionNotifications" ? (
                        <view className="SettingsNotificationsDesktopControl">
                          <Button
                            size="xs"
                            variant="outline"
                            disabled={notificationSupported !== true}
                            onClick={sendTestNotification}
                          >
                            Test
                          </Button>
                          <SettingsGeneralBooleanControlElement
                            checked={checked}
                            disabled={notificationSupported !== true}
                            ariaLabel={ariaLabel}
                            onChange={onCheckedChange}
                          />
                        </view>
                      ) : (
                        <SettingsGeneralBooleanControlElement
                          checked={checked}
                          ariaLabel={ariaLabel}
                          onChange={onCheckedChange}
                        />
                      )
                    }
                    renderResetAction={renderSettingsResetAction}
                  />
                ) : section === "shortcuts" ? (
                  <KeyboardShortcutsSettingsComposition
                    keybindings={keybindings}
                    includeDesktopShellShortcuts
                  />
                ) : section === "usage" ? (
                  <SettingsUsagePanel />
                ) : section === "worktrees" ? (
                  <SettingsWorktreesPanel />
                ) : section === "skills" ? (
                  <SettingsSkillsPanel />
                ) : section === "advanced" ? (
                  <SettingsAdvancedPanel />
                ) : section === "integrations" ? (
                  <SettingsIntegrationsPanel />
                ) : section === "archived" ? (
                  <SettingsArchivedPanel />
                ) : section === "models" ? (
                  <view className="SettingsModelsStack">
                    <SettingsGitWritingModelComposition
                      values={models}
                      defaults={DEFAULT_SETTINGS_GIT_WRITING_MODEL_VALUES}
                      options={modelOptions}
                      onChange={updateModels}
                    />
                    <SettingsCustomModelsPanel onSettingsChange={applyModelSettings} />
                  </view>
                ) : section === "providers" ? (
                  <>
                    <SettingsProviderToolsPanel
                      hiddenProviders={providerPicker.hiddenProviders}
                      enableProviderUpdateChecks={providers.enableProviderUpdateChecks}
                      defaultEnableProviderUpdateChecks={
                        DEFAULT_SETTINGS_PROVIDER_UPDATE_CHECKS_VALUES.enableProviderUpdateChecks
                      }
                      onEnableProviderUpdateChecksChange={(enableProviderUpdateChecks) =>
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
                {section !== "profile" &&
                section !== "appsnap" &&
                section !== "worktrees" &&
                section !== "skills" &&
                section !== "advanced" &&
                section !== "integrations" &&
                section !== "archived" &&
                persistencePresentation ? (
                  <PanelStateMessage
                    density="compact"
                    className="SettingsSavedState"
                    intent={persistencePresentation.intent}
                    announcement={persistencePresentation.announcement}
                  >
                    {persistencePresentation.message}
                  </PanelStateMessage>
                ) : null}
                {persistenceState.kind === "error" ? (
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
                  intent={hydrationState === "loading" ? "status" : "alert"}
                  announcement={
                    hydrationState === "loading"
                      ? "Loading preferences"
                      : "Preferences could not be loaded"
                  }
                >
                  {hydrationState === "loading"
                    ? "Loading preferences…"
                    : "Preferences could not be loaded. Retry to use your saved settings."}
                </PanelStateMessage>
                {hydrationState === "error" ? (
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
