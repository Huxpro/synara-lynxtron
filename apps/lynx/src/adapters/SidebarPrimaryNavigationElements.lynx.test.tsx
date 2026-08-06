import { render } from '@lynx-js/react/testing-library';
import { describe, expect, it } from '@rstest/core';
import { readFileSync } from 'node:fs';

import { SidebarPrimaryNavigationShortcutElement } from './SidebarPrimaryNavigationElements.lynx';

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
      /\.AppSidebarShortcutKey\s*\{[^}]*width:\s*20px;[^}]*height:\s*20px;[^}]*border-radius:\s*4px;[^}]*background-color:\s*var\(--muted\);[^}]*font-size:\s*12px;[^}]*line-height:\s*16px;[^}]*font-weight:\s*500;/s
    );
    expect(sidebarSource).toContain(
      'newThreadShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.newThread}'
    );
    expect(sidebarSource).toContain(
      'searchShortcutLabel={LYNX_PRIMARY_SHORTCUT_LABELS.search}'
    );
  });
});
