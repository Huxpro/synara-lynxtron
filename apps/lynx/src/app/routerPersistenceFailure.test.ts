import { describe, expect, it } from '@rstest/core';

import { readPersistedLastThreadRouteFallback } from './routerPersistence.logic';

describe('readPersistedLastThreadRouteFallback', () => {
  it('returns the persisted route when storage succeeds', async () => {
    await expect(
      readPersistedLastThreadRouteFallback(async () => ({
        threadId: 'thread-1' as never,
      }))
    ).resolves.toEqual({ threadId: 'thread-1' });
  });

  it('falls back to no route when storage hydration fails', async () => {
    await expect(
      readPersistedLastThreadRouteFallback(async () => {
        throw new Error('storage unavailable');
      })
    ).resolves.toBeNull();
  });
});
