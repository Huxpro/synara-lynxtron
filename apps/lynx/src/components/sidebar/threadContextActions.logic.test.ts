import { describe, expect, it } from '@rstest/core';

import {
  buildNativeThreadContextCommand,
  nativeThreadContextConfirmation,
  resolveSecondaryPointerOffset,
} from './threadContextActions.logic';

describe('native thread context actions', () => {
  it('publishes only a secondary-button point with finite coordinates', () => {
    expect(resolveSecondaryPointerOffset({ button: 0, x: 4, y: 5 })).toBeNull();
    expect(resolveSecondaryPointerOffset({ button: 2, x: 4, y: 5 })).toEqual({
      x: 4,
      y: 5,
    });
    expect(
      resolveSecondaryPointerOffset({ button: 2, x: Number.NaN, y: 5 })
    ).toBeNull();
  });

  it('builds server-authoritative pin, archive, and delete commands', () => {
    expect(
      buildNativeThreadContextCommand({
        action: 'toggle-pin',
        commandId: 'command-1',
        isPinned: false,
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.meta.update',
      commandId: 'command-1',
      threadId: 'thread-1',
      isPinned: true,
    });
    expect(
      buildNativeThreadContextCommand({
        action: 'archive',
        commandId: 'command-2',
        isPinned: false,
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.archive',
      commandId: 'command-2',
      threadId: 'thread-1',
    });
    expect(
      buildNativeThreadContextCommand({
        action: 'delete',
        commandId: 'command-3',
        isPinned: false,
        threadId: 'thread-1',
      })
    ).toEqual({
      type: 'thread.delete',
      commandId: 'command-3',
      threadId: 'thread-1',
    });
  });

  it('requires confirmation only for destructive visibility changes', () => {
    const defaults = {
      confirmThreadArchive: false,
      confirmThreadDelete: true,
    };
    expect(
      nativeThreadContextConfirmation('toggle-pin', 'A', defaults)
    ).toBeNull();
    expect(
      nativeThreadContextConfirmation('archive', 'A', defaults)
    ).toBeNull();
    expect(
      nativeThreadContextConfirmation('archive', 'A', {
        ...defaults,
        confirmThreadArchive: true,
      })
    ).toContain(
      'Archive thread "A"?'
    );
    expect(
      nativeThreadContextConfirmation('delete', 'A', defaults)
    ).toContain(
      'permanently clears conversation history'
    );
    expect(
      nativeThreadContextConfirmation('delete', 'A', {
        ...defaults,
        confirmThreadDelete: false,
      })
    ).toBeNull();
  });
});
