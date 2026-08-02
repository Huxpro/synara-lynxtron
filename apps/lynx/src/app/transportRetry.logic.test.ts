import { describe, expect, it } from '@rstest/core';

import { retryActiveSynaraQueries } from './transportRetry.logic';

describe('retryActiveSynaraQueries', () => {
  it('refetches active queries exactly once', async () => {
    const filters: unknown[] = [];

    await retryActiveSynaraQueries({
      refetchQueries: async (value) => {
        filters.push(value);
        return undefined;
      },
    });

    expect(filters).toEqual([{ type: 'active' }]);
  });

  it('contains transport rejection so the retry control remains reusable', async () => {
    await expect(
      retryActiveSynaraQueries({
        refetchQueries: async () => {
          throw new Error('offline');
        },
      })
    ).resolves.toBeUndefined();
  });
});
