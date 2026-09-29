// FILE: SettingsAppearanceComposition.logic.ts
// Purpose: Host-neutral Appearance values, defaults, options, and normalization.

export type SettingsAppearanceValues = {
  readonly themeMode: "light" | "dark" | "system";
  readonly systemUiFont: boolean;
  readonly uiDensity: "compact" | "comfortable" | "spacious";
  readonly chatFontSizePx: number;
  readonly terminalFontSizePx: number;
  readonly terminalFontFamily: string;
  readonly enableNativeFontSmoothing: boolean;
  readonly timestampFormat: "locale" | "12-hour" | "24-hour";
};

export type SettingsAppearanceKey = keyof SettingsAppearanceValues;

export const MIN_TERMINAL_FONT_SIZE_PX = 10;
export const MAX_TERMINAL_FONT_SIZE_PX = 22;
export const DEFAULT_TERMINAL_FONT_SIZE_PX = 12;
export const DEFAULT_TERMINAL_FONT_FAMILY = "";

// Free-form terminal font values remain unrestricted. These are autocomplete
// suggestions only, shared by hosts that can render an autocomplete control.
export const TERMINAL_FONT_FAMILY_SUGGESTIONS: ReadonlyArray<string> = [
  "JetBrains Mono",
  "Fira Code",
  "Cascadia Code",
  "SF Mono",
  "Menlo",
  "Source Code Pro",
  "IBM Plex Mono",
  "Hack",
  "Roboto Mono",
  "Ubuntu Mono",
  "Consolas",
];

export const SETTINGS_THEME_OPTIONS = [
  { value: "light", label: "Light" },
  { value: "dark", label: "Dark" },
  { value: "system", label: "System" },
] as const;

export const SETTINGS_DENSITY_OPTIONS = [
  { value: "compact", label: "Compact" },
  { value: "comfortable", label: "Comfortable" },
  { value: "spacious", label: "Spacious" },
] as const;

export const SETTINGS_TIMESTAMP_OPTIONS = [
  { value: "locale", label: "System default" },
  { value: "12-hour", label: "12-hour" },
  { value: "24-hour", label: "24-hour" },
] as const;

export function settingsAppearanceValuesEqual(
  current: SettingsAppearanceValues,
  defaults: SettingsAppearanceValues,
): boolean {
  return (
    current.themeMode === defaults.themeMode &&
    current.systemUiFont === defaults.systemUiFont &&
    current.uiDensity === defaults.uiDensity &&
    current.chatFontSizePx === defaults.chatFontSizePx &&
    current.terminalFontSizePx === defaults.terminalFontSizePx &&
    current.terminalFontFamily === defaults.terminalFontFamily &&
    current.enableNativeFontSmoothing === defaults.enableNativeFontSmoothing &&
    current.timestampFormat === defaults.timestampFormat
  );
}

export function normalizeAppearanceNumber(
  key: "chatFontSizePx" | "terminalFontSizePx",
  value: number,
): number {
  const [minimum, maximum] =
    key === "chatFontSizePx" ? [11, 20] : [MIN_TERMINAL_FONT_SIZE_PX, MAX_TERMINAL_FONT_SIZE_PX];
  if (!Number.isFinite(value)) return minimum;
  return Math.min(maximum, Math.max(minimum, Math.round(value)));
}
