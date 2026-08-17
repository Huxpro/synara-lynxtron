import { describe, expect, it } from '@rstest/core';

import { retainLocalServerStopFeedback } from './environmentLocalServers.logic';

describe('Environment Local Servers feedback lifecycle', () => {
  const feedback = {
    pid: 42,
    message: 'Stop signal sent; the process is still shutting down.',
  };

  it('retains feedback while its target server remains present', () => {
    expect(retainLocalServerStopFeedback(feedback, [7, 42])).toBe(feedback);
  });

  it('clears feedback after its target server disappears', () => {
    expect(retainLocalServerStopFeedback(feedback, [7])).toBeNull();
  });

  it('keeps an empty feedback state empty', () => {
    expect(retainLocalServerStopFeedback(null, [42])).toBeNull();
  });
});
