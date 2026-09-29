import {
  rankSettingsSearchEntries,
  SETTINGS_SEARCH_ENTRIES,
  type SettingsSearchEntry,
} from "@synara-web/settingsSearchIndex";

export const SETTINGS_SEARCH_RESULTS_LIMIT = 12;
export const UNSUPPORTED_SETTINGS_SEARCH_ENTRY_IDS = new Set([
  "appsnap:permissions",
  "models:saved-model-slugs",
  "providers:provider-updates",
  "providers:installed-clis",
  "advanced:release-history",
  "appearance:font-smoothing",
  "appearance:time-format",
]);

export function rankLynxSettingsSearchEntries(query: string): readonly SettingsSearchEntry[] {
  return rankSettingsSearchEntries(query, SETTINGS_SEARCH_ENTRIES.length)
    .filter((entry) => !UNSUPPORTED_SETTINGS_SEARCH_ENTRY_IDS.has(entry.id))
    .slice(0, SETTINGS_SEARCH_RESULTS_LIMIT);
}
