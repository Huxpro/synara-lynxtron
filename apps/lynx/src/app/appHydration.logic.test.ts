import { describe, expect, it } from '@rstest/core';
import {
  DEFAULT_SETTINGS_APPEARANCE_VALUES,
} from '@synara-web/appSettingsStorageProjection.logic';
import { DEFAULT_THEME_STATE } from '@synara-web/theme/theme.logic';

import { readPersistedAppearanceFallback } from './appHydration.logic';

describe('readPersistedAppearanceFallback', () => {
  it('preserves hydrated appearance state', async () => {
    const value = {
      appearance: {
        ...DEFAULT_SETTINGS_APPEARANCE_VALUES,
        chatFontSizePx: 18,
      },
      themeState: {
        ...DEFAULT_THEME_STATE,
        mode: 'dark' as const,
      },
    };

    await expect(
      readPersistedAppearanceFallback(async () => value)
    ).resolves.toEqual(value);
  });

  it('uses canonical defaults when storage hydration fails', async () => {
    await expect(
      readPersistedAppearanceFallback(async () => {
        throw new Error('storage unavailable');
      })
    ).resolves.toEqual({
      appearance: DEFAULT_SETTINGS_APPEARANCE_VALUES,
      themeState: DEFAULT_THEME_STATE,
    });
  });
});
