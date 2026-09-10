import { describe, expect, it } from 'vitest';

import {
  APP_SNAP_WELCOME_STORAGE_KEY,
  readAppSnapWelcomeStorage,
  writeAppSnapWelcomeStorage,
} from './AppSnapWelcomeDialog.logic';

describe('AppSnap welcome persistence', () => {
  it('uses one versioned key and defaults malformed state to unacknowledged', () => {
    expect(APP_SNAP_WELCOME_STORAGE_KEY).toBe('synara:appsnap-welcome:v1');
    expect(readAppSnapWelcomeStorage(null)).toEqual({ acknowledged: false });
    expect(readAppSnapWelcomeStorage('{"acknowledged":"yes"}')).toEqual({
      acknowledged: false,
    });
  });

  it('round-trips an acknowledgement', () => {
    const encoded = writeAppSnapWelcomeStorage({ acknowledged: true });
    expect(readAppSnapWelcomeStorage(encoded)).toEqual({ acknowledged: true });
  });
});
