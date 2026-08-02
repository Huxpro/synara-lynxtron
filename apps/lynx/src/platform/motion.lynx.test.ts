import { describe, expect, it } from '@rstest/core';

import {
  DISCLOSURE_CLEANUP_BUFFER_MS,
  DISCLOSURE_TRANSITION_MS,
  disclosureChevronClassName,
  disclosureContentClassName,
} from './motion.lynx';

describe('Lynx disclosure motion contract', () => {
  it('matches the canonical Web timing and cleanup contract', () => {
    expect(DISCLOSURE_TRANSITION_MS).toBe(220);
    expect(DISCLOSURE_CLEANUP_BUFFER_MS).toBe(40);
  });

  it('projects open, closed, and chevron state without layout classes', () => {
    expect(disclosureContentClassName(true, 'Panel')).toContain(
      'LynxDisclosureMotion--open'
    );
    expect(disclosureContentClassName(false, 'Panel')).toContain(
      'LynxDisclosureMotion--closed'
    );
    expect(disclosureContentClassName(false, 'Panel')).toContain('Panel');
    expect(disclosureChevronClassName(true)).toContain(
      'LynxDisclosureChevron--open'
    );
    expect(disclosureChevronClassName(false)).not.toContain(
      'LynxDisclosureChevron--open'
    );
  });
});
