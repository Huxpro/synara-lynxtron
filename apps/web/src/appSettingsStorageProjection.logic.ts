// FILE: appSettingsStorageProjection.logic.ts
// Purpose: Side-effect-free canonical app-settings storage projection for shared hosts.

import type { ProviderKind } from "@synara/contracts";
import { PROVIDER_DESCRIPTORS } from "@synara/shared/providerMetadata";
import {
  DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
  DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
} from "./sidebarSortDefaults";
import { DEFAULT_UI_DENSITY } from "./lib/appDensity";
import { DEFAULT_CHAT_FONT_SIZE_PX } from "./chatFontSize";
import type { SettingsGeneralValues } from "./components/settings/SettingsGeneralComposition.logic";
import {
  DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES,
  normalizeSettingsProviderPickerValues,
  type SettingsProviderPickerValues,
} from "./components/settings/SettingsProviderPickerComposition.logic";
import {
  DEFAULT_TERMINAL_FONT_FAMILY,
  DEFAULT_TERMINAL_FONT_SIZE_PX,
  type SettingsAppearanceValues,
} from "./components/settings/SettingsAppearanceComposition.logic";
import {
  DEFAULT_THEME_STATE,
  parseStoredThemeState,
  serializeThemeState,
} from "./theme/theme.logic";

export const APP_SETTINGS_STORAGE_KEY = "synara:app-settings:v1";
export const THEME_STORAGE_KEY = "synara:theme";

export const DEFAULT_SETTINGS_GENERAL_VALUES: SettingsGeneralValues = {
  defaultProvider: "codex",
  defaultThreadEnvMode: "local",
  sidebarProjectSortOrder: DEFAULT_SIDEBAR_PROJECT_SORT_ORDER,
  sidebarThreadSortOrder: DEFAULT_SIDEBAR_THREAD_SORT_ORDER,
  showChatsSection: true,
  showStudioSection: true,
  showWorkspaceSection: false,
  environmentPanelDefaultOpen: false,
  showEnvironmentUsage: true,
  showEnvironmentRepository: true,
  showEnvironmentPullRequest: true,
  showEnvironmentEditor: true,
  showEnvironmentRecap: true,
  showEnvironmentPinned: true,
  showEnvironmentMarkers: true,
  showEnvironmentInstructions: true,
  showEnvironmentNotepad: true,
};

export const DEFAULT_SETTINGS_APPEARANCE_VALUES: SettingsAppearanceValues = {
  themeMode: DEFAULT_THEME_STATE.mode,
  systemUiFont: DEFAULT_THEME_STATE.systemUiFont,
  uiDensity: DEFAULT_UI_DENSITY,
  chatFontSizePx: DEFAULT_CHAT_FONT_SIZE_PX,
  terminalFontSizePx: DEFAULT_TERMINAL_FONT_SIZE_PX,
  terminalFontFamily: DEFAULT_TERMINAL_FONT_FAMILY,
  enableNativeFontSmoothing: true,
  timestampFormat: "locale",
};

const providerKinds = new Set<ProviderKind>(
  PROVIDER_DESCRIPTORS.map((descriptor) => descriptor.kind),
);

function isRecord(value: unknown): value is Record<string, unknown> {
  return value !== null && typeof value === "object" && !Array.isArray(value);
}

function parseRecord(raw: string | null): Record<string, unknown> {
  if (!raw) return {};
  try {
    const parsed = JSON.parse(raw) as unknown;
    return isRecord(parsed) ? parsed : {};
  } catch {
    return {};
  }
}

function booleanValue(
  record: Record<string, unknown>,
  key: string,
  fallback: boolean,
): boolean {
  return typeof record[key] === "boolean" ? record[key] : fallback;
}

export function readSettingsGeneralProjection(
  raw: string | null,
  serverDefaultThreadEnvMode?: unknown,
): SettingsGeneralValues {
  const record = parseRecord(raw);
  const defaultProvider =
    typeof record.defaultProvider === "string" &&
    providerKinds.has(record.defaultProvider as ProviderKind)
      ? (record.defaultProvider as ProviderKind)
      : DEFAULT_SETTINGS_GENERAL_VALUES.defaultProvider;
  const localThreadMode =
    record.defaultThreadEnvMode === "worktree" ? "worktree" : "local";
  const defaultThreadEnvMode =
    serverDefaultThreadEnvMode === "local" || serverDefaultThreadEnvMode === "worktree"
      ? serverDefaultThreadEnvMode
      : localThreadMode;
  const sidebarProjectSortOrder =
    record.sidebarProjectSortOrder === "updated_at" ||
    record.sidebarProjectSortOrder === "created_at" ||
    record.sidebarProjectSortOrder === "manual"
      ? record.sidebarProjectSortOrder
      : DEFAULT_SETTINGS_GENERAL_VALUES.sidebarProjectSortOrder;
  const sidebarThreadSortOrder =
    record.sidebarThreadSortOrder === "updated_at" ||
    record.sidebarThreadSortOrder === "created_at"
      ? record.sidebarThreadSortOrder
      : DEFAULT_SETTINGS_GENERAL_VALUES.sidebarThreadSortOrder;

  return {
    defaultProvider,
    defaultThreadEnvMode,
    sidebarProjectSortOrder,
    sidebarThreadSortOrder,
    showChatsSection: booleanValue(
      record,
      "showChatsSection",
      DEFAULT_SETTINGS_GENERAL_VALUES.showChatsSection,
    ),
    showStudioSection: booleanValue(
      record,
      "showStudioSection",
      DEFAULT_SETTINGS_GENERAL_VALUES.showStudioSection,
    ),
    showWorkspaceSection: booleanValue(
      record,
      "showWorkspaceSection",
      DEFAULT_SETTINGS_GENERAL_VALUES.showWorkspaceSection,
    ),
    environmentPanelDefaultOpen: booleanValue(
      record,
      "environmentPanelDefaultOpen",
      DEFAULT_SETTINGS_GENERAL_VALUES.environmentPanelDefaultOpen,
    ),
    showEnvironmentUsage: booleanValue(
      record,
      "showEnvironmentUsage",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentUsage,
    ),
    showEnvironmentRepository: booleanValue(
      record,
      "showEnvironmentRepository",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentRepository,
    ),
    showEnvironmentPullRequest: booleanValue(
      record,
      "showEnvironmentPullRequest",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentPullRequest,
    ),
    showEnvironmentEditor: booleanValue(
      record,
      "showEnvironmentEditor",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentEditor,
    ),
    showEnvironmentRecap: booleanValue(
      record,
      "showEnvironmentRecap",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentRecap,
    ),
    showEnvironmentPinned: booleanValue(
      record,
      "showEnvironmentPinned",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentPinned,
    ),
    showEnvironmentMarkers: booleanValue(
      record,
      "showEnvironmentMarkers",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentMarkers,
    ),
    showEnvironmentInstructions: booleanValue(
      record,
      "showEnvironmentInstructions",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentInstructions,
    ),
    showEnvironmentNotepad: booleanValue(
      record,
      "showEnvironmentNotepad",
      DEFAULT_SETTINGS_GENERAL_VALUES.showEnvironmentNotepad,
    ),
  };
}

