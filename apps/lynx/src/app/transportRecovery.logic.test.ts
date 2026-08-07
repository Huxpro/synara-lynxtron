import { describe, expect, it } from '@rstest/core';

import { shouldRefetchAfterTransportRecovery } from './transportRecovery.logic';

describe('transport recovery', () => {
  it('refetches after a reconnect or offline interval', () => {
    expect(
      shouldRefetchAfterTransportRecovery('reconnecting', 'connected')
    ).toBe(true);
    expect(shouldRefetchAfterTransportRecovery('offline', 'connected')).toBe(
      true
    );
  });

  it('does not refetch on initial connection or unrelated transitions', () => {
    expect(shouldRefetchAfterTransportRecovery('idle', 'connected')).toBe(
      false
    );
    expect(shouldRefetchAfterTransportRecovery('connected', 'connected')).toBe(
      false
    );
    expect(
      shouldRefetchAfterTransportRecovery('connected', 'reconnecting')
    ).toBe(false);
  });
});
