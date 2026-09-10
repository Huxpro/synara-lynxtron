import { describe, expect, it, rs } from '@rstest/core';
import { fireEvent, render, waitFor } from '@lynx-js/react/testing-library';
import { readFileSync } from 'node:fs';

import { SpaceSwitcherLynx, buildNativeSpaceOptions } from './SpaceSwitcher.lynx';

const spaces = [
  {
    id: 'space-a' as never,
    name: 'Alpha',
    icon: 'rocket' as const,
    sortOrder: 0,
    createdAt: '2026-01-01T00:00:00.000Z',
    updatedAt: '2026-01-01T00:00:00.000Z',
  },
] as const;

describe('Native Space switcher', () => {
  it('keeps Void first and preserves server Space order', () => {
    expect(buildNativeSpaceOptions(spaces)).toEqual([
      { id: null, icon: 'black-hole', name: 'Void' },
      { id: 'space-a', icon: 'rocket', name: 'Alpha' },
    ]);
  });

  it('renders the active tab and dispatches a real Space id', async () => {
    const onSelect = rs.fn();
    render(
      <SpaceSwitcherLynx
        activeSpaceId={'space-a' as never}
        activityBySpaceId={new Map([['space-a', 'attention']])}
        spaces={spaces}
        onContextMenu={() => undefined}
        onCreate={() => undefined}
        onSelect={onSelect}
      />
    );
    await waitFor(() =>
      expect(elementTree.root?.querySelector('.AppSidebarSpaceTab--active')).toBeTruthy()
    );
    const tabs = elementTree.root?.querySelectorAll('.AppSidebarSpaceTab') ?? [];
    expect(tabs).toHaveLength(3);
    expect(tabs[1]?.getAttribute('accessibility-label')).toBe(
      'Alpha · Active · Needs attention'
    );
    expect(tabs[1]?.querySelector('.AppSidebarSpaceActivityDot--attention')).toBeTruthy();
    if (tabs[0]) fireEvent.tap(tabs[0]);
    expect(onSelect).toHaveBeenCalledWith(null);
  });

  it('opens Space creation from the dedicated plus control', () => {
    const onCreate = rs.fn();
    render(
      <SpaceSwitcherLynx
        activeSpaceId={null}
        activityBySpaceId={new Map()}
        spaces={spaces}
        onContextMenu={() => undefined}
        onCreate={onCreate}
        onSelect={() => undefined}
      />
    );
    const create = elementTree.root?.querySelector('.AppSidebarSpaceCreate');
    expect(create?.getAttribute('accessibility-label')).toBe('New space');
    if (!create) throw new Error('expected New space control');
    fireEvent.tap(create);
    expect(onCreate).toHaveBeenCalledTimes(1);
  });

  it('wires secondary click and long press only for stored Spaces', () => {
    const source = readFileSync(
      new URL('./SpaceSwitcher.lynx.tsx', import.meta.url),
      'utf8'
    );
    expect(source).toContain('resolveSecondaryPointerOffset(event)');
    expect(source).toContain('getRectByRef(tabRef, true)');
    expect(source).toContain('bindlongpress=');
    expect(source).toContain('option.id === null');
  });

  it('stays absent until a stored Space exists, matching Web', () => {
    render(
      <SpaceSwitcherLynx
        activeSpaceId={null}
        activityBySpaceId={new Map()}
        spaces={[]}
        onContextMenu={() => undefined}
        onCreate={() => undefined}
        onSelect={() => {}}
      />
    );
    expect(elementTree.root?.querySelector('.AppSidebarSpaces')).toBeNull();
  });
});