export function writeSettingsGeneralProjection(
  raw: string | null,
  values: SettingsGeneralValues,
): string {
  return JSON.stringify({
    ...parseRecord(raw),
    ...values,
  });
}

export function readSettingsAppearanceProjection(
  appSettingsRaw: string | null,
  themeRaw: string | null,
): SettingsAppearanceValues {
  const record = parseRecord(appSettingsRaw);
  const theme = parseStoredThemeState(themeRaw);
  return {
    themeMode: theme.mode,
    systemUiFont: theme.systemUiFont,
    uiDensity:
      record.uiDensity === "compact" ||
      record.uiDensity === "comfortable" ||
      record.uiDensity === "spacious"
        ? record.uiDensity
        : DEFAULT_SETTINGS_APPEARANCE_VALUES.uiDensity,
    chatFontSizePx:
      typeof record.chatFontSizePx === "number"
        ? record.chatFontSizePx
        : DEFAULT_SETTINGS_APPEARANCE_VALUES.chatFontSizePx,
    terminalFontSizePx:
      typeof record.terminalFontSizePx === "number"
        ? record.terminalFontSizePx
        : DEFAULT_SETTINGS_APPEARANCE_VALUES.terminalFontSizePx,
    terminalFontFamily:
      typeof record.terminalFontFamily === "string"
        ? record.terminalFontFamily
        : DEFAULT_SETTINGS_APPEARANCE_VALUES.terminalFontFamily,
    enableNativeFontSmoothing: booleanValue(
      record,
      "enableNativeFontSmoothing",
      DEFAULT_SETTINGS_APPEARANCE_VALUES.enableNativeFontSmoothing,
    ),
    timestampFormat:
      record.timestampFormat === "12-hour" ||
      record.timestampFormat === "24-hour" ||
      record.timestampFormat === "locale"
        ? record.timestampFormat
        : DEFAULT_SETTINGS_APPEARANCE_VALUES.timestampFormat,
  };
}

export function writeSettingsAppearanceProjection(
  appSettingsRaw: string | null,
  themeRaw: string | null,
  values: SettingsAppearanceValues,
): {
  readonly appSettingsRaw: string;
  readonly themeRaw: string;
} {
  const theme = parseStoredThemeState(themeRaw);
  return {
    appSettingsRaw: JSON.stringify({
      ...parseRecord(appSettingsRaw),
      uiDensity: values.uiDensity,
      chatFontSizePx: values.chatFontSizePx,
      terminalFontSizePx: values.terminalFontSizePx,
      terminalFontFamily: values.terminalFontFamily,
      enableNativeFontSmoothing: values.enableNativeFontSmoothing,
      timestampFormat: values.timestampFormat,
    }),
    themeRaw: serializeThemeState({
      ...theme,
      mode: values.themeMode,
      systemUiFont: values.systemUiFont,
    }),
  };
}

export function readSettingsProviderPickerProjection(
  raw: string | null,
): SettingsProviderPickerValues {
  const record = parseRecord(raw);
  return normalizeSettingsProviderPickerValues({
    hiddenProviders: Array.isArray(record.hiddenProviders)
      ? record.hiddenProviders.filter((value): value is string => typeof value === "string")
      : DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES.hiddenProviders,
    providerOrder: Array.isArray(record.providerOrder)
      ? record.providerOrder.filter((value): value is string => typeof value === "string")
      : DEFAULT_SETTINGS_PROVIDER_PICKER_VALUES.providerOrder,
  });
}

export function writeSettingsProviderPickerProjection(
  raw: string | null,
  values: SettingsProviderPickerValues,
): string {
  const normalized = normalizeSettingsProviderPickerValues(values);
  return JSON.stringify({
    ...parseRecord(raw),
    hiddenProviders: normalized.hiddenProviders,
    providerOrder: normalized.providerOrder,
  });
}
