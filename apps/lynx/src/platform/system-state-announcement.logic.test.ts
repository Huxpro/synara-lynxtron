import { describe, expect, it } from '@rstest/core';

import { resolveNextSystemStateAnnouncement } from './system-state-announcement.logic';

describe('resolveNextSystemStateAnnouncement', () => {
  it('keeps plain hints and empty labels out of the announcement channel', () => {
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: null,
        intent: 'plain',
        announcement: 'Select a file',
      })
    ).toEqual({ content: null, nextKey: null });
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: null,
        intent: 'status',
        announcement: '   ',
      })
    ).toEqual({ content: null, nextKey: null });
  });

  it('announces a discrete state once and suppresses consecutive duplicates', () => {
    const first = resolveNextSystemStateAnnouncement({
      previousKey: null,
      intent: 'status',
      announcement: ' Loading conversation ',
    });
    expect(first).toEqual({
      content: 'Loading conversation',
      nextKey: 'status:Loading conversation',
    });
    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: first.nextKey,
        intent: 'status',
        announcement: 'Loading conversation',
      })
    ).toEqual({
      content: null,
      nextKey: 'status:Loading conversation',
    });
  });

  it('announces changed result and error states and resets after plain content', () => {
    const empty = resolveNextSystemStateAnnouncement({
      previousKey: 'status:Loading pull requests',
      intent: 'empty',
      announcement: 'No pull requests found',
    });
    expect(empty.content).toBe('No pull requests found');

    const alert = resolveNextSystemStateAnnouncement({
      previousKey: empty.nextKey,
      intent: 'alert',
      announcement: 'Pull requests unavailable',
    });
    expect(alert.content).toBe('Pull requests unavailable');

    expect(
      resolveNextSystemStateAnnouncement({
        previousKey: alert.nextKey,
        intent: 'plain',
      })
    ).toEqual({ content: null, nextKey: null });
  });
});
