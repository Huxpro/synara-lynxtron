import { describe, expect, it } from '@rstest/core';

import {
  shouldDeleteDepartingTemporaryThread,
  toggleTemporaryThreadId,
} from './temporaryThreadLifecycle.lynx';

describe('temporary Thread lifecycle', () => {
  it('toggles only the active thread marker', () => {
    expect(toggleTemporaryThreadId(null, 'thread-a')).toBe('thread-a');
    expect(toggleTemporaryThreadId('thread-a', 'thread-a')).toBeNull();
    expect(toggleTemporaryThreadId('thread-a', 'thread-b')).toBe('thread-b');
  });

  it('deletes only when the marked thread route departs', () => {
    expect(shouldDeleteDepartingTemporaryThread('thread-a', 'thread-a')).toBe(
      true
    );
    expect(shouldDeleteDepartingTemporaryThread('thread-a', 'thread-b')).toBe(
      false
    );
    expect(shouldDeleteDepartingTemporaryThread(null, 'thread-a')).toBe(false);
  });
});
