import { describe, expect, it } from '@rstest/core';

import {
  firstAvailableEditor,
  shouldOfferRecoveryTools,
} from './settingsAdvanced.logic';

describe('Settings Advanced projection', () => {
  it('chooses the first product-ordered available editor', () => {
    expect(firstAvailableEditor(['cursor', 'vscode'])).toBe('cursor');
    expect(firstAvailableEditor(['cursor'])).toBe('cursor');
    expect(firstAvailableEditor([])).toBeNull();
  });

  it('offers recovery only for hydrated projects with missing history', () => {
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 0,
        threadsHydrated: true,
        allThreadsMessageless: true,
      })
    ).toBe(true);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 2,
        threadsHydrated: true,
        allThreadsMessageless: true,
      })
    ).toBe(true);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 1,
        threadCount: 2,
        threadsHydrated: true,
        allThreadsMessageless: false,
      })
    ).toBe(false);
    expect(
      shouldOfferRecoveryTools({
        projectCount: 0,
        threadCount: 0,
        threadsHydrated: true,
        allThreadsMessageless: true,
      })
    ).toBe(false);
  });
});
