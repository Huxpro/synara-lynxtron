import { describe, expect, it } from '@rstest/core';

import {
  rankLynxSettingsSearchEntries,
  SETTINGS_SEARCH_RESULTS_LIMIT,
  UNSUPPORTED_SETTINGS_SEARCH_ENTRY_IDS,
} from './settingsSearch.logic';

describe('Lynx Settings search', () => {
  it('uses the shared ranking model and caps broad results', () => {
    const results = rankLynxSettingsSearchEntries('settings');
    expect(results.length).toBeLessThanOrEqual(SETTINGS_SEARCH_RESULTS_LIMIT);
    expect(results.length).toBeGreaterThan(0);
  });

  it('finds real native section owners', () => {
    expect(rankLynxSettingsSearchEntries('archived thread')[0]).toMatchObject({
      id: 'archived:archived-threads',
      section: 'archived',
    });
    expect(rankLynxSettingsSearchEntries('external mcp')[0]).toMatchObject({
      id: 'integrations:external-mcp',
      section: 'integrations',
    });
  });

  it('omits Web-only controls that have no native renderer', () => {
    for (const query of [
      'permission status',
      'saved model slugs',
      'provider updates',
      'installed clis',
      'release history',
      'font smoothing',
      'time format',
    ]) {
      const results = rankLynxSettingsSearchEntries(query);
      expect(
        results.some((entry) =>
          UNSUPPORTED_SETTINGS_SEARCH_ENTRY_IDS.has(entry.id)
        )
      ).toBe(false);
    }
  });
});
