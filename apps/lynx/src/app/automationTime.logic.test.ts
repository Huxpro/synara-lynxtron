import { describe, expect, it } from '@rstest/core';

import { isAutomationTimeOfDay } from './automationTime.logic';

describe('Automation time validation', () => {
  it('accepts valid 24-hour times', () => {
    expect(isAutomationTimeOfDay('00:00')).toBe(true);
    expect(isAutomationTimeOfDay('14:30')).toBe(true);
    expect(isAutomationTimeOfDay('23:59')).toBe(true);
  });

  it('rejects incomplete and out-of-range times', () => {
    expect(isAutomationTimeOfDay('9:00')).toBe(false);
    expect(isAutomationTimeOfDay('24:00')).toBe(false);
    expect(isAutomationTimeOfDay('14:60')).toBe(false);
  });
});
