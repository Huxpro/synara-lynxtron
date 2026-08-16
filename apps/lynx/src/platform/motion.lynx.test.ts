import { act, render } from '@lynx-js/react/testing-library';
import { createElement } from '@lynx-js/react';
import { beforeEach, describe, expect, it } from '@rstest/core';

import {
  DISCLOSURE_CLEANUP_BUFFER_MS,
  DISCLOSURE_TRANSITION_MS,
  disclosureChevronClassName,
  disclosureContentClassName,
  setLynxReducedMotion,
  useLynxDisclosurePresence,
} from './motion.lynx';

function PresenceProbe(props: { readonly open: boolean }) {
  const present = useLynxDisclosurePresence(props.open);
  return present ? createElement('view', { className: 'PresenceProbe' }) : null;
}

describe('Lynx disclosure motion contract', () => {
  beforeEach(() => setLynxReducedMotion(false));

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

  it('removes closed content immediately when the host reduces motion', async () => {
    const view = render(createElement(PresenceProbe, { open: true }));
    expect(elementTree.root?.querySelector('.PresenceProbe')).not.toBeNull();

    await act(async () => setLynxReducedMotion(true));
    view.rerender(createElement(PresenceProbe, { open: false }));

    expect(elementTree.root?.querySelector('.PresenceProbe')).toBeNull();
  });
});
