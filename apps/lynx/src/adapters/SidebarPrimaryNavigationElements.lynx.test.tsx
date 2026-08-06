import { fireEvent, render } from '@lynx-js/react/testing-library';
import { describe, expect, it, rs } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { SidebarPrimaryNavigationShortcutElement } from './SidebarPrimaryNavigationElements.lynx';
import { SidebarPrimaryActionButtonElement } from './SidebarPrimaryActionElements.lynx';

describe('sidebar primary navigation shortcut', () => {
  it('renders each shortcut part as a separate key pill', () => {
    render(
      <SidebarPrimaryNavigationShortcutElement parts={['⌘', 'N']} />
    );

    const shortcut = elementTree.root?.querySelector('.AppSidebarShortcut');
    expect(shortcut?.querySelectorAll('.AppSidebarShortcutKey')).toHaveLength(2);
    expect(shortcut?.textContent).toBe('⌘N');
  });

  it('matches the measured Web key geometry and typography', () => {
    const sidebarStyles = readFileSync(
      new URL('../components/sidebar/sidebar.css', import.meta.url),
      'utf8'
    );
    const sidebarSource = readFileSync(
      new URL('../components/sidebar/Sidebar.lynx.tsx', import.meta.url),
      'utf8'
    );

    expect(sidebarStyles).toMatch(
      /\.AppSidebarShortcut\s*\{[^}]*height:\s*20px;[^}]*gap:\s*4px;/s
    );
    expect(sidebarStyles).toMatch(
      /\.AppSidebarShortcut\s*\{[^}]*opacity:\s*0;[^}]*transition:\s*opacity 150ms cubic-bezier\(0\.4,\s*0,\s*0\.2,\s*1\);/s
    );
    expect(sidebarStyles).toMatch(
      /\.SharedSidebarPrimaryActionButton\.ui-hover \.AppSidebarShortcut,\s*\.SharedSidebarPrimaryActionButton\.ui-focus \.AppSidebarShortcut\s*\{[^}]*opacity:\s*1;/s
    );
    expect(sidebarStyles).toMatch(
      /\.AppSidebarShortcutKey\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*4px;[^}]*background-color:\s*var\(--muted\);[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*font-weight:\s*500;/s
    );
    expect(sidebarSource).toContain(
      'newThreadShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.newThread}'
    );
    expect(sidebarSource).toContain(
      'searchShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.search}'
    );
  });

  it('reveals shortcut keys through the shared row hover and focus states', () => {
    render(
      <SidebarPrimaryActionButtonElement
        active={false}
        accessibleLabel="New thread"
        disabled={false}
        onActivate={rs.fn()}
      >
        <SidebarPrimaryNavigationShortcutElement parts={['⌘', 'N']} />
      </SidebarPrimaryActionButtonElement>
    );

    const row = elementTree.root?.querySelector(
      '.SharedSidebarPrimaryActionButton'
    );
    if (!row) throw new Error('expected primary action row');

    fireEvent(row, new Event('bindEvent:mouseenter', { bubbles: true }));
    expect(row.getAttribute('class')).toContain('ui-hover');
    fireEvent.focus(row);
    expect(row.getAttribute('class')).toContain('ui-focus');
  });
});
