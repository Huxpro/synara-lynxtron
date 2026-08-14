import {
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
} from '@synara-web/appSettingsStorageProjection.logic';
import {
  DEFAULT_THEME_STATE,
  type ThemeState,
} from '@synara-web/theme/theme.logic';
import type { SettingsAppearanceValues } from '@synara-web/components/settings/SettingsAppearanceComposition.logic';

export interface PersistedAppearanceState {
  readonly appearance: SettingsAppearanceValues;
  readonly themeState: ThemeState;
}

export async function readPersistedAppearanceFallback(
  read: () => Promise<PersistedAppearanceState>
): Promise<PersistedAppearanceState> {
  return read().catch(() => ({
    appearance: DEFAULT_SETTINGS_APPEARANCE_VALUES,
    themeState: DEFAULT_THEME_STATE,
  }));
}
