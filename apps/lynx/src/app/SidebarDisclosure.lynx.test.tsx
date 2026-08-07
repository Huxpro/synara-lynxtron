import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { SidebarDisclosure } from './SidebarDisclosure.lynx';

describe('Lynx sidebar disclosure', () => {
  it('publishes an interactive open shell with the shared sidebar width', () => {
    render(
      <SidebarDisclosure open>
        <view className="SidebarContent" />
      </SidebarDisclosure>
    );

    const shell = elementTree.root?.querySelector('.SidebarDisclosure');
    expect(shell?.getAttribute('class')).toContain('SidebarDisclosure--open');
    expect(shell?.getAttribute('aria-hidden')).toBe('false');
    expect(shell?.getAttribute('accessibility-elements-hidden')).toBe('false');
  });

  it('uses the shared 220ms disclosure duration and reduced-motion fallback', () => {
    const styles = readFileSync(
      new URL('./sidebar-disclosure.css', import.meta.url),
      'utf8'
    );
    const source = readFileSync(
      new URL('./SidebarDisclosure.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(source).toContain('useLynxDisclosurePresence(props.open)');
    expect(source).toContain(
      '<LynxInteractionScope disabled={!interactive}>'
    );
    expect(source).toContain(
      'accessibility-elements-hidden={!interactive}'
    );
    expect(styles).toMatch(
      /\.SidebarDisclosure\s*\{[^}]*width:\s*256px;[^}]*transition-duration:\s*220ms;/s
    );
    expect(styles).toMatch(
      /\.SidebarDisclosure--closed\s*\{[^}]*width:\s*0;[^}]*pointer-events:\s*none;/s
    );
    expect(styles).toMatch(
      /\.SidebarDisclosure--closed \.SidebarDisclosureInner\s*\{[^}]*transform:\s*translateX\(-256px\);/s
    );
    expect(styles).toMatch(
      /@media \(prefers-reduced-motion: reduce\)\s*\{[^}]*transition-duration:\s*0\.01ms;/s
    );
  });
});
