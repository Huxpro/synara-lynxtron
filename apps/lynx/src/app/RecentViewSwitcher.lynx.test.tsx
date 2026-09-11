import { describe, expect, it } from '@rstest/core';
import { render } from '@lynx-js/react/testing-library';

import { RecentViewSwitcherLynx } from './RecentViewSwitcher.lynx';

describe('Native recent-view switcher', () => {
  it('renders shared display entries and selected state', () => {
    render(
      <RecentViewSwitcherLynx
        selectedIndex={1}
        entries={[
          { key: 'thread:one', view: { kind: 'thread', threadId: 'one' as never }, kind: 'thread', icon: { kind: 'chat' }, title: 'First chat', subtitle: 'Project · Chat', isCurrent: true, isPinned: false, isSplit: false, isTerminal: false },
          { key: 'settings:appearance', view: { kind: 'settings', section: 'appearance' }, kind: 'settings', icon: { kind: 'settings' }, title: 'Settings', subtitle: 'Appearance', isCurrent: false, isPinned: false, isSplit: false, isTerminal: false },
        ]}
      />
    );

    expect(elementTree.root?.textContent).toContain('First chat');
    expect(elementTree.root?.textContent).toContain('Settings');
    expect(elementTree.root?.textContent).toContain('2 recent views');
    expect(
      elementTree.root?.querySelectorAll('.RecentViewSwitcherRow--selected')
    ).toHaveLength(1);
  });
});
